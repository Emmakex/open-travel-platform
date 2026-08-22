import { createHash, randomUUID } from "node:crypto";
import { getMongoDatabase } from "@/lib/mongodb";

export const authAuditCollectionName = "travel_auth_audit";

export type AuthScope = "customer" | "staff";
export type AuthAuditEventType =
  | "sign_in_success"
  | "sign_in_failure"
  | "sign_out"
  | "password_changed"
  | "account_locked";

export type StoredAuthAuditEvent = {
  id: string;
  scope: AuthScope;
  event: AuthAuditEventType;
  subjectId?: string;
  emailHash?: string;
  occurredAt: Date;
};

export const authLockout = {
  maxFailedAttempts: 5,
  lockMinutes: 15
} as const;

export function hashEmailForAudit(email: string) {
  return createHash("sha256").update(email.trim().toLowerCase()).digest("hex");
}

export async function ensureAuthAuditIndexes() {
  const database = await getMongoDatabase();
  const audit = database.collection<StoredAuthAuditEvent>(authAuditCollectionName);
  await Promise.all([
    audit.createIndex({ occurredAt: -1 }, { name: "travel_auth_audit_occurred" }),
    audit.createIndex({ subjectId: 1, occurredAt: -1 }, { name: "travel_auth_audit_subject" }),
    audit.createIndex({ scope: 1, event: 1, occurredAt: -1 }, { name: "travel_auth_audit_scope_event" })
  ]);
}

export async function recordAuthAudit(input: {
  scope: AuthScope;
  event: AuthAuditEventType;
  subjectId?: string;
  email?: string;
}) {
  await ensureAuthAuditIndexes();
  const database = await getMongoDatabase();
  await database.collection<StoredAuthAuditEvent>(authAuditCollectionName).insertOne({
    id: `auth-${randomUUID()}`,
    scope: input.scope,
    event: input.event,
    subjectId: input.subjectId,
    emailHash: input.email ? hashEmailForAudit(input.email) : undefined,
    occurredAt: new Date()
  });
}

export async function listRecentAuthAudit(limit = 100) {
  await ensureAuthAuditIndexes();
  const database = await getMongoDatabase();
  return database.collection<StoredAuthAuditEvent>(authAuditCollectionName)
    .find({})
    .sort({ occurredAt: -1 })
    .limit(Math.max(1, Math.min(limit, 250)))
    .toArray();
}
