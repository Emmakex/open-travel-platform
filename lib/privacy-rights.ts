import { randomUUID } from "node:crypto";
import type { ClientSession, Db } from "mongodb";
import { getMongoClient, getMongoDatabaseName } from "@/lib/mongodb";

export const privacyRequestCollectionName = "travel_privacy_requests";
export const privacyRequestAuditCollectionName = "travel_privacy_request_audit";

export const privacyRightTypes = [
  "access",
  "rectification",
  "erasure",
  "restriction",
  "objection",
  "portability"
] as const;
export type PrivacyRightType = (typeof privacyRightTypes)[number];

export const privacyRequestStatuses = [
  "received",
  "verification-required",
  "in-review",
  "action-pending",
  "completed",
  "declined",
  "withdrawn"
] as const;
export type PrivacyRequestStatus = (typeof privacyRequestStatuses)[number];

export type PrivacyRetentionState = "not-applicable" | "pending" | "clear" | "hold";
export type PrivacyRetentionReason =
  | "legal-obligation"
  | "legal-claims"
  | "rights-of-others"
  | "other-applicable-basis";
export type PrivacyExtensionReason = "complexity" | "request-volume";
export type PrivacyOutcomeCode =
  | "fulfilled"
  | "partially-fulfilled"
  | "identity-not-verified"
  | "not-applicable"
  | "retention-required";

export type StoredPrivacyRequest = {
  id: string;
  identityId: string;
  type: PrivacyRightType;
  status: PrivacyRequestStatus;
  openKey?: string;
  receivedAt: Date;
  dueAt: Date;
  extendedDueAt?: Date;
  extensionReason?: PrivacyExtensionReason;
  retentionState: PrivacyRetentionState;
  retentionReason?: PrivacyRetentionReason;
  outcomeCode?: PrivacyOutcomeCode;
  completedAt?: Date;
  updatedAt?: Date;
};

export type PrivacyRequestAuditEvent = {
  id: string;
  requestId: string;
  identityId: string;
  actorId: string;
  actorType: "customer" | "staff";
  action:
    | "requested"
    | "status-changed"
    | "deadline-extended"
    | "retention-reviewed"
    | "withdrawn";
  fromStatus?: PrivacyRequestStatus;
  toStatus?: PrivacyRequestStatus;
  extensionReason?: PrivacyExtensionReason;
  retentionState?: PrivacyRetentionState;
  retentionReason?: PrivacyRetentionReason;
  outcomeCode?: PrivacyOutcomeCode;
  occurredAt: Date;
};

const terminalStatuses = new Set<PrivacyRequestStatus>(["completed", "declined", "withdrawn"]);

function privacyError(code: string, message: string) {
  return Object.assign(new Error(message), { code });
}

function daysInUtcMonth(year: number, month: number) {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
}

export function addUtcCalendarMonths(input: Date, months: number) {
  const year = input.getUTCFullYear();
  const monthIndex = input.getUTCMonth() + months;
  const targetYear = year + Math.floor(monthIndex / 12);
  const targetMonth = ((monthIndex % 12) + 12) % 12;
  const targetDay = Math.min(input.getUTCDate(), daysInUtcMonth(targetYear, targetMonth));
  return new Date(Date.UTC(
    targetYear,
    targetMonth,
    targetDay,
    input.getUTCHours(),
    input.getUTCMinutes(),
    input.getUTCSeconds(),
    input.getUTCMilliseconds()
  ));
}

export function privacyRequestDueAt(receivedAt: Date) {
  return addUtcCalendarMonths(receivedAt, 1);
}

export async function ensurePrivacyRequestIndexes(database: Db) {
  const requests = database.collection<StoredPrivacyRequest>(privacyRequestCollectionName);
  const audit = database.collection<PrivacyRequestAuditEvent>(privacyRequestAuditCollectionName);
  await Promise.all([
    requests.createIndex({ id: 1 }, { unique: true, name: "privacy_request_id_unique" }),
    requests.createIndex({ openKey: 1 }, { unique: true, sparse: true, name: "privacy_request_open_unique" }),
    requests.createIndex({ identityId: 1, receivedAt: -1 }, { name: "privacy_request_identity_received" }),
    requests.createIndex({ status: 1, dueAt: 1 }, { name: "privacy_request_status_due" }),
    audit.createIndex({ id: 1 }, { unique: true, name: "privacy_request_audit_id_unique" }),
    audit.createIndex({ requestId: 1, occurredAt: 1 }, { name: "privacy_request_audit_request" }),
    audit.createIndex({ occurredAt: -1 }, { name: "privacy_request_audit_occurred" })
  ]);
}

