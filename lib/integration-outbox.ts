import { randomUUID } from "node:crypto";
import type { ClientSession, Db } from "mongodb";
import type { UserRole } from "@/domain/identity/types";
import type {
  IntegrationDelivery,
  IntegrationDeliveryStatus,
  IntegrationEventEnvelope,
  IntegrationEventType
} from "@/domain/integrations/types";
import { integrationEndpointCollectionName } from "@/lib/integration-endpoints";
import { getIntegrationEndpointRuntime } from "@/lib/integration-endpoints";
import { getMongoClient, getMongoDatabaseName } from "@/lib/mongodb";
import {
  deliverSignedIntegrationWebhook,
  validateIntegrationWebhookUrl
} from "@/lib/integration-webhook-security";

export const integrationEventCollectionName = "travel_integration_events";
export const integrationDeliveryCollectionName = "travel_integration_deliveries";
export const integrationDeliveryAttemptCollectionName = "travel_integration_delivery_attempts";
export const integrationReplayAuditCollectionName = "travel_integration_replay_audit";

const maxAttempts = 8;
const retrySeconds = [60, 300, 900, 3600, 14400, 43200, 86400, 86400];

type StoredEndpointSubscription = {
  id: string;
  enabled: boolean;
  subscribedEvents: IntegrationEventType[];
};

export type IntegrationDeliveryAttempt = {
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

export type IntegrationReplayAuditEvent = {
  id: string;
  deliveryId: string;
  eventId: string;
  endpointId: string;
  actorIdentityId: string;
  actorRole: UserRole;
  reason: string;
  previousAttempts: number;
  occurredAt: string;
};

export type IntegrationQueueHealth = {
  pending: number;
  retrying: number;
  delivering: number;
  succeeded: number;
  deadLetter: number;
  due: number;
  oldestDueAt?: string;
  recent24h: {
    attempts: number;
    succeeded: number;
    retrying: number;
    deadLetter: number;
    successRate: number | null;
  };
};

export async function ensureIntegrationOutboxIndexes(database: Db) {
  await Promise.all([
    database.collection<IntegrationEventEnvelope>(integrationEventCollectionName)
      .createIndex({ id: 1 }, { unique: true, name: "integration_event_id_unique" }),
    database.collection<IntegrationEventEnvelope>(integrationEventCollectionName)
      .createIndex({ aggregateType: 1, aggregateId: 1, occurredAt: -1 }, { name: "integration_event_aggregate" }),
    database.collection<IntegrationDelivery>(integrationDeliveryCollectionName)
      .createIndex({ id: 1 }, { unique: true, name: "integration_delivery_id_unique" }),
    database.collection<IntegrationDelivery>(integrationDeliveryCollectionName)
      .createIndex({ eventId: 1, endpointId: 1 }, { unique: true, name: "integration_delivery_event_endpoint_unique" }),
    database.collection<IntegrationDelivery>(integrationDeliveryCollectionName)
      .createIndex({ status: 1, nextAttemptAt: 1, leaseUntil: 1 }, { name: "integration_delivery_queue" }),
    database.collection<IntegrationDeliveryAttempt>(integrationDeliveryAttemptCollectionName)
      .createIndex({ deliveryId: 1, occurredAt: -1 }, { name: "integration_delivery_attempt_history" }),
    database.collection<IntegrationDeliveryAttempt>(integrationDeliveryAttemptCollectionName)
      .createIndex({ occurredAt: -1, outcome: 1 }, { name: "integration_delivery_attempt_recent" }),
    database.collection<IntegrationReplayAuditEvent>(integrationReplayAuditCollectionName)
      .createIndex({ deliveryId: 1, occurredAt: -1 }, { name: "integration_replay_audit_delivery" }),
    database.collection<IntegrationReplayAuditEvent>(integrationReplayAuditCollectionName)
      .createIndex({ occurredAt: -1 }, { name: "integration_replay_audit_recent" })
  ]);
}

export function createIntegrationEvent(input: Omit<IntegrationEventEnvelope, "id" | "version" | "occurredAt"> & {
  id?: string;
  occurredAt?: string;
}): IntegrationEventEnvelope {
  return {
    id: input.id ?? `intevt-${randomUUID()}`,
    type: input.type,
    version: 1,
    occurredAt: input.occurredAt ?? new Date().toISOString(),
    aggregateType: input.aggregateType,
    aggregateId: input.aggregateId,
    payload: input.payload
  };
}

/** Call ensureIntegrationOutboxIndexes(database) before opening the transaction. */
export async function enqueueIntegrationEvent(
  database: Db,
  session: ClientSession,
  event: IntegrationEventEnvelope
) {
  const endpoints = await database.collection<StoredEndpointSubscription>(integrationEndpointCollectionName)
    .find({ enabled: true, subscribedEvents: event.type }, { session })
    .project<{ id: string }>({ id: 1 })
    .toArray();

  await database.collection<IntegrationEventEnvelope>(integrationEventCollectionName)
    .updateOne({ id: event.id }, { $setOnInsert: event }, { upsert: true, session });

  if (endpoints.length) {
    const createdAt = event.occurredAt;
    const deliveries = endpoints.map((endpoint): IntegrationDelivery => ({
      id: `intdel-${event.id}-${endpoint.id}`,
      eventId: event.id,
      endpointId: endpoint.id,
      status: "pending",
      attempts: 0,
      nextAttemptAt: createdAt,
      createdAt
    }));
    await database.collection<IntegrationDelivery>(integrationDeliveryCollectionName).bulkWrite(
      deliveries.map((delivery) => ({
        updateOne: {
          filter: { eventId: delivery.eventId, endpointId: delivery.endpointId },
          update: { $setOnInsert: delivery },
          upsert: true
        }
      })),
      { ordered: false, session }
    );
  }
  return endpoints.length;
}

function retryAt(attempt: number, now = Date.now()) {
  const seconds = retrySeconds[Math.min(Math.max(attempt - 1, 0), retrySeconds.length - 1)];
  return new Date(now + seconds * 1000).toISOString();
}

function deliveryError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? "Unknown integration delivery error");
  const status = error && typeof error === "object" && "status" in error && typeof error.status === "number"
    ? error.status
    : undefined;
  return { message: message.replace(/[\r\n]+/g, " ").slice(0, 500), status };
}

