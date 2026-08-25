import { randomUUID } from "node:crypto";
import type { ClientSession, Db } from "mongodb";
import type {
  AddOperationsTaskCommentInput,
  CreateOperationsTaskInput,
  OperationsTask,
  OperationsTaskComment,
  OperationsTaskEvent,
  OperationsTaskStatus,
  OperationsTaskTargetType,
  UpdateOperationsTaskInput
} from "@/domain/operations/types";
import { customerUserCollectionName, type StoredCustomerUser } from "@/lib/customer-auth";
import { ensureMongoReservationIndexes, travelReservationCollectionName, type StoredReservation } from "@/lib/mongo-reservations";
import { getMongoClient, getMongoDatabaseName } from "@/lib/mongodb";
import { operationsConfig } from "@/lib/operations-config";
import {
  isOperationsTaskStatus,
  isOperationsTaskTargetType,
  normalizeOperationsTaskComment,
  normalizeOperationsTaskDetails,
  normalizeOperationsTaskDueDate,
  normalizeOperationsTaskTitle
} from "@/lib/operations-task-rules";
import { ensureServiceReservationIndexes, serviceReservationCollectionName } from "@/lib/service-reservations";
import { staffUserCollectionName, type StoredStaffUser } from "@/lib/staff-auth";

export const travelOperationsTaskCollectionName = "travel_operations_tasks";
export const travelOperationsTaskEventCollectionName = "travel_operations_task_events";
export const travelOperationsTaskCommentCollectionName = "travel_operations_task_comments";

type StoredOperationsTask = OperationsTask;
type StoredOperationsTaskEvent = OperationsTaskEvent;
type StoredOperationsTaskComment = OperationsTaskComment;

function taskError(code: string, message: string) {
  const error = new Error(message);
  Object.assign(error, { code });
  return error;
}

async function ensureOperationsTaskIndexes(database: Db) {
  const tasks = database.collection<StoredOperationsTask>(travelOperationsTaskCollectionName);
  const events = database.collection<StoredOperationsTaskEvent>(travelOperationsTaskEventCollectionName);
  const comments = database.collection<StoredOperationsTaskComment>(travelOperationsTaskCommentCollectionName);
  await Promise.all([
    tasks.createIndex({ id: 1 }, { unique: true, name: "travel_operations_task_id_unique" }),
    tasks.createIndex({ targetType: 1, targetId: 1, status: 1, dueDate: 1 }, { name: "travel_operations_task_target" }),
    tasks.createIndex({ assigneeStaffId: 1, status: 1, dueDate: 1 }, { name: "travel_operations_task_assignee" }),
    tasks.createIndex({ status: 1, dueDate: 1, createdAt: -1 }, { name: "travel_operations_task_queue" }),
    events.createIndex({ id: 1 }, { unique: true, name: "travel_operations_task_event_id_unique" }),
    events.createIndex({ taskId: 1, occurredAt: -1 }, { name: "travel_operations_task_event_task" }),
    comments.createIndex({ id: 1 }, { unique: true, name: "travel_operations_task_comment_id_unique" }),
    comments.createIndex({ taskId: 1, createdAt: -1 }, { name: "travel_operations_task_comment_task" })
  ]);
}

async function ensureTargetExists(
  database: Db,
  targetType: OperationsTaskTargetType,
  targetId: string,
  session?: ClientSession
) {
  if (targetType === "trip-reservation") {
    return Boolean(await database.collection<StoredReservation>(travelReservationCollectionName).findOne({ id: targetId }, { session }));
  }
  if (targetType === "service-reservation") {
    return Boolean(await database.collection(serviceReservationCollectionName).findOne({ id: targetId }, { session }));
  }
  return Boolean(await database.collection<StoredCustomerUser>(customerUserCollectionName).findOne({ id: targetId }, { session }));
}

async function resolveAssignee(database: Db, staffId: string | undefined, session?: ClientSession) {
  if (!staffId) return null;
  const user = await database.collection<StoredStaffUser>(staffUserCollectionName)
    .findOne({ id: staffId, status: "active" }, { session });
  if (!user) throw taskError("INVALID_ASSIGNEE", "The selected task assignee is not active.");
  return { id: user.id, displayName: user.displayName };
}

function canTransition(from: OperationsTaskStatus, to: OperationsTaskStatus) {
  if (from === to) return true;
  if (from === "cancelled") return false;
  if (from === "completed") return to === "open" || to === "in-progress";
  return to === "open" || to === "in-progress" || to === "completed" || to === "cancelled";
}

async function prepareDatabase(database: Db) {
  await Promise.all([
    ensureMongoReservationIndexes(database),
    ensureServiceReservationIndexes(database),
    ensureOperationsTaskIndexes(database)
  ]);
}

