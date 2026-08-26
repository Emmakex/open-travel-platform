import { randomUUID } from "node:crypto";
import type { Db } from "mongodb";
import type { UserRole } from "@/domain/identity/types";
import type {
  IntegrationDelivery,
  IntegrationEventEnvelope
} from "@/domain/integrations/types";
import {
  ensureIntegrationOutboxIndexes,
  integrationDeliveryAttemptCollectionName,
  integrationDeliveryCollectionName,
  integrationEventCollectionName
} from "@/lib/integration-outbox";
import { getMongoClient, getMongoDatabaseName } from "@/lib/mongodb";

export const integrationDeliveryAuditCollectionName = "travel_integration_delivery_audit";
export const integrationWorkerStateCollectionName = "travel_integration_worker_state";
export const integrationRetentionAuditCollectionName = "travel_integration_retention_audit";

const workerStateId = "outbound-delivery";
const workerLeaseMs = 15 * 60 * 1000;
const retentionBatchLimit = 1000;

type IntegrationDeliveryAttempt = {
  id: string;
  deliveryId: string;
  eventId: string;
  endpointId: string;
  attempt: number;
  outcome: "succeeded" | "retrying" | "dead-letter";
  responseStatus?: number;
  error?: string;
  occurredAt: string;
};

type IntegrationDeliveryAuditEvent = {
  id: string;
  deliveryId: string;
  eventId: string;
  endpointId: string;
  action: "dead_letter_requeued";
  actorIdentityId: string;
  actorRole: UserRole;
  previousAttempts: number;
  occurredAt: string;
};

type IntegrationWorkerState = {
  id: typeof workerStateId;
  leaseUntil?: string;
  nextAllowedAt?: string;
  lastStartedAt?: string;
  lastFinishedAt?: string;
  lastSource?: "scheduler" | "admin";
  lastResult?: {
    processed: number;
    succeeded: number;
    retried: number;
    deadLettered: number;
  };
};

type IntegrationRetentionAuditEvent = {
  id: string;
  cutoff: string;
  retentionDays: number;
  removedDeliveries: number;
  removedAttempts: number;
  removedEvents: number;
  occurredAt: string;
};

export type IntegrationHealthMetrics = {
  pending: number;
  delivering: number;
  retrying: number;
  deadLetter: number;
  oldestDueAt?: string;
  recentWindowHours: 24;
  recentAttempts: number;
  recentSucceeded: number;
  recentFailed: number;
  recentSuccessRate: number | null;
  recentFailureRate: number | null;
};

export async function ensureIntegrationOperationsIndexes(database: Db) {
  await Promise.all([
    database.collection<IntegrationDeliveryAuditEvent>(integrationDeliveryAuditCollectionName)
      .createIndex({ deliveryId: 1, occurredAt: -1 }, { name: "integration_delivery_audit_target" }),
    database.collection<IntegrationDeliveryAuditEvent>(integrationDeliveryAuditCollectionName)
      .createIndex({ occurredAt: -1 }, { name: "integration_delivery_audit_recent" }),
    database.collection<IntegrationWorkerState>(integrationWorkerStateCollectionName)
      .createIndex({ id: 1 }, { unique: true, name: "integration_worker_state_unique" }),
    database.collection<IntegrationRetentionAuditEvent>(integrationRetentionAuditCollectionName)
      .createIndex({ occurredAt: -1 }, { name: "integration_retention_audit_recent" })
  ]);
}

function clampInteger(value: string | undefined, fallback: number, minimum: number, maximum: number) {
  const parsed = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(minimum, Math.min(parsed, maximum));
}

export function getIntegrationWorkerBatchSize() {
  return clampInteger(process.env.INTEGRATION_WORKER_BATCH_SIZE, 10, 1, 25);
}

export function getIntegrationWorkerMinimumIntervalSeconds() {
  return clampInteger(process.env.INTEGRATION_WORKER_MIN_INTERVAL_SECONDS, 60, 10, 3600);
}

export function getIntegrationCompletedRetentionDays() {
  return clampInteger(process.env.INTEGRATION_COMPLETED_RETENTION_DAYS, 180, 30, 3650);
}

