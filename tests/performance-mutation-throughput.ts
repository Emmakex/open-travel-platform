import assert from "node:assert/strict";
import { performance } from "node:perf_hooks";
import { MongoBookingRepository } from "@/adapters/mongo-booking-repository";
import type { CreateReservationInput } from "@/domain/booking/types";
import { integrationEventCollectionName } from "@/lib/integration-outbox";
import { travelDepartureCollectionName } from "@/lib/mongo-departures";
import { travelReservationCollectionName } from "@/lib/mongo-reservations";
import { getMongoClient, getMongoDatabaseName } from "@/lib/mongodb";

const CAPACITY = 16;
const ATTEMPTS = 32;
const CREATE_P95_BUDGET_MS = 3000;
const CANCEL_P95_BUDGET_MS = 3000;

type TimedResult<T> = {
  durationMs: number;
  result: PromiseSettledResult<T>;
};

function requireDisposableLocalDatabase() {
  const uri = process.env.MONGODB_URI?.trim();
  const databaseName = getMongoDatabaseName();
  assert(uri, "MONGODB_URI is required for mutation throughput validation.");
  assert(databaseName.startsWith("ktravel_ci_"), `Refusing destructive mutation load against non-CI database: ${databaseName}`);
  const parsed = new URL(uri);
  assert(parsed.protocol === "mongodb:", "Mutation throughput validation requires mongodb://.");
  assert(parsed.hostname === "127.0.0.1" || parsed.hostname === "localhost", `Refusing mutation load against non-local MongoDB host: ${parsed.hostname}`);
}

function reservationInput(index: number): CreateReservationInput {
  return {
    identityId: `performance-mutation-customer-${index}`,
    tripId: "trip-performance-mutation",
    availabilityId: "departure-performance-mutation",
    partySize: 1,
    inventorySpaces: 1,
    unitPrice: 100,
    tripPriceTotal: 100,
    totalPrice: 100,
    currency: "EUR",
    tripTitle: "Mutation throughput test trip",
    departureDate: "2099-09-10",
    returnDate: "2099-09-17"
  };
}

function errorCode(reason: unknown) {
  return reason && typeof reason === "object" && "code" in reason
    ? String((reason as { code?: unknown }).code ?? "")
    : "";
}

function percentile(values: number[], quantile: number) {
  if (!values.length) return 0;
  const sorted = values.slice().sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.max(0, Math.ceil(sorted.length * quantile) - 1))];
}

function round(value: number) {
  return Math.round(value * 100) / 100;
}

async function timed<T>(operation: () => Promise<T>): Promise<TimedResult<T>> {
  const started = performance.now();
  try {
    const value = await operation();
    return { durationMs: performance.now() - started, result: { status: "fulfilled", value } };
  } catch (reason) {
    return { durationMs: performance.now() - started, result: { status: "rejected", reason } };
  }
}

