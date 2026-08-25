import { randomUUID } from "node:crypto";
import type { Db } from "mongodb";
import type {
  AddReservationInternalNoteInput,
  ReservationInternalNote,
  ReservationOperationsEvent,
  ReservationOperationsState,
  UpdateReservationOperationsInput
} from "@/domain/operations/types";
import {
  ensureMongoReservationIndexes,
  travelReservationCollectionName,
  type StoredReservation
} from "@/lib/mongo-reservations";
import { getMongoClient, getMongoDatabaseName } from "@/lib/mongodb";
import { operationsConfig } from "@/lib/operations-config";
import {
  isReservationPriority,
  normalizeInternalNote,
  normalizeReservationTags,
  tagsSnapshot
} from "@/lib/reservation-operations-rules";
import { staffUserCollectionName, type StoredStaffUser } from "@/lib/staff-auth";

export const travelReservationOperationsCollectionName = "travel_reservation_operations";
export const travelReservationInternalNotesCollectionName = "travel_reservation_internal_notes";
export const travelReservationOperationsEventsCollectionName = "travel_reservation_operations_events";

type StoredReservationOperationsState = ReservationOperationsState;
type StoredReservationInternalNote = ReservationInternalNote;
type StoredReservationOperationsEvent = ReservationOperationsEvent;

function workflowError(code: string, message: string) {
  const error = new Error(message);
  Object.assign(error, { code });
  return error;
}

function defaultState(reservationId: string): ReservationOperationsState {
  return { reservationId, priority: "normal", tags: [] };
}

async function ensureReservationOperationsIndexes(database: Db) {
  const states = database.collection<StoredReservationOperationsState>(travelReservationOperationsCollectionName);
  const notes = database.collection<StoredReservationInternalNote>(travelReservationInternalNotesCollectionName);
  const events = database.collection<StoredReservationOperationsEvent>(travelReservationOperationsEventsCollectionName);

  await Promise.all([
    states.createIndex({ reservationId: 1 }, { unique: true, name: "travel_reservation_operations_reservation_unique" }),
    states.createIndex({ ownerStaffId: 1, priority: 1 }, { name: "travel_reservation_operations_owner_priority" }),
    states.createIndex({ priority: 1, updatedAt: -1 }, { name: "travel_reservation_operations_priority" }),
    states.createIndex({ tags: 1, updatedAt: -1 }, { name: "travel_reservation_operations_tags" }),
    notes.createIndex({ id: 1 }, { unique: true, name: "travel_reservation_internal_note_id_unique" }),
    notes.createIndex({ reservationId: 1, createdAt: -1 }, { name: "travel_reservation_internal_note_reservation" }),
    events.createIndex({ id: 1 }, { unique: true, name: "travel_reservation_operations_event_id_unique" }),
    events.createIndex({ reservationId: 1, occurredAt: -1 }, { name: "travel_reservation_operations_event_reservation" })
  ]);
}

export async function getReservationOperationsState(reservationId: string) {
  if (operationsConfig.mode !== "mongodb") return defaultState(reservationId);
  const client = await getMongoClient();
  const database = client.db(getMongoDatabaseName());
  await ensureReservationOperationsIndexes(database);
  return await database.collection<StoredReservationOperationsState>(travelReservationOperationsCollectionName)
    .findOne({ reservationId }) ?? defaultState(reservationId);
}

export async function listReservationOperationsStates(reservationIds: string[]) {
  const result = new Map<string, ReservationOperationsState>();
  for (const reservationId of reservationIds) result.set(reservationId, defaultState(reservationId));
  if (operationsConfig.mode !== "mongodb" || !reservationIds.length) return result;

  const client = await getMongoClient();
  const database = client.db(getMongoDatabaseName());
  await ensureReservationOperationsIndexes(database);
  const rows = await database.collection<StoredReservationOperationsState>(travelReservationOperationsCollectionName)
    .find({ reservationId: { $in: reservationIds } })
    .toArray();
  for (const row of rows) result.set(row.reservationId, row);
  return result;
}

export async function listReservationInternalNotes(reservationId: string) {
  if (operationsConfig.mode !== "mongodb") return [] as ReservationInternalNote[];
  const client = await getMongoClient();
  const database = client.db(getMongoDatabaseName());
  await ensureReservationOperationsIndexes(database);
  return database.collection<StoredReservationInternalNote>(travelReservationInternalNotesCollectionName)
    .find({ reservationId })
    .sort({ createdAt: -1 })
    .limit(100)
    .toArray();
}

export async function listReservationOperationsEvents(reservationId: string) {
  if (operationsConfig.mode !== "mongodb") return [] as ReservationOperationsEvent[];
  const client = await getMongoClient();
  const database = client.db(getMongoDatabaseName());
  await ensureReservationOperationsIndexes(database);
  return database.collection<StoredReservationOperationsEvent>(travelReservationOperationsEventsCollectionName)
    .find({ reservationId })
    .sort({ occurredAt: -1 })
    .limit(100)
    .toArray();
}

