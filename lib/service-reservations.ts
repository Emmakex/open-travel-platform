import { randomUUID } from "node:crypto";
import type { Db } from "mongodb";
import type {
  CreateServiceReservationInput,
  ServiceReservation,
  ServiceReservationStatus
} from "@/domain/services/booking-types";
import { evaluateServiceReservationPolicy } from "@/lib/change-policy";
import { serviceAvailabilityCollectionName } from "@/lib/service-availability";
import { getMongoClient, getMongoDatabaseName } from "@/lib/mongodb";

export const serviceReservationCollectionName = "travel_service_reservations";

type StoredServiceReservation = ServiceReservation;

export async function ensureServiceReservationIndexes(database: Db) {
  const collection = database.collection<StoredServiceReservation>(serviceReservationCollectionName);
  await Promise.all([
    collection.createIndex({ id: 1 }, { unique: true, name: "service_reservation_id_unique" }),
    collection.createIndex({ identityId: 1, createdAt: -1 }, { name: "service_reservation_customer" }),
    collection.createIndex({ status: 1, createdAt: -1 }, { name: "service_reservation_operations" }),
    collection.createIndex({ serviceId: 1, serviceDate: 1 }, { name: "service_reservation_service_date" }),
    collection.createIndex({ relatedReservationId: 1 }, { name: "service_reservation_related_trip" })
  ]);
}

function serviceError(code: string, message: string) {
  const error = new Error(message);
  Object.assign(error, { code });
  return error;
}

function inventoryError() {
  return serviceError("SERVICE_UNAVAILABLE", "Service inventory is no longer available.");
}

export async function listServiceReservationsForCustomer(identityId: string) {
  const client = await getMongoClient();
  const database = client.db(getMongoDatabaseName());
  await ensureServiceReservationIndexes(database);
  return database
    .collection<StoredServiceReservation>(serviceReservationCollectionName)
    .find({ identityId })
    .sort({ createdAt: -1 })
    .toArray();
}

export async function getServiceReservationForCustomer(identityId: string, id: string) {
  const client = await getMongoClient();
  const database = client.db(getMongoDatabaseName());
  await ensureServiceReservationIndexes(database);
  return database
    .collection<StoredServiceReservation>(serviceReservationCollectionName)
    .findOne({ id, identityId });
}

export async function listServiceReservationsForRelatedTrip(relatedReservationId: string) {
  const client = await getMongoClient();
  const database = client.db(getMongoDatabaseName());
  await ensureServiceReservationIndexes(database);
  return database
    .collection<StoredServiceReservation>(serviceReservationCollectionName)
    .find({ relatedReservationId })
    .sort({ serviceDate: 1, createdAt: 1 })
    .toArray();
}

export async function listServiceReservationsForRelatedTripForCustomer(
  identityId: string,
  relatedReservationId: string
) {
  const client = await getMongoClient();
  const database = client.db(getMongoDatabaseName());
  await ensureServiceReservationIndexes(database);
  return database
    .collection<StoredServiceReservation>(serviceReservationCollectionName)
    .find({ identityId, relatedReservationId })
    .sort({ serviceDate: 1, createdAt: 1 })
    .toArray();
}

export async function listServiceReservationsForOperator() {
  const client = await getMongoClient();
  const database = client.db(getMongoDatabaseName());
  await ensureServiceReservationIndexes(database);
  return database
    .collection<StoredServiceReservation>(serviceReservationCollectionName)
    .find({})
    .sort({ createdAt: -1 })
    .limit(500)
    .toArray();
}

export async function getServiceReservationForOperator(id: string) {
  const client = await getMongoClient();
  const database = client.db(getMongoDatabaseName());
  await ensureServiceReservationIndexes(database);
  return database
    .collection<StoredServiceReservation>(serviceReservationCollectionName)
    .findOne({ id });
}