export async function listOperationsTasks() {
  if (operationsConfig.mode !== "mongodb") return [] as OperationsTask[];
  const client = await getMongoClient();
  const database = client.db(getMongoDatabaseName());
  await ensureOperationsTaskIndexes(database);
  return database.collection<StoredOperationsTask>(travelOperationsTaskCollectionName)
    .find({})
    .sort({ dueDate: 1, createdAt: -1 })
    .limit(1000)
    .toArray();
}

export async function listOperationsTasksForTarget(targetType: OperationsTaskTargetType, targetId: string) {
  if (operationsConfig.mode !== "mongodb") return [] as OperationsTask[];
  const client = await getMongoClient();
  const database = client.db(getMongoDatabaseName());
  await ensureOperationsTaskIndexes(database);
  return database.collection<StoredOperationsTask>(travelOperationsTaskCollectionName)
    .find({ targetType, targetId })
    .sort({ dueDate: 1, createdAt: -1 })
    .limit(200)
    .toArray();
}

export async function listOperationsTaskEvents(taskId: string) {
  if (operationsConfig.mode !== "mongodb") return [] as OperationsTaskEvent[];
  const client = await getMongoClient();
  const database = client.db(getMongoDatabaseName());
  await ensureOperationsTaskIndexes(database);
  return database.collection<StoredOperationsTaskEvent>(travelOperationsTaskEventCollectionName)
    .find({ taskId })
    .sort({ occurredAt: -1 })
    .limit(100)
    .toArray();
}

export async function listOperationsTaskComments(taskId: string) {
  if (operationsConfig.mode !== "mongodb") return [] as OperationsTaskComment[];
  const client = await getMongoClient();
  const database = client.db(getMongoDatabaseName());
  await ensureOperationsTaskIndexes(database);
  return database.collection<StoredOperationsTaskComment>(travelOperationsTaskCommentCollectionName)
    .find({ taskId })
    .sort({ createdAt: -1 })
    .limit(100)
    .toArray();
}

export async function createOperationsTask(input: CreateOperationsTaskInput) {
  if (operationsConfig.mode !== "mongodb") throw taskError("TASKS_UNAVAILABLE", "Operations tasks require MongoDB operations mode.");
  const title = normalizeOperationsTaskTitle(input.title);
  const details = normalizeOperationsTaskDetails(input.details);
  const dueDate = normalizeOperationsTaskDueDate(input.dueDate);
  if (!isOperationsTaskTargetType(input.targetType) || !input.targetId.trim() || !title || details === null || dueDate === null || !input.actorIdentityId || !input.actorDisplayName.trim()) {
    throw taskError("INVALID_TASK", "Operations task input is invalid.");
  }

  const client = await getMongoClient();
  const database = client.db(getMongoDatabaseName());
  await prepareDatabase(database);
  const tasks = database.collection<StoredOperationsTask>(travelOperationsTaskCollectionName);
  const session = client.startSession();
  let saved: OperationsTask | null = null;
  try {
    await session.withTransaction(async () => {
      if (!(await ensureTargetExists(database, input.targetType, input.targetId, session))) {
        throw taskError("TARGET_NOT_FOUND", "The task target could not be found.");
      }
      const assignee = await resolveAssignee(database, input.assigneeStaffId, session);
      const task: OperationsTask = {
        id: `task-${randomUUID()}`,
        targetType: input.targetType,
        targetId: input.targetId,
        title,
        ...(details ? { details } : {}),
        status: "open",
        ...(dueDate ? { dueDate } : {}),
        ...(assignee ? { assigneeStaffId: assignee.id, assigneeDisplayName: assignee.displayName } : {}),
        createdByStaffId: input.actorIdentityId,
        createdByDisplayName: input.actorDisplayName.trim(),
        createdByRole: input.actorRole,
        createdAt: new Date().toISOString()
      };
      await tasks.insertOne(task, { session });
      saved = task;
    });
    return saved;
  } finally {
    await session.endSession();
  }
}

