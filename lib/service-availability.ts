import type { WithId } from "mongodb";
import type {
  ServiceAvailabilitySlot,
  ServiceAvailabilityStatus,
  ServiceInventoryMode
} from "@/domain/services/types";
import { getMongoDatabase } from "@/lib/mongodb";

export const serviceAvailabilityCollectionName = "travel_service_availability";

type StoredServiceAvailabilitySlot = ServiceAvailabilitySlot & {
  createdAt?: Date;
  updatedAt?: Date;
};

export type ServiceAvailabilityDraft = Omit<ServiceAvailabilitySlot, "reserved">;

async function ensureIndexes() {
  const database = await getMongoDatabase();
  const collection = database.collection<StoredServiceAvailabilitySlot>(serviceAvailabilityCollectionName);
  await Promise.all([
    collection.createIndex({ id: 1 }, { unique: true, name: "service_availability_id_unique" }),
    collection.createIndex(
      { serviceId: 1, date: 1, startTime: 1 },
      { unique: true, name: "service_availability_slot_unique" }
    ),
    collection.createIndex(
      { serviceId: 1, status: 1, date: 1, startTime: 1 },
      { name: "service_availability_public" }
    )
  ]);
}

function stripMetadata(document: WithId<StoredServiceAvailabilitySlot>): ServiceAvailabilitySlot {
  const { _id: _ignored, createdAt: _createdAt, updatedAt: _updatedAt, ...slot } = document;
  return slot;
}

function isIsoDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
}

function isClockTime(value: string) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function isInventoryMode(value: string): value is ServiceInventoryMode {
  return value === "people" || value === "units";
}

function isStatus(value: string): value is ServiceAvailabilityStatus {
  return value === "open" || value === "closed";
}

export function availableInventory(slot: Pick<ServiceAvailabilitySlot, "capacity" | "reserved">) {
  return Math.max(0, slot.capacity - slot.reserved);
}

export function validateServiceAvailabilityDraft(slot: ServiceAvailabilityDraft) {
  return Boolean(
    slot.id &&
    slot.serviceId &&
    (slot.serviceType === "activity" || slot.serviceType === "transport") &&
    isIsoDate(slot.date) &&
    isClockTime(slot.startTime) &&
    (!slot.endTime || isClockTime(slot.endTime)) &&
    isInventoryMode(slot.inventoryMode) &&
    Number.isInteger(slot.capacity) &&
    slot.capacity >= 1 &&
    isStatus(slot.status) &&
    (slot.priceOverride === undefined || (Number.isFinite(slot.priceOverride) && slot.priceOverride >= 0))
  );
}

export async function listServiceAvailabilityForAdmin(serviceId: string) {
  await ensureIndexes();
  const database = await getMongoDatabase();
  const documents = await database
    .collection<StoredServiceAvailabilitySlot>(serviceAvailabilityCollectionName)
    .find({ serviceId })
    .sort({ date: 1, startTime: 1 })
    .toArray();
  return documents.map(stripMetadata);
}

export async function listPublishedServiceAvailability(serviceId: string) {
  await ensureIndexes();
  const database = await getMongoDatabase();
  const today = new Date().toISOString().slice(0, 10);
  const documents = await database
    .collection<StoredServiceAvailabilitySlot>(serviceAvailabilityCollectionName)
    .find({ serviceId, status: "open", date: { $gte: today } })
    .sort({ date: 1, startTime: 1 })
    .limit(50)
    .toArray();
  return documents.map(stripMetadata).filter((slot) => availableInventory(slot) > 0);
}

export async function saveServiceAvailabilitySlots(
  serviceId: string,
  serviceType: "activity" | "transport",
  drafts: ServiceAvailabilityDraft[]
) {
  await ensureIndexes();
  const database = await getMongoDatabase();
  const collection = database.collection<StoredServiceAvailabilitySlot>(serviceAvailabilityCollectionName);
  const existing = await collection.find({ serviceId }).toArray();
  const existingById = new Map(existing.map((slot) => [slot.id, slot]));
  const submittedIds = new Set<string>();
  const uniqueScheduleKeys = new Set<string>();

  for (const draft of drafts) {
    if (draft.serviceId !== serviceId || draft.serviceType !== serviceType || !validateServiceAvailabilityDraft(draft)) {
      throw new Error("INVALID_SERVICE_AVAILABILITY");
    }
    if (submittedIds.has(draft.id)) throw new Error("DUPLICATE_SERVICE_AVAILABILITY_ID");
    submittedIds.add(draft.id);

    const scheduleKey = `${draft.date}:${draft.startTime}`;
    if (uniqueScheduleKeys.has(scheduleKey)) throw new Error("DUPLICATE_SERVICE_AVAILABILITY_SLOT");
    uniqueScheduleKeys.add(scheduleKey);

    const previous = existingById.get(draft.id);
    const reserved = previous?.reserved ?? 0;
    if (draft.capacity < reserved) throw new Error("CAPACITY_BELOW_RESERVED");

    const now = new Date();
    await collection.updateOne(
      { id: draft.id },
      {
        $set: {
          ...draft,
          reserved,
          updatedAt: now
        },
        $setOnInsert: { createdAt: now }
      },
      { upsert: true }
    );
  }

  for (const previous of existing) {
    if (submittedIds.has(previous.id)) continue;
    if ((previous.reserved ?? 0) > 0) {
      await collection.updateOne(
        { id: previous.id },
        { $set: { status: "closed", updatedAt: new Date() } }
      );
    } else {
      await collection.deleteOne({ id: previous.id });
    }
  }
}
