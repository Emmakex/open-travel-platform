import { randomUUID } from "node:crypto";
import type { ClientSession, Db } from "mongodb";
import type { Reservation } from "@/domain/booking/types";
import type {
  AddSupplierFulfilmentNoteInput,
  SaveSupplierFulfilmentInput,
  SupplierFulfilmentComponent,
  SupplierFulfilmentEvent,
  SupplierFulfilmentItem,
  SupplierFulfilmentNote,
  SupplierFulfilmentStatus,
  SupplierFulfilmentTargetType
} from "@/domain/operations/types";
import type { ServiceReservation } from "@/domain/services/booking-types";
import { ensureMongoReservationIndexes, travelReservationCollectionName, type StoredReservation } from "@/lib/mongo-reservations";
import { getMongoClient, getMongoDatabaseName } from "@/lib/mongodb";
import { operationsConfig } from "@/lib/operations-config";
import { ensureServiceReservationIndexes, serviceReservationCollectionName } from "@/lib/service-reservations";
import {
  canSupplierFulfilmentTransition,
  isSupplierCurrency,
  isSupplierFulfilmentStatus,
  isSupplierFulfilmentTargetType,
  normalizeSupplierCost,
  normalizeSupplierDeadline,
  normalizeSupplierFulfilmentNote,
  normalizeSupplierName,
  normalizeSupplierReference
} from "@/lib/supplier-fulfilment-rules";

export const travelSupplierFulfilmentCollectionName = "travel_supplier_fulfilment";
export const travelSupplierFulfilmentEventCollectionName = "travel_supplier_fulfilment_events";
export const travelSupplierFulfilmentNoteCollectionName = "travel_supplier_fulfilment_notes";

type StoredSupplierFulfilmentItem = SupplierFulfilmentItem;
type StoredSupplierFulfilmentEvent = SupplierFulfilmentEvent;
type StoredSupplierFulfilmentNote = SupplierFulfilmentNote;

function fulfilmentError(code: string, message: string) {
  const error = new Error(message);
  Object.assign(error, { code });
  return error;
}

async function ensureSupplierFulfilmentIndexes(database: Db) {
  const items = database.collection<StoredSupplierFulfilmentItem>(travelSupplierFulfilmentCollectionName);
  const events = database.collection<StoredSupplierFulfilmentEvent>(travelSupplierFulfilmentEventCollectionName);
  const notes = database.collection<StoredSupplierFulfilmentNote>(travelSupplierFulfilmentNoteCollectionName);
  await Promise.all([
    items.createIndex({ id: 1 }, { unique: true, name: "travel_supplier_fulfilment_id_unique" }),
    items.createIndex(
      { targetType: 1, targetId: 1, componentKey: 1 },
      { unique: true, name: "travel_supplier_fulfilment_component_unique" }
    ),
    items.createIndex({ status: 1, deadline: 1, updatedAt: -1 }, { name: "travel_supplier_fulfilment_queue" }),
    items.createIndex({ supplierName: 1, status: 1 }, { name: "travel_supplier_fulfilment_supplier" }),
    events.createIndex({ id: 1 }, { unique: true, name: "travel_supplier_fulfilment_event_id_unique" }),
    events.createIndex({ fulfilmentId: 1, occurredAt: -1 }, { name: "travel_supplier_fulfilment_event_item" }),
    events.createIndex({ targetType: 1, targetId: 1, occurredAt: -1 }, { name: "travel_supplier_fulfilment_event_target" }),
    notes.createIndex({ id: 1 }, { unique: true, name: "travel_supplier_fulfilment_note_id_unique" }),
    notes.createIndex({ fulfilmentId: 1, createdAt: -1 }, { name: "travel_supplier_fulfilment_note_item" })
  ]);
}

async function prepareDatabase(database: Db) {
  await Promise.all([
    ensureMongoReservationIndexes(database),
    ensureServiceReservationIndexes(database),
    ensureSupplierFulfilmentIndexes(database)
  ]);
}

export function supplierFulfilmentComponentsForTripReservation(reservation: Reservation): SupplierFulfilmentComponent[] {
  const customerCurrency = reservation.currency as SupplierFulfilmentComponent["customerCurrency"];
  return [
    {
      targetType: "trip-reservation",
      targetId: reservation.id,
      componentType: "trip",
      componentKey: "trip",
      componentLabel: reservation.tripTitle ?? reservation.tripId,
      customerCurrency
    },
    ...(reservation.accommodationBookings ?? []).map((stay) => ({
      targetType: "trip-reservation" as const,
      targetId: reservation.id,
      componentType: "accommodation" as const,
      componentKey: `accommodation:${stay.componentId}`,
      componentLabel: `${stay.accommodationName} · ${stay.roomTypeName} · ${stay.checkInDate} → ${stay.checkOutDate}`,
      customerCurrency
    }))
  ];
}

