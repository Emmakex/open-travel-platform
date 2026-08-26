import { randomUUID } from "node:crypto";
import type { ClientSession, Db, MongoClient } from "mongodb";
import type { ServiceReservation } from "@/domain/services/booking-types";
import type { IntegrationEventEnvelope, IntegrationEventType } from "@/domain/integrations/types";
import {
  customerUserCollectionName,
  type StoredCustomerUser
} from "@/lib/customer-auth";
import { getCrmSyncAdapter } from "@/lib/crm-sync-adapter";
import { isCrmSyncConfigured } from "@/lib/crm-sync-config";
import {
  travelReservationCollectionName,
  type StoredReservation
} from "@/lib/mongo-reservations";
import { getMongoClient, getMongoDatabaseName } from "@/lib/mongodb";
import { serviceReservationCollectionName } from "@/lib/service-reservations";
import type {
  CrmContactSnapshot,
  CrmReservationSnapshot,
  CrmSyncResult
} from "@/repositories/crm-sync-adapter";

export const crmIntegrationDeliveryEndpointId = "crm-rest:primary";
export const crmSyncLinkCollectionName = "travel_crm_sync_links";
export const crmSyncAuditCollectionName = "travel_crm_sync_audit";

const crmRelevantEventTypes = new Set<IntegrationEventType>([
  "customer.created",
  "customer.profile.updated",
  "trip.reservation.created",
  "trip.reservation.status.changed",
  "service.reservation.created",
  "service.reservation.status.changed"
]);

type CrmEntityType = "contact" | "trip-reservation" | "service-reservation";

type CrmSyncLink = {
  id: string;
  adapterId: string;
  entityType: CrmEntityType;
  localId: string;
  externalId: string;
  firstSyncedAt: string;
  lastSyncedAt: string;
};

type CrmSyncAuditEvent = {
  id: string;
  eventId: string;
  deliveryId: string;
  adapterId: string;
  entityType: CrmEntityType;
  localId: string;
  externalId: string;
  operation: "upsert";
  outcome: "upserted" | "unchanged";
  responseStatus?: number;
  occurredAt: string;
};

function crmError(code: string, message: string) {
  return Object.assign(new Error(message), { code });
}

export function shouldQueueCrmIntegrationEvent(type: IntegrationEventType) {
  return isCrmSyncConfigured() && crmRelevantEventTypes.has(type);
}

export function isCrmIntegrationDelivery(endpointId: string) {
  return endpointId === crmIntegrationDeliveryEndpointId;
}

export async function ensureCrmSyncIndexes(database: Db) {
  await Promise.all([
    database.collection<CrmSyncLink>(crmSyncLinkCollectionName)
      .createIndex({ id: 1 }, { unique: true, name: "crm_sync_link_id_unique" }),
    database.collection<CrmSyncLink>(crmSyncLinkCollectionName)
      .createIndex(
        { adapterId: 1, entityType: 1, localId: 1 },
        { unique: true, name: "crm_sync_link_entity_unique" }
      ),
    database.collection<CrmSyncAuditEvent>(crmSyncAuditCollectionName)
      .createIndex({ eventId: 1, occurredAt: -1 }, { name: "crm_sync_audit_event" }),
    database.collection<CrmSyncAuditEvent>(crmSyncAuditCollectionName)
      .createIndex({ entityType: 1, localId: 1, occurredAt: -1 }, { name: "crm_sync_audit_entity" })
  ]);
}

function contactSnapshot(user: StoredCustomerUser): CrmContactSnapshot {
  return {
    localId: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    ...(user.phone ? { phone: user.phone } : {}),
    ...(user.country ? { country: user.country } : {}),
    ...(user.preferredLocale ? { preferredLocale: user.preferredLocale } : {})
  };
}

function tripReservationSnapshot(reservation: StoredReservation): CrmReservationSnapshot {
  return {
    reservationType: "trip",
    localId: reservation.id,
    contactLocalId: reservation.identityId,
    productId: reservation.tripId,
    ...(reservation.tripTitle ? { productTitle: reservation.tripTitle } : {}),
    status: reservation.status,
    partySize: reservation.partySize,
    ...(reservation.departureDate ? { startDate: reservation.departureDate } : {}),
    ...(reservation.returnDate ? { endDate: reservation.returnDate } : {}),
    createdAt: reservation.createdAt,
    ...(reservation.updatedAt ? { updatedAt: reservation.updatedAt } : {})
  };
}

function serviceReservationSnapshot(reservation: ServiceReservation): CrmReservationSnapshot {
  return {
    reservationType: "service",
    localId: reservation.id,
    contactLocalId: reservation.identityId,
    productId: reservation.serviceId,
    ...(reservation.serviceTitle ? { productTitle: reservation.serviceTitle } : {}),
    status: reservation.status,
    partySize: reservation.partySize,
    ...(reservation.serviceDate ? { startDate: reservation.serviceDate } : {}),
    createdAt: reservation.createdAt,
    ...(reservation.updatedAt ? { updatedAt: reservation.updatedAt } : {})
  };
}