export async function getIntegrationHealthMetrics(): Promise<IntegrationHealthMetrics> {
  const client = await getMongoClient();
  const database = client.db(getMongoDatabaseName());
  await Promise.all([
    ensureIntegrationOutboxIndexes(database),
    ensureIntegrationOperationsIndexes(database)
  ]);
  const deliveries = database.collection<IntegrationDelivery>(integrationDeliveryCollectionName);
  const attempts = database.collection<IntegrationDeliveryAttempt>(integrationDeliveryAttemptCollectionName);
  const now = new Date().toISOString();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const [pending, delivering, retrying, deadLetter, oldestDue, recentSucceeded, recentFailed] = await Promise.all([
    deliveries.countDocuments({ status: "pending" }),
    deliveries.countDocuments({ status: "delivering" }),
    deliveries.countDocuments({ status: "retrying" }),
    deliveries.countDocuments({ status: "dead-letter" }),
    deliveries.find({
      status: { $in: ["pending", "retrying"] },
      nextAttemptAt: { $lte: now }
    }).sort({ nextAttemptAt: 1 }).limit(1).next(),
    attempts.countDocuments({ occurredAt: { $gte: since }, outcome: "succeeded" }),
    attempts.countDocuments({ occurredAt: { $gte: since }, outcome: { $in: ["retrying", "dead-letter"] } })
  ]);
  const recentAttempts = recentSucceeded + recentFailed;

  return {
    pending,
    delivering,
    retrying,
    deadLetter,
    oldestDueAt: oldestDue?.nextAttemptAt,
    recentWindowHours: 24,
    recentAttempts,
    recentSucceeded,
    recentFailed,
    recentSuccessRate: recentAttempts ? recentSucceeded / recentAttempts : null,
    recentFailureRate: recentAttempts ? recentFailed / recentAttempts : null
  };
}

export async function getIntegrationEventDetails(eventId: string) {
  const client = await getMongoClient();
  const database = client.db(getMongoDatabaseName());
  await Promise.all([
    ensureIntegrationOutboxIndexes(database),
    ensureIntegrationOperationsIndexes(database)
  ]);
  const event = await database.collection<IntegrationEventEnvelope>(integrationEventCollectionName)
    .findOne({ id: eventId });
  if (!event) return null;
  const deliveries = await database.collection<IntegrationDelivery>(integrationDeliveryCollectionName)
    .find({ eventId })
    .sort({ createdAt: 1 })
    .toArray();
  return { event, deliveries };
}

export async function getIntegrationDeliveryDetails(deliveryId: string) {
  const client = await getMongoClient();
  const database = client.db(getMongoDatabaseName());
  await Promise.all([
    ensureIntegrationOutboxIndexes(database),
    ensureIntegrationOperationsIndexes(database)
  ]);
  const delivery = await database.collection<IntegrationDelivery>(integrationDeliveryCollectionName)
    .findOne({ id: deliveryId });
  if (!delivery) return null;
  const [event, attempts, audit] = await Promise.all([
    database.collection<IntegrationEventEnvelope>(integrationEventCollectionName).findOne({ id: delivery.eventId }),
    database.collection<IntegrationDeliveryAttempt>(integrationDeliveryAttemptCollectionName)
      .find({ deliveryId })
      .sort({ occurredAt: -1 })
      .limit(200)
      .toArray(),
    database.collection<IntegrationDeliveryAuditEvent>(integrationDeliveryAuditCollectionName)
      .find({ deliveryId })
      .sort({ occurredAt: -1 })
      .limit(100)
      .toArray()
  ]);
  return { delivery, event, attempts, audit };
}

export async function requeueDeadLetterDelivery(input: {
  deliveryId: string;
  actorIdentityId: string;
  actorRole: UserRole;
}) {
  if (input.actorRole !== "admin") {
    throw Object.assign(new Error("Only Admin can requeue dead-letter integration deliveries."), { code: "INTEGRATION_REQUEUE_FORBIDDEN" });
  }
  const client = await getMongoClient();
  const database = client.db(getMongoDatabaseName());
  await Promise.all([
    ensureIntegrationOutboxIndexes(database),
    ensureIntegrationOperationsIndexes(database)
  ]);
  const session = client.startSession();
  let changed = false;

  try {
    await session.withTransaction(async () => {
      const deliveries = database.collection<IntegrationDelivery>(integrationDeliveryCollectionName);
      const current = await deliveries.findOne({ id: input.deliveryId, status: "dead-letter" }, { session });
      if (!current) return;
      const occurredAt = new Date().toISOString();
      const update = await deliveries.updateOne(
        { id: current.id, status: "dead-letter" },
        {
          $set: {
            status: "pending",
            attempts: 0,
            nextAttemptAt: occurredAt,
            updatedAt: occurredAt
          },
          $unset: {
            leaseUntil: "",
            lastAttemptAt: "",
            lastError: "",
            responseStatus: "",
            deadLetteredAt: "",
            succeededAt: ""
          }
        },
        { session }
      );
      if (update.modifiedCount !== 1) return;
      await database.collection<IntegrationDeliveryAuditEvent>(integrationDeliveryAuditCollectionName).insertOne({
        id: `intda-${randomUUID()}`,
        deliveryId: current.id,
        eventId: current.eventId,
        endpointId: current.endpointId,
        action: "dead_letter_requeued",
        actorIdentityId: input.actorIdentityId,
        actorRole: input.actorRole,
        previousAttempts: current.attempts,
        occurredAt
      }, { session });
      changed = true;
    });
    return changed;
  } finally {
    await session.endSession();
  }
}

