import assert from "node:assert/strict";
import { MongoBookingRepository } from "@/adapters/mongo-booking-repository";
import { travelCollectionNames } from "@/adapters/mongo-travel-repository";
import type { AvailabilityWindow, CreateReservationInput, TripDeparture } from "@/domain/booking/types";
import type { PaymentTransaction } from "@/domain/payment/types";
import type { Trip } from "@/domain/travel/types";
import {
  changeReservationDeparture,
  correctReservationTraveller,
  listReservationAmendments
} from "@/lib/reservation-amendments";
import { travelDepartureCollectionName } from "@/lib/mongo-departures";
import { travelPaymentTransactionCollectionName } from "@/lib/mongo-payments";
import { travelReservationCollectionName } from "@/lib/mongo-reservations";
import { getMongoClient, getMongoDatabaseName } from "@/lib/mongodb";
import {
  calculateAgeOnDate,
  priceTravellerComposition,
  TravellerPricingError,
  type TravellerBookingDraft
} from "@/lib/traveller-pricing";

function requireDisposableLocalDatabase() {
  const uri = process.env.MONGODB_URI?.trim();
  const databaseName = getMongoDatabaseName();
  assert(uri, "MONGODB_URI is required for the traveller/amendment MongoDB test.");
  assert(
    databaseName.startsWith("ktravel_ci_"),
    `Refusing destructive test against non-CI database: ${databaseName}`
  );

  const parsed = new URL(uri);
  assert.equal(
    parsed.protocol,
    "mongodb:",
    "Traveller/amendment integration tests require a local mongodb:// replica-set URI."
  );
  assert(
    parsed.hostname === "127.0.0.1" || parsed.hostname === "localhost",
    `Refusing destructive test against non-local MongoDB host: ${parsed.hostname}`
  );
}

function errorCode(reason: unknown) {
  return reason && typeof reason === "object" && "code" in reason
    ? String((reason as { code?: unknown }).code ?? "")
    : "";
}

const tripId = "trip-traveller-amendment";
const successfulSourceId = "departure-age-source";
const successfulTargetId = "departure-age-target";
const rollbackSourceId = "departure-rollback-source";
const rollbackTargetId = "departure-rollback-target";

const sourceDate = "2099-06-14";
const targetDate = "2099-06-15";
const returnDate = "2099-06-22";

const trip: Trip = {
  id: tripId,
  slug: "traveller-amendment-test",
  destinationId: "destination-test",
  title: "Traveller amendment test trip",
  summary: "CI-only traveller pricing and amendment fixture.",
  durationDays: 8,
  fromPrice: 120,
  currency: "EUR",
  travellerPricing: [
    {
      id: "infant",
      code: "infant",
      label: "Infant",
      labelEs: "Bebé",
      minAge: 0,
      maxAge: 1,
      price: 20,
      consumesInventory: false
    },
    {
      id: "child",
      code: "child",
      label: "Child",
      labelEs: "Menor",
      minAge: 2,
      maxAge: 17,
      price: 60,
      consumesInventory: false
    },
    {
      id: "adult",
      code: "adult",
      label: "Adult",
      labelEs: "Adulto",
      minAge: 18,
      price: 120,
      consumesInventory: true
    }
  ],
  highlights: [],
  featured: false,
  publicationStatus: "published"
};

const leadDraft: TravellerBookingDraft = {
  id: "traveller-lead",
  firstName: "Alex",
  lastName: "Adult",
  dateOfBirth: "2070-01-01",
  nationality: "ES"
};

const boundaryMinorDraft: TravellerBookingDraft = {
  id: "traveller-boundary",
  firstName: "Taylor",
  lastName: "Boundary",
  dateOfBirth: "2081-06-15",
  nationality: "ES",
  guardianTravellerId: leadDraft.id,
  guardianRelationship: "parent"
};

function availability(
  id: string,
  departureDate: string,
  remainingSpaces: number,
  travellerPrices: Record<string, number>
): AvailabilityWindow {
  return {
    id,
    tripId,
    departureDate,
    returnDate,
    remainingSpaces,
    unitPrice: travellerPrices.adult,
    travellerPrices
  };
}

