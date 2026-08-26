import { randomUUID } from "node:crypto";
import type { Db } from "mongodb";
import type { StaffRole } from "@/domain/operations/types";
import type { ExportFormat } from "@/lib/tabular-export";
import { getMongoDatabase } from "@/lib/mongodb";
import { operationsConfig } from "@/lib/operations-config";

export const operatorExportAuditCollectionName = "travel_operator_export_audit";

export type OperatorExportType =
  | "reservations"
  | "services"
  | "customers"
  | "reconciliation"
  | "outstanding-balances"
  | "revenue"
  | "protected-travellers";

export type OperatorExportAuditRecord = {
  id: string;
  exportType: OperatorExportType;
  format: ExportFormat;
  actorIdentityId: string;
  actorRole: StaffRole;
  actorDisplayName: string;
  sensitive: boolean;
  rowCount: number;
  columns: string[];
  filters: Record<string, string>;
  reason?: string;
  targetType?: "trip" | "service";
  targetId?: string;
  occurredAt: Date;
};

async function ensureIndexes(database: Db) {
  const collection = database.collection<OperatorExportAuditRecord>(operatorExportAuditCollectionName);
  await Promise.all([
    collection.createIndex({ id: 1 }, { unique: true, name: "operator_export_audit_id_unique" }),
    collection.createIndex({ occurredAt: -1 }, { name: "operator_export_audit_recent" }),
    collection.createIndex({ actorIdentityId: 1, occurredAt: -1 }, { name: "operator_export_audit_actor" }),
    collection.createIndex({ exportType: 1, occurredAt: -1 }, { name: "operator_export_audit_type" })
  ]);
}

function cleanFilters(filters: Record<string, string | undefined>) {
  return Object.fromEntries(
    Object.entries(filters)
      .filter(([, value]) => typeof value === "string" && value.trim())
      .map(([key, value]) => [key.slice(0, 80), value!.trim().slice(0, 200)])
  );
}

export async function recordOperatorExportAudit(input: {
  exportType: OperatorExportType;
  format: ExportFormat;
  actorIdentityId: string;
  actorRole: StaffRole;
  actorDisplayName: string;
  sensitive?: boolean;
  rowCount: number;
  columns: string[];
  filters?: Record<string, string | undefined>;
  reason?: string;
  targetType?: "trip" | "service";
  targetId?: string;
}) {
  const sensitive = input.sensitive === true;
  if (operationsConfig.mode !== "mongodb") {
    if (sensitive) {
      throw Object.assign(
        new Error("Sensitive exports require persistent audit storage."),
        { code: "EXPORT_AUDIT_REQUIRED" }
      );
    }
    return null;
  }

  const database = await getMongoDatabase();
  await ensureIndexes(database);
  const record: OperatorExportAuditRecord = {
    id: `exp-${randomUUID()}`,
    exportType: input.exportType,
    format: input.format,
    actorIdentityId: input.actorIdentityId,
    actorRole: input.actorRole,
    actorDisplayName: input.actorDisplayName.trim().slice(0, 160),
    sensitive,
    rowCount: Math.max(0, Math.trunc(input.rowCount)),
    columns: input.columns.map((column) => column.slice(0, 120)).slice(0, 100),
    filters: cleanFilters(input.filters ?? {}),
    reason: input.reason?.trim().slice(0, 500) || undefined,
    targetType: input.targetType,
    targetId: input.targetId?.slice(0, 160),
    occurredAt: new Date()
  };
  await database.collection<OperatorExportAuditRecord>(operatorExportAuditCollectionName).insertOne(record);
  return record.id;
}

export async function listRecentOperatorExportAudit(input?: {
  actorIdentityId?: string;
  limit?: number;
}) {
  if (operationsConfig.mode !== "mongodb") return [] as OperatorExportAuditRecord[];
  const database = await getMongoDatabase();
  await ensureIndexes(database);
  const limit = Math.max(1, Math.min(input?.limit ?? 30, 100));
  return database.collection<OperatorExportAuditRecord>(operatorExportAuditCollectionName)
    .find(input?.actorIdentityId ? { actorIdentityId: input.actorIdentityId } : {})
    .sort({ occurredAt: -1 })
    .limit(limit)
    .toArray();
}
