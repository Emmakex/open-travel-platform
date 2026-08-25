import type {
  OperationsTask,
  OperationsTaskStatus,
  OperationsTaskTargetType
} from "@/domain/operations/types";

const taskStatuses = new Set<OperationsTaskStatus>(["open", "in-progress", "completed", "cancelled"]);
const taskTargetTypes = new Set<OperationsTaskTargetType>(["trip-reservation", "service-reservation", "customer"]);
const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;

export function isOperationsTaskStatus(value: string): value is OperationsTaskStatus {
  return taskStatuses.has(value as OperationsTaskStatus);
}

export function isOperationsTaskTargetType(value: string): value is OperationsTaskTargetType {
  return taskTargetTypes.has(value as OperationsTaskTargetType);
}

export function normalizeOperationsTaskTitle(value: string) {
  const title = value.trim().replace(/\s+/g, " ");
  return title.length >= 2 && title.length <= 160 ? title : null;
}

export function normalizeOperationsTaskDetails(value?: string) {
  if (!value) return undefined;
  const details = value.trim().replace(/\r\n/g, "\n");
  if (!details) return undefined;
  return details.length <= 2000 ? details : null;
}

export function normalizeOperationsTaskComment(value: string) {
  const body = value.trim().replace(/\r\n/g, "\n");
  return body.length >= 1 && body.length <= 2000 ? body : null;
}

export function normalizeOperationsTaskDueDate(value?: string) {
  if (!value) return undefined;
  const dueDate = value.trim();
  if (!isoDatePattern.test(dueDate)) return null;
  const parsed = new Date(`${dueDate}T12:00:00Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== dueDate) return null;
  return dueDate;
}

export function operationsDateKey(now = new Date()) {
  return now.toISOString().slice(0, 10);
}

export function isOperationsTaskOpen(task: Pick<OperationsTask, "status">) {
  return task.status === "open" || task.status === "in-progress";
}

export function isOperationsTaskOverdue(task: Pick<OperationsTask, "status" | "dueDate">, today = operationsDateKey()) {
  return Boolean(task.dueDate && isOperationsTaskOpen(task) && task.dueDate < today);
}

export function isOperationsTaskDueToday(task: Pick<OperationsTask, "status" | "dueDate">, today = operationsDateKey()) {
  return Boolean(task.dueDate === today && isOperationsTaskOpen(task));
}