async function claimNextDelivery(database: Db) {
  const now = new Date().toISOString();
  const leaseUntil = new Date(Date.now() + 45_000).toISOString();
  return database.collection<IntegrationDelivery>(integrationDeliveryCollectionName).findOneAndUpdate(
    {
      $or: [
        { status: { $in: ["pending", "retrying"] }, nextAttemptAt: { $lte: now } },
        { status: "delivering", leaseUntil: { $lte: now } }
      ]
    },
    {
      $set: { status: "delivering", leaseUntil, lastAttemptAt: now, updatedAt: now },
      $inc: { attempts: 1 }
    },
    { sort: { nextAttemptAt: 1, createdAt: 1 }, returnDocument: "after" }
  );
}

async function recordAttempt(
  database: Db,
  delivery: IntegrationDelivery,
  outcome: IntegrationDeliveryAttempt["outcome"],
  input?: { responseStatus?: number; error?: string }
) {
  await database.collection<IntegrationDeliveryAttempt>(integrationDeliveryAttemptCollectionName).insertOne({
    id: `intatt-${randomUUID()}`,
    deliveryId: delivery.id,
    eventId: delivery.eventId,
    endpointId: delivery.endpointId,
    attempt: delivery.attempts,
    outcome,
    responseStatus: input?.responseStatus,
    error: input?.error,
    occurredAt: new Date().toISOString()
  });
}

