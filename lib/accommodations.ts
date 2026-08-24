import type { Db, WithId } from "mongodb";
import type {
  Accommodation,
  AccommodationInventoryPeriod,
  AccommodationTranslation
} from "@/domain/accommodation/types";
import type { TravelLocale } from "@/domain/travel/types";
import { getMongoClient, getMongoDatabaseName } from "@/lib/mongodb";

export const accommodationCollectionName = "travel_accommodations";
export const accommodationInventoryCollectionName = "travel_accommodation_inventory";

type StoredAccommodation = Accommodation & { createdAt?: Date; updatedAt?: Date };
type StoredAccommodationInventory = AccommodationInventoryPeriod & { createdAt?: Date; updatedAt?: Date };

export async function ensureAccommodationIndexes(database: Db) {
  const accommodations = database.collection<StoredAccommodation>(accommodationCollectionName);
  const inventory = database.collection<StoredAccommodationInventory>(accommodationInventoryCollectionName);
  await Promise.all([
    accommodations.createIndex({ id: 1 }, { unique: true, name: "accommodation_id_unique" }),
    accommodations.createIndex({ slug: 1 }, { unique: true, name: "accommodation_slug_unique" }),
    accommodations.createIndex(
      { publicationStatus: 1, featured: -1, name: 1 },
      { name: "accommodation_public_catalogue" }
    ),
    inventory.createIndex({ id: 1 }, { unique: true, name: "accommodation_inventory_id_unique" }),
    inventory.createIndex(
      { accommodationId: 1, roomTypeId: 1, startDate: 1, endDate: 1 },
      { name: "accommodation_room_inventory_period" }
    )
  ]);
}

function stripAccommodation(document: WithId<StoredAccommodation>): Accommodation {
  const { _id: _ignored, createdAt: _createdAt, updatedAt: _updatedAt, ...value } = document;
  return value;
}

function stripInventory(document: WithId<StoredAccommodationInventory>): AccommodationInventoryPeriod {
  const { _id: _ignored, createdAt: _createdAt, updatedAt: _updatedAt, ...value } = document;
  return value;
}

export function localizeAccommodation(accommodation: Accommodation, locale: TravelLocale): Accommodation {
  const translation = accommodation.translations?.[locale] as AccommodationTranslation | undefined;
  if (!translation) return accommodation;
  const translatedRooms = accommodation.roomTypes.map((room) => {
    const roomTranslation = translation.roomTypes?.[room.id];
    return roomTranslation ? { ...room, ...roomTranslation } : room;
  });
  return {
    ...accommodation,
    ...translation,
    roomTypes: translatedRooms
  };
}

export async function listPublishedAccommodations(): Promise<Accommodation[]> {
  const client = await getMongoClient();
  const database = client.db(getMongoDatabaseName());
  await ensureAccommodationIndexes(database);
  const documents = await database
    .collection<StoredAccommodation>(accommodationCollectionName)
    .find({ publicationStatus: "published" })
    .sort({ featured: -1, name: 1 })
    .toArray();
  return documents.map(stripAccommodation);
}

export async function getPublishedAccommodation(slug: string) {
  const client = await getMongoClient();
  const database = client.db(getMongoDatabaseName());
  await ensureAccommodationIndexes(database);
  const document = await database
    .collection<StoredAccommodation>(accommodationCollectionName)
    .findOne({ slug, publicationStatus: "published" });
  return document ? stripAccommodation(document) : null;
}

export async function listAccommodationsForAdmin(): Promise<Accommodation[]> {
  const client = await getMongoClient();
  const database = client.db(getMongoDatabaseName());
  await ensureAccommodationIndexes(database);
  const documents = await database
    .collection<StoredAccommodation>(accommodationCollectionName)
    .find({})
    .sort({ featured: -1, name: 1 })
    .toArray();
  return documents.map(stripAccommodation);
}

export async function getAccommodationForAdmin(id: string) {
  const client = await getMongoClient();
  const database = client.db(getMongoDatabaseName());
  await ensureAccommodationIndexes(database);
  const document = await database
    .collection<StoredAccommodation>(accommodationCollectionName)
    .findOne({ id });
  return document ? stripAccommodation(document) : null;
}

export async function listAccommodationInventory(accommodationId: string) {
  const client = await getMongoClient();
  const database = client.db(getMongoDatabaseName());
  await ensureAccommodationIndexes(database);
  const documents = await database
    .collection<StoredAccommodationInventory>(accommodationInventoryCollectionName)
    .find({ accommodationId })
    .sort({ startDate: 1, roomTypeId: 1 })
    .toArray();
  return documents.map(stripInventory);
}

function capacityConflict() {
  const error = new Error("Room inventory capacity cannot be lower than already reserved rooms.");
  Object.assign(error, { code: "ACCOMMODATION_CAPACITY_CONFLICT" });
  return error;
}

export async function saveAccommodationWithInventory(
  accommodation: Accommodation,
  requestedInventory: AccommodationInventoryPeriod[]
) {
  const client = await getMongoClient();
  const database = client.db(getMongoDatabaseName());
  await ensureAccommodationIndexes(database);
  const accommodations = database.collection<StoredAccommodation>(accommodationCollectionName);
  const inventory = database.collection<StoredAccommodationInventory>(accommodationInventoryCollectionName);
  const session = client.startSession();

  try {
    await session.withTransaction(async () => {
      const now = new Date();
      await accommodations.updateOne(
        { id: accommodation.id },
        {
          $set: { ...accommodation, updatedAt: now },
          $setOnInsert: { createdAt: now }
        },
        { upsert: true, session }
      );

      const existing = await inventory.find({ accommodationId: accommodation.id }, { session }).toArray();
      const existingById = new Map(existing.map((item) => [item.id, item]));
      const requestedIds = new Set(requestedInventory.map((item) => item.id));
      const roomIds = new Set(accommodation.roomTypes.map((room) => room.id));

      for (const requested of requestedInventory) {
        if (!roomIds.has(requested.roomTypeId)) {
          throw new Error("Accommodation inventory references an unknown room type.");
        }
        const previous = existingById.get(requested.id);
        const reserved = previous?.reserved ?? 0;
        if (requested.capacity < reserved) throw capacityConflict();

        await inventory.updateOne(
          { id: requested.id },
          {
            $set: {
              ...requested,
              accommodationId: accommodation.id,
              reserved,
              updatedAt: now
            },
            $setOnInsert: { createdAt: now }
          },
          { upsert: true, session }
        );
      }

      for (const previous of existing) {
        if (requestedIds.has(previous.id)) continue;
        if ((previous.reserved ?? 0) > 0) {
          await inventory.updateOne(
            { id: previous.id },
            { $set: { status: "closed", updatedAt: now } },
            { session }
          );
        } else {
          await inventory.deleteOne({ id: previous.id }, { session });
        }
      }
    });
  } finally {
    await session.endSession();
  }
}