async function main() {
  requireDisposableLocalDatabase();
  const client = await getMongoClient();
  const database = client.db(getMongoDatabaseName());
  const departures = database.collection(travelDepartureCollectionName);
  const reservations = database.collection(travelReservationCollectionName);
  const events = database.collection(integrationEventCollectionName);
  const repository = new MongoBookingRepository();

  try {
    await database.dropDatabase();
    await departures.insertOne({
      id: "departure-performance-mutation",
      tripId: "trip-performance-mutation",
      departureDate: "2099-09-10",
      returnDate: "2099-09-17",
      capacity: CAPACITY,
      reservedSpaces: 0,
      status: "open"
    });

    const createWallStarted = performance.now();
    const createResults = await Promise.all(
      Array.from({ length: ATTEMPTS }, (_, index) => timed(() => repository.createReservation(reservationInput(index + 1))))
    );
    const createWallMs = performance.now() - createWallStarted;
    const committed = createResults.filter((item) => item.result.status === "fulfilled");
    const rejected = createResults.filter((item) => item.result.status === "rejected");

    assert.equal(committed.length, CAPACITY, "Concurrent mutation load must commit exactly the available capacity.");
    assert.equal(rejected.length, ATTEMPTS - CAPACITY, "Attempts beyond capacity must be rejected.");
    assert(rejected.every((item) => item.result.status === "rejected" && errorCode(item.result.reason) === "DEPARTURE_UNAVAILABLE"), "All capacity rejections must be the expected DEPARTURE_UNAVAILABLE outcome.");

    const committedReservations = committed.map((item) => {
      assert.equal(item.result.status, "fulfilled");
      return item.result.value;
    });
    const createSuccessDurations = committed.map((item) => item.durationMs);
    const createRejectDurations = rejected.map((item) => item.durationMs);
    const createP95Ms = round(percentile(createSuccessDurations, 0.95));

    assert(createP95Ms <= CREATE_P95_BUDGET_MS, `Committed reservation p95 ${createP95Ms}ms exceeded CI budget ${CREATE_P95_BUDGET_MS}ms.`);

    const departureAfterCreate = await departures.findOne({ id: "departure-performance-mutation" });
    assert.equal(departureAfterCreate?.reservedSpaces, CAPACITY, "Post-load inventory must equal committed reservation count.");
    assert.equal(await reservations.countDocuments({ tripId: "trip-performance-mutation" }), CAPACITY, "Post-load reservation count must equal committed capacity.");
    assert.equal(await events.countDocuments({ type: "trip.reservation.created", "payload.tripId": "trip-performance-mutation" }), CAPACITY, "Outbox must contain exactly one create event per committed reservation.");
    assert.equal(new Set(committedReservations.map((reservation) => reservation.id)).size, CAPACITY, "Committed reservation IDs must remain unique under load.");

    console.log(JSON.stringify({
      event: "mutation_throughput_create",
      attempts: ATTEMPTS,
      capacity: CAPACITY,
      committed: committed.length,
      expectedRejections: rejected.length,
      p50Ms: round(percentile(createSuccessDurations, 0.5)),
      p95Ms: createP95Ms,
      p99Ms: round(percentile(createSuccessDurations, 0.99)),
      rejectionP95Ms: round(percentile(createRejectDurations, 0.95)),
      wallMs: round(createWallMs),
      attemptedRequestsPerSecond: round((ATTEMPTS * 1000) / createWallMs),
      committedRequestsPerSecond: round((committed.length * 1000) / createWallMs)
    }));

    const cancelWallStarted = performance.now();
    const cancelResults = await Promise.all(
      committedReservations.map((reservation) => timed(() => repository.cancelReservation(reservation.identityId, reservation.id)))
    );
    const cancelWallMs = performance.now() - cancelWallStarted;
    assert(cancelResults.every((item) => item.result.status === "fulfilled" && item.result.value), "Every committed reservation must cancel exactly once during post-load cleanup.");
    const cancelDurations = cancelResults.map((item) => item.durationMs);
    const cancelP95Ms = round(percentile(cancelDurations, 0.95));
    assert(cancelP95Ms <= CANCEL_P95_BUDGET_MS, `Cancellation p95 ${cancelP95Ms}ms exceeded CI budget ${CANCEL_P95_BUDGET_MS}ms.`);

    const finalDeparture = await departures.findOne({ id: "departure-performance-mutation" });
    assert.equal(finalDeparture?.reservedSpaces, 0, "Post-cancellation inventory must return exactly to zero.");
    assert.equal(await reservations.countDocuments({ tripId: "trip-performance-mutation", status: "cancelled" }), CAPACITY, "Every committed reservation must be cancelled after cleanup.");
    assert.equal(await events.countDocuments({ type: "trip.reservation.status.changed", aggregateType: "trip-reservation" }), CAPACITY, "Outbox must contain exactly one cancellation event per committed reservation.");

    console.log(JSON.stringify({
      event: "mutation_throughput_cancel",
      cancellations: CAPACITY,
      p50Ms: round(percentile(cancelDurations, 0.5)),
      p95Ms: cancelP95Ms,
      p99Ms: round(percentile(cancelDurations, 0.99)),
      wallMs: round(cancelWallMs),
      requestsPerSecond: round((CAPACITY * 1000) / cancelWallMs),
      finalReservedSpaces: finalDeparture?.reservedSpaces ?? null
    }));

    console.log(JSON.stringify({
      event: "mutation_throughput_complete",
      attempts: ATTEMPTS,
      committed: CAPACITY,
      expectedCapacityRejections: ATTEMPTS - CAPACITY,
      finalReservedSpaces: 0,
      postLoadCorrectness: "passed"
    }));
  } finally {
    await database.dropDatabase();
    await client.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