function isPrivacyRightType(value: string): value is PrivacyRightType {
  return (privacyRightTypes as readonly string[]).includes(value);
}

function canTransition(from: PrivacyRequestStatus, to: PrivacyRequestStatus) {
  if (from === to) return true;
  if (terminalStatuses.has(from)) return false;
  if (to === "withdrawn") return false;
  if (from === "received") return ["verification-required", "in-review", "declined"].includes(to);
  if (from === "verification-required") return ["in-review", "declined"].includes(to);
  if (from === "in-review") return ["verification-required", "action-pending", "completed", "declined"].includes(to);
  if (from === "action-pending") return ["in-review", "completed", "declined"].includes(to);
  return false;
}

async function insertAudit(database: Db, session: ClientSession, event: Omit<PrivacyRequestAuditEvent, "id" | "occurredAt">) {
  await database.collection<PrivacyRequestAuditEvent>(privacyRequestAuditCollectionName).insertOne({
    ...event,
    id: `pra-${randomUUID()}`,
    occurredAt: new Date()
  }, { session });
}

export async function createPrivacyRequest(identityId: string, rawType: string) {
  if (!isPrivacyRightType(rawType)) throw privacyError("PRIVACY_TYPE_INVALID", "Unsupported privacy-right request type.");
  const client = await getMongoClient();
  const database = client.db(getMongoDatabaseName());
  await ensurePrivacyRequestIndexes(database);
  const receivedAt = new Date();
  const request: StoredPrivacyRequest = {
    id: `prq-${randomUUID()}`,
    identityId,
    type: rawType,
    status: "received",
    openKey: `${identityId}:${rawType}`,
    receivedAt,
    dueAt: privacyRequestDueAt(receivedAt),
    retentionState: rawType === "erasure" ? "pending" : "not-applicable"
  };
  const session = client.startSession();
  try {
    await session.withTransaction(async () => {
      await database.collection<StoredPrivacyRequest>(privacyRequestCollectionName).insertOne(request, { session });
      await insertAudit(database, session, {
        requestId: request.id,
        identityId,
        actorId: identityId,
        actorType: "customer",
        action: "requested",
        toStatus: "received"
      });
    });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && Number((error as { code?: unknown }).code) === 11000) {
      throw privacyError("PRIVACY_REQUEST_ALREADY_OPEN", "An open request of this type already exists.");
    }
    throw error;
  } finally {
    await session.endSession();
  }
  return request;
}

export async function listPrivacyRequestsForCustomer(identityId: string) {
  const client = await getMongoClient();
  const database = client.db(getMongoDatabaseName());
  await ensurePrivacyRequestIndexes(database);
  return database.collection<StoredPrivacyRequest>(privacyRequestCollectionName)
    .find({ identityId })
    .sort({ receivedAt: -1 })
    .limit(100)
    .toArray();
}

export async function withdrawPrivacyRequest(identityId: string, requestId: string) {
  const client = await getMongoClient();
  const database = client.db(getMongoDatabaseName());
  await ensurePrivacyRequestIndexes(database);
  const session = client.startSession();
  let withdrawn = false;
  try {
    await session.withTransaction(async () => {
      const current = await database.collection<StoredPrivacyRequest>(privacyRequestCollectionName)
        .findOne({ id: requestId, identityId }, { session });
      if (!current) throw privacyError("PRIVACY_REQUEST_NOT_FOUND", "Privacy request not found.");
      if (terminalStatuses.has(current.status)) throw privacyError("PRIVACY_REQUEST_TERMINAL", "Privacy request is already closed.");
      const updatedAt = new Date();
      const update = await database.collection<StoredPrivacyRequest>(privacyRequestCollectionName).updateOne(
        { id: current.id, identityId, status: current.status },
        { $set: { status: "withdrawn", updatedAt }, $unset: { openKey: "" } },
        { session }
      );
      if (update.modifiedCount !== 1) throw privacyError("PRIVACY_REQUEST_CONFLICT", "Privacy request changed concurrently.");
      await insertAudit(database, session, {
        requestId: current.id,
        identityId,
        actorId: identityId,
        actorType: "customer",
        action: "withdrawn",
        fromStatus: current.status,
        toStatus: "withdrawn"
      });
      withdrawn = true;
    });
  } finally {
    await session.endSession();
  }
  return withdrawn;
}

export async function listPrivacyRequestsForAdmin(limit = 200) {
  const client = await getMongoClient();
  const database = client.db(getMongoDatabaseName());
  await ensurePrivacyRequestIndexes(database);
  return database.collection<StoredPrivacyRequest>(privacyRequestCollectionName)
    .find({})
    .sort({ receivedAt: -1 })
    .limit(Math.max(1, Math.min(limit, 500)))
    .toArray();
}

