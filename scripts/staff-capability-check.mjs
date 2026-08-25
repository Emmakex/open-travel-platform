import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  effectiveStaffCapabilities,
  hasStaffCapability,
  legacyOperatorCapabilities,
  normalizeStaffCapabilities,
  staffCapabilities
} from "../lib/staff-capabilities.ts";

const customer = { id: "customer-1", email: "c@example.com", displayName: "Customer", role: "customer" };
const legacyOperator = { id: "operator-legacy", email: "o@example.com", displayName: "Legacy", role: "operator" };
const limitedOperator = {
  id: "operator-limited",
  email: "l@example.com",
  displayName: "Limited",
  role: "operator",
  capabilities: ["reservations", "finance"]
};
const admin = { id: "admin-1", email: "a@example.com", displayName: "Admin", role: "admin" };

assert.deepEqual(effectiveStaffCapabilities(customer), []);
assert.deepEqual(effectiveStaffCapabilities(legacyOperator), legacyOperatorCapabilities);
assert.deepEqual(effectiveStaffCapabilities(limitedOperator), ["reservations", "finance"]);
assert.deepEqual(effectiveStaffCapabilities(admin), staffCapabilities);
assert.equal(hasStaffCapability(limitedOperator, "reservations"), true);
assert.equal(hasStaffCapability(limitedOperator, "catalogue"), false);
assert.equal(hasStaffCapability(legacyOperator, "suppliers"), true);
assert.equal(hasStaffCapability(legacyOperator, "administration"), false);
assert.equal(hasStaffCapability(admin, "administration"), true);
assert.deepEqual(
  normalizeStaffCapabilities(["finance", "administration", "finance", "catalogue", "unknown"]),
  ["catalogue", "finance"]
);

const sourceChecks = [
  ["app/operator/reservations/layout.tsx", 'requireStaffCapability("reservations")'],
  ["app/operator/service-reservations/layout.tsx", 'requireStaffCapability("reservations")'],
  ["app/operator/catalogue/layout.tsx", 'requireStaffCapability("catalogue")'],
  ["app/operator/media/layout.tsx", 'requireStaffCapability("catalogue")'],
  ["app/operator/payments/layout.tsx", 'requireStaffCapability("finance")'],
  ["app/operator/tasks/layout.tsx", 'requireStaffCapability("tasks")'],
  ["app/operator/fulfilment/layout.tsx", 'requireStaffCapability("suppliers")'],
  ["app/operator/actions.ts", 'requireStaffCapability("reservations")'],
  ["app/operator/payments/actions.ts", 'requireStaffCapability("finance")'],
  ["app/operator/tasks/actions.ts", 'requireStaffCapability("tasks")'],
  ["app/operator/fulfilment/actions.ts", 'requireStaffCapability("suppliers")'],
  ["app/operator/catalogue/actions.ts", 'requireStaffCapability("catalogue")'],
  ["app/operator/catalogue/accommodations/actions.ts", 'requireStaffCapability("catalogue")'],
  ["app/operator/catalogue/services/actions.ts", 'requireStaffCapability("catalogue")'],
  ["app/operator/service-reservations/actions.ts", 'requireStaffCapability("reservations")'],
  ["app/api/operator/media/route.ts", 'hasStaffCapability(identity, "catalogue")'],
  ["app/operator/reservations/[id]/page.tsx", 'hasStaffCapability(staff, "finance")'],
  ["app/operator/reservations/[id]/page.tsx", 'hasStaffCapability(staff, "traveller-data")'],
  ["app/operator/reservations/page.tsx", 'paymentSummaries = canFinance'],
  ["app/operator/reservations/[id]/workflow/page.tsx", 'canSuppliers ? listSupplierFulfilmentForTarget'],
  ["app/operator/reservations/[id]/workflow/page.tsx", 'canTasks ? listOperationsTasksForTarget'],
  ["app/operator/service-reservations/[id]/page.tsx", 'canViewTravellerData && requirementsActive'],
  ["app/operator/page.tsx", 'canFinance ? <Link'],
  ["app/operator/page.tsx", 'canSuppliers ? listSupplierFulfilmentQueue()'],
  ["adapters/mongo-identity-repository.ts", "getExplicitStaffCapabilities"],
  ["lib/staff-permissions.ts", "travel_staff_capability_audit"],
  ["lib/staff-permissions.ts", "session.withTransaction"],
  ["lib/staff-permissions.ts", 'beforeMode: current ? "explicit" : "legacy"'],
  ["lib/staff-permissions.ts", 'afterMode: "explicit"'],
  ["app/operator/staff/page.tsx", "listRecentStaffCapabilityAudit"]
];

for (const [path, expected] of sourceChecks) {
  const source = await readFile(new URL(`../${path}`, import.meta.url), "utf8");
  assert.ok(source.includes(expected), `${path} must contain ${expected}`);
}

console.log("Granular staff capability, boundary and audit invariants passed.");
