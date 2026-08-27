import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const assert = (condition, message) => {
  if (!condition) throw new Error(`Privacy-rights invariant failed: ${message}`);
};

const rights = read("lib/privacy-rights.ts");
const inventory = read("lib/privacy-data-inventory.ts");
const customerActions = read("app/account/privacy/actions.ts");
const customerPage = read("app/account/privacy/page.tsx");
const adminActions = read("app/operator/privacy/actions.ts");
const adminPage = read("app/operator/privacy/page.tsx");
const test = read("tests/mongodb-privacy-rights.ts");
const docs = read("docs/PRIVACY-RIGHTS.md");
const docsEs = read("docs/PRIVACY-RIGHTS.es.md");
const packageJson = JSON.parse(read("package.json"));

for (const right of ["access", "rectification", "erasure", "restriction", "objection", "portability"]) {
  assert(rights.includes(`\"${right}\"`), `rights lifecycle must include ${right}`);
  assert(customerPage.includes(`${right}:`), `customer UI must label ${right}`);
}

assert(rights.includes("privacyRequestDueAt") && rights.includes("addUtcCalendarMonths(receivedAt, 1)"), "initial response deadline must be one calendar month");
assert(rights.includes("1 + input.extendByMonths"), "deadline extension must remain bounded to one or two additional calendar months");
assert(rights.includes('name: "privacy_request_open_unique"'), "one-open-request-per-right guard must be enforced by MongoDB");
assert(rights.includes("session.withTransaction"), "privacy request/audit writes must be transactional");
assert(rights.includes("PRIVACY_RETENTION_REVIEW_REQUIRED"), "erasure completion must fail closed until retention review resolves");
assert(rights.includes("PRIVACY_RETENTION_REASON_REQUIRED"), "retention holds must require a structured reason");
assert(rights.includes("PRIVACY_OUTCOME_REQUIRED"), "staff closure must require a structured outcome");
assert(rights.includes("PRIVACY_REQUEST_TERMINAL"), "terminal cases must reject further mutation");
assert(!rights.includes("deleteMany({ identityId"), "Phase 9D-1 must not implement automatic personal-data erasure");

assert(customerActions.includes("requireCustomerIdentity"), "customer privacy mutations must require authenticated customer identity");
assert(adminActions.includes("requireAdminIdentity"), "privacy review mutations must remain Admin-only");
assert(adminPage.includes("requireAdminIdentity"), "privacy operations console must remain Admin-only");
assert(customerPage.includes("listPrivacyRequestsForCustomer(identity.id)"), "customer history must remain identity-scoped");

for (const boundary of [
  "customer-account",
  "customer-sessions",
  "authentication-audit",
  "trip-reservations",
  "service-reservations",
  "payment-ledger",
  "protected-traveller-data",
  "operations-audit",
  "privacy-rights-case"
]) {
  assert(inventory.includes(`id: \"${boundary}\"`), `technical privacy inventory must include ${boundary}`);
}
assert(inventory.includes("Password hashes") && inventory.includes("token hashes"), "inventory must separate profile data from credential/session security material");
assert(inventory.includes("not a declaration of legal basis"), "technical inventory must not pretend to choose legal basis");

for (const evidence of [
  "one-calendar-month deadlines must clamp safely at month end",
  "PRIVACY_REQUEST_ALREADY_OPEN",
  "PRIVACY_RETENTION_REVIEW_REQUIRED",
  "privacy request creation must roll back when its audit write fails",
  "privacy case storage must not duplicate protected/security field"
]) {
  assert(test.includes(evidence), `MongoDB privacy test must prove: ${evidence}`);
}

for (const [name, text] of [["English", docs], ["Spanish", docsEs]]) {
  const lower = text.toLowerCase();
  assert(lower.includes("eur-lex.europa.eu/eli/reg/2016/679/oj"), `${name} docs must reference the official GDPR source`);
  assert(lower.includes("aepd.es/derechos-y-deberes/ejerce-tus-derechos"), `${name} docs must reference AEPD rights guidance`);
  assert(lower.includes("not a legal-compliance certification") || lower.includes("no constituye una certificación de cumplimiento"), `${name} docs must avoid claiming legal certification`);
  assert(lower.includes("phase 9d-1 never hard-deletes") || lower.includes("fase 9d-1 nunca elimina"), `${name} docs must preserve the no-automatic-erasure boundary`);
}

assert(packageJson.scripts?.["check:privacy-rights"] === "node scripts/privacy-rights-check.mjs", "privacy static gate must be registered");
assert(packageJson.scripts?.["test:mongodb-privacy-rights"] === "tsx tests/mongodb-privacy-rights.ts", "privacy MongoDB test must be registered");
assert(packageJson.scripts?.verify?.includes("check:privacy-rights"), "privacy invariant must be part of verify");

console.log("Privacy-rights request, minimisation and retention-review invariants passed.");
