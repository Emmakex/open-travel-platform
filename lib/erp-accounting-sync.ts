import { randomUUID } from "node:crypto";
import type { Db, MongoClient } from "mongodb";
import type { PaymentTransaction } from "@/domain/payment/types";
import type { IntegrationEventEnvelope, IntegrationEventType } from "@/domain/integrations/types";
import { getErpAccountingAdapter } from "@/lib/erp-accounting-adapter";
import { isErpAccountingConfigured } from "@/lib/erp-accounting-config";
import {
  travelPaymentTransactionCollectionName,
  type StoredPaymentTransaction
} from "@/lib/mongo-payments";
import { getMongoClient, getMongoDatabaseName } from "@/lib/mongodb";
import type {
  ErpAccountingMovementSnapshot,
  ErpAccountingSyncResult
} from "@/repositories/erp-accounting-adapter";

export const erpAccountingDeliveryEndpointId = "erp-accounting-rest:primary";
export const erpAccountingLinkCollectionName = "travel_erp_accounting_links";
export const erpAccountingAuditCollectionName = "travel_erp_accounting_audit";

const erpRelevantEventTypes = new Set<IntegrationEventType>(["payment.transaction.succeeded"]);

type ErpAccountingLink = {
  id: string;
  adapterId: string;
  entityType: "payment-movement";
  localId: string;
  externalId: string;
  firstSyncedAt: string;
  lastSyncedAt: string;
};

type ErpAccountingAuditEvent = {
  id: string;
  eventId: string;
  deliveryId: string;
  adapterId: string;
  entityType: "payment-movement";
  localId: string;
  externalId: string;
  operation: "upsert";
  outcome: "upserted" | "unchanged";
  responseStatus?: number;
  occurredAt: string;
};

function accountingError(code: string, message: string) {
  return Object.assign(new Error(message), { code });
}

export function shouldQueueErpAccountingEvent(type: IntegrationEventType) {
  return isErpAccountingConfigured() && erpRelevantEventTypes.has(type);
}

export function isErpAccountingDelivery(endpointId: string) {
  return endpointId === erpAccountingDeliveryEndpointId;
}

export async function ensureErpAccountingIndexes(database: Db) {
  await Promise.all([
    database.collection<ErpAccountingLink>(erpAccountingLinkCollectionName)
      .createIndex({ id: 1 }, { unique: true, name: "erp_accounting_link_id_unique" }),
    database.collection<ErpAccountingLink>(erpAccountingLinkCollectionName)
      .createIndex(
        { adapterId: 1, entityType: 1, localId: 1 },
        { unique: true, name: "erp_accounting_link_entity_unique" }
      ),
    database.collection<ErpAccountingAuditEvent>(erpAccountingAuditCollectionName)
      .createIndex({ eventId: 1, occurredAt: -1 }, { name: "erp_accounting_audit_event" }),
    database.collection<ErpAccountingAuditEvent>(erpAccountingAuditCollectionName)
      .createIndex({ localId: 1, occurredAt: -1 }, { name: "erp_accounting_audit_entity" })
  ]);
}

function movementSnapshot(transaction: PaymentTransaction): ErpAccountingMovementSnapshot {
  if (transaction.status !== "succeeded") {
    throw accountingError("ERP_ACCOUNTING_MOVEMENT_NOT_FINAL", "Only succeeded payment ledger movements can be synchronized.");
  }
  return {
    localId: transaction.id,
    targetType: transaction.targetType === "service" ? "service" : "trip",
    targetId: transaction.reservationId,
    movementType: transaction.type,
    amount: transaction.amount,
    currency: transaction.currency,
    provider: transaction.provider,
    ...(transaction.method ? { method: transaction.method } : {}),
    ...(transaction.providerReference ? { providerReference: transaction.providerReference } : {}),
    occurredAt: transaction.updatedAt ?? transaction.createdAt
  };
}

