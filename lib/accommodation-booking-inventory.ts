import type { ClientSession, Db } from "mongodb";
import type { ReservationAccommodationBooking } from "@/domain/booking/types";
import { accommodationInventoryCollectionName } from "@/lib/accommodations";
import { accommodationInventoryMovements, AccommodationBookingError } from "@/lib/accommodation-booking";

export async function reserveAccommodationBookingInventory(
  database: Db,
  session: ClientSession,
  bookings: ReservationAccommodationBooking[]
) {
  const inventory = database.collection(accommodationInventoryCollectionName);
  const movements = accommodationInventoryMovements(bookings);
  const now = new Date();

  for (const [periodId, rooms] of movements) {
    if (rooms <= 0) continue;
    const result = await inventory.updateOne(
      {
        id: periodId,
        status: "open",
        $expr: {
          $gte: [
            { $subtract: ["$capacity", "$reserved"] },
            rooms
          ]
        }
      },
      {
        $inc: { reserved: rooms },
        $set: { updatedAt: now }
      },
      { session }
    );
    if (result.modifiedCount !== 1) {
      throw new AccommodationBookingError(
        "ACCOMMODATION_INVENTORY_UNAVAILABLE",
        "Accommodation room inventory changed before the reservation could be completed."
      );
    }
  }
}

export async function releaseAccommodationBookingInventory(
  database: Db,
  session: ClientSession,
  bookings: ReservationAccommodationBooking[] | undefined
) {
  if (!bookings?.length) return;
  const inventory = database.collection(accommodationInventoryCollectionName);
  const movements = accommodationInventoryMovements(bookings);
  const now = new Date();

  for (const [periodId, rooms] of movements) {
    if (rooms <= 0) continue;
    const result = await inventory.updateOne(
      { id: periodId, reserved: { $gte: rooms } },
      {
        $inc: { reserved: -rooms },
        $set: { updatedAt: now }
      },
      { session }
    );
    if (result.modifiedCount !== 1) {
      const error = new Error("Reserved accommodation inventory could not be released.");
      Object.assign(error, { code: "ACCOMMODATION_INVENTORY_RELEASE_FAILED" });
      throw error;
    }
  }
}

export async function reallocateAccommodationBookingInventory(
  database: Db,
  session: ClientSession,
  before: ReservationAccommodationBooking[] | undefined,
  after: ReservationAccommodationBooking[] | undefined
) {
  const previous = accommodationInventoryMovements(before ?? []);
  const next = accommodationInventoryMovements(after ?? []);
  const periodIds = new Set([...previous.keys(), ...next.keys()]);
  const inventory = database.collection(accommodationInventoryCollectionName);
  const now = new Date();

  // Reserve every positive delta first. If any new capacity is unavailable, the
  // transaction aborts before old room inventory is released.
  for (const periodId of periodIds) {
    const delta = (next.get(periodId) ?? 0) - (previous.get(periodId) ?? 0);
    if (delta <= 0) continue;
    const result = await inventory.updateOne(
      {
        id: periodId,
        status: "open",
        $expr: {
          $gte: [
            { $subtract: ["$capacity", "$reserved"] },
            delta
          ]
        }
      },
      {
        $inc: { reserved: delta },
        $set: { updatedAt: now }
      },
      { session }
    );
    if (result.modifiedCount !== 1) {
      throw new AccommodationBookingError(
        "ACCOMMODATION_INVENTORY_UNAVAILABLE",
        "The new departure no longer has enough accommodation inventory."
      );
    }
  }

  // Only after positive deltas are secured do we release inventory that the
  // amended reservation no longer needs.
  for (const periodId of periodIds) {
    const delta = (next.get(periodId) ?? 0) - (previous.get(periodId) ?? 0);
    if (delta >= 0) continue;
    const roomsToRelease = Math.abs(delta);
    const result = await inventory.updateOne(
      { id: periodId, reserved: { $gte: roomsToRelease } },
      {
        $inc: { reserved: -roomsToRelease },
        $set: { updatedAt: now }
      },
      { session }
    );
    if (result.modifiedCount !== 1) {
      const error = new Error("Previous accommodation inventory could not be released safely.");
      Object.assign(error, { code: "ACCOMMODATION_INVENTORY_RELEASE_FAILED" });
      throw error;
    }
  }
}
