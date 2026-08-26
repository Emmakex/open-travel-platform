import { createHash, randomUUID } from "node:crypto";
import type { SupplierFulfilmentItem, SupplierFulfilmentTargetType, StaffRole } from "@/domain/operations/types";
import { getMongoClient, getMongoDatabaseName } from "@/lib/mongodb";
import { operationsConfig } from "@/lib/operations-config";
import { getSupplierFulfilmentAdapter } from "@/lib/supplier-fulfilment-adapter";
import {
  saveSupplierFulfilment,
  travelSupplierFulfilmentCollectionName
} from "@/lib/supplier-fulfilment";
import type {
  SupplierAdapterOperation,
  SupplierAdapterResult
} from "@/repositories/supplier-fulfilment-adapter";

export const travelSupplierFulfilmentAdapterAuditCollectionName = "travel_supplier_fulfilment_adapter_audit";

export type SupplierAdapterAuditOutcome = "received" | "applied" | "no-change" | "conflict" | "failed";

export interface SupplierFulfilmentAdapterAuditEvent {
  id: string;
  fulfilmentId: string;
  targetType: SupplierFulfilmentTargetType;
  targetId: string;
  componentKey: string;
  adapterId: string;
  operation: SupplierAdapterOperation;
  requestId: string;
  outcome: SupplierAdapterAuditOutcome;
  responseStatus?: string;
  responseReference?: string;
  providerMessage?: string;
  errorCode?: string;
  actorIdentityId: string;
  actorRole: StaffRole;
  actorDisplayName: string;
  occurredAt: string;
  appliedAt?: string;
}

export interface PerformSupplierAdapterOperationInput {
  fulfilmentId: string;
  operation: SupplierAdapterOperation;
  actorIdentityId: string;
  actorRole: StaffRole;
  actorDisplayName: string;
}

function syncError(code: string, message: string) {
  return Object.assign(new Error(message), { code });
}

function errorCode(error: unknown) {
  return error && typeof error === "object" && "code" in error ? String(error.code) : "SUPPLIER_ADAPTER_FAILED";
}

function assertOperationAllowed(item: SupplierFulfilmentItem, operation: SupplierAdapterOperation) {
  if (!item.supplierName) throw syncError("SUPPLIER_ADAPTER_SUPPLIER_REQUIRED", "Save a supplier before using the external adapter.");
  if (item.status === "cancelled") throw syncError("SUPPLIER_ADAPTER_INVALID_OPERATION", "Cancelled supplier fulfilment cannot be synchronized.");
  if (operation === "request" && item.status === "requested") {
    throw syncError("SUPPLIER_ADAPTER_INVALID_OPERATION", "This supplier fulfilment is already requested. Synchronize status instead.");
  }
  if (operation === "cancel" && item.status === "not-requested") {
    throw syncError("SUPPLIER_ADAPTER_INVALID_OPERATION", "A supplier request must exist before it can be cancelled externally.");
  }
  if (operation === "status" && item.status === "not-requested") {
    throw syncError("SUPPLIER_ADAPTER_INVALID_OPERATION", "Request the supplier before synchronizing external status.");
  }
}

function idempotencyKey(item: SupplierFulfilmentItem, operation: SupplierAdapterOperation) {
  if (operation === "status") return undefined;
  const revision = item.updatedAt ?? item.createdAt;
  const digest = createHash("sha256")
    .update(`${item.id}|${operation}|${revision}|${item.status}|${item.supplierReference ?? ""}`)
    .digest("hex");
  return `otp-supplier-${digest}`;
}

async function ensureAuditIndexes() {
  const client = await getMongoClient();
  const database = client.db(getMongoDatabaseName());
  const audit = database.collection<SupplierFulfilmentAdapterAuditEvent>(travelSupplierFulfilmentAdapterAuditCollectionName);
  await Promise.all([
    audit.createIndex({ id: 1 }, { unique: true, name: "travel_supplier_adapter_audit_id_unique" }),
    audit.createIndex({ fulfilmentId: 1, occurredAt: -1 }, { name: "travel_supplier_adapter_audit_fulfilment" }),
    audit.createIndex({ targetType: 1, targetId: 1, occurredAt: -1 }, { name: "travel_supplier_adapter_audit_target" })
  ]);
  return { database, audit };
}

export async function listSupplierAdapterAuditForTarget(targetType: SupplierFulfilmentTargetType, targetId: string) {
  if (operationsConfig.mode !== "mongodb") return [] as SupplierFulfilmentAdapterAuditEvent[];
  const { audit } = await ensureAuditIndexes();
  return audit.find({ targetType, targetId }).sort({ occurredAt: -1 }).limit(300).toArray();
}

