import assert from "node:assert/strict";
import { MongoPaymentRepository } from "@/adapters/mongo-payment-repository";
import type { CheckoutOrder } from "@/domain/payment/checkout-types";
import {
  erpAccountingDeliveryEndpointId
} from "@/lib/erp-accounting-sync";
import {
  integrationDeliveryCollectionName,
  integrationEventCollectionName
} from "@/lib/integration-outbox";
import {
  claimPaymentWebhookEvent,
  finalizeCheckoutOrder,
  paymentCheckoutOrderCollectionName,
  paymentWebhookEventCollectionName
} from "@/lib/payment-checkout";
import {
  travelPaymentTransactionCollectionName
} from "@/lib/mongo-payments";
import { travelReservationCollectionName } from "@/lib/mongo-reservations";
import { getMongoClient, getMongoDatabaseName } from "@/lib/mongodb";

function requireDisposableLocalDatabase() {
  const uri = process.env.MONGODB_URI?.trim();
  const databaseName = getMongoDatabaseName();
  assert(uri, "MONGODB_URI is required for the MongoDB payment idempotency test.");
  assert(
    databaseName.startsWith("ktravel_ci_"),
    `Refusing destructive test against non-CI database: ${databaseName}`
  );
  const parsed = new URL(uri);
  assert(parsed.protocol === "mongodb:", "Payment idempotency tests require a local mongodb:// URI.");
  assert(
    parsed.hostname === "127.0.0.1" || parsed.hostname === "localhost",
    `Refusing destructive test against non-local MongoDB host: ${parsed.hostname}`
  );
  assert(
    process.env.PAYMENT_LEDGER_MODE === "mongodb",
    "PAYMENT_LEDGER_MODE=mongodb is required for checkout finalization coverage."
  );
  assert(
    process.env.ERP_ACCOUNTING_MODE === "rest",
    "ERP_ACCOUNTING_MODE=rest is required so succeeded-movement outbox behavior is observable."
  );
}

function code(error: unknown) {
  return error && typeof error === "object" && "code" in error
    ? String((error as { code?: unknown }).code ?? "")
    : "";
}

