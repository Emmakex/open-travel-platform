import { randomBytes, randomUUID } from "node:crypto";
import type { Db } from "mongodb";
import type { UserRole } from "@/domain/identity/types";
import type {
  IntegrationEndpointSummary,
  WebhookIntegrationEventType
} from "@/domain/integrations/types";
import { getMongoClient, getMongoDatabase, getMongoDatabaseName } from "@/lib/mongodb";
import {
  decryptIntegrationSecret,
  encryptIntegrationSecret,
  isIntegrationSecretEncryptionConfigured,
  type EncryptedIntegrationSecret
} from "@/lib/integration-secrets";
import { validateIntegrationWebhookUrl } from "@/lib/integration-webhook-security";

export const integrationEndpointCollectionName = "travel_integration_endpoints";
export const integrationEndpointAuditCollectionName = "travel_integration_endpoint_audit";

export const integrationEventTypes: WebhookIntegrationEventType[] = [
  "trip.reservation.created",
  "trip.reservation.status.changed",
  "service.reservation.created",
  "service.reservation.status.changed"
];

type StoredIntegrationEndpoint = {
  id: string;
  name: string;
  url: string;
  enabled: boolean;
  subscribedEvents: WebhookIntegrationEventType[];
  signingSecret: EncryptedIntegrationSecret;
  createdAt: string;
  createdBy: string;
  updatedAt?: string;
  updatedBy?: string;
};

type IntegrationEndpointAuditEvent = {
  id: string;
  endpointId: string;
  action: "created" | "updated" | "deleted";
  actorIdentityId: string;
  actorRole: UserRole;
  enabled?: boolean;
  subscribedEvents?: WebhookIntegrationEventType[];
  occurredAt: string;
};

export async function ensureIntegrationEndpointIndexes(database: Db) {
  await Promise.all([
    database.collection<StoredIntegrationEndpoint>(integrationEndpointCollectionName)
      .createIndex({ id: 1 }, { unique: true, name: "integration_endpoint_id_unique" }),
    database.collection<StoredIntegrationEndpoint>(integrationEndpointCollectionName)
      .createIndex({ enabled: 1, subscribedEvents: 1 }, { name: "integration_endpoint_subscriptions" }),
    database.collection<IntegrationEndpointAuditEvent>(integrationEndpointAuditCollectionName)
      .createIndex({ endpointId: 1, occurredAt: -1 }, { name: "integration_endpoint_audit_target" }),
    database.collection<IntegrationEndpointAuditEvent>(integrationEndpointAuditCollectionName)
      .createIndex({ occurredAt: -1 }, { name: "integration_endpoint_audit_recent" })
  ]);
}

function summary(endpoint: StoredIntegrationEndpoint): IntegrationEndpointSummary {
  return {
    id: endpoint.id,
    name: endpoint.name,
    url: endpoint.url,
    enabled: endpoint.enabled,
    subscribedEvents: endpoint.subscribedEvents,
    secretConfigured: Boolean(endpoint.signingSecret),
    createdAt: endpoint.createdAt,
    updatedAt: endpoint.updatedAt
  };
}

function normalizeSubscriptions(values: string[]) {
  const valid = new Set(integrationEventTypes);
  return [...new Set(values.filter((value): value is WebhookIntegrationEventType => valid.has(value as WebhookIntegrationEventType)))];
}

export function generateIntegrationSigningSecret() {
  return `otp_whsec_${randomBytes(32).toString("base64url")}`;
}

export async function listIntegrationEndpointSummaries() {
  const database = await getMongoDatabase();
  await ensureIntegrationEndpointIndexes(database);
  const endpoints = await database.collection<StoredIntegrationEndpoint>(integrationEndpointCollectionName)
    .find({})
    .sort({ createdAt: 1 })
    .toArray();
  return endpoints.map(summary);
}

export async function getIntegrationEndpointRuntime(endpointId: string) {
  const database = await getMongoDatabase();
  await ensureIntegrationEndpointIndexes(database);
  const endpoint = await database.collection<StoredIntegrationEndpoint>(integrationEndpointCollectionName)
    .findOne({ id: endpointId, enabled: true });
  if (!endpoint) return null;
  return {
    id: endpoint.id,
    name: endpoint.name,
    url: endpoint.url,
    subscribedEvents: endpoint.subscribedEvents,
    signingSecret: decryptIntegrationSecret(endpoint.signingSecret)
  };
}