export async function updateReservationOperations(input: UpdateReservationOperationsInput) {
  if (operationsConfig.mode !== "mongodb") {
    throw workflowError("OPERATIONS_WORKFLOW_UNAVAILABLE", "Internal reservation workflow requires MongoDB operations mode.");
  }
  if (!input.reservationId || !input.actorIdentityId || !input.actorDisplayName.trim()) {
    throw workflowError("INVALID_REQUEST", "Reservation workflow update is invalid.");
  }
  if (!isReservationPriority(input.priority)) {
    throw workflowError("INVALID_PRIORITY", "Reservation priority is invalid.");
  }
  const tags = normalizeReservationTags(input.tags);
  if (!tags) throw workflowError("INVALID_TAGS", "Reservation tags are invalid.");

  const client = await getMongoClient();
  const database = client.db(getMongoDatabaseName());
  await Promise.all([ensureMongoReservationIndexes(database), ensureReservationOperationsIndexes(database)]);
  const reservations = database.collection<StoredReservation>(travelReservationCollectionName);
  const states = database.collection<StoredReservationOperationsState>(travelReservationOperationsCollectionName);
  const events = database.collection<StoredReservationOperationsEvent>(travelReservationOperationsEventsCollectionName);
  const staffUsers = database.collection<StoredStaffUser>(staffUserCollectionName);
  const session = client.startSession();
  let saved: ReservationOperationsState | null = null;

  try {
    await session.withTransaction(async () => {
      const reservation = await reservations.findOne({ id: input.reservationId }, { session });
      if (!reservation) throw workflowError("RESERVATION_NOT_FOUND", "Reservation not found.");

      const current = await states.findOne({ reservationId: input.reservationId }, { session }) ?? defaultState(input.reservationId);
      let ownerStaffId: string | undefined;
      let ownerDisplayName: string | undefined;
      if (input.ownerStaffId) {
        const owner = await staffUsers.findOne({ id: input.ownerStaffId, status: "active" }, { session });
        if (!owner) throw workflowError("INVALID_OWNER", "The selected staff owner is not active.");
        ownerStaffId = owner.id;
        ownerDisplayName = owner.displayName;
      }

      const changes: ReservationOperationsEvent["changes"] = [];
      if ((current.ownerStaffId ?? "") !== (ownerStaffId ?? "")) {
        changes.push({
          field: "owner",
          before: current.ownerStaffId ? `${current.ownerDisplayName ?? current.ownerStaffId} (${current.ownerStaffId})` : "",
          after: ownerStaffId ? `${ownerDisplayName ?? ownerStaffId} (${ownerStaffId})` : ""
        });
      }
      if (current.priority !== input.priority) {
        changes.push({ field: "priority", before: current.priority, after: input.priority });
      }
      if (tagsSnapshot(current.tags) !== tagsSnapshot(tags)) {
        changes.push({ field: "tags", before: tagsSnapshot(current.tags), after: tagsSnapshot(tags) });
      }
      if (!changes.length) throw workflowError("NO_CHANGES", "No internal workflow changes were detected.");

      const occurredAt = new Date().toISOString();
      const next: ReservationOperationsState = {
        reservationId: input.reservationId,
        ...(ownerStaffId ? { ownerStaffId, ownerDisplayName } : {}),
        priority: input.priority,
        tags,
        updatedAt: occurredAt,
        updatedByStaffId: input.actorIdentityId,
        updatedByDisplayName: input.actorDisplayName.trim()
      };

      await states.updateOne(
        { reservationId: input.reservationId },
        { $set: next, ...(!ownerStaffId ? { $unset: { ownerStaffId: "", ownerDisplayName: "" } } : {}) },
        { upsert: true, session }
      );
      await events.insertOne({
        id: `ops-${randomUUID()}`,
        reservationId: input.reservationId,
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

export async function addReservationInternalNote(input: AddReservationInternalNoteInput) {
  if (operationsConfig.mode !== "mongodb") {
    throw workflowError("OPERATIONS_WORKFLOW_UNAVAILABLE", "Internal reservation notes require MongoDB operations mode.");
  }
  const body = normalizeInternalNote(input.body);
  if (!input.reservationId || !input.actorIdentityId || !input.actorDisplayName.trim() || !body) {
    throw workflowError("INVALID_NOTE", "Internal note is invalid.");
  }

  const client = await getMongoClient();
  const database = client.db(getMongoDatabaseName());
  await Promise.all([ensureMongoReservationIndexes(database), ensureReservationOperationsIndexes(database)]);
  const reservations = database.collection<StoredReservation>(travelReservationCollectionName);
  const notes = database.collection<StoredReservationInternalNote>(travelReservationInternalNotesCollectionName);
  const session = client.startSession();
  let saved: ReservationInternalNote | null = null;

  try {
    await session.withTransaction(async () => {
      const reservation = await reservations.findOne({ id: input.reservationId }, { session });
      if (!reservation) throw workflowError("RESERVATION_NOT_FOUND", "Reservation not found.");
      const note: ReservationInternalNote = {
        id: `note-${randomUUID()}`,
        reservationId: input.reservationId,
        body,
        authorStaffId: input.actorIdentityId,
        authorRole: input.actorRole,
        authorDisplayName: input.actorDisplayName.trim(),
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