async function persistSuccessfulSync(input: {
  client: MongoClient;
  database: Db;
  eventId: string;
  deliveryId: string;
  adapterId: string;
  entityType: CrmEntityType;
  localId: string;
  result: CrmSyncResult;
}) {
  const now = new Date().toISOString();
  const links = input.database.collection<CrmSyncLink>(crmSyncLinkCollectionName);
  const audit = input.database.collection<CrmSyncAuditEvent>(crmSyncAuditCollectionName);
  const session = input.client.startSession();
  try {
    await session.withTransaction(async () => {
      const current = await links.findOne({
        adapterId: input.adapterId,
        entityType: input.entityType,
        localId: input.localId
      }, { session });
      const id = current?.id ?? `crm-link-${randomUUID()}`;
      await links.updateOne(
        { adapterId: input.adapterId, entityType: input.entityType, localId: input.localId },
        {
          $set: {
            id,
            adapterId: input.adapterId,
            entityType: input.entityType,
            localId: input.localId,
            externalId: input.result.externalId,
            firstSyncedAt: current?.firstSyncedAt ?? now,
            lastSyncedAt: now
          }
        },
        { upsert: true, session }
      );
      await audit.insertOne({
        id: `crm-audit-${randomUUID()}`,
        eventId: input.eventId,
        deliveryId: input.deliveryId,
        adapterId: input.adapterId,
        entityType: input.entityType,
        localId: input.localId,
        externalId: input.result.externalId,
        operation: "upsert",
        outcome: input.result.outcome,
        ...(input.result.responseStatus ? { responseStatus: input.result.responseStatus } : {}),
        occurredAt: now
      }, { session });
    });
  } finally {
    await session.endSession();
  }
}

async function loadCustomer(database: Db, customerId: string) {
  const user = await database.collection<StoredCustomerUser>(customerUserCollectionName)
    .findOne({ id: customerId, role: "customer" });
  if (!user) throw crmError("CRM_SYNC_CONTACT_NOT_FOUND", "The CRM synchronization contact no longer exists.");
  return user;
}

async function syncContact(input: {
  client: MongoClient;
  database: Db;
  event: IntegrationEventEnvelope;
  deliveryId: string;
  customer: StoredCustomerUser;
}) {
  const adapter = getCrmSyncAdapter();
  const result = await adapter.upsertContact({
    snapshot: contactSnapshot(input.customer),
    requestId: `${input.deliveryId}:contact`,
    idempotencyKey: `otp-crm:${input.event.id}:contact`
  });
  await persistSuccessfulSync({
    client: input.client,
    database: input.database,
    eventId: input.event.id,
    deliveryId: input.deliveryId,
    adapterId: adapter.id,
    entityType: "contact",
    localId: input.customer.id,
    result
  });
  return { adapter, result };
}

export async function deliverCrmIntegrationEvent(input: {
  event: IntegrationEventEnvelope;
  deliveryId: string;
}) {
  if (!isCrmSyncConfigured()) throw crmError("CRM_SYNC_DISABLED", "CRM synchronization is disabled or not configured.");
  if (!crmRelevantEventTypes.has(input.event.type)) {
    throw crmError("CRM_SYNC_EVENT_UNSUPPORTED", "This integration event is not supported by CRM synchronization.");
  }

  const client = await getMongoClient();
  const database = client.db(getMongoDatabaseName());
  await ensureCrmSyncIndexes(database);

  if (input.event.aggregateType === "customer") {
    const customer = await loadCustomer(database, input.event.aggregateId);
    const { result } = await syncContact({ client, database, event: input.event, deliveryId: input.deliveryId, customer });
    return { status: result.responseStatus ?? 200 };
  }

  if (input.event.aggregateType === "trip-reservation") {
    const reservation = await database.collection<StoredReservation>(travelReservationCollectionName)
      .findOne({ id: input.event.aggregateId });
    if (!reservation) throw crmError("CRM_SYNC_RESERVATION_NOT_FOUND", "The trip reservation no longer exists.");
    const customer = await loadCustomer(database, reservation.identityId);
    const { adapter } = await syncContact({ client, database, event: input.event, deliveryId: input.deliveryId, customer });
    const result = await adapter.upsertReservation({
      snapshot: tripReservationSnapshot(reservation),
      requestId: `${input.deliveryId}:reservation`,
      idempotencyKey: `otp-crm:${input.event.id}:reservation`
    });
    await persistSuccessfulSync({
      client,
      database,
      eventId: input.event.id,
      deliveryId: input.deliveryId,
      adapterId: adapter.id,
      entityType: "trip-reservation",
      localId: reservation.id,
      result
    });
    return { status: result.responseStatus ?? 200 };
  }

  if (input.event.aggregateType === "service-reservation") {
    const reservation = await database.collection<ServiceReservation>(serviceReservationCollectionName)
      .findOne({ id: input.event.aggregateId });
    if (!reservation) throw crmError("CRM_SYNC_RESERVATION_NOT_FOUND", "The service reservation no longer exists.");
    const customer = await loadCustomer(database, reservation.identityId);
    const { adapter } = await syncContact({ client, database, event: input.event, deliveryId: input.deliveryId, customer });
    const result = await adapter.upsertReservation({
      snapshot: serviceReservationSnapshot(reservation),
      requestId: `${input.deliveryId}:reservation`,
      idempotencyKey: `otp-crm:${input.event.id}:reservation`
    });
    await persistSuccessfulSync({
      client,
      database,
      eventId: input.event.id,
      deliveryId: input.deliveryId,
      adapterId: adapter.id,
      entityType: "service-reservation",
      localId: reservation.id,
      result
    });
    return { status: result.responseStatus ?? 200 };
  }

  throw crmError("CRM_SYNC_EVENT_UNSUPPORTED", "This integration aggregate is not supported by CRM synchronization.");
}

export async function listRecentCrmSyncAudit(limit = 100) {
  const client = await getMongoClient();
  const database = client.db(getMongoDatabaseName());
  await ensureCrmSyncIndexes(database);
  return database.collection<CrmSyncAuditEvent>(crmSyncAuditCollectionName)
    .find({})
    .sort({ occurredAt: -1 })
    .limit(Math.max(1, Math.min(limit, 500)))
    .toArray();
}
