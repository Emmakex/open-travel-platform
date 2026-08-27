import assert from "node:assert/strict";
import { privacyDataInventory } from "@/lib/privacy-data-inventory";
import {
  evaluatePrivacyRetention,
  getPrivacyRetentionPolicyItem,
  privacyRetentionPolicy,
  validatePrivacyRetentionPolicyCoverage
} from "@/lib/privacy-retention-policy";

assert.equal(validatePrivacyRetentionPolicyCoverage(), true, "retention policy must cover the complete personal-data inventory");
assert.equal(privacyRetentionPolicy.length, privacyDataInventory.length, "retention policy and inventory must remain 1:1");
assert.equal(new Set(privacyRetentionPolicy.map((item) => item.inventoryId)).size, privacyRetentionPolicy.length, "retention policy IDs must be unique");

const sessions = getPrivacyRetentionPolicyItem("customer-sessions");
assert.equal(sessions?.strategy, "ttl", "customer sessions must remain TTL-managed");
assert.equal(sessions?.deploymentDecisionRequired, false, "existing session TTL does not require a second retention schedule");

const traveller = getPrivacyRetentionPolicyItem("protected-traveller-data");
assert.equal(traveller?.strategy, "ttl", "protected Traveller Data must remain tied to bounded TTL expiry");

const payments = getPrivacyRetentionPolicyItem("payment-ledger");
assert.equal(payments?.owner, "finance", "payment retention must be owned by finance/legal review rather than automatic privacy deletion");
assert.equal(payments?.strategy, "business-record-review", "payment ledger must never become an automatic TTL deletion path");

const bookings = getPrivacyRetentionPolicyItem("trip-reservations");
assert.equal(bookings?.strategy, "business-record-review", "booking records must remain review-driven");

const now = new Date("2026-08-27T12:00:00.000Z");
const expired = new Date("2026-08-26T12:00:00.000Z");
const future = new Date("2026-08-28T12:00:00.000Z");

assert.deepEqual(
  evaluatePrivacyRetention({ inventoryId: "customer-sessions", now, expiresAt: expired }),
  { action: "eligible-for-expiry", reason: "ttl-expired-no-hold" },
  "expired TTL data with no hold may only be marked eligible for expiry"
);
assert.deepEqual(
  evaluatePrivacyRetention({ inventoryId: "customer-sessions", now, expiresAt: future }),
  { action: "retain", reason: "ttl-not-expired" },
  "unexpired TTL data must be retained"
);
assert.deepEqual(
  evaluatePrivacyRetention({ inventoryId: "customer-sessions", now, expiresAt: expired, hold: true }),
  { action: "retain", reason: "documented-hold" },
  "documented holds must override TTL eligibility"
);
assert.deepEqual(
  evaluatePrivacyRetention({ inventoryId: "payment-ledger", now, expiresAt: expired }),
  { action: "review-required", reason: "business-record-review-requires-deployment-review" },
  "business records must never become automatically deletable because a date was supplied"
);
assert.deepEqual(
  evaluatePrivacyRetention({ inventoryId: "unknown-store", now, expiresAt: expired }),
  { action: "review-required", reason: "unknown-inventory-item" },
  "unknown data stores must fail closed to human review"
);
assert.deepEqual(
  evaluatePrivacyRetention({ inventoryId: "protected-traveller-data", now }),
  { action: "review-required", reason: "ttl-expiry-metadata-missing" },
  "TTL-managed data without expiry metadata must fail closed"
);

console.log("Privacy retention policy coverage, holds and safe expiry eligibility tests passed.");
