import assert from "node:assert/strict";
import { MongoBookingRepository } from "@/adapters/mongo-booking-repository";
import type { CreateReservationInput, ReservationAccommodationBooking } from "@/domain/booking/types";
import { integrationEventCollectionName } from "@/lib/integration-outbox";
import { travelDepartureCollectionName } from "@/lib/mongo-departures";
import { travelReservationCollectionName } from "@/lib/mongo-reservations";
import { getMongoClient, getMongoDatabaseName } from "@/lib/mongodb";

function requireDisposableLocalDatabase() {
  const uri = process.env.MONGODB_URI?.trim();
  const databaseName = getMongoDatabaseName();
  assert(uri, "MONGODB_URI is required for the MongoDB concurrency test.");
  assert(
    databaseName.startsWith("ktravel_ci_"),
    `Refusing destructive test against non-CI database: ${databaseName}`
  );

  const parsed = new URL(uri);
  assert(
    parsed.protocol === "mongodb:",
    "MongoDB concurrency tests require a local mongodb:// replica-set URI."
  );
  assert(
    parsed.hostname === "127.0.0.1" || parsed.hostname === "localhost",
    `Refusing destructive test against non-local MongoDB host: ${parsed.hostname}`
  );
}

function baseReservationInput(index: number, tripId: string, departureId: string): CreateReservationInput {
  return {
    identityId: `customer-concurrency-${index}`,
    tripId,
    availabilityId: departureId,
    partySize: 1,
    inventorySpaces: 1,
    unitPrice: 100,
    tripPriceTotal: 100,
    totalPrice: 100,
    currency: "EUR",
    tripTitle: "Concurrency test trip",
    departureDate: "2099-01-10",
    returnDate: "2099-01-17"
  };
}

function unavailableAccommodationBooking(): ReservationAccommodationBooking {
  return {
    componentId: "component-rollback",
    accommodationId: "hotel-rollback",
    accommodationName: "Rollback Hotel",
    roomTypeId: "room-rollback",
    roomTypeName: "Rollback Room",
    mode: "optional",
    checkInDay: 1,
    nights: 1,
    checkInDate: "2099-01-10",
    checkOutDate: "2099-01-11",
    currency: "EUR",
    rooms: [
      {
        id: "rollback-room-1",
        travellerIds: [],
        adults: 1,
        childAges: [],
        basePrice: 50,
        seasonalAdjustment: 0,
        occupancyAdjustment: 0,
        totalPrice: 50
      }
    ],
    totalPrice: 50,
    amountAddedToReservation: 50,
    inventory: [{ periodId: "missing-accommodation-period", rooms: 1 }]
  };
}

function errorCode(reason: unknown) {
  return reason && typeof reason === "object" && "code" in reason
    ? String((reason as { code?: unknown }).code ?? "")
    : "";
}