function reservationInput({
  identityId,
  availabilityId,
  priced,
  departureDate
}: {
  identityId: string;
  availabilityId: string;
  priced: ReturnType<typeof priceTravellerComposition>;
  departureDate: string;
}): CreateReservationInput {
  return {
    identityId,
    tripId,
    availabilityId,
    partySize: priced.travellers.length,
    inventorySpaces: priced.inventorySpaces,
    travellers: priced.travellers,
    unitPrice: priced.leadUnitPrice,
    tripPriceTotal: priced.totalPrice,
    totalPrice: priced.totalPrice,
    currency: "EUR",
    tripTitle: trip.title,
    departureDate,
    returnDate
  };
}

async function main() {
  requireDisposableLocalDatabase();
  assert.equal(process.env.OPERATIONS_MODE, "mongodb", "OPERATIONS_MODE=mongodb is required for amendment validation.");

  assert.equal(
    calculateAgeOnDate(boundaryMinorDraft.dateOfBirth, sourceDate),
    17,
    "A traveller must remain 17 on the day before their birthday."
  );
  assert.equal(
    calculateAgeOnDate(boundaryMinorDraft.dateOfBirth, targetDate),
    18,
    "A traveller must become 18 exactly on their birthday/departure date."
  );

  const oldAvailability = availability(successfulSourceId, sourceDate, 4, {
    infant: 20,
    child: 60,
    adult: 120
  });
  const newAvailability = availability(successfulTargetId, targetDate, 4, {
    infant: 25,
    child: 70,
    adult: 150
  });

  assert.throws(
    () => priceTravellerComposition({
      trip,
      availability: oldAvailability,
      drafts: [leadDraft, { ...boundaryMinorDraft, guardianTravellerId: undefined, guardianRelationship: undefined }]
    }),
    (error: unknown) => error instanceof TravellerPricingError && error.code === "MINOR_GUARDIAN_REQUIRED",
    "A minor must require an adult guardian before the departure-date boundary."
  );

  const sourcePricing = priceTravellerComposition({
    trip,
    availability: oldAvailability,
    drafts: [leadDraft, boundaryMinorDraft]
  });
  assert.equal(sourcePricing.totalPrice, 180, "Adult + child source pricing must use the source departure snapshot.");
  assert.equal(sourcePricing.inventorySpaces, 1, "The configured child band must not consume departure inventory.");
  assert.equal(sourcePricing.travellers[1]?.pricingCode, "child");
  assert.equal(sourcePricing.travellers[1]?.ageAtDeparture, 17);
  assert.equal(sourcePricing.travellers[1]?.guardianTravellerId, leadDraft.id);

  const targetPricingPreview = priceTravellerComposition({
    trip,
    availability: newAvailability,
    drafts: [leadDraft, boundaryMinorDraft]
  });
  assert.equal(targetPricingPreview.totalPrice, 300, "Both travellers must price as adults on the target departure.");
  assert.equal(targetPricingPreview.inventorySpaces, 2, "Both adults must consume inventory on the target departure.");
  assert.equal(targetPricingPreview.travellers[1]?.pricingCode, "adult");
  assert.equal(targetPricingPreview.travellers[1]?.ageAtDeparture, 18);
  assert.equal(
    targetPricingPreview.travellers[1]?.guardianTravellerId,
    undefined,
    "Guardian linkage must not remain on a traveller repriced as an adult."
  );

  const client = await getMongoClient();
  const database = client.db(getMongoDatabaseName());
  const repository = new MongoBookingRepository();
  const departures = database.collection<TripDeparture & { updatedAt?: Date }>(travelDepartureCollectionName);
  const reservations = database.collection(travelReservationCollectionName);
  const payments = database.collection<PaymentTransaction>(travelPaymentTransactionCollectionName);

  try {
    await database.dropDatabase();
    await database.collection<Trip>(travelCollectionNames.trips).insertOne(trip);
    await departures.insertMany([
      {
        id: successfulSourceId,
        tripId,
        departureDate: sourceDate,
        returnDate,
        capacity: 4,
        reservedSpaces: 0,
        status: "open",
        unitPrice: 120,
        travellerPrices: { infant: 20, child: 60, adult: 120 }
      },
      {
        id: successfulTargetId,
        tripId,
        departureDate: targetDate,
        returnDate,
        capacity: 4,
        reservedSpaces: 0,
        status: "open",
        unitPrice: 150,
        travellerPrices: { infant: 25, child: 70, adult: 150 }
      },
      {
        id: rollbackSourceId,
        tripId,
        departureDate: sourceDate,
        returnDate,
        capacity: 4,
        reservedSpaces: 0,
        status: "open",
        unitPrice: 120,
        travellerPrices: { infant: 20, child: 60, adult: 120 }
      },
      {
        id: rollbackTargetId,
        tripId,
        departureDate: targetDate,
        returnDate,
        capacity: 1,
        reservedSpaces: 0,
        status: "open",
        unitPrice: 150,
        travellerPrices: { infant: 25, child: 70, adult: 150 }
      }
    ]);

    const reservation = await repository.createReservation(
      reservationInput({
        identityId: "customer-traveller-amendment",
        availabilityId: successfulSourceId,
        priced: sourcePricing,
        departureDate: sourceDate
      })
    );

    assert.equal(
      (await departures.findOne({ id: successfulSourceId }))?.reservedSpaces,
      1,
      "Initial booking must consume the snapshot inventory count."
    );

    const historicalPayment: PaymentTransaction = {
      id: "pay-traveller-amendment-history",
      reservationId: reservation.id,
      targetType: "trip",
      type: "payment",
      status: "succeeded",
      amount: 90,
      currency: "EUR",
      provider: "manual-bank-transfer",
      providerReference: "CI-TRAVELLER-AMENDMENT-PAYMENT",
      createdAt: "2098-12-01T10:00:00.000Z"
    };
    await payments.insertOne(historicalPayment);
    const paymentBefore = await payments.findOne({ id: historicalPayment.id });
    assert(paymentBefore, "Historical payment fixture must exist before amendment.");

    const changed = await changeReservationDeparture({
      reservationId: reservation.id,
      newAvailabilityId: successfulTargetId,
      actorIdentityId: "staff-amendment-ci",
      actorRole: "admin",
      reason: "Validate birthday boundary repricing in CI"
    });

    assert(changed.reservation, "Departure amendment must return the updated reservation.");
    assert(changed.amendment, "Departure amendment must persist an audit record.");
    assert.equal(changed.reservation.availabilityId, successfulTargetId);
    assert.equal(changed.reservation.totalPrice, 300);
    assert.equal(changed.reservation.tripPriceTotal, 300);
    assert.equal(changed.reservation.inventorySpaces, 2);
    assert.equal(changed.reservation.travellers?.[1]?.ageAtDeparture, 18);
    assert.equal(changed.reservation.travellers?.[1]?.pricingCode, "adult");
    assert.equal(changed.reservation.travellers?.[1]?.unitPrice, 150);
    assert.equal(changed.reservation.travellers?.[1]?.guardianTravellerId, undefined);
    assert.equal(changed.amendment.priceDelta, 120, "Amendment must preserve the explicit repricing delta.");
    assert.equal(changed.amendment.currency, "EUR");
    assert.deepEqual(changed.amendment.inventoryMovement, {
      fromAvailabilityId: successfulSourceId,
      toAvailabilityId: successfulTargetId,
      releasedSpaces: 1,
      reservedSpaces: 2
    });
    assert.equal(changed.amendment.actorIdentityId, "staff-amendment-ci");
    assert.equal(changed.amendment.actorRole, "admin");
    assert.equal(changed.amendment.reason, "Validate birthday boundary repricing in CI");
    assert(
      changed.amendment.changes.some((change) => change.field === "totalPrice" && change.before === "180.00" && change.after === "300.00"),
      "Amendment history must record the before/after customer total."
    );
    assert(
      changed.amendment.changes.some((change) => change.field === "inventorySpaces" && change.before === "1" && change.after === "2"),
      "Amendment history must record inventory-consumption change."
    );

    assert.equal((await departures.findOne({ id: successfulSourceId }))?.reservedSpaces, 0);
    assert.equal((await departures.findOne({ id: successfulTargetId }))?.reservedSpaces, 2);

    const paymentAfterDepartureChange = await payments.findOne({ id: historicalPayment.id });
    assert.deepEqual(
      paymentAfterDepartureChange,
      paymentBefore,
      "Departure repricing must not rewrite historical payment ledger movements."
    );

    const corrected = await correctReservationTraveller({
      reservationId: reservation.id,
      travellerId: boundaryMinorDraft.id,
      actorIdentityId: "staff-amendment-ci",
      actorRole: "operator",
      reason: "Correct traveller identity spelling",
      firstName: "Taylor",
      lastName: "Boundary-Corrected",
      nationality: "ES"
    });
    assert(corrected.reservation && corrected.amendment, "Traveller correction must persist reservation and audit atomically.");
    assert.equal(corrected.reservation.totalPrice, 300, "Identity correction must not alter the repriced reservation total.");
    assert.equal(corrected.reservation.travellers?.[1]?.pricingCode, "adult");
    assert.equal(corrected.reservation.travellers?.[1]?.unitPrice, 150);
    assert.equal(corrected.amendment.type, "traveller-correction");
    assert(
      corrected.amendment.changes.some(
        (change) => change.field === "lastName" && change.before === "Boundary" && change.after === "Boundary-Corrected"
      ),
      "Traveller correction audit must preserve before/after values."
    );

    const paymentAfterCorrection = await payments.findOne({ id: historicalPayment.id });
    assert.deepEqual(
      paymentAfterCorrection,
      paymentBefore,
      "Traveller identity correction must not mutate historical payments."
    );

    const successfulHistory = await listReservationAmendments(reservation.id);
    assert.equal(successfulHistory.length, 2, "Successful reservation must expose both amendment audit entries.");
    assert.deepEqual(
      new Set(successfulHistory.map((item) => item.type)),
      new Set(["departure-change", "traveller-correction"])
    );

    const rollbackReservation = await repository.createReservation(
      reservationInput({
        identityId: "customer-traveller-rollback",
        availabilityId: rollbackSourceId,
        priced: sourcePricing,
        departureDate: sourceDate
      })
    );
    assert.equal((await departures.findOne({ id: rollbackSourceId }))?.reservedSpaces, 1);

    await assert.rejects(
      changeReservationDeparture({
        reservationId: rollbackReservation.id,
        newAvailabilityId: rollbackTargetId,
        actorIdentityId: "staff-amendment-ci",
        actorRole: "admin",
        reason: "Validate insufficient target capacity rollback"
      }),
      (error: unknown) => errorCode(error) === "DEPARTURE_UNAVAILABLE",
      "A target departure without enough repriced inventory capacity must reject the amendment."
    );

    assert.equal(
      (await departures.findOne({ id: rollbackSourceId }))?.reservedSpaces,
      1,
      "Failed departure change must keep original inventory reserved."
    );
    assert.equal(
      (await departures.findOne({ id: rollbackTargetId }))?.reservedSpaces,
      0,
      "Failed departure change must not leave target inventory consumed."
    );

    const rollbackStored = await reservations.findOne({ id: rollbackReservation.id });
    assert(rollbackStored, "Rollback reservation must still exist.");
    assert.equal(rollbackStored.availabilityId, rollbackSourceId);
    assert.equal(rollbackStored.totalPrice, 180);
    assert.equal(rollbackStored.inventorySpaces, 1);
    assert.equal(
      await database.collection("travel_reservation_amendments").countDocuments({ reservationId: rollbackReservation.id }),
      0,
      "Failed departure change must not leave an amendment audit record."
    );

    console.log(
      "MongoDB traveller/amendment validation passed: birthday pricing boundary, guardian rules, financial snapshots, atomic inventory movement, immutable payment history and rollback are consistent."
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