export async function listPrivacyRequestAudit(requestId: string) {
  const client = await getMongoClient();
  const database = client.db(getMongoDatabaseName());
  await ensurePrivacyRequestIndexes(database);
  return database.collection<PrivacyRequestAuditEvent>(privacyRequestAuditCollectionName)
    .find({ requestId })
    .sort({ occurredAt: 1 })
    .limit(200)
    .toArray();
}

export async function updatePrivacyRequestByAdmin(input: {
  actorId: string;
  requestId: string;
  status?: PrivacyRequestStatus;
  extendByMonths?: 1 | 2;
  extensionReason?: PrivacyExtensionReason;
  retentionState?: PrivacyRetentionState;
  retentionReason?: PrivacyRetentionReason;
  outcomeCode?: PrivacyOutcomeCode;
}) {
  const client = await getMongoClient();
  const database = client.db(getMongoDatabaseName());
  await ensurePrivacyRequestIndexes(database);
  const session = client.startSession();
  let result: StoredPrivacyRequest | null = null;

  try {
    await session.withTransaction(async () => {
      const requests = database.collection<StoredPrivacyRequest>(privacyRequestCollectionName);
      const current = await requests.findOne({ id: input.requestId }, { session });
      if (!current) throw privacyError("PRIVACY_REQUEST_NOT_FOUND", "Privacy request not found.");
      if (input.status === "withdrawn") throw privacyError("PRIVACY_STATUS_INVALID", "Only the customer can withdraw a request.");
      if (input.status && !canTransition(current.status, input.status)) {
        throw privacyError("PRIVACY_STATUS_INVALID", `Invalid privacy request transition: ${current.status} -> ${input.status}`);
      }
      if (input.extendByMonths && !input.extensionReason) {
        throw privacyError("PRIVACY_EXTENSION_REASON_REQUIRED", "An extension reason is required.");
      }
      if (input.retentionState && current.type !== "erasure") {
        throw privacyError("PRIVACY_RETENTION_NOT_APPLICABLE", "Retention review applies only to erasure requests.");
      }
      if (input.retentionState === "hold" && !input.retentionReason) {
        throw privacyError("PRIVACY_RETENTION_REASON_REQUIRED", "A structured retention reason is required for a hold.");
      }

      const nextStatus = input.status ?? current.status;
      const updatedAt = new Date();
      const set: Record<string, unknown> = { updatedAt };
      const unset: Record<string, ""> = {};
      if (input.status) set.status = nextStatus;
      if (input.extendByMonths) {
        set.extendedDueAt = addUtcCalendarMonths(current.receivedAt, 1 + input.extendByMonths);
        set.extensionReason = input.extensionReason;
      }
      if (input.retentionState) {
        set.retentionState = input.retentionState;
        if (input.retentionState === "hold") set.retentionReason = input.retentionReason;
        else unset.retentionReason = "";
      }
      if (input.outcomeCode) set.outcomeCode = input.outcomeCode;
      if (terminalStatuses.has(nextStatus)) {
        set.completedAt = updatedAt;
        unset.openKey = "";
      }

      const update = await requests.updateOne(
        { id: current.id, status: current.status },
        { $set: set, ...(Object.keys(unset).length ? { $unset: unset } : {}) },
        { session }
      );
      if (update.modifiedCount !== 1) throw privacyError("PRIVACY_REQUEST_CONFLICT", "Privacy request changed concurrently.");

      if (input.status && input.status !== current.status) {
        await insertAudit(database, session, {
          requestId: current.id,
          identityId: current.identityId,
          actorId: input.actorId,
          actorType: "staff",
          action: "status-changed",
          fromStatus: current.status,
          toStatus: input.status,
          outcomeCode: input.outcomeCode
        });
      }
      if (input.extendByMonths) {
        await insertAudit(database, session, {
          requestId: current.id,
          identityId: current.identityId,
          actorId: input.actorId,
          actorType: "staff",
          action: "deadline-extended",
          extensionReason: input.extensionReason
        });
      }
      if (input.retentionState) {
        await insertAudit(database, session, {
          requestId: current.id,
          identityId: current.identityId,
          actorId: input.actorId,
          actorType: "staff",
          action: "retention-reviewed",
          retentionState: input.retentionState,
          retentionReason: input.retentionState === "hold" ? input.retentionReason : undefined
        });
      }

      result = await requests.findOne({ id: current.id }, { session });
    });
  } finally {
    await session.endSession();
  }
  return result;
}