export function supplierFulfilmentComponentsForServiceReservation(reservation: ServiceReservation): SupplierFulfilmentComponent[] {
  const date = reservation.serviceDate ? ` · ${reservation.serviceDate}${reservation.startTime ? ` ${reservation.startTime}` : ""}` : "";
  return [{
    targetType: "service-reservation",
    targetId: reservation.id,
    componentType: "service",
    componentKey: "service",
    componentLabel: `${reservation.serviceTitle}${date}`,
    customerCurrency: reservation.currency
  }];
}

async function resolveComponents(
  database: Db,
  targetType: SupplierFulfilmentTargetType,
  targetId: string,
  session?: ClientSession
): Promise<SupplierFulfilmentComponent[] | null> {
  if (targetType === "trip-reservation") {
    const reservation = await database.collection<StoredReservation>(travelReservationCollectionName)
      .findOne({ id: targetId }, { session });
    return reservation ? supplierFulfilmentComponentsForTripReservation(reservation) : null;
  }
  const reservation = await database.collection<ServiceReservation>(serviceReservationCollectionName)
    .findOne({ id: targetId }, { session });
  return reservation ? supplierFulfilmentComponentsForServiceReservation(reservation) : null;
}

export async function listSupplierFulfilmentItems() {
  if (operationsConfig.mode !== "mongodb") return [] as SupplierFulfilmentItem[];
  const client = await getMongoClient();
  const database = client.db(getMongoDatabaseName());
  await ensureSupplierFulfilmentIndexes(database);
  return database.collection<StoredSupplierFulfilmentItem>(travelSupplierFulfilmentCollectionName)
    .find({})
    .sort({ deadline: 1, updatedAt: -1, createdAt: -1 })
    .limit(2000)
    .toArray();
}

export async function listSupplierFulfilmentForTarget(targetType: SupplierFulfilmentTargetType, targetId: string) {
  if (operationsConfig.mode !== "mongodb") return [] as SupplierFulfilmentItem[];
  const client = await getMongoClient();
  const database = client.db(getMongoDatabaseName());
  await ensureSupplierFulfilmentIndexes(database);
  return database.collection<StoredSupplierFulfilmentItem>(travelSupplierFulfilmentCollectionName)
    .find({ targetType, targetId })
    .sort({ componentType: 1, createdAt: 1 })
    .toArray();
}

export async function listSupplierFulfilmentEventsForTarget(targetType: SupplierFulfilmentTargetType, targetId: string) {
  if (operationsConfig.mode !== "mongodb") return [] as SupplierFulfilmentEvent[];
  const client = await getMongoClient();
  const database = client.db(getMongoDatabaseName());
  await ensureSupplierFulfilmentIndexes(database);
  return database.collection<StoredSupplierFulfilmentEvent>(travelSupplierFulfilmentEventCollectionName)
    .find({ targetType, targetId })
    .sort({ occurredAt: -1 })
    .limit(300)
    .toArray();
}

export async function listSupplierFulfilmentNotesForItems(fulfilmentIds: string[]) {
  if (operationsConfig.mode !== "mongodb" || !fulfilmentIds.length) return [] as SupplierFulfilmentNote[];
  const client = await getMongoClient();
  const database = client.db(getMongoDatabaseName());
  await ensureSupplierFulfilmentIndexes(database);
  return database.collection<StoredSupplierFulfilmentNote>(travelSupplierFulfilmentNoteCollectionName)
    .find({ fulfilmentId: { $in: fulfilmentIds } })
    .sort({ createdAt: -1 })
    .limit(500)
    .toArray();
}

export async function listSupplierFulfilmentQueue() {
  if (operationsConfig.mode !== "mongodb") return [] as Array<{ component: SupplierFulfilmentComponent; item?: SupplierFulfilmentItem }>;
  const client = await getMongoClient();
  const database = client.db(getMongoDatabaseName());
  await prepareDatabase(database);
  const [reservations, serviceReservations, items] = await Promise.all([
    database.collection<StoredReservation>(travelReservationCollectionName).find({}).sort({ createdAt: -1 }).limit(500).toArray(),
    database.collection<ServiceReservation>(serviceReservationCollectionName).find({}).sort({ createdAt: -1 }).limit(500).toArray(),
    database.collection<StoredSupplierFulfilmentItem>(travelSupplierFulfilmentCollectionName).find({}).limit(2000).toArray()
  ]);
  const itemByKey = new Map(items.map((item) => [`${item.targetType}:${item.targetId}:${item.componentKey}`, item]));
  const components = [
    ...reservations.flatMap(supplierFulfilmentComponentsForTripReservation),
    ...serviceReservations.flatMap(supplierFulfilmentComponentsForServiceReservation)
  ];
  const rows = components.map((component) => ({
    component,
    item: itemByKey.get(`${component.targetType}:${component.targetId}:${component.componentKey}`)
  }));

  const liveKeys = new Set(rows.map((row) => `${row.component.targetType}:${row.component.targetId}:${row.component.componentKey}`));
  for (const item of items) {
    const key = `${item.targetType}:${item.targetId}:${item.componentKey}`;
    if (!liveKeys.has(key)) rows.push({ component: item, item });
  }
  return rows;
}