async function main() {
  requireDisposableLocalDatabase();
  const client = await getMongoClient();
  const database = client.db(getMongoDatabaseName());
  const payments = database.collection(travelPaymentTransactionCollectionName);
  const reservations = database.collection(travelReservationCollectionName);
  const events = database.collection(integrationEventCollectionName);
  const deliveries = database.collection(integrationDeliveryCollectionName);
  const checkoutOrders = database.collection<CheckoutOrder>(paymentCheckoutOrderCollectionName);
  const webhookEvents = database.collection(paymentWebhookEventCollectionName);
  const repository = new MongoPaymentRepository();

  const reservationA = "res-payment-race-a";
  const reservationB = "res-payment-race-b";

  try {
    await database.dropDatabase();
    await reservations.insertMany([
      {
        id: reservationA,
        identityId: "customer-payment-a",
        tripId: "trip-payment-a",
        availabilityId: "departure-payment-a",
        partySize: 1,
        inventorySpaces: 1,
        unitPrice: 100,
        tripPriceTotal: 100,
        totalPrice: 100,
        currency: "EUR",
        tripTitle: "Payment idempotency A",
        departureDate: "2099-02-01",
        returnDate: "2099-02-08",
        status: "confirmed",
        createdAt: new Date().toISOString()
      },
      {
        id: reservationB,
        identityId: "customer-payment-b",
        tripId: "trip-payment-b",
        availabilityId: "departure-payment-b",
        partySize: 1,
        inventorySpaces: 1,
        unitPrice: 100,
        tripPriceTotal: 100,
        totalPrice: 100,
        currency: "EUR",
        tripTitle: "Payment idempotency B",
        departureDate: "2099-03-01",
        returnDate: "2099-03-08",
        status: "confirmed",
        createdAt: new Date().toISOString()
      }
    ]);

    // Simulate an existing deployment that still has the pre-9B non-unique
    // provider-reference index. ensureMongoPaymentIndexes must replace it.
    await payments.createIndex(
      { provider: 1, providerReference: 1 },
      {
        name: "travel_payment_provider_reference",
        partialFilterExpression: { providerReference: { $type: "string" } }
      }
    );

    const sameProviderMovement = {
      reservationId: reservationA,
      targetType: "trip" as const,
      type: "payment" as const,
      amount: 50,
      currency: "EUR",
      provider: "stripe",
      method: "online",
      status: "succeeded" as const,
      providerReference: "cs_idempotent_shared"
    };

    const concurrentCreates = await Promise.all([
      repository.createTransaction(sameProviderMovement),
      repository.createTransaction(sameProviderMovement)
    ]);
    assert.equal(
      new Set(concurrentCreates.map((transaction) => transaction.id)).size,
      1,
      "Concurrent creates with the same provider reference must resolve to one ledger movement."
    );
    const created = concurrentCreates[0];
    assert.equal(
      await payments.countDocuments({ provider: "stripe", providerReference: "cs_idempotent_shared" }),
      1,
      "The database must enforce one movement per provider reference."
    );

    const paymentIndexes = await payments.listIndexes().toArray();
    assert(
      paymentIndexes.some((index) => index.name === "travel_payment_provider_reference_unique" && index.unique === true),
      "The legacy provider-reference index must be migrated to a unique index."
    );
    assert(
      !paymentIndexes.some((index) => index.name === "travel_payment_provider_reference"),
      "The legacy non-unique provider-reference index must be removed."
    );

    assert.equal(
      await events.countDocuments({ type: "payment.transaction.succeeded", aggregateId: created.id }),
      1,
      "A concurrently deduplicated succeeded movement must create one ERP integration event."
    );
    assert.equal(
      await deliveries.countDocuments({
        eventId: `intevt-payment-${created.id}-succeeded`,
        endpointId: erpAccountingDeliveryEndpointId
      }),
      1,
      "A concurrently deduplicated succeeded movement must create one ERP delivery."
    );

    await assert.rejects(
      repository.createTransaction({
        ...sameProviderMovement,
        reservationId: reservationB,
        amount: 25
      }),
      (error: unknown) => code(error) === "PAYMENT_REFERENCE_CONFLICT",
      "Reusing a provider reference for a different movement must fail closed."
    );

    const pending = await repository.createTransaction({
      reservationId: reservationB,
      targetType: "trip",
      type: "payment",
      amount: 80,
      currency: "EUR",
      provider: "stripe",
      method: "online",
      status: "pending"
    });

    const checkoutId = "chk-payment-race";
    await checkoutOrders.insertOne({
      id: checkoutId,
      identityId: "customer-payment-b",
      targetType: "trip",
      targetId: reservationB,
      targetLabel: "Payment idempotency B",
      amount: 80,
      currency: "EUR",
      provider: "stripe",
      environment: "test",
      transactionId: pending.id,
      status: "pending",
      providerReference: "cs_checkout_race",
      createdAt: new Date().toISOString()
    });

    const duplicateClaims = await Promise.all(
      Array.from({ length: 8 }, () =>
        claimPaymentWebhookEvent({
          provider: "stripe",
          eventId: "evt_same_delivery",
          checkoutId
        })
      )
    );
    assert.equal(
      duplicateClaims.filter(Boolean).length,
      1,
      "A repeated provider event ID must be claimed once under concurrency."
    );
    assert.equal(
      await webhookEvents.countDocuments({ provider: "stripe", eventId: "evt_same_delivery" }),
      1,
      "Webhook event storage must contain one row for a repeated provider event ID."
    );

    const distinctClaims = await Promise.all([
      claimPaymentWebhookEvent({ provider: "stripe", eventId: "evt_distinct_a", checkoutId }),
      claimPaymentWebhookEvent({ provider: "stripe", eventId: "evt_distinct_b", checkoutId })
    ]);
    assert(distinctClaims.every(Boolean), "Distinct valid provider event IDs must each be claimable.");

    const finalizations = await Promise.allSettled([
      finalizeCheckoutOrder(checkoutId, "paid", "cs_checkout_race"),
      finalizeCheckoutOrder(checkoutId, "paid", "cs_checkout_race")
    ]);
    assert(
      finalizations.every((result) => result.status === "fulfilled"),
      `Concurrent checkout finalization must be idempotent: ${finalizations.map((result) => result.status === "rejected" ? String(result.reason) : "ok").join(", ")}`
    );

    const storedPending = await payments.findOne({ id: pending.id });
    assert.equal(storedPending?.status, "succeeded", "The pending ledger movement must finalize to succeeded.");
    assert.equal(
      storedPending?.providerReference,
      "cs_checkout_race",
      "The finalized movement must retain the provider reference."
    );
    const storedCheckout = await checkoutOrders.findOne({ id: checkoutId });
    assert.equal(storedCheckout?.status, "paid", "The checkout must end in paid state after concurrent finalization.");

    assert.equal(
      await events.countDocuments({ type: "payment.transaction.succeeded", aggregateId: pending.id }),
      1,
      "Concurrent finalization must enqueue one succeeded-movement event."
    );
    assert.equal(
      await deliveries.countDocuments({
        eventId: `intevt-payment-${pending.id}-succeeded`,
        endpointId: erpAccountingDeliveryEndpointId
      }),
      1,
      "Concurrent finalization must enqueue one ERP delivery."
    );

    await finalizeCheckoutOrder(checkoutId, "paid", "cs_checkout_race");
    assert.equal(
      await events.countDocuments({ type: "payment.transaction.succeeded", aggregateId: pending.id }),
      1,
      "Replaying finalization after paid state must not duplicate the financial event."
    );

    console.log(
      "MongoDB payment idempotency test passed: provider references, webhook claims, concurrent finalization and ERP outbox are deduplicated."
    );
  } finally {
    await database.dropDatabase();
    await client.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