async function persistSuccessfulSync(input: {
  client: MongoClient;
  database: Db;
  eventId: string;
  deliveryId: string;
  adapterId: string;
  localId: string;
  result: ErpAccountingSyncResult;
}) {
  const now = new Date().toISOString();
  const links = input.database.collection<ErpAccountingLink>(erpAccountingLinkCollectionName);
  const audit = input.database.collection<ErpAccountingAuditEvent>(erpAccountingAuditCollectionName);
  const session = input.client.startSession();
  try {
    await session.withTransaction(async () => {
      const current = await links.findOne(
        { adapterId: input.adapterId, entityType: "payment-movement", localId: input.localId },
        { session }
      );
      const id = current?.id ?? `erp-link-${randomUUID()}`;
      await links.updateOne(
        { adapterId: input.adapterId, entityType: "payment-movement", localId: input.localId },
        {
          $set: {
            id,
            adapterId: input.adapterId,
            entityType: "payment-movement",
            localId: input.localId,
            externalId: input.result.externalId,
            firstSyncedAt: current?.firstSyncedAt ?? now,
            lastSyncedAt: now
          }
        },
        { upsert: true, session }
      );
      await audit.insertOne({
        id: `erp-audit-${randomUUID()}`,
        eventId: input.eventId,
        deliveryId: input.deliveryId,
        adapterId: input.adapterId,
        entityType: "payment-movement",
        localId: input.localId,
        externalId: input.result.externalId,
        operation: "upsert",
        outcome: input.result.outcome,
        ...(input.result.responseStatus ? { responseStatus: input.result.responseStatus } : {}),
        occurredAt: now
      }, { session });
    });
  } finally {
    await session.endSession();
  }
}

export async function deliverErpAccountingEvent(input: {
  event: IntegrationEventEnvelope;
  deliveryId: string;
}) {
  if (!isErpAccountingConfigured()) {
    throw accountingError("ERP_ACCOUNTING_DISABLED", "ERP/accounting synchronization is disabled or not configured.");
  }
  if (!erpRelevantEventTypes.has(input.event.type) || input.event.aggregateType !== "payment-transaction") {
    throw accountingError("ERP_ACCOUNTING_EVENT_UNSUPPORTED", "This integration event is not an ERP/accounting movement.");
  }

  const client = await getMongoClient();
  const database = client.db(getMongoDatabaseName());
  await ensureErpAccountingIndexes(database);
  const transaction = await database.collection<StoredPaymentTransaction>(travelPaymentTransactionCollectionName)
    .findOne({ id: input.event.aggregateId });
  if (!transaction) {
    throw accountingError("ERP_ACCOUNTING_MOVEMENT_NOT_FOUND", "The payment ledger movement no longer exists.");
  }

  const adapter = getErpAccountingAdapter();
  const result = await adapter.upsertMovement({
    snapshot: movementSnapshot(transaction),
    requestId: `${input.deliveryId}:movement`,
    idempotencyKey: `otp-erp:${input.event.id}:movement`
  });
  await persistSuccessfulSync({
    client,
    database,
    eventId: input.event.id,
    deliveryId: input.deliveryId,
    adapterId: adapter.id,
    localId: transaction.id,
    result
  });
  return { status: result.responseStatus ?? 200 };
}

export async function listRecentErpAccountingAudit(limit = 100) {
  const client = await getMongoClient();
  const database = client.db(getMongoDatabaseName());
  await ensureErpAccountingIndexes(database);
  return database.collection<ErpAccountingAuditEvent>(erpAccountingAuditCollectionName)
    .find({})
    .sort({ occurredAt: -1 })
    .limit(Math.max(1, Math.min(limit, 500)))
    .toArray();
}

export async function listErpAccountingLinks(limit = 100) {
  const client = await getMongoClient();
  const database = client.db(getMongoDatabaseName());
  await ensureErpAccountingIndexes(database);
  return database.collection<ErpAccountingLink>(erpAccountingLinkCollectionName)
    .find({})
    .sort({ lastSyncedAt: -1 })
    .limit(Math.max(1, Math.min(limit, 500)))
    .toArray();
}