function statusTimestampFields(status: SupplierFulfilmentStatus, occurredAt: string) {
  if (status === "requested") return { requestedAt: occurredAt };
  if (status === "confirmed") return { confirmedAt: occurredAt };
  if (status === "rejected") return { rejectedAt: occurredAt };
  if (status === "cancelled") return { cancelledAt: occurredAt };
  return {};
}

export async function saveSupplierFulfilment(input: SaveSupplierFulfilmentInput) {
  if (operationsConfig.mode !== "mongodb") throw fulfilmentError("FULFILMENT_UNAVAILABLE", "Supplier fulfilment requires MongoDB operations mode.");
  if (!isSupplierFulfilmentTargetType(input.targetType) || !input.targetId.trim() || !input.componentKey.trim() || !isSupplierFulfilmentStatus(input.status) || !input.actorIdentityId || !input.actorDisplayName.trim()) {
    throw fulfilmentError("INVALID_FULFILMENT", "Supplier fulfilment input is invalid.");
  }
  const supplierName = normalizeSupplierName(input.supplierName);
  const supplierReference = normalizeSupplierReference(input.supplierReference);
  const supplierCost = normalizeSupplierCost(input.supplierCost);
  const deadline = normalizeSupplierDeadline(input.deadline);
  if (supplierName === null || supplierReference === null || supplierCost === null || deadline === null) {
    throw fulfilmentError("INVALID_FULFILMENT", "Supplier fulfilment details are invalid.");
  }
  if (["requested", "confirmed", "rejected"].includes(input.status) && !supplierName) {
    throw fulfilmentError("SUPPLIER_REQUIRED", "A supplier is required for this status.");
  }
  if (supplierCost !== undefined && (!input.supplierCurrency || !isSupplierCurrency(input.supplierCurrency))) {
    throw fulfilmentError("INVALID_COST", "Supplier cost currency is invalid.");
  }

  const client = await getMongoClient();
  const database = client.db(getMongoDatabaseName());
  await prepareDatabase(database);
  const items = database.collection<StoredSupplierFulfilmentItem>(travelSupplierFulfilmentCollectionName);
  const events = database.collection<StoredSupplierFulfilmentEvent>(travelSupplierFulfilmentEventCollectionName);
  const session = client.startSession();
  let saved: SupplierFulfilmentItem | null = null;

  try {
    await session.withTransaction(async () => {
      const components = await resolveComponents(database, input.targetType, input.targetId, session);
      if (!components) throw fulfilmentError("TARGET_NOT_FOUND", "Supplier fulfilment target not found.");
      const component = components.find((candidate) => candidate.componentKey === input.componentKey);
      if (!component) throw fulfilmentError("COMPONENT_NOT_FOUND", "Supplier fulfilment component not found.");

      const current = await items.findOne({
        targetType: input.targetType,
        targetId: input.targetId,
        componentKey: input.componentKey
      }, { session });
      const currentStatus = current?.status ?? "not-requested";
      if (!canSupplierFulfilmentTransition(currentStatus, input.status)) {
        throw fulfilmentError("INVALID_TRANSITION", "Supplier fulfilment status transition is not allowed.");
      }

      const costCurrency = supplierCost !== undefined ? input.supplierCurrency : undefined;
      const changes: SupplierFulfilmentEvent["changes"] = [];
      if ((current?.supplierName ?? "") !== (supplierName ?? "")) changes.push({ field: "supplier", before: current?.supplierName ?? "", after: supplierName ?? "" });
      if (currentStatus !== input.status) changes.push({ field: "status", before: currentStatus, after: input.status });
      if ((current?.supplierReference ?? "") !== (supplierReference ?? "")) changes.push({ field: "reference", before: current?.supplierReference ?? "", after: supplierReference ?? "" });
      const currentCost = current?.supplierCost !== undefined ? `${current.supplierCost}|${current.supplierCurrency ?? ""}` : "";
      const nextCost = supplierCost !== undefined ? `${supplierCost}|${costCurrency ?? ""}` : "";
      if (currentCost !== nextCost) changes.push({ field: "cost", before: currentCost, after: nextCost });
      if ((current?.deadline ?? "") !== (deadline ?? "")) changes.push({ field: "deadline", before: current?.deadline ?? "", after: deadline ?? "" });
      if (!changes.length) throw fulfilmentError("NO_CHANGES", "No supplier fulfilment changes were detected.");

      const occurredAt = new Date().toISOString();
      const id = current?.id ?? `ful-${randomUUID()}`;
      const next: SupplierFulfilmentItem = {
        ...component,
        id,
        status: input.status,
        ...(supplierName ? { supplierName } : {}),
        ...(supplierReference ? { supplierReference } : {}),
        ...(supplierCost !== undefined ? { supplierCost, supplierCurrency: costCurrency } : {}),
        ...(deadline ? { deadline } : {}),
        createdAt: current?.createdAt ?? occurredAt,
        createdByStaffId: current?.createdByStaffId ?? input.actorIdentityId,
        createdByDisplayName: current?.createdByDisplayName ?? input.actorDisplayName.trim(),
        updatedAt: occurredAt,
        updatedByStaffId: input.actorIdentityId,
        updatedByDisplayName: input.actorDisplayName.trim(),
        ...statusTimestampFields(input.status, occurredAt)
      };
      if (current?.requestedAt && input.status !== "requested") next.requestedAt = current.requestedAt;
      if (current?.confirmedAt && input.status !== "confirmed") next.confirmedAt = current.confirmedAt;
      if (current?.rejectedAt && input.status !== "rejected") next.rejectedAt = current.rejectedAt;
      if (current?.cancelledAt && input.status !== "cancelled") next.cancelledAt = current.cancelledAt;

      await items.updateOne(
        { targetType: input.targetType, targetId: input.targetId, componentKey: input.componentKey },
        { $set: next, $unset: {
          ...(!supplierName ? { supplierName: "" } : {}),
          ...(!supplierReference ? { supplierReference: "" } : {}),
          ...(supplierCost === undefined ? { supplierCost: "", supplierCurrency: "" } : {}),
          ...(!deadline ? { deadline: "" } : {})
        } },
        { upsert: true, session }
      );
      await events.insertOne({
        id: `ful-event-${randomUUID()}`,
        fulfilmentId: id,
        targetType: input.targetType,
        targetId: input.targetId,
        componentKey: input.componentKey,
        actorIdentityId: input.actorIdentityId,
        actorRole: input.actorRole,
        actorDisplayName: input.actorDisplayName.trim(),
        changes,
        occurredAt
      }, { session });
      saved = next;
    });
    return saved;
  } finally {
    await session.endSession();
  }
}

