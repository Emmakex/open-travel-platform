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
