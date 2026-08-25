import { randomUUID } from "node:crypto";
import { travelCollectionNames } from "@/adapters/mongo-travel-repository";
import type { Reservation, ReservationTripAddOnBooking } from "@/domain/booking/types";
import type { PackageAddOnChangeInput, ReservationAmendment, ReservationAmendmentChange } from "@/domain/operations/types";
import type { Trip } from "@/domain/travel/types";
import {
  ensureMongoReservationIndexes,
  travelReservationAmendmentCollectionName,
  travelReservationCollectionName,
  type StoredReservation,
  type StoredReservationAmendment
} from "@/lib/mongo-reservations";
import { getMongoClient, getMongoDatabaseName } from "@/lib/mongodb";
import { operationsConfig } from "@/lib/operations-config";
import {
  buildPackageAddOnAmendment,
  PackageAddOnAmendmentError,
  packageAddOnSnapshotsEqual
} from "@/lib/package-addon-amendment-rules";

function amendmentError(code: string, message: string) {
  const error = new Error(message);
  Object.assign(error, { code });
  return error;
}

function normalizeReason(value: string) {
  const normalized = value.trim().replace(/\s+/g, " ");
  return normalized && normalized.length <= 500 ? normalized : null;
}

function money(value: number) {
  return Number(value.toFixed(2));
}

function moneySnapshot(value: number) {
  return Number.isFinite(value) ? value.toFixed(2) : "0.00";
}

function currentPackageAddOnTotal(bookings: ReservationTripAddOnBooking[] | undefined, storedTotal: number | undefined) {
  if (storedTotal !== undefined && Number.isFinite(storedTotal)) return money(storedTotal);
  return money((bookings ?? []).reduce((sum, booking) => sum + booking.totalPrice, 0));
}

export async function changeReservationPackageAddOns(input: PackageAddOnChangeInput) {
  if (operationsConfig.mode !== "mongodb") {
    throw amendmentError("AMENDMENTS_UNAVAILABLE", "Reservation changes are unavailable.");
  }

  const reason = normalizeReason(input.reason);
  if (!input.reservationId.trim() || !reason) {
    throw amendmentError("INVALID_REQUEST", "Package supplement amendment data is invalid.");
  }

  const client = await getMongoClient();
  const database = client.db(getMongoDatabaseName());
  await ensureMongoReservationIndexes(database);
  const reservations = database.collection<StoredReservation>(travelReservationCollectionName);
  const amendments = database.collection<StoredReservationAmendment>(travelReservationAmendmentCollectionName);
  const trips = database.collection<Trip>(travelCollectionNames.trips);
  const session = client.startSession();
  let updatedReservation: Reservation | null = null;
  let storedAmendment: ReservationAmendment | null = null;

  try {
    await session.withTransaction(async () => {
      const current = await reservations.findOne({ id: input.reservationId }, { session });
      if (!current) return;
      if (current.status === "cancelled") {
        throw amendmentError("RESERVATION_CANCELLED", "Cancelled reservations cannot be amended.");
      }

      const trip = await trips.findOne({ id: current.tripId }, { session });
      if (!trip) throw amendmentError("TRIP_NOT_FOUND", "The trip linked to this reservation could not be found.");

      let rebuilt;
      try {
        rebuilt = buildPackageAddOnAmendment({
          catalogAddOns: trip.addOns ?? [],
          currentBookings: current.packageAddOns ?? [],
          travellers: current.travellers ?? [],
          selectedBookingAddOnIds: input.selectedBookingAddOnIds,
          selectedTravellerIdsByAddOn: input.selectedTravellerIdsByAddOn
        });
      } catch (error) {
        if (error instanceof PackageAddOnAmendmentError) {
          throw amendmentError(error.code, error.message);
        }
        throw error;
      }

      const previousBookings = current.packageAddOns ?? [];
      const previousAddOnTotal = currentPackageAddOnTotal(previousBookings, current.packageAddOnTotal);
      const accommodationAdditionalTotal = current.accommodationAdditionalTotal ?? 0;
      const tripPriceTotal = current.tripPriceTotal ?? money(current.totalPrice - accommodationAdditionalTotal - previousAddOnTotal);
      const totalPrice = money(tripPriceTotal + accommodationAdditionalTotal + rebuilt.packageAddOnTotal);

      if (
        packageAddOnSnapshotsEqual(previousBookings, rebuilt.bookings) &&
        Math.abs(previousAddOnTotal - rebuilt.packageAddOnTotal) < 0.005 &&
        Math.abs(current.totalPrice - totalPrice) < 0.005
      ) {
        throw amendmentError("NO_CHANGES", "No package supplement changes were detected.");
      }

      const occurredAt = new Date().toISOString();
      const update = await reservations.updateOne(
        {
          id: current.id,
          status: { $ne: "cancelled" },
          totalPrice: current.totalPrice
        },
        {
          $set: {
            packageAddOns: rebuilt.bookings,
            packageAddOnTotal: rebuilt.packageAddOnTotal,
            totalPrice,
            updatedAt: occurredAt
          }
        },
        { session }
      );
      if (update.modifiedCount !== 1) {
        throw amendmentError("UPDATE_CONFLICT", "Reservation changed while applying package supplement amendment.");
      }

      const changes: ReservationAmendmentChange[] = [];
      if (Math.abs(previousAddOnTotal - rebuilt.packageAddOnTotal) >= 0.005) {
        changes.push({
          field: "packageAddOnTotal",
          before: moneySnapshot(previousAddOnTotal),
          after: moneySnapshot(rebuilt.packageAddOnTotal)
        });
      }
      if (Math.abs(current.totalPrice - totalPrice) >= 0.005) {
        changes.push({ field: "totalPrice", before: moneySnapshot(current.totalPrice), after: moneySnapshot(totalPrice) });
      }

      const amendment: ReservationAmendment = {
        id: `amend-${randomUUID()}`,
        reservationId: current.id,
        type: "package-addons-change",
        actorIdentityId: input.actorIdentityId,
        actorRole: input.actorRole,
        reason,
        changes,
        priceDelta: money(totalPrice - current.totalPrice),
        currency: current.currency,
        packageAddOnsBefore: previousBookings,
        packageAddOnsAfter: rebuilt.bookings,
        occurredAt
      };
      await amendments.insertOne(amendment, { session });

      updatedReservation = {
        ...current,
        packageAddOns: rebuilt.bookings,
        packageAddOnTotal: rebuilt.packageAddOnTotal,
        totalPrice,
        updatedAt: occurredAt
      };
      storedAmendment = amendment;
    });

    return { reservation: updatedReservation, amendment: storedAmendment };
  } finally {
    await session.endSession();
  }
}