async function main() {
  requireDisposableLocalDatabase();

  const client = await getMongoClient();
  const database = client.db(getMongoDatabaseName());
  const repository = new MongoBookingRepository();
  const departures = database.collection(travelDepartureCollectionName);
  const reservations = database.collection(travelReservationCollectionName);
  const events = database.collection(integrationEventCollectionName);

  const concurrencyTripId = "trip-concurrency";
  const concurrencyDepartureId = "departure-concurrency";
  const rollbackTripId = "trip-rollback";
  const rollbackDepartureId = "departure-rollback";

  try {
    await database.dropDatabase();
    await departures.insertMany([
      {
        id: concurrencyDepartureId,
        tripId: concurrencyTripId,
        departureDate: "2099-01-10",
        returnDate: "2099-01-17",
        capacity: 5,
        reservedSpaces: 0,
        status: "open"
      },
      {
        id: rollbackDepartureId,
        tripId: rollbackTripId,
        departureDate: "2099-01-10",
        returnDate: "2099-01-17",
        capacity: 2,
        reservedSpaces: 0,
        status: "open"
      }
    ]);

    const rollbackInput: CreateReservationInput = {
      ...baseReservationInput(999, rollbackTripId, rollbackDepartureId),
      accommodationBookings: [unavailableAccommodationBooking()],
      accommodationTotal: 50,
      accommodationAdditionalTotal: 50,
      totalPrice: 150
    };

    await assert.rejects(
      repository.createReservation(rollbackInput),
      (error: unknown) => errorCode(error) === "ACCOMMODATION_INVENTORY_UNAVAILABLE",
      "The forced accommodation failure must abort the reservation transaction."
    );

    const rollbackDeparture = await departures.findOne({ id: rollbackDepartureId });
    assert.equal(
      rollbackDeparture?.reservedSpaces,
      0,
      "Departure inventory increment must roll back when a later transaction step fails."
    );
    assert.equal(
      await reservations.countDocuments({ tripId: rollbackTripId }),
      0,
      "A rolled-back booking must not persist a reservation."
    );
    assert.equal(
      await events.countDocuments({ type: "trip.reservation.created", "payload.tripId": rollbackTripId }),
      0,
      "A rolled-back booking must not persist its integration event."
    );

    const attempts = Array.from({ length: 12 }, (_, index) =>
      repository.createReservation(
        baseReservationInput(index + 1, concurrencyTripId, concurrencyDepartureId)
      )
    );
    const results = await Promise.allSettled(attempts);
    const succeeded = results.filter(
      (result): result is PromiseFulfilledResult<Awaited<ReturnType<MongoBookingRepository["createReservation"]>>> =>
        result.status === "fulfilled"
    );
    const failed = results.filter(
      (result): result is PromiseRejectedResult => result.status === "rejected"
    );

    assert.equal(succeeded.length, 5, "Exactly the five available spaces must be reservable.");
    assert.equal(failed.length, 7, "All attempts beyond capacity must be rejected.");
    assert(
      failed.every((result) => errorCode(result.reason) === "DEPARTURE_UNAVAILABLE"),
      `Unexpected concurrent booking error(s): ${failed.map((result) => errorCode(result.reason) || String(result.reason)).join(", ")}`
    );

    const departureAfterBookings = await departures.findOne({ id: concurrencyDepartureId });
    assert.equal(departureAfterBookings?.reservedSpaces, 5, "Concurrent booking must never oversell departure capacity.");
    assert.equal(
      await reservations.countDocuments({ tripId: concurrencyTripId }),
      5,
      "Only committed reservations may exist after the concurrency race."
    );
    assert.equal(
      await events.countDocuments({ type: "trip.reservation.created", "payload.tripId": concurrencyTripId }),
      5,
      "The transactional outbox must contain exactly one created event per committed reservation."
    );
    assert.equal(
      new Set(succeeded.map((result) => result.value.id)).size,
      5,
      "Committed reservation IDs must remain unique under concurrency."
    );

    const first = succeeded[0].value;
    const duplicateCancellation = await Promise.all([
      repository.cancelReservation(first.identityId, first.id),
      repository.cancelReservation(first.identityId, first.id)
    ]);
    assert.equal(
      duplicateCancellation.filter(Boolean).length,
      1,
      "Concurrent duplicate cancellation must release inventory only once."
    );

    const departureAfterDuplicateCancellation = await departures.findOne({ id: concurrencyDepartureId });
    assert.equal(
      departureAfterDuplicateCancellation?.reservedSpaces,
      4,
      "Duplicate cancellation must not double-release departure inventory."
    );
    assert.equal(
      await events.countDocuments({
        type: "trip.reservation.status.changed",
        aggregateId: first.id
      }),
      1,
      "Duplicate cancellation must emit one status-change event."
    );

    await Promise.all(
      succeeded.slice(1).map((result) =>
        repository.cancelReservation(result.value.identityId, result.value.id)
      )
    );

    const finalDeparture = await departures.findOne({ id: concurrencyDepartureId });
    assert.equal(finalDeparture?.reservedSpaces, 0, "Cancelling all committed reservations must restore inventory to zero.");
    assert.equal(
      await reservations.countDocuments({ tripId: concurrencyTripId, status: "cancelled" }),
      5,
      "All committed reservations must reach cancelled state exactly once."
    );
    assert.equal(
      await events.countDocuments({
        type: "trip.reservation.status.changed",
        aggregateType: "trip-reservation"
      }),
      5,
      "The outbox must contain exactly one cancellation event per committed reservation."
    );

    console.log(
      "MongoDB booking concurrency test passed: rollback, capacity race, transactional outbox and duplicate cancellation are consistent."
    );
  } finally {
    await database.dropDatabase();
    await client.close();
  }
}

await main();
