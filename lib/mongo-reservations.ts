import type { Db } from "mongodb";
import type { Reservation } from "@/domain/booking/types";
import type { OperationsAuditEvent } from "@/domain/operations/types";

export const travelReservationCollectionName = "travel_reservations";
export const travelOperationsAuditCollectionName = "travel_operations_audit";

export type StoredReservation = Reservation & {
  createdAt: string;
  updatedAt?: string;
};

export type StoredOperationsAuditEvent = OperationsAuditEvent;

export async function ensureMongoReservationIndexes(database: Db) {
  const reservations = database.collection<StoredReservation>(travelReservationCollectionName);
  const audit = database.collection<StoredOperationsAuditEvent>(travelOperationsAuditCollectionName);

  await Promise.all([
    reservations.createIndex({ id: 1 }, { unique: true, name: "travel_reservation_id_unique" }),
    reservations.createIndex(
      { identityId: 1, createdAt: -1 },
      { name: "travel_reservation_identity_created" }
    ),
    reservations.createIndex(
      { tripId: 1, status: 1, createdAt: -1 },
      { name: "travel_reservation_trip_status" }
    ),
    reservations.createIndex(
      { availabilityId: 1, status: 1 },
      { name: "travel_reservation_departure_status" }
    ),
    audit.createIndex({ id: 1 }, { unique: true, name: "travel_operations_audit_id_unique" }),
    audit.createIndex(
      { reservationId: 1, occurredAt: -1 },
      { name: "travel_operations_audit_reservation" }
    ),
    audit.createIndex(
      { occurredAt: -1 },
      { name: "travel_operations_audit_occurred" }
    )
  ]);
}