export async function processIntegrationDeliveries(input?: { limit?: number }) {
  const client = await getMongoClient();
  const database = client.db(getMongoDatabaseName());
  await ensureIntegrationOutboxIndexes(database);
  const limit = Math.max(1, Math.min(input?.limit ?? 25, 100));
  const result = { processed: 0, succeeded: 0, retried: 0, deadLettered: 0 };

  for (let index = 0; index < limit; index += 1) {
    const delivery = await claimNextDelivery(database);
    if (!delivery) break;
    result.processed += 1;
    const event = await database.collection<IntegrationEventEnvelope>(integrationEventCollectionName)
      .findOne({ id: delivery.eventId });
    const endpoint = await getIntegrationEndpointRuntime(delivery.endpointId);

    if (!event || !endpoint) {
      const error = !event ? "Integration event no longer exists." : "Integration endpoint is unavailable or disabled.";
      const status: IntegrationDeliveryStatus = delivery.attempts >= maxAttempts ? "dead-letter" : "retrying";
      const now = new Date().toISOString();
      await database.collection<IntegrationDelivery>(integrationDeliveryCollectionName).updateOne(
        { id: delivery.id, status: "delivering" },
        {
          $set: {
            status,
            lastError: error,
            nextAttemptAt: status === "retrying" ? retryAt(delivery.attempts) : delivery.nextAttemptAt,
            ...(status === "dead-letter" ? { deadLetteredAt: now } : {}),
            updatedAt: now
          },
          $unset: { leaseUntil: "" }
        }
      );
      await recordAttempt(database, delivery, status === "dead-letter" ? "dead-letter" : "retrying", { error });
      if (status === "dead-letter") result.deadLettered += 1;
      else result.retried += 1;
      continue;
    }

    try {
      const target = await validateIntegrationWebhookUrl(endpoint.url);
      const response = await deliverSignedIntegrationWebhook({
        target,
        secret: endpoint.signingSecret,
        event
      });
      const now = new Date().toISOString();
      await database.collection<IntegrationDelivery>(integrationDeliveryCollectionName).updateOne(
        { id: delivery.id, status: "delivering" },
        {
          $set: {
            status: "succeeded",
            responseStatus: response.status,
            succeededAt: now,
            updatedAt: now
          },
          $unset: { leaseUntil: "", lastError: "" }
        }
      );
      await recordAttempt(database, delivery, "succeeded", { responseStatus: response.status });
      result.succeeded += 1;
    } catch (error) {
      const details = deliveryError(error);
      const status: IntegrationDeliveryStatus = delivery.attempts >= maxAttempts ? "dead-letter" : "retrying";
      const now = new Date().toISOString();
      await database.collection<IntegrationDelivery>(integrationDeliveryCollectionName).updateOne(
        { id: delivery.id, status: "delivering" },
        {
          $set: {
            status,
            lastError: details.message,
            ...(details.status ? { responseStatus: details.status } : {}),
            nextAttemptAt: status === "retrying" ? retryAt(delivery.attempts) : delivery.nextAttemptAt,
            ...(status === "dead-letter" ? { deadLetteredAt: now } : {}),
            updatedAt: now
          },
          $unset: { leaseUntil: "" }
        }
      );
      await recordAttempt(database, delivery, status === "dead-letter" ? "dead-letter" : "retrying", {
        responseStatus: details.status,
        error: details.message
      });
      if (status === "dead-letter") result.deadLettered += 1;
      else result.retried += 1;
    }
  }
  return result;
}

export async function listRecentIntegrationDeliveries(limit = 100) {
  const client = await getMongoClient();
  const database = client.db(getMongoDatabaseName());
  await ensureIntegrationOutboxIndexes(database);
  return database.collection<IntegrationDelivery>(integrationDeliveryCollectionName)
    .find({})
    .sort({ createdAt: -1 })
    .limit(Math.max(1, Math.min(limit, 500)))
    .toArray();
}

export async function getIntegrationQueueHealth(): Promise<IntegrationQueueHealth> {
  const client = await getMongoClient();
  const database = client.db(getMongoDatabaseName());
  await ensureIntegrationOutboxIndexes(database);
  const deliveries = database.collection<IntegrationDelivery>(integrationDeliveryCollectionName);
  const attempts = database.collection<IntegrationDeliveryAttempt>(integrationDeliveryAttemptCollectionName);
  const now = new Date().toISOString();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const [pending, retrying, delivering, succeeded, deadLetter, due, oldestDue, recentSucceeded, recentRetrying, recentDead] = await Promise.all([
    deliveries.countDocuments({ status: "pending" }),
    deliveries.countDocuments({ status: "retrying" }),
    deliveries.countDocuments({ status: "delivering" }),
    deliveries.countDocuments({ status: "succeeded" }),
    deliveries.countDocuments({ status: "dead-letter" }),
    deliveries.countDocuments({ status: { $in: ["pending", "retrying"] }, nextAttemptAt: { $lte: now } }),
    deliveries.find({ status: { $in: ["pending", "retrying"] }, nextAttemptAt: { $lte: now } })
      .sort({ nextAttemptAt: 1 }).project<{ nextAttemptAt: string }>({ nextAttemptAt: 1 }).limit(1).next(),
    attempts.countDocuments({ occurredAt: { $gte: since }, outcome: "succeeded" }),
    attempts.countDocuments({ occurredAt: { $gte: since }, outcome: "retrying" }),
    attempts.countDocuments({ occurredAt: { $gte: since }, outcome: "dead-letter" })
  ]);
  const recentAttempts = recentSucceeded + recentRetrying + recentDead;
  return {
    pending,
    retrying,
    delivering,
    succeeded,
    deadLetter,
    due,
    oldestDueAt: oldestDue?.nextAttemptAt,
    recent24h: {
      attempts: recentAttempts,
      succeeded: recentSucceeded,
      retrying: recentRetrying,
      deadLetter: recentDead,
      successRate: recentAttempts ? recentSucceeded / recentAttempts : null
    }
  };
}

