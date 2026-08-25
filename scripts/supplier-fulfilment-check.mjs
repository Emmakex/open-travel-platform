import assert from "node:assert/strict";
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import {
  canSupplierFulfilmentTransition,
  isSupplierCurrency,
  isSupplierFulfilmentOverdue,
  isSupplierFulfilmentStatus,
  isSupplierFulfilmentTargetType,
  normalizeSupplierCost,
  normalizeSupplierDeadline,
  normalizeSupplierFulfilmentNote,
  normalizeSupplierName,
  normalizeSupplierReference
} from "../lib/supplier-fulfilment-rules.ts";

assert.equal(isSupplierFulfilmentStatus("requested"), true);
assert.equal(isSupplierFulfilmentStatus("pending"), false);
assert.equal(isSupplierFulfilmentTargetType("trip-reservation"), true);
assert.equal(isSupplierFulfilmentTargetType("customer"), false);
assert.equal(isSupplierCurrency("EUR"), true);
assert.equal(isSupplierCurrency("JPY"), false);

assert.equal(normalizeSupplierName("  Hotel   Partner  "), "Hotel Partner");
assert.equal(normalizeSupplierName("x"), null);
assert.equal(normalizeSupplierReference("  REF   123  "), "REF 123");
assert.equal(normalizeSupplierReference("x".repeat(161)), null);
assert.equal(normalizeSupplierCost(123.456), 123.46);
assert.equal(normalizeSupplierCost(-1), null);
assert.equal(normalizeSupplierCost(undefined), undefined);
assert.equal(normalizeSupplierDeadline("2026-08-31"), "2026-08-31");
assert.equal(normalizeSupplierDeadline("2026-02-31"), null);
assert.equal(normalizeSupplierFulfilmentNote("  Called supplier\r\nAwaiting reply  "), "Called supplier\nAwaiting reply");
assert.equal(normalizeSupplierFulfilmentNote("   "), null);
assert.equal(normalizeSupplierFulfilmentNote("x".repeat(2001)), null);

assert.equal(canSupplierFulfilmentTransition("not-requested", "requested"), true);
assert.equal(canSupplierFulfilmentTransition("not-requested", "confirmed"), false);
assert.equal(canSupplierFulfilmentTransition("requested", "confirmed"), true);
assert.equal(canSupplierFulfilmentTransition("requested", "rejected"), true);
assert.equal(canSupplierFulfilmentTransition("confirmed", "requested"), true);
assert.equal(canSupplierFulfilmentTransition("rejected", "requested"), true);
assert.equal(canSupplierFulfilmentTransition("cancelled", "requested"), false);

assert.equal(isSupplierFulfilmentOverdue({ status: "requested", deadline: "2026-08-24" }, "2026-08-25"), true);
assert.equal(isSupplierFulfilmentOverdue({ status: "confirmed", deadline: "2026-08-24" }, "2026-08-25"), false);
assert.equal(isSupplierFulfilmentOverdue({ status: "cancelled", deadline: "2026-08-24" }, "2026-08-25"), false);
assert.equal(isSupplierFulfilmentOverdue({ status: "requested", deadline: "2026-08-25" }, "2026-08-25"), false);

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

for (const root of ["app", "components"]) {
  for (const file of await filesUnder(root)) {
    const normalized = file.split(path.sep).join("/");
    if (normalized.includes("/operator/")) continue;
    const source = await readFile(file, "utf8");
    assert.equal(source.includes("@/lib/supplier-fulfilment"), false, `${file} must not import internal supplier fulfilment data`);
    assert.equal(source.includes("travel_supplier_fulfilment"), false, `${file} must not reference internal supplier fulfilment storage`);
  }
}

console.log("Supplier fulfilment invariants passed.");