export async function updateOperationsTask(input: UpdateOperationsTaskInput) {
  if (operationsConfig.mode !== "mongodb") throw taskError("TASKS_UNAVAILABLE", "Operations tasks require MongoDB operations mode.");
  if (!input.taskId || !isOperationsTaskStatus(input.status) || !input.actorIdentityId || !input.actorDisplayName.trim()) {
    throw taskError("INVALID_TASK", "Operations task update is invalid.");
  }
  const dueDate = normalizeOperationsTaskDueDate(input.dueDate);
  if (dueDate === null) throw taskError("INVALID_DUE_DATE", "Task due date is invalid.");

  const client = await getMongoClient();
  const database = client.db(getMongoDatabaseName());
  await ensureOperationsTaskIndexes(database);
  const tasks = database.collection<StoredOperationsTask>(travelOperationsTaskCollectionName);
  const events = database.collection<StoredOperationsTaskEvent>(travelOperationsTaskEventCollectionName);
  const session = client.startSession();
  let saved: OperationsTask | null = null;
  try {
    await session.withTransaction(async () => {
      const current = await tasks.findOne({ id: input.taskId }, { session });
      if (!current) throw taskError("TASK_NOT_FOUND", "Task not found.");
      if (!canTransition(current.status, input.status)) throw taskError("INVALID_TRANSITION", "Task status transition is not allowed.");
      const assignee = await resolveAssignee(database, input.assigneeStaffId, session);
      const changes: OperationsTaskEvent["changes"] = [];
      if (current.status !== input.status) changes.push({ field: "status", before: current.status, after: input.status });
      if ((current.assigneeStaffId ?? "") !== (assignee?.id ?? "")) {
        changes.push({
          field: "assignee",
          before: current.assigneeStaffId ? `${current.assigneeDisplayName ?? current.assigneeStaffId} (${current.assigneeStaffId})` : "",
          after: assignee ? `${assignee.displayName} (${assignee.id})` : ""
        });
      }
      if ((current.dueDate ?? "") !== (dueDate ?? "")) changes.push({ field: "dueDate", before: current.dueDate ?? "", after: dueDate ?? "" });
      if (!changes.length) throw taskError("NO_CHANGES", "No task changes were detected.");

      const occurredAt = new Date().toISOString();
      const next: OperationsTask = {
        ...current,
        status: input.status,
        ...(dueDate ? { dueDate } : {}),
        ...(assignee ? { assigneeStaffId: assignee.id, assigneeDisplayName: assignee.displayName } : {}),
        updatedAt: occurredAt,
        ...(input.status === "completed" ? { completedAt: occurredAt } : {}),
        ...(input.status === "cancelled" ? { cancelledAt: occurredAt } : {})
      };
      if (!dueDate) delete next.dueDate;
      if (!assignee) {
        delete next.assigneeStaffId;
        delete next.assigneeDisplayName;
      }
      if (input.status !== "completed") delete next.completedAt;
      if (input.status !== "cancelled") delete next.cancelledAt;

      const set: Record<string, unknown> = { status: next.status, updatedAt: occurredAt };
      if (next.dueDate) set.dueDate = next.dueDate;
      if (next.assigneeStaffId) {
        set.assigneeStaffId = next.assigneeStaffId;
        set.assigneeDisplayName = next.assigneeDisplayName;
      }
      if (next.completedAt) set.completedAt = next.completedAt;
      if (next.cancelledAt) set.cancelledAt = next.cancelledAt;
      const unset: Record<string, ""> = {};
      if (!next.dueDate) unset.dueDate = "";
      if (!next.assigneeStaffId) {
        unset.assigneeStaffId = "";
        unset.assigneeDisplayName = "";
      }
      if (!next.completedAt) unset.completedAt = "";
      if (!next.cancelledAt) unset.cancelledAt = "";

      await tasks.updateOne({ id: current.id }, { $set: set, ...(Object.keys(unset).length ? { $unset: unset } : {}) }, { session });
      await events.insertOne({
        id: `task-event-${randomUUID()}`,
        taskId: current.id,
        targetType: current.targetType,
        targetId: current.targetId,
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

export async function addOperationsTaskComment(input: AddOperationsTaskCommentInput) {
  if (operationsConfig.mode !== "mongodb") throw taskError("TASKS_UNAVAILABLE", "Operations tasks require MongoDB operations mode.");
  const body = normalizeOperationsTaskComment(input.body);
  if (!input.taskId || !body || !input.actorIdentityId || !input.actorDisplayName.trim()) {
    throw taskError("INVALID_COMMENT", "Task follow-up comment is invalid.");
  }

  const client = await getMongoClient();
  const database = client.db(getMongoDatabaseName());
  await ensureOperationsTaskIndexes(database);
  const tasks = database.collection<StoredOperationsTask>(travelOperationsTaskCollectionName);
  const comments = database.collection<StoredOperationsTaskComment>(travelOperationsTaskCommentCollectionName);
  const session = client.startSession();
  let saved: OperationsTaskComment | null = null;
  try {
    await session.withTransaction(async () => {
      const task = await tasks.findOne({ id: input.taskId }, { session });
      if (!task) throw taskError("TASK_NOT_FOUND", "Task not found.");
      const comment: OperationsTaskComment = {
        id: `task-comment-${randomUUID()}`,
        taskId: task.id,
        body,
        authorStaffId: input.actorIdentityId,
        authorDisplayName: input.actorDisplayName.trim(),
        authorRole: input.actorRole,
        createdAt: new Date().toISOString()
      };
      await comments.insertOne(comment, { session });
      saved = comment;
    });
    return saved;
  } finally {
    await session.endSession();
  }
}
