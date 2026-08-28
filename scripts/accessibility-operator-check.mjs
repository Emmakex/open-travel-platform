import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const assert = (condition, message) => {
  if (!condition) throw new Error(`Operator accessibility invariant failed: ${message}`);
};

const workflow = read("components/operator/reservation-operations-workflow.tsx");
const tasks = read("components/operator/operations-tasks.tsx");
const fulfilment = read("components/operator/supplier-fulfilment-panel.tsx");
const browser = read("tests/e2e/accessibility-operator.spec.ts");
const docs = read("docs/ACCESSIBILITY-OPERATOR.md");
const docsEs = read("docs/ACCESSIBILITY-OPERATOR.es.md");

for (const [name, source, statusId, errorId] of [
  ["reservation workflow", workflow, "operations-status", "operations-error"],
  ["tasks", tasks, "tasks-status", "tasks-error"],
  ["supplier fulfilment", fulfilment, "fulfilment-status", "fulfilment-error"]
]) {
  assert(source.includes(`id=\"${statusId}\"`) && source.includes('role="status"') && source.includes('aria-live="polite"'), `${name} must expose polite success status`);
  assert(source.includes(`id=\"${errorId}\"`) && source.includes('role="alert"') && source.includes('aria-live="assertive"'), `${name} must expose assertive failure alerts`);
  assert(source.includes("aria-describedby"), `${name} forms must relate returned feedback programmatically`);
  assert(source.includes("aria-invalid"), `${name} validation must expose invalid controls`);
}

assert(workflow.includes('aria-label={tr(locale, "Reservation internal workflow", "Gestión interna de la reserva")}'), "reservation workflow form must have a stable accessible name");
assert(workflow.includes('id="operations-tags-help"'), "workflow tags help must remain programmatically addressable");
assert(tasks.includes('aria-label={tr(locale, "Create internal task", "Crear tarea interna")}'), "task creation form must have a stable accessible name");
assert(tasks.includes("<article") && tasks.includes("aria-labelledby={taskTitleId}"), "repeated tasks must be named articles");
assert(fulfilment.includes("aria-labelledby={componentTitleId}"), "supplier components must be named articles");
assert(fulfilment.includes('role="group"') && fulfilment.includes("External supplier actions for"), "external supplier action groups must be named");

for (const evidence of [
  "Operator workflow exposes accessible feedback, form names and error relationships",
  "#operations-status",
  "#tasks-error",
  "#fulfilment-error",
  "Reservation internal workflow|Gestión interna de la reserva",
  "Create internal task|Crear tarea interna",
  "Supplier tracking for|Seguimiento de proveedor para",
  "PR #115 regression guard"
]) {
  assert(browser.includes(evidence), `blocking browser coverage must include: ${evidence}`);
}

for (const [name, text] of [["English", docs], ["Spanish", docsEs]]) {
  const lower = text.toLowerCase();
  assert(lower.includes("wcag 2.2 aa"), `${name} docs must state the accessibility target`);
  assert(lower.includes('role="alert"') && lower.includes('role="status"'), `${name} docs must document alert/status semantics`);
  assert(lower.includes("operator"), `${name} docs must describe Operator scope`);
  assert(lower.includes("manual") && (lower.includes("screen-reader") || lower.includes("lector de pantalla")), `${name} docs must preserve the manual assistive-technology review boundary`);
}

console.log("Operator accessibility invariants passed.");
