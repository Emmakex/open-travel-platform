import assert from "node:assert/strict";
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import {
  isReservationPriority,
  normalizeInternalNote,
  normalizeReservationTags,
  parseReservationTags
} from "../lib/reservation-operations-rules.ts";

assert.equal(isReservationPriority("urgent"), true);
assert.equal(isReservationPriority("critical"), false);

assert.deepEqual(
  normalizeReservationTags([" VIP ", "vip", " Documentación pendiente ", "Proveedor"]),
  ["VIP", "Documentación pendiente", "Proveedor"]
);
assert.deepEqual(parseReservationTags("VIP, documentos, proveedor"), ["VIP", "documentos", "proveedor"]);
assert.equal(normalizeReservationTags(Array.from({ length: 11 }, (_, index) => `tag-${index}`)), null);
assert.equal(normalizeReservationTags(["x".repeat(41)]), null);

assert.equal(normalizeInternalNote("  Supplier pending\r\nCall Friday  "), "Supplier pending\nCall Friday");
assert.equal(normalizeInternalNote("\u0000Internal note"), "Internal note");
assert.equal(normalizeInternalNote("   "), null);
assert.equal(normalizeInternalNote("x".repeat(2001)), null);

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
    assert.equal(source.includes("@/lib/reservation-operations"), false, `${file} must not import internal reservation workflow data`);
    assert.equal(source.includes("travel_reservation_internal_notes"), false, `${file} must not reference internal notes storage`);
  }
}

console.log("Reservation operations invariants passed.");
