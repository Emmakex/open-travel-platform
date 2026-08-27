import assert from "node:assert/strict";
import { authAuditCollectionName } from "../lib/auth-security";
import {
  customerSessionCollectionName,
  customerUserCollectionName
} from "../lib/customer-auth";
import {
  integrationDeliveryAttemptCollectionName,
  integrationDeliveryCollectionName,
  integrationEventCollectionName
} from "../lib/integration-outbox";
import {
  travelOperationsAuditCollectionName,
  travelReservationCollectionName
} from "../lib/mongo-reservations";
import { travelPaymentTransactionCollectionName } from "../lib/mongo-payments";
import { getMongoClient, getMongoDatabaseName } from "../lib/mongodb";
import {
  travelOperationsTaskCollectionName,
  travelOperationsTaskEventCollectionName
} from "../lib/operations-tasks";
import { executePrivacyErasureWithSecondaryByAdmin } from "../lib/privacy-erasure-runner";
import {
  approvePrivacyExportByAdmin,
  executePrivacyRestrictionByAdmin,
  privacyExecutionCollectionName
} from "../lib/privacy-execution";
import { listPrivacyExecutionForCustomer } from "../lib/privacy-execution-view";
import { buildApprovedPrivacyExport } from "../lib/privacy-export";
import {
  createPrivacyRequest,
  privacyRequestAuditCollectionName,
  privacyRequestCollectionName,
  updatePrivacyRequestByAdmin
} from "../lib/privacy-rights";
import { serviceReservationCollectionName } from "../lib/service-reservations";
import { travellerDataCollectionName } from "../lib/traveller-data";

async function expectCode(run: () => Promise<unknown>, code: string) {
  await assert.rejects(run, (error: unknown) => Boolean(
    error && typeof error === "object" && "code" in error && (error as { code?: unknown }).code === code
  ));
}

async function seedUser(database: ReturnType<Awaited<ReturnType<typeof getMongoClient>>["db"]>, id: string, email: string) {
  const now = new Date();
  await database.collection(customerUserCollectionName).insertOne({
    id,
    email,
    emailNormalized: email,
    displayName: "Privacy Test User",
    firstName: "Privacy",
    lastName: "User",
    phone: "+34123456789",
    country: "ES",
    preferredLocale: "es",
    role: "customer",
    passwordHash: "secret-password-hash",
    passwordSalt: "secret-password-salt",
    status: "active",
    createdAt: now
  });
  await database.collection(customerSessionCollectionName).insertOne({
    id: `session-${id}`,
    userId: id,
    tokenHash: `token-hash-${id}`,
    createdAt: now,
    expiresAt: new Date(now.getTime() + 86400000)
  });
}

async function moveToActionPending(requestId: string) {
  await updatePrivacyRequestByAdmin({ actorId: "admin-privacy", requestId, status: "in-review" });
  await updatePrivacyRequestByAdmin({ actorId: "admin-privacy", requestId, status: "action-pending" });
}