export async function getIntegrationDeliveryDetail(deliveryId: string) {
  const client = await getMongoClient();
  const database = client.db(getMongoDatabaseName());
  await ensureIntegrationOutboxIndexes(database);
  const delivery = await database.collection<IntegrationDelivery>(integrationDeliveryCollectionName).findOne({ id: deliveryId });
  if (!delivery) return null;
  const [event, attempts, replays] = await Promise.all([
    database.collection<IntegrationEventEnvelope>(integrationEventCollectionName).findOne({ id: delivery.eventId }),
    database.collection<IntegrationDeliveryAttempt>(integrationDeliveryAttemptCollectionName)
      .find({ deliveryId }).sort({ occurredAt: -1 }).limit(200).toArray(),
    database.collection<IntegrationReplayAuditEvent>(integrationReplayAuditCollectionName)
      .find({ deliveryId }).sort({ occurredAt: -1 }).limit(100).toArray()
  ]);
  return { delivery, event, attempts, replays };
}

export async function requeueDeadLetterDelivery(input: {
  deliveryId: string;
  actorIdentityId: string;
  actorRole: UserRole;
  reason: string;
}) {
  const reason = input.reason.trim().replace(/\s+/g, " ");
  if (reason.length < 10 || reason.length > 500) {
    throw Object.assign(new Error("Replay reason must contain 10–500 characters."), { code: "INTEGRATION_REPLAY_REASON_INVALID" });
  }
  const client = await getMongoClient();
  const database = client.db(getMongoDatabaseName());
  await ensureIntegrationOutboxIndexes(database);
  const session = client.startSession();
  let requeued: IntegrationDelivery | null = null;

  try {
    await session.withTransaction(async () => {
      const deliveries = database.collection<IntegrationDelivery>(integrationDeliveryCollectionName);
      const current = await deliveries.findOne({ id: input.deliveryId, status: "dead-letter" }, { session });
      if (!current) return;
      const now = new Date().toISOString();
      const result = await deliveries.findOneAndUpdate(
        { id: current.id, status: "dead-letter" },
        {
          $set: {
            status: "retrying",
            attempts: 0,
            nextAttemptAt: now,
            updatedAt: now
          },
          $unset: {
            deadLetteredAt: "",
            leaseUntil: "",
            responseStatus: "",
            lastError: "",
            succeededAt: ""
          }
        },
        { session, returnDocument: "after" }
      );
      if (!result) return;
      await database.collection<IntegrationReplayAuditEvent>(integrationReplayAuditCollectionName).insertOne({
        id: `intreplay-${randomUUID()}`,
        deliveryId: current.id,
        eventId: current.eventId,
        endpointId: current.endpointId,
        actorIdentityId: input.actorIdentityId,
        actorRole: input.actorRole,
        reason,
        previousAttempts: current.attempts,
        occurredAt: now
      }, { session });
      requeued = result;
    });
    return requeued;
  } finally {
    await session.endSession();
  }
}

export function integrationHistoryRetentionDays() {
  const configured = Number.parseInt(process.env.INTEGRATION_HISTORY_RETENTION_DAYS ?? "180", 10);
  if (!Number.isFinite(configured)) return 180;
  return Math.max(30, Math.min(configured, 730));
}

export async function pruneCompletedIntegrationHistory(input?: { limit?: number }) {
  const client = await getMongoClient();
  const database = client.db(getMongoDatabaseName());
  await ensureIntegrationOutboxIndexes(database);
  const limit = Math.max(1, Math.min(input?.limit ?? 500, 2000));
  const cutoff = new Date(Date.now() - integrationHistoryRetentionDays() * 24 * 60 * 60 * 1000).toISOString();
  const deliveries = database.collection<IntegrationDelivery>(integrationDeliveryCollectionName);
  const completed = await deliveries.find({ status: "succeeded", succeededAt: { $lte: cutoff } })
    .project<{ id: string; eventId: string }>({ id: 1, eventId: 1 })
    .limit(limit)
    .toArray();
  if (!completed.length) return { deliveries: 0, attempts: 0, events: 0 };

  const deliveryIds = completed.map((item) => item.id);
  const eventIds = [...new Set(completed.map((item) => item.eventId))];
  const attemptDelete = await database.collection<IntegrationDeliveryAttempt>(integrationDeliveryAttemptCollectionName)
    .deleteMany({ deliveryId: { $in: deliveryIds } });
  const deliveryDelete = await deliveries.deleteMany({ id: { $in: deliveryIds }, status: "succeeded" });

  let eventsDeleted = 0;
  for (const eventId of eventIds) {
    const remaining = await deliveries.countDocuments({ eventId }, { limit: 1 });
    if (remaining === 0) {
      const removed = await database.collection<IntegrationEventEnvelope>(integrationEventCollectionName).deleteOne({ id: eventId });
      eventsDeleted += removed.deletedCount;
    }
  }
  return {
    deliveries: deliveryDelete.deletedCount,
    attempts: attemptDelete.deletedCount,
    events: eventsDeleted
  };
}
