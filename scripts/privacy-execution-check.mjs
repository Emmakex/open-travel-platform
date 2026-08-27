import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const assert = (condition, message) => {
  if (!condition) throw new Error(`Privacy-execution invariant failed: ${message}`);
};

const execution = read("lib/privacy-execution.ts");
const exportSource = read("lib/privacy-export.ts");
const erasureRunner = read("lib/privacy-erasure-runner.ts");
const secondary = read("lib/privacy-erasure-secondary.ts");
const executionView = read("lib/privacy-execution-view.ts");
const route = read("app/api/account/privacy/requests/[id]/export/route.ts");
const customerPage = read("app/account/privacy/page.tsx");
const operatorActions = read("app/operator/privacy/execution-actions.ts");
const operatorPage = read("app/operator/privacy/page.tsx");
const test = read("tests/mongodb-privacy-execution.ts");
const docs = read("docs/PRIVACY-EXECUTION.md");
const docsEs = read("docs/PRIVACY-EXECUTION.es.md");
const packageJson = JSON.parse(read("package.json"));

assert(execution.includes('request.status !== "action-pending"'), "all executable privacy operations must require action-pending status");
assert(execution.includes('request.type !== "access" && request.type !== "portability"'), "export approval must apply only to access/portability");
assert(execution.includes('request.retentionState !== "clear"'), "erasure must fail closed unless retention review is clear");
assert(execution.includes('status: "disabled"'), "restriction/erasure must disable the customer account");
assert(execution.includes("deleteMany({ userId: request.identityId }"), "restriction/erasure must revoke persisted customer sessions");
assert(execution.includes("PRIVACY_EXECUTION_REQUIRES_OFFLINE_MIGRATION"), "online erasure must be bounded and fail to an offline migration path for oversized accounts");

for (const forbidden of ["passwordHash", "passwordSalt", "tokenHash"]) {
  const safeAccountBody = exportSource.slice(exportSource.indexOf("function safeAccount"), exportSource.indexOf("function tripForAccess"));
  assert(!safeAccountBody.includes(forbidden), `customer export must not expose ${forbidden}`);
}
assert(exportSource.includes("machineReadable: true"), "portability/access output must be marked machine-readable");
assert(exportSource.includes("PRIVACY_EXPORT_PROTECTED_DATA_UNAVAILABLE"), "protected traveller export must fail closed when the keyring is unavailable");
assert(exportSource.includes("portability || targetIds.length === 0"), "portability must exclude payment/accounting movements");

assert(route.includes("requireCustomerIdentity"), "privacy export route must require customer authentication");
assert(route.includes('"Cache-Control": "private, no-store, max-age=0"'), "privacy export route must be non-cacheable");
assert(route.includes("Content-Disposition"), "privacy export route must return a download attachment");
assert(customerPage.includes("execution?.exportApproved"), "customer download UI must appear only after staff release approval");
assert(executionView.includes("exportApprovedAt"), "customer execution projection must expose only bounded release state");

assert(operatorActions.includes('value(formData, "confirm") !== "erase"'), "erasure action must require explicit confirmation");
assert(operatorActions.includes('value(formData, "confirm") !== "restrict"'), "restriction action must require explicit confirmation");
assert(operatorPage.includes("approvePrivacyExportAction"), "operator UI must expose explicit export release approval");
assert(operatorPage.includes("executePrivacyErasureAction"), "operator UI must expose controlled erasure execution");

assert(erasureRunner.includes("existing?.erasureAppliedAt && existing.erasurePseudonym"), "erasure retries must reuse persisted execution state");
assert(erasureRunner.includes("eraseSecondaryIdentityLinks"), "erasure must converge secondary identity-link cleanup");
assert(secondary.includes("authAuditCollectionName"), "secondary cleanup must cover authentication audit linkage");
assert(secondary.includes("privacyRequestCollectionName"), "secondary cleanup must pseudonymise privacy-case linkage");
assert(secondary.includes("integrationEventCollectionName"), "secondary cleanup must remove customer integration-event copies");
assert(secondary.includes('targetType: "customer"'), "secondary cleanup must pseudonymise customer-targeted operational tasks");

for (const evidence of [
  "PRIVACY_EXPORT_NOT_APPROVED",
  "portability must exclude payment/accounting history",
  "restriction must suspend account processing access",
  "PRIVACY_ERASURE_RETENTION_BLOCK",
  "erasure retry must converge to the persisted pseudonym"
]) {
  assert(test.includes(evidence), `MongoDB privacy-execution test must prove: ${evidence}`);
}

for (const [name, text] of [["English", docs], ["Spanish", docsEs]]) {
  const lower = text.toLowerCase();
  assert(lower.includes("eur-lex.europa.eu/eli/reg/2016/679/oj"), `${name} docs must reference the official GDPR source`);
  assert(lower.includes("aepd.es"), `${name} docs must reference official AEPD guidance`);
  assert(lower.includes("json"), `${name} docs must document the machine-readable export format`);
  assert(lower.includes("retention") || lower.includes("retención"), `${name} docs must preserve the retention-review boundary`);
  assert(lower.includes("not legal advice") || lower.includes("no es asesoramiento jurídico"), `${name} docs must avoid claiming legal certification`);
}

assert(packageJson.scripts?.["check:privacy-execution"] === "node scripts/privacy-execution-check.mjs", "privacy-execution static gate must be registered");
assert(packageJson.scripts?.["test:mongodb-privacy-execution"] === "tsx tests/mongodb-privacy-execution.ts", "privacy-execution MongoDB test must be registered");
assert(packageJson.scripts?.verify?.includes("check:privacy-execution"), "privacy-execution invariant must be part of verify");

console.log("Privacy export, restriction, erasure and retry-safety invariants passed.");
