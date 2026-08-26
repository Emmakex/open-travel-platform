import { randomUUID } from "node:crypto";
import type { ClientSession, Db } from "mongodb";
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

const maxAttempts = 8;
const retrySeconds = [60, 300, 900, 3600, 14400, 43200, 86400, 86400];

type StoredEndpointSubscription = {
  id: string;
  enabled: boolean;
  subscribedEvents: IntegrationEventType[];
};

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
      .createIndex({ deliveryId: 1, occurredAt: -1 }, { name: "integration_delivery_attempt_history" })
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

export async function enqueueIntegrationEvent(
  database: Db,
  session: ClientSession,
  event: IntegrationEventEnvelope
) {
  await ensureIntegrationOutboxIndexes(database);
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