export async function claimIntegrationWorkerRun(input: {
  source: "scheduler" | "admin";
  minimumIntervalSeconds?: number;
}) {
  const client = await getMongoClient();
  const database = client.db(getMongoDatabaseName());
  await ensureIntegrationOperationsIndexes(database);
  const states = database.collection<IntegrationWorkerState>(integrationWorkerStateCollectionName);
  await states.updateOne({ id: workerStateId }, { $setOnInsert: { id: workerStateId } }, { upsert: true });

  const nowMs = Date.now();
  const now = new Date(nowMs).toISOString();
  const minimumIntervalSeconds = Math.max(10, Math.min(input.minimumIntervalSeconds ?? getIntegrationWorkerMinimumIntervalSeconds(), 3600));
  const nextAllowedAt = new Date(nowMs + minimumIntervalSeconds * 1000).toISOString();
  const leaseUntil = new Date(nowMs + workerLeaseMs).toISOString();
  const claimed = await states.findOneAndUpdate(
    {
      id: workerStateId,
      $and: [
        { $or: [{ leaseUntil: { $exists: false } }, { leaseUntil: { $lte: now } }] },
        { $or: [{ nextAllowedAt: { $exists: false } }, { nextAllowedAt: { $lte: now } }] }
      ]
    },
    {
      $set: {
        leaseUntil,
        nextAllowedAt,
        lastStartedAt: now,
        lastSource: input.source
      }
    },
    { returnDocument: "after" }
  );
  if (claimed) return { claimed: true as const, leaseUntil, nextAllowedAt };

  const current = await states.findOne({ id: workerStateId });
  const retryAt = [current?.leaseUntil, current?.nextAllowedAt]
    .filter((value): value is string => Boolean(value) && value! > now)
    .sort()[0];
  return { claimed: false as const, retryAt };
}

export async function finishIntegrationWorkerRun(input: {
  result: {
    processed: number;
    succeeded: number;
    retried: number;
    deadLettered: number;
  };
}) {
  const client = await getMongoClient();
  const database = client.db(getMongoDatabaseName());
  await ensureIntegrationOperationsIndexes(database);
  await database.collection<IntegrationWorkerState>(integrationWorkerStateCollectionName).updateOne(
    { id: workerStateId },
    {
      $set: {
        lastFinishedAt: new Date().toISOString(),
        lastResult: input.result
      },
      $unset: { leaseUntil: "" }
    }
  );
}

export async function releaseIntegrationWorkerLease() {
  const client = await getMongoClient();
  const database = client.db(getMongoDatabaseName());
  await ensureIntegrationOperationsIndexes(database);
  await database.collection<IntegrationWorkerState>(integrationWorkerStateCollectionName).updateOne(
    { id: workerStateId },
    { $unset: { leaseUntil: "" } }
  );
}

export async function pruneCompletedIntegrationHistory(input?: { retentionDays?: number }) {
  const client = await getMongoClient();
  const database = client.db(getMongoDatabaseName());
  await Promise.all([
    ensureIntegrationOutboxIndexes(database),
    ensureIntegrationOperationsIndexes(database)
  ]);
  const retentionDays = Math.max(30, Math.min(input?.retentionDays ?? getIntegrationCompletedRetentionDays(), 3650));
  const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000).toISOString();
  const deliveriesCollection = database.collection<IntegrationDelivery>(integrationDeliveryCollectionName);
  const candidates = await deliveriesCollection
    .find({ status: "succeeded", succeededAt: { $lte: cutoff } })
    .project<Pick<IntegrationDelivery, "id" | "eventId">>({ id: 1, eventId: 1 })
    .sort({ succeededAt: 1 })
    .limit(retentionBatchLimit)
    .toArray();
  if (!candidates.length) {
    return { retentionDays, cutoff, removedDeliveries: 0, removedAttempts: 0, removedEvents: 0 };
  }

  const deliveryIds = candidates.map((item) => item.id);
  const eventIds = [...new Set(candidates.map((item) => item.eventId))];
  const removedAttempts = await database.collection<IntegrationDeliveryAttempt>(integrationDeliveryAttemptCollectionName)
    .deleteMany({ deliveryId: { $in: deliveryIds } });
  const removedDeliveries = await deliveriesCollection.deleteMany({ id: { $in: deliveryIds }, status: "succeeded" });
  const stillReferencedEventIds = await deliveriesCollection.distinct("eventId", { eventId: { $in: eventIds } });
  const removableEventIds = eventIds.filter((eventId) => !stillReferencedEventIds.includes(eventId));
  const removedEvents = removableEventIds.length
    ? await database.collection<IntegrationEventEnvelope>(integrationEventCollectionName)
      .deleteMany({ id: { $in: removableEventIds }, occurredAt: { $lte: cutoff } })
    : { deletedCount: 0 };

  const result = {
    retentionDays,
    cutoff,
    removedDeliveries: removedDeliveries.deletedCount,
    removedAttempts: removedAttempts.deletedCount,
    removedEvents: removedEvents.deletedCount
  };
  await database.collection<IntegrationRetentionAuditEvent>(integrationRetentionAuditCollectionName).insertOne({
    id: `intra-${randomUUID()}`,
    ...result,
    occurredAt: new Date().toISOString()
  });
  return result;
}
