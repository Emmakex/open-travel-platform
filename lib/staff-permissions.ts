import { randomUUID } from "node:crypto";
import type { Db } from "mongodb";
import type { StaffCapability } from "@/domain/identity/types";
import { getMongoClient, getMongoDatabase, getMongoDatabaseName } from "@/lib/mongodb";
import { normalizeStaffCapabilities } from "@/lib/staff-capabilities";

export const staffCapabilityCollectionName = "travel_staff_capabilities";
export const staffCapabilityAuditCollectionName = "travel_staff_capability_audit";

type StoredStaffCapabilityAssignment = {
  userId: string;
  capabilities: StaffCapability[];
  updatedAt: Date;
  updatedBy: string;
};

export type StaffCapabilityAuditEvent = {
  id: string;
  userId: string;
  action: "set-explicit" | "clear-explicit";
  beforeMode: "legacy" | "explicit";
  beforeCapabilities?: StaffCapability[];
  afterMode: "legacy" | "explicit";
  afterCapabilities?: StaffCapability[];
  actorIdentityId: string;
  occurredAt: Date;
};

async function ensureIndexes(database: Db) {
  const assignments = database.collection<StoredStaffCapabilityAssignment>(staffCapabilityCollectionName);
  const audit = database.collection<StaffCapabilityAuditEvent>(staffCapabilityAuditCollectionName);
  await Promise.all([
    assignments.createIndex({ userId: 1 }, { unique: true, name: "travel_staff_capability_user_unique" }),
    audit.createIndex({ userId: 1, occurredAt: -1 }, { name: "travel_staff_capability_audit_user" }),
    audit.createIndex({ occurredAt: -1 }, { name: "travel_staff_capability_audit_recent" })
  ]);
}

function sameCapabilities(left: StaffCapability[] | undefined, right: StaffCapability[]) {
  if (!left || left.length !== right.length) return false;
  return left.every((capability, index) => capability === right[index]);
}

export async function getExplicitStaffCapabilities(userId: string) {
  const database = await getMongoDatabase();
  await ensureIndexes(database);
  const record = await database.collection<StoredStaffCapabilityAssignment>(staffCapabilityCollectionName).findOne({ userId });
  return record ? [...record.capabilities] : undefined;
}

export async function listExplicitStaffCapabilities() {
  const database = await getMongoDatabase();
  await ensureIndexes(database);
  const records = await database.collection<StoredStaffCapabilityAssignment>(staffCapabilityCollectionName).find({}).toArray();
  return new Map(records.map((record) => [record.userId, [...record.capabilities]]));
}

export async function listRecentStaffCapabilityAudit(limit = 40) {
  const database = await getMongoDatabase();
  await ensureIndexes(database);
  return database
    .collection<StaffCapabilityAuditEvent>(staffCapabilityAuditCollectionName)
    .find({})
    .sort({ occurredAt: -1 })
    .limit(Math.max(1, Math.min(100, Math.floor(limit))))
    .toArray();
}

export async function setExplicitStaffCapabilities(input: {
  userId: string;
  capabilities: string[];
  updatedBy: string;
}) {
  const capabilities = normalizeStaffCapabilities(input.capabilities);
  const client = await getMongoClient();
  const database = client.db(getMongoDatabaseName());
  await ensureIndexes(database);
  const assignments = database.collection<StoredStaffCapabilityAssignment>(staffCapabilityCollectionName);
  const audit = database.collection<StaffCapabilityAuditEvent>(staffCapabilityAuditCollectionName);
  const session = client.startSession();

  try {
    await session.withTransaction(async () => {
      const current = await assignments.findOne({ userId: input.userId }, { session });
      if (current && sameCapabilities(current.capabilities, capabilities)) return;

      const occurredAt = new Date();
      await assignments.updateOne(
        { userId: input.userId },
        {
          $set: {
            capabilities,
            updatedAt: occurredAt,
            updatedBy: input.updatedBy
          }
        },
        { upsert: true, session }
      );

      await audit.insertOne(
        {
          id: randomUUID(),
          userId: input.userId,
          action: "set-explicit",
          beforeMode: current ? "explicit" : "legacy",
          beforeCapabilities: current ? [...current.capabilities] : undefined,
          afterMode: "explicit",
          afterCapabilities: [...capabilities],
          actorIdentityId: input.updatedBy,
          occurredAt
        },
        { session }
      );
    });
  } finally {
    await session.endSession();
  }

  return capabilities;
}

export async function clearExplicitStaffCapabilities(userId: string, updatedBy = "system") {
  const client = await getMongoClient();
  const database = client.db(getMongoDatabaseName());
  await ensureIndexes(database);
  const assignments = database.collection<StoredStaffCapabilityAssignment>(staffCapabilityCollectionName);
  const audit = database.collection<StaffCapabilityAuditEvent>(staffCapabilityAuditCollectionName);
  const session = client.startSession();
  let changed = false;

  try {
    await session.withTransaction(async () => {
      const current = await assignments.findOne({ userId }, { session });
      if (!current) return;

      const occurredAt = new Date();
      await assignments.deleteOne({ userId }, { session });
      await audit.insertOne(
        {
          id: randomUUID(),
          userId,
          action: "clear-explicit",
          beforeMode: "explicit",
          beforeCapabilities: [...current.capabilities],
          afterMode: "legacy",
          actorIdentityId: updatedBy,
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