export async function createServiceReservation(input: CreateServiceReservationInput) {
  const client = await getMongoClient();
  const database = client.db(getMongoDatabaseName());
  await ensureServiceReservationIndexes(database);
  const reservations = database.collection<StoredServiceReservation>(serviceReservationCollectionName);
  const availability = database.collection(serviceAvailabilityCollectionName);
  const session = client.startSession();
  const reservation: ServiceReservation = {
    ...input,
    id: `srv-${randomUUID()}`,
    status: "pending",
    statusHistory: [],
    createdAt: new Date().toISOString()
  };

  try {
    await session.withTransaction(async () => {
      if (input.availabilityId) {
        const today = new Date().toISOString().slice(0, 10);
        const inventoryResult = await availability.updateOne(
          {
            id: input.availabilityId,
            serviceId: input.serviceId,
            status: "open",
            date: { $gte: today },
            $expr: {
              $gte: [
                { $subtract: ["$capacity", "$reserved"] },
                input.inventoryUnits
              ]
            }
          },
          {
            $inc: { reserved: input.inventoryUnits },
            $set: { updatedAt: new Date() }
          },
          { session }
        );
        if (inventoryResult.modifiedCount !== 1) throw inventoryError();
      }

      await reservations.insertOne(reservation, { session });
    });
    return reservation;
  } finally {
    await session.endSession();
  }
}

async function changeStatus(input: {
  reservationId: string;
  identityId?: string;
  toStatus: ServiceReservationStatus;
  actorType: "customer" | "staff";
  actorId: string;
  customerPendingOnly?: boolean;
}) {
  const client = await getMongoClient();
  const database = client.db(getMongoDatabaseName());
  await ensureServiceReservationIndexes(database);
  const reservations = database.collection<StoredServiceReservation>(serviceReservationCollectionName);
  const availability = database.collection(serviceAvailabilityCollectionName);
  const session = client.startSession();
  let changed: ServiceReservation | null = null;

  try {
    await session.withTransaction(async () => {
      const current = await reservations.findOne(
        {
          id: input.reservationId,
          ...(input.identityId ? { identityId: input.identityId } : {})
        },
        { session }
      );
      if (!current || current.status === input.toStatus) return;
      if (current.status === "cancelled") return;
      if (input.customerPendingOnly && current.status !== "pending") return;

      if (input.toStatus === "cancelled") {
        const policy = evaluateServiceReservationPolicy(current);
        if (input.actorType === "customer" && !policy.customerCancellationAllowed) {
          throw serviceError("SERVICE_CANCELLATION_DEADLINE", "Customer cancellation is outside the allowed policy window.");
        }
        if (input.actorType === "staff" && !policy.staffCancellationAllowed) {
          throw serviceError("SERVICE_CANCELLATION_DEADLINE", "Staff cancellation is outside the allowed policy window.");
        }
      }

      const updatedAt = new Date().toISOString();
      const event = {
        id: `evt-${randomUUID()}`,
        fromStatus: current.status,
        toStatus: input.toStatus,
        actorType: input.actorType,
        actorId: input.actorId,
        at: updatedAt
      } as const;

      const update = await reservations.updateOne(
        { id: current.id, status: current.status },
        {
          $set: { status: input.toStatus, updatedAt },
          $push: { statusHistory: event }
        },
        { session }
      );
      if (update.modifiedCount !== 1) return;

      if (input.toStatus === "cancelled" && current.availabilityId && current.inventoryUnits > 0) {
        const release = await availability.updateOne(
          {
            id: current.availabilityId,
            serviceId: current.serviceId,
            reserved: { $gte: current.inventoryUnits }
          },
          {
            $inc: { reserved: -current.inventoryUnits },
            $set: { updatedAt: new Date() }
          },
          { session }
        );
        if (release.modifiedCount !== 1) {
          throw serviceError("SERVICE_INVENTORY_RELEASE_FAILED", "Service inventory could not be released safely.");
        }
      }

      changed = {
        ...current,
        status: input.toStatus,
        updatedAt,
        statusHistory: [...(current.statusHistory ?? []), event]
      };
    });
    return changed;
  } finally {
    await session.endSession();
  }
}

export function cancelServiceReservationForCustomer(identityId: string, reservationId: string) {
  return changeStatus({
    reservationId,
    identityId,
    toStatus: "cancelled",
    actorType: "customer",
    actorId: identityId,
    customerPendingOnly: true
  });
}

export function updateServiceReservationStatusByStaff(
  reservationId: string,
  toStatus: "confirmed" | "cancelled",
  actorId: string
) {
  return changeStatus({
    reservationId,
    toStatus,
    actorType: "staff",
    actorId
  });
}