export async function performSupplierAdapterOperation(input: PerformSupplierAdapterOperationInput) {
  if (operationsConfig.mode !== "mongodb" || !operationsConfig.writesEnabled) {
    throw syncError("SUPPLIER_ADAPTER_UNAVAILABLE", "Supplier adapter synchronization requires writable MongoDB operations mode.");
  }
  if (!input.fulfilmentId || !["request", "status", "cancel"].includes(input.operation)) {
    throw syncError("SUPPLIER_ADAPTER_INVALID_OPERATION", "Supplier adapter operation is invalid.");
  }

  const { database, audit } = await ensureAuditIndexes();
  const item = await database.collection<SupplierFulfilmentItem>(travelSupplierFulfilmentCollectionName)
    .findOne({ id: input.fulfilmentId });
  if (!item) throw syncError("SUPPLIER_ADAPTER_FULFILMENT_NOT_FOUND", "Supplier fulfilment item was not found.");
  assertOperationAllowed(item, input.operation);

  const adapter = getSupplierFulfilmentAdapter();
  const requestId = `otp-supplier-${randomUUID()}`;
  const occurredAt = new Date().toISOString();
  const auditId = `ful-adapter-${randomUUID()}`;
  const baseAudit = {
    id: auditId,
    fulfilmentId: item.id,
    targetType: item.targetType,
    targetId: item.targetId,
    componentKey: item.componentKey,
    adapterId: adapter.id,
    operation: input.operation,
    requestId,
    actorIdentityId: input.actorIdentityId,
    actorRole: input.actorRole,
    actorDisplayName: input.actorDisplayName.trim(),
    occurredAt
  };

  const markOutcome = async (fields: Partial<SupplierFulfilmentAdapterAuditEvent>) => {
    try {
      await audit.updateOne({ id: auditId }, { $set: fields });
    } catch {
      // The response audit is already persisted before local application.
      // Outcome enrichment is best-effort so a successful local apply is not misreported as failed.
    }
  };

  let result: SupplierAdapterResult;
  try {
    result = await adapter.execute({
      operation: input.operation,
      component: item,
      item,
      requestId,
      idempotencyKey: idempotencyKey(item, input.operation)
    });
  } catch (error) {
    const failedAudit: SupplierFulfilmentAdapterAuditEvent = {
      ...baseAudit,
      outcome: "failed",
      errorCode: errorCode(error)
    };
    try {
      await audit.insertOne(failedAudit);
    } catch {
      throw syncError("SUPPLIER_ADAPTER_AUDIT_FAILED", "Supplier adapter failed and its audit record could not be persisted.");
    }
    throw error;
  }

  const receivedAudit: SupplierFulfilmentAdapterAuditEvent = {
    ...baseAudit,
    outcome: "received",
    responseStatus: result.status,
    ...(result.supplierReference ? { responseReference: result.supplierReference } : {}),
    ...(result.providerMessage ? { providerMessage: result.providerMessage } : {})
  };
  try {
    await audit.insertOne(receivedAudit);
  } catch {
    throw syncError("SUPPLIER_ADAPTER_AUDIT_FAILED", "Supplier adapter response could not be audited, so it was not applied locally.");
  }

  try {
    const saved = await saveSupplierFulfilment({
      targetType: item.targetType,
      targetId: item.targetId,
      componentKey: item.componentKey,
      status: result.status,
      supplierName: item.supplierName,
      supplierReference: result.supplierReference ?? item.supplierReference,
      supplierCost: item.supplierCost,
      supplierCurrency: item.supplierCurrency,
      deadline: item.deadline,
      actorIdentityId: input.actorIdentityId,
      actorRole: input.actorRole,
      actorDisplayName: input.actorDisplayName
    });
    await markOutcome({ outcome: "applied", appliedAt: new Date().toISOString() });
    return saved ?? item;
  } catch (error) {
    const code = errorCode(error);
    if (code === "NO_CHANGES") {
      await markOutcome({ outcome: "no-change", appliedAt: new Date().toISOString() });
      return item;
    }
    if (code === "INVALID_TRANSITION") {
      await markOutcome({ outcome: "conflict", errorCode: "SUPPLIER_ADAPTER_STATUS_CONFLICT" });
      throw syncError("SUPPLIER_ADAPTER_STATUS_CONFLICT", "The external supplier status conflicts with the allowed local fulfilment transition.");
    }
    await markOutcome({ outcome: "failed", errorCode: code });
    throw error;
  }
}