export async function addSupplierFulfilmentNote(input: AddSupplierFulfilmentNoteInput) {
  if (operationsConfig.mode !== "mongodb") throw fulfilmentError("FULFILMENT_UNAVAILABLE", "Supplier fulfilment requires MongoDB operations mode.");
  const body = normalizeSupplierFulfilmentNote(input.body);
  if (!input.fulfilmentId || !body || !input.actorIdentityId || !input.actorDisplayName.trim()) {
    throw fulfilmentError("INVALID_NOTE", "Supplier fulfilment note is invalid.");
  }

  const client = await getMongoClient();
  const database = client.db(getMongoDatabaseName());
  await ensureSupplierFulfilmentIndexes(database);
  const items = database.collection<StoredSupplierFulfilmentItem>(travelSupplierFulfilmentCollectionName);
  const notes = database.collection<StoredSupplierFulfilmentNote>(travelSupplierFulfilmentNoteCollectionName);
  const session = client.startSession();
  let saved: SupplierFulfilmentNote | null = null;
  try {
    await session.withTransaction(async () => {
      const item = await items.findOne({ id: input.fulfilmentId }, { session });
      if (!item) throw fulfilmentError("FULFILMENT_NOT_FOUND", "Supplier fulfilment item not found.");
      const note: SupplierFulfilmentNote = {
        id: `ful-note-${randomUUID()}`,
        fulfilmentId: item.id,
        body,
        authorStaffId: input.actorIdentityId,
        authorDisplayName: input.actorDisplayName.trim(),
        authorRole: input.actorRole,
        createdAt: new Date().toISOString()
      };
      await notes.insertOne(note, { session });
      saved = note;
    });
    return saved;
  } finally {
    await session.endSession();
  }
}
