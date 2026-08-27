import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const assert = (condition, message) => {
  if (!condition) throw new Error(`Privacy-retention invariant failed: ${message}`);
};

const policy = read("lib/privacy-retention-policy.ts");
const inventory = read("lib/privacy-data-inventory.ts");
const test = read("tests/privacy-retention-policy.ts");
const docs = read("docs/RETENTION-REGULATORY-BASELINE.md");
const docsEs = read("docs/RETENTION-REGULATORY-BASELINE.es.md");
const packageJson = JSON.parse(read("package.json"));

for (const strategy of ["ttl", "case-review", "business-record-review", "security-review"]) {
  assert(policy.includes(`\"${strategy}\"`), `retention strategy ${strategy} must remain explicit`);
}

assert(policy.includes("validatePrivacyRetentionPolicyCoverage"), "policy must validate 1:1 personal-data inventory coverage");
assert(policy.includes("if (input.hold)"), "documented holds must take precedence over expiry evaluation");
assert(policy.includes('action: "eligible-for-expiry"'), "TTL expiry may only mark data eligible for expiry");
assert(!policy.includes('action: "delete"'), "retention registry must not emit an automatic delete instruction");
assert(policy.includes('strategy !== "ttl"'), "non-TTL stores must fail to deployment review rather than date-based expiry");
assert(policy.includes("ttl-expiry-metadata-missing"), "TTL stores without expiry metadata must fail closed");

for (const inventoryId of [
  "customer-account",
  "customer-sessions",
  "authentication-audit",
  "trip-reservations",
  "service-reservations",
  "payment-ledger",
  "protected-traveller-data",
  "operations-audit",
  "customer-operations-tasks",
  "integration-outbox",
  "privacy-rights-case"
]) {
  assert(inventory.includes(`id: \"${inventoryId}\"`), `inventory must still contain ${inventoryId}`);
  assert(policy.includes(`inventoryId: \"${inventoryId}\"`), `retention registry must cover ${inventoryId}`);
}

for (const evidence of [
  "retention policy must cover the complete personal-data inventory",
  "documented holds must override TTL eligibility",
  "business records must never become automatically deletable",
  "unknown data stores must fail closed",
  "TTL-managed data without expiry metadata must fail closed"
]) {
  assert(test.includes(evidence), `retention unit test must prove: ${evidence}`);
}

for (const [name, text] of [["English", docs], ["Spanish", docsEs]]) {
  const lower = text.toLowerCase();
  assert(lower.includes("eur-lex.europa.eu/eli/reg/2016/679/oj"), `${name} docs must cite the official GDPR source`);
  assert(lower.includes("boe-a-1885-6627"), `${name} docs must cite the Spanish Commercial Code source`);
  assert(lower.includes("boe-a-2003-23186"), `${name} docs must cite the Spanish General Tax Law source`);
  assert(lower.includes("2015/2302"), `${name} docs must cite the package-travel directive`);
  assert(lower.includes("boe-a-2007-20555"), `${name} docs must cite the Spanish consumer/package-travel framework`);
  assert(lower.includes("not legal advice") || lower.includes("no es asesoramiento jurídico"), `${name} docs must not claim legal certification`);
  assert(lower.includes("six-year") || lower.includes("seis años"), `${name} docs must explain the Spanish commercial reference period`);
  assert(lower.includes("four-year") || lower.includes("cuatro años"), `${name} docs must explain the Spanish tax limitation reference period`);
  assert(lower.includes("not universal") || lower.includes("no valores por defecto universales"), `${name} docs must reject universal statutory defaults`);
}

assert(packageJson.scripts?.["check:privacy-retention-policy"] === "node scripts/privacy-retention-policy-check.mjs", "retention static gate must be registered");
assert(packageJson.scripts?.["test:privacy-retention-policy"] === "tsx tests/privacy-retention-policy.ts", "retention unit test must be registered");
assert(packageJson.scripts?.verify?.includes("check:privacy-retention-policy"), "retention static gate must be part of verify");
assert(packageJson.scripts?.verify?.includes("test:privacy-retention-policy"), "retention unit test must be part of verify");

console.log("Privacy retention registry, legal-boundary documentation and fail-closed expiry invariants passed.");
