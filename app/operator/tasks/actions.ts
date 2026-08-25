"use server";

import { redirect } from "next/navigation";
import {
  addOperationsTaskComment,
  createOperationsTask,
  updateOperationsTask
} from "@/lib/operations-tasks";
import {
  isOperationsTaskStatus,
  isOperationsTaskTargetType,
  normalizeOperationsTaskDueDate
} from "@/lib/operations-task-rules";
import { operationsConfig } from "@/lib/operations-config";
import { requireStaffCapability } from "@/lib/require-staff-capability";

function value(formData: FormData, key: string) {
  const item = formData.get(key);
  return typeof item === "string" ? item.trim() : "";
}

function safeReturnTo(value: string) {
  return value.startsWith("/operator/") && !value.startsWith("//") ? value : "/operator/tasks";
}

function withQuery(path: string, key: string, value: string) {
  const url = new URL(path, "https://internal.invalid");
  url.searchParams.set(key, value);
  return `${url.pathname}${url.search}${url.hash || "#tasks"}`;
}

function taskErrorQuery(error: unknown) {
  if (!error || typeof error !== "object" || !("code" in error)) return "update-failed";
  switch (error.code) {
    case "TASKS_UNAVAILABLE": return "tasks-unavailable";
    case "TARGET_NOT_FOUND": return "target-not-found";
    case "TASK_NOT_FOUND": return "task-not-found";
    case "INVALID_ASSIGNEE": return "invalid-assignee";
    case "INVALID_DUE_DATE": return "invalid-due-date";
    case "INVALID_TRANSITION": return "invalid-transition";
    case "INVALID_COMMENT": return "invalid-comment";
    case "NO_CHANGES": return "no-changes";
    case "INVALID_TASK": return "invalid-task";
    default: return "update-failed";
  }
}

export async function createOperationsTaskAction(formData: FormData) {
  const staff = await requireStaffCapability("tasks");
  const targetType = value(formData, "targetType");
  const targetId = value(formData, "targetId");
  const title = value(formData, "title");
  const details = value(formData, "details") || undefined;
  const dueDate = value(formData, "dueDate") || undefined;
  const assigneeStaffId = value(formData, "assigneeStaffId") || undefined;
  const returnTo = safeReturnTo(value(formData, "returnTo"));

  if (!operationsConfig.writesEnabled || !isOperationsTaskTargetType(targetType) || !targetId || !title || normalizeOperationsTaskDueDate(dueDate) === null) {
    redirect(withQuery(returnTo, "taskError", "invalid-task"));
  }

  try {
    await createOperationsTask({
      targetType,
      targetId,
      title,
      details,
      dueDate,
      assigneeStaffId,
      actorIdentityId: staff.id,
      actorRole: staff.role,
      actorDisplayName: staff.displayName
    });
  } catch (error) {
    redirect(withQuery(returnTo, "taskError", taskErrorQuery(error)));
  }
  redirect(withQuery(returnTo, "taskUpdated", "created"));
}

export async function updateOperationsTaskAction(formData: FormData) {
  const staff = await requireStaffCapability("tasks");
  const taskId = value(formData, "taskId");
  const status = value(formData, "status");
  const dueDate = value(formData, "dueDate") || undefined;
  const assigneeStaffId = value(formData, "assigneeStaffId") || undefined;
  const returnTo = safeReturnTo(value(formData, "returnTo"));

  if (!operationsConfig.writesEnabled || !taskId || !isOperationsTaskStatus(status) || normalizeOperationsTaskDueDate(dueDate) === null) {
    redirect(withQuery(returnTo, "taskError", "invalid-task"));
  }

  try {
    await updateOperationsTask({
      taskId,
      status,
      dueDate,
      assigneeStaffId,
      actorIdentityId: staff.id,
      actorRole: staff.role,
      actorDisplayName: staff.displayName
    });
  } catch (error) {
    redirect(withQuery(returnTo, "taskError", taskErrorQuery(error)));
  }
  redirect(withQuery(returnTo, "taskUpdated", "updated"));
}

export async function addOperationsTaskCommentAction(formData: FormData) {
  const staff = await requireStaffCapability("tasks");
  const taskId = value(formData, "taskId");
  const body = value(formData, "body");
  const returnTo = safeReturnTo(value(formData, "returnTo"));
  if (!operationsConfig.writesEnabled || !taskId || !body) {
    redirect(withQuery(returnTo, "taskError", "invalid-comment"));
  }
  try {
    await addOperationsTaskComment({
      taskId,
      body,
      actorIdentityId: staff.id,
      actorRole: staff.role,
      actorDisplayName: staff.displayName
    });
  } catch (error) {
    redirect(withQuery(returnTo, "taskError", taskErrorQuery(error)));
  }
  redirect(withQuery(returnTo, "taskUpdated", "comment"));
}
