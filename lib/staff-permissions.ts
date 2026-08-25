import type { StaffCapability } from "@/domain/identity/types";
import { getMongoDatabase } from "@/lib/mongodb";
import { normalizeStaffCapabilities } from "@/lib/staff-capabilities";

export const staffCapabilityCollectionName = "travel_staff_capabilities";

type StoredStaffCapabilityAssignment = {
  userId: string;
  capabilities: StaffCapability[];
  updatedAt: Date;
  updatedBy: string;
};

async function collection() {
  const database = await getMongoDatabase();
  const result = database.collection<StoredStaffCapabilityAssignment>(staffCapabilityCollectionName);
  await result.createIndex({ userId: 1 }, { unique: true, name: "travel_staff_capability_user_unique" });
  return result;
}

export async function getExplicitStaffCapabilities(userId: string) {
  const record = await (await collection()).findOne({ userId });
  return record ? [...record.capabilities] : undefined;
}

export async function listExplicitStaffCapabilities() {
  const records = await (await collection()).find({}).toArray();
  return new Map(records.map((record) => [record.userId, [...record.capabilities]]));
}

export async function setExplicitStaffCapabilities(input: {
  userId: string;
  capabilities: string[];
  updatedBy: string;
}) {
  const capabilities = normalizeStaffCapabilities(input.capabilities);
  const updatedAt = new Date();
  await (await collection()).updateOne(
    { userId: input.userId },
    {
      $set: {
        capabilities,
        updatedAt,
        updatedBy: input.updatedBy
      }
    },
    { upsert: true }
  );
  return capabilities;
}

export async function clearExplicitStaffCapabilities(userId: string) {
  await (await collection()).deleteOne({ userId });
}