async function main() {
  const client = await getMongoClient();
  const database = client.db(getMongoDatabaseName());
  await database.dropDatabase();

  try {
    const exportIdentity = "customer-export";
    await seedUser(database, exportIdentity, "export@example.com");
    await database.collection(travelReservationCollectionName).insertOne({
      id: "trip-export-1",
      identityId: exportIdentity,
      tripId: "trip-1",
      availabilityId: "departure-1",
      partySize: 1,
      unitPrice: 800,
      totalPrice: 800,
      currency: "EUR",
      status: "confirmed",
      createdAt: "2026-08-01T10:00:00.000Z",
      travellers: [{
        id: "traveller-1",
        firstName: "Privacy",
        lastName: "User",
        dateOfBirth: "1990-01-01",
        nationality: "ES",
        isLead: true,
        ageAtDeparture: 36,
        pricingBandId: "adult",
        pricingCode: "adult",
        pricingLabel: "Adult",
        unitPrice: 800,
        consumesInventory: true
      }]
    });
    await database.collection(serviceReservationCollectionName).insertOne({
      id: "service-export-1",
      identityId: exportIdentity,
      serviceId: "service-1",
      serviceType: "activity",
      serviceSlug: "activity-one",
      serviceTitle: "Activity One",
      pricingMode: "per-person",
      currency: "EUR",
      status: "confirmed",
      partySize: 1,
      inventoryUnits: 1,
      quantity: 1,
      unitPrice: 50,
      totalPrice: 50,
      travellers: [],
      createdAt: "2026-08-02T10:00:00.000Z"
    });
    await database.collection(travelPaymentTransactionCollectionName).insertOne({
      id: "payment-export-1",
      reservationId: "trip-export-1",
      targetType: "trip",
      type: "payment",
      status: "succeeded",
      amount: 800,
      currency: "EUR",
      provider: "manual",
      method: "card",
      providerReference: "safe-provider-reference",
      actorIdentityId: exportIdentity,
      note: "customer-visible payment note",
      createdAt: "2026-08-03T10:00:00.000Z"
    });
    await database.collection(travelOperationsAuditCollectionName).insertOne({
      id: "ops-audit-export-1",
      reservationId: "trip-export-1",
      actorIdentityId: "staff-1",
      actorRole: "admin",
      fromStatus: "pending",
      toStatus: "confirmed",
      occurredAt: "2026-08-03T11:00:00.000Z"
    });

    const access = await createPrivacyRequest(exportIdentity, "access");
    await moveToActionPending(access.id);
    await expectCode(
      () => buildApprovedPrivacyExport({ identityId: exportIdentity, requestId: access.id }),
      "PRIVACY_EXPORT_NOT_APPROVED"
    );
    await approvePrivacyExportByAdmin({ requestId: access.id, actorId: "admin-privacy" });
    const accessPackage = await buildApprovedPrivacyExport({ identityId: exportIdentity, requestId: access.id });
    assert.equal(accessPackage.request.type, "access");
    assert.equal(accessPackage.tripReservations.length, 1);
    assert.equal(accessPackage.serviceReservations.length, 1);
    assert.equal(accessPackage.paymentMovements?.length, 1);
    assert.equal(accessPackage.bookingStatusHistory?.length, 1);
    assert.ok((accessPackage.privacyRequests?.length ?? 0) >= 1);
    const accessSerialized = JSON.stringify(accessPackage).toLowerCase();
    for (const forbidden of ["secret-password-hash", "secret-password-salt", `token-hash-${exportIdentity}`]) {
      assert.equal(accessSerialized.includes(forbidden), false, `access export must exclude ${forbidden}`);
    }
    const customerExecution = await listPrivacyExecutionForCustomer(exportIdentity);
    assert.equal(customerExecution.find((item) => item.requestId === access.id)?.exportApproved, true);

    const portability = await createPrivacyRequest(exportIdentity, "portability");
    await moveToActionPending(portability.id);
    await approvePrivacyExportByAdmin({ requestId: portability.id, actorId: "admin-privacy" });
    const portabilityPackage = await buildApprovedPrivacyExport({ identityId: exportIdentity, requestId: portability.id });
    assert.equal(portabilityPackage.request.type, "portability");
    assert.equal(portabilityPackage.scope.machineReadable, true);
    assert.equal("paymentMovements" in portabilityPackage, false, "portability must exclude payment/accounting history");
    assert.equal("privacyRequests" in portabilityPackage, false, "portability must exclude internal case history");
    assert.equal("bookingStatusHistory" in portabilityPackage, false, "portability must exclude staff audit history");

    const restrictedIdentity = "customer-restricted";
    await seedUser(database, restrictedIdentity, "restricted@example.com");
    const restriction = await createPrivacyRequest(restrictedIdentity, "restriction");
    await moveToActionPending(restriction.id);
    await executePrivacyRestrictionByAdmin({ requestId: restriction.id, actorId: "admin-privacy" });
    const restrictedUser = await database.collection(customerUserCollectionName).findOne({ id: restrictedIdentity });
    assert.equal(restrictedUser?.status, "disabled", "restriction must suspend account processing access");
    assert.equal(await database.collection(customerSessionCollectionName).countDocuments({ userId: restrictedIdentity }), 0);

    const erasedIdentity = "customer-erasure";
    await seedUser(database, erasedIdentity, "erase@example.com");
    await database.collection(travelReservationCollectionName).insertOne({
      id: "trip-erasure-1",
      identityId: erasedIdentity,
      tripId: "trip-erase",
      availabilityId: "departure-erase",
      partySize: 1,
      unitPrice: 500,
      totalPrice: 500,
      currency: "EUR",
      status: "confirmed",
      createdAt: "2026-08-05T10:00:00.000Z",
      travellers: [{
        id: "traveller-erase",
        firstName: "Erase",
        lastName: "Me",
        dateOfBirth: "1985-05-05",
        nationality: "ES",
        isLead: true,
        ageAtDeparture: 41,
        pricingBandId: "adult",
        pricingCode: "adult",
        pricingLabel: "Adult",
        unitPrice: 500,
        consumesInventory: true
      }]
    });
    await database.collection(serviceReservationCollectionName).insertOne({
      id: "service-erasure-1",
      identityId: erasedIdentity,
      serviceId: "service-erase",
      serviceType: "activity",
      serviceSlug: "erase-activity",
      serviceTitle: "Erase Activity",
      pricingMode: "per-person",
      currency: "EUR",
      status: "confirmed",
      partySize: 1,
      inventoryUnits: 1,
      quantity: 1,
      unitPrice: 25,
      totalPrice: 25,
      travellers: [{
        id: "service-traveller-erase",
        firstName: "Erase",
        lastName: "Me",
        dateOfBirth: "1985-05-05",
        nationality: "ES",
        isLead: true,
        ageAtDeparture: 41,
        pricingBandId: "adult",
        pricingCode: "adult",
        pricingLabel: "Adult",
        unitPrice: 25,
        consumesInventory: true
      }],
      statusHistory: [{
        id: "status-erasure-1",
        fromStatus: "pending",
        toStatus: "confirmed",
        actorType: "customer",
        actorId: erasedIdentity,
        at: "2026-08-05T11:00:00.000Z"
      }],
      createdAt: "2026-08-05T10:00:00.000Z"
    });
    await database.collection(travelPaymentTransactionCollectionName).insertOne({
      id: "payment-erasure-1",
      reservationId: "trip-erasure-1",
      targetType: "trip",
      type: "payment",
      status: "succeeded",
      amount: 500,
      currency: "EUR",
      provider: "manual",
      actorIdentityId: erasedIdentity,
      note: "erase this free text",
      createdAt: "2026-08-06T10:00:00.000Z"
    });
    await database.collection(travellerDataCollectionName).insertOne({
      id: "protected-erasure-1",
      identityId: erasedIdentity,
      targetType: "trip",
      reservationId: "trip-erasure-1",
      travellerId: "traveller-erase",
      payload: { version: 2, keyId: "old", algorithm: "aes-256-gcm", iv: "x", tag: "y", value: "z" },
      completedFields: ["documentNumber"],
      createdAt: new Date(),
      updatedAt: new Date(),
      retentionUntil: new Date(Date.now() + 86400000)
    });
    await database.collection(authAuditCollectionName).insertOne({
      id: "auth-erasure-1",
      scope: "customer",
      event: "sign_in_success",
      subjectId: erasedIdentity,
      emailHash: "old-email-hash",
      occurredAt: new Date()
    });
    await database.collection(integrationEventCollectionName).insertOne({
      id: "intevt-erasure-customer",
      type: "customer.profile.updated",
      version: 1,
      occurredAt: new Date().toISOString(),
      aggregateType: "customer",
      aggregateId: erasedIdentity,
      payload: { customerId: erasedIdentity }
    });
    await database.collection(integrationDeliveryCollectionName).insertOne({
      id: "intdel-erasure-customer",
      eventId: "intevt-erasure-customer",
      endpointId: "crm:test",
      status: "succeeded",
      attempts: 1,
      nextAttemptAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    });
    await database.collection(integrationDeliveryAttemptCollectionName).insertOne({
      id: "intatt-erasure-customer",
      deliveryId: "intdel-erasure-customer",
      eventId: "intevt-erasure-customer",
      endpointId: "crm:test",
      attempt: 1,
      outcome: "succeeded",
      occurredAt: new Date().toISOString()
    });
    await database.collection(travelOperationsTaskCollectionName).insertOne({
      id: "task-erasure-customer",
      targetType: "customer",
      targetId: erasedIdentity,
      title: "Customer follow-up",
      status: "completed",
      createdByStaffId: "staff-1",
      createdByDisplayName: "Staff",
      createdByRole: "admin",
      createdAt: new Date().toISOString()
    });
    await database.collection(travelOperationsTaskEventCollectionName).insertOne({
      id: "task-event-erasure-customer",
      taskId: "task-erasure-customer",
      targetType: "customer",
      targetId: erasedIdentity,
      actorIdentityId: "staff-1",
      actorRole: "admin",
      actorDisplayName: "Staff",
      changes: [],
      occurredAt: new Date().toISOString()
    });

    const erasure = await createPrivacyRequest(erasedIdentity, "erasure");
    await moveToActionPending(erasure.id);
    await expectCode(
      () => executePrivacyErasureWithSecondaryByAdmin({ requestId: erasure.id, actorId: "admin-privacy" }),
      "PRIVACY_ERASURE_RETENTION_BLOCK"
    );
    await updatePrivacyRequestByAdmin({
      actorId: "admin-privacy",
      requestId: erasure.id,
      retentionState: "clear"
    });
    const erased = await executePrivacyErasureWithSecondaryByAdmin({ requestId: erasure.id, actorId: "admin-privacy" });
    assert.ok(erased.pseudonym.startsWith("privacy-erased-"));

    const erasedUser = await database.collection(customerUserCollectionName).findOne({ id: erasedIdentity });
    assert.equal(erasedUser?.status, "disabled");
    assert.ok(String(erasedUser?.email).endsWith("@privacy.invalid"));
    assert.equal(erasedUser?.phone, undefined);
    assert.equal(await database.collection(customerSessionCollectionName).countDocuments({ userId: erasedIdentity }), 0);

    const erasedTrip = await database.collection(travelReservationCollectionName).findOne({ id: "trip-erasure-1" });
    assert.equal(erasedTrip?.identityId, erased.pseudonym);
    assert.equal(erasedTrip?.travellers?.[0]?.firstName, "");
    const erasedService = await database.collection(serviceReservationCollectionName).findOne({ id: "service-erasure-1" });
    assert.equal(erasedService?.identityId, erased.pseudonym);
    assert.equal(erasedService?.travellers?.[0]?.lastName, "");
    assert.equal(erasedService?.statusHistory?.[0]?.actorId, erased.pseudonym);

    const erasedPayment = await database.collection(travelPaymentTransactionCollectionName).findOne({ id: "payment-erasure-1" });
    assert.equal(erasedPayment?.actorIdentityId, undefined);
    assert.equal(erasedPayment?.note, undefined);
    assert.equal(await database.collection(travellerDataCollectionName).countDocuments({ identityId: erasedIdentity }), 0);

    const erasedAuth = await database.collection(authAuditCollectionName).findOne({ id: "auth-erasure-1" });
    assert.equal(erasedAuth?.subjectId, erased.pseudonym);
    assert.equal(erasedAuth?.emailHash, undefined);
    assert.equal(await database.collection(integrationEventCollectionName).countDocuments({ id: "intevt-erasure-customer" }), 0);
    assert.equal(await database.collection(integrationDeliveryCollectionName).countDocuments({ id: "intdel-erasure-customer" }), 0);
    assert.equal(await database.collection(integrationDeliveryAttemptCollectionName).countDocuments({ id: "intatt-erasure-customer" }), 0);
    assert.equal((await database.collection(travelOperationsTaskCollectionName).findOne({ id: "task-erasure-customer" }))?.targetId, erased.pseudonym);
    assert.equal((await database.collection(travelOperationsTaskEventCollectionName).findOne({ id: "task-event-erasure-customer" }))?.targetId, erased.pseudonym);

    const erasedCase = await database.collection(privacyRequestCollectionName).findOne({ id: erasure.id });
    assert.equal(erasedCase?.identityId, erased.pseudonym);
    assert.ok(String(erasedCase?.openKey).startsWith(`${erased.pseudonym}:`));
    const erasedAudit = await database.collection(privacyRequestAuditCollectionName).findOne({ requestId: erasure.id, actorType: "customer" });
    assert.equal(erasedAudit?.identityId, erased.pseudonym);
    assert.equal(erasedAudit?.actorId, erased.pseudonym);
    const erasedExecution = await database.collection(privacyExecutionCollectionName).findOne({ requestId: erasure.id });
    assert.equal(erasedExecution?.identityId, erased.pseudonym);

    const retry = await executePrivacyErasureWithSecondaryByAdmin({ requestId: erasure.id, actorId: "admin-privacy" });
    assert.equal(retry.pseudonym, erased.pseudonym, "erasure retry must converge to the persisted pseudonym");

    console.info("MongoDB privacy execution validation passed: approved exports, portability scope, restriction, erasure holds, anonymisation and retry convergence are safe.");
  } finally {
    await database.dropDatabase();
    await client.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
