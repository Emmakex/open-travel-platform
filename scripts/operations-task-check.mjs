import assert from "node:assert/strict";
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import {
  isOperationsTaskDueToday,
  isOperationsTaskOverdue,
  isOperationsTaskStatus,
  isOperationsTaskTargetType,
  normalizeOperationsTaskComment,
  normalizeOperationsTaskDetails,
  normalizeOperationsTaskDueDate,
  normalizeOperationsTaskTitle
} from "../lib/operations-task-rules.ts";

assert.equal(isOperationsTaskStatus("open"), true);
assert.equal(isOperationsTaskStatus("blocked"), false);
assert.equal(isOperationsTaskTargetType("trip-reservation"), true);
assert.equal(isOperationsTaskTargetType("service-reservation"), true);
assert.equal(isOperationsTaskTargetType("customer"), true);
assert.equal(isOperationsTaskTargetType("trip"), false);

assert.equal(normalizeOperationsTaskTitle("  Confirm   hotel  "), "Confirm hotel");
assert.equal(normalizeOperationsTaskTitle("x"), null);
assert.equal(normalizeOperationsTaskDetails("  Supplier replied\r\nWaiting voucher  "), "Supplier replied\nWaiting voucher");
assert.equal(normalizeOperationsTaskDetails("x".repeat(2001)), null);
assert.equal(normalizeOperationsTaskComment("  Called supplier  "), "Called supplier");
assert.equal(normalizeOperationsTaskComment("x".repeat(2001)), null);
assert.equal(normalizeOperationsTaskDueDate("2026-08-25"), "2026-08-25");
assert.equal(normalizeOperationsTaskDueDate("2026-02-30"), null);
assert.equal(normalizeOperationsTaskDueDate("25/08/2026"), null);

assert.equal(isOperationsTaskOverdue({ status: "open", dueDate: "2026-08-24" }, "2026-08-25"), true);
assert.equal(isOperationsTaskOverdue({ status: "completed", dueDate: "2026-08-24" }, "2026-08-25"), false);
assert.equal(isOperationsTaskDueToday({ status: "in-progress", dueDate: "2026-08-25" }, "2026-08-25"), true);

async function filesUnder(directory) {
  const output = [];
  async function walk(current) {
    for (const entry of await readdir(current)) {
      const fullPath = path.join(current, entry);
      const info = await stat(fullPath);
      if (info.isDirectory()) await walk(fullPath);
      else if (/\.(ts|tsx|js|jsx)$/.test(entry)) output.push(fullPath);
    }
  }
  await walk(directory);
  return output;
}

for (const directory of ["app/account", "app/reservations"]) {
  for (const file of await filesUnder(directory)) {
    const source = await readFile(file, "utf8");
    assert.equal(source.includes("@/lib/operations-tasks"), false, `${file} must not import internal operations tasks`);
    assert.equal(source.includes("travel_operations_tasks"), false, `${file} must not reference internal task storage`);
  }
}

console.log("Operations task invariants passed.");