export async function saveIntegrationEndpoint(input: {
  endpointId?: string;
  name: string;
  url: string;
  enabled: boolean;
  subscribedEvents: string[];
  signingSecret?: string;
  rotateSecret?: boolean;
  actorIdentityId: string;
  actorRole: UserRole;
}) {
  if (!isIntegrationSecretEncryptionConfigured()) {
    throw Object.assign(new Error("Integration secret encryption is not configured on the server."), { code: "INTEGRATION_ENCRYPTION_REQUIRED" });
  }
  const name = input.name.trim().replace(/\s+/g, " ");
  if (name.length < 3 || name.length > 120) {
    throw Object.assign(new Error("Integration endpoint name must contain 3–120 characters."), { code: "INTEGRATION_NAME_INVALID" });
  }
  const validated = await validateIntegrationWebhookUrl(input.url);
  const normalizedUrl = validated.url.toString();
  const subscribedEvents = normalizeSubscriptions(input.subscribedEvents);
  if (!subscribedEvents.length) {
    throw Object.assign(new Error("Select at least one integration event."), { code: "INTEGRATION_EVENTS_REQUIRED" });
  }

  const client = await getMongoClient();
  const database = client.db(getMongoDatabaseName());
  await ensureIntegrationEndpointIndexes(database);
  const endpoints = database.collection<StoredIntegrationEndpoint>(integrationEndpointCollectionName);
  const audit = database.collection<IntegrationEndpointAuditEvent>(integrationEndpointAuditCollectionName);
  const session = client.startSession();
  let result: { summary: IntegrationEndpointSummary; generatedSecret?: string } | undefined;

  try {
    await session.withTransaction(async () => {
      const current = input.endpointId
        ? await endpoints.findOne({ id: input.endpointId }, { session })
        : null;
      if (input.endpointId && !current) {
        throw Object.assign(new Error("Integration endpoint not found."), { code: "INTEGRATION_NOT_FOUND" });
      }

      const rawSecret = input.rotateSecret
        ? generateIntegrationSigningSecret()
        : input.signingSecret?.trim() || "";
      if (rawSecret && rawSecret.length < 16) {
        throw Object.assign(new Error("Webhook signing secret must contain at least 16 characters."), { code: "INTEGRATION_SECRET_WEAK" });
      }
      const signingSecret = rawSecret ? encryptIntegrationSecret(rawSecret) : current?.signingSecret;
      if (!signingSecret) {
        throw Object.assign(new Error("A signing secret is required."), { code: "INTEGRATION_SECRET_REQUIRED" });
      }

      const now = new Date().toISOString();
      const id = current?.id ?? `int-${randomUUID()}`;
      const next: StoredIntegrationEndpoint = {
        id,
        name,
        url: normalizedUrl,
        enabled: input.enabled,
        subscribedEvents,
        signingSecret,
        createdAt: current?.createdAt ?? now,
        createdBy: current?.createdBy ?? input.actorIdentityId,
        updatedAt: current ? now : undefined,
        updatedBy: current ? input.actorIdentityId : undefined
      };

      await endpoints.replaceOne({ id }, next, { upsert: true, session });
      await audit.insertOne(
        {
          id: `inta-${randomUUID()}`,
          endpointId: id,
          action: current ? "updated" : "created",
          actorIdentityId: input.actorIdentityId,
          actorRole: input.actorRole,
          enabled: next.enabled,
          subscribedEvents: next.subscribedEvents,
          occurredAt: now
        },
        { session }
      );
      result = {
        summary: summary(next),
        generatedSecret: input.rotateSecret ? rawSecret : undefined
      };
    });
  } finally {
    await session.endSession();
  }

  if (!result) throw new Error("Integration endpoint transaction completed without a result.");
  return result;
}

export async function deleteIntegrationEndpoint(input: {
  endpointId: string;
  actorIdentityId: string;
  actorRole: UserRole;
}) {
  const client = await getMongoClient();
  const database = client.db(getMongoDatabaseName());
  await ensureIntegrationEndpointIndexes(database);
  const endpoints = database.collection<StoredIntegrationEndpoint>(integrationEndpointCollectionName);
  const audit = database.collection<IntegrationEndpointAuditEvent>(integrationEndpointAuditCollectionName);
  const session = client.startSession();
  let changed = false;

  try {
    await session.withTransaction(async () => {
      const current = await endpoints.findOne({ id: input.endpointId }, { session });
      if (!current) return;
      const occurredAt = new Date().toISOString();
      await endpoints.deleteOne({ id: current.id }, { session });
      await audit.insertOne(
        {
          id: `inta-${randomUUID()}`,
          endpointId: current.id,
          action: "deleted",
          actorIdentityId: input.actorIdentityId,
          actorRole: input.actorRole,
          occurredAt
        },
        { session }
      );
      changed = true;
    });
  } finally {
    await session.endSession();
  }

  return changed;
}