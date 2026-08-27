import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const assert = (condition, message) => {
  if (!condition) throw new Error(`Privileged audit invariant failed: ${message}`);
};

const payments = read("lib/payment-provider-config.ts");
const integrations = read("lib/integration-endpoints.ts");
const staffPermissions = read("lib/staff-permissions.ts");
const test = read("tests/mongodb-privileged-audit.ts");
const docs = read("docs/PRIVILEGED-AUDIT.md");
const docsEs = read("docs/PRIVILEGED-AUDIT.es.md");
const packageJson = JSON.parse(read("package.json"));

for (const [name, source] of [
  ["payment provider settings", payments],
  ["integration endpoints", integrations],
  ["staff capability assignments", staffPermissions]
]) {
  assert(source.includes("startSession()"), `${name} must start a MongoDB session`);
  assert(source.includes("withTransaction"), `${name} must commit mutation and audit transactionally`);
}

assert(payments.includes('replaceOne({ provider: "stripe" }, next, { upsert: true, session })'), "Stripe settings mutation must use the audit transaction session");
assert(payments.includes('replaceOne({ provider: "redsys" }, next, { upsert: true, session })'), "Redsys settings mutation must use the audit transaction session");
assert((payments.match(/audit\.insertOne\(/g) ?? []).length >= 2, "payment provider mutations must persist audit events");
assert((payments.match(/\{ session \}/g) ?? []).length >= 2, "payment provider audit writes must share the transaction session");

assert(integrations.includes("replaceOne({ id }, next, { upsert: true, session })"), "integration create/update must use the audit transaction session");
assert(integrations.includes("deleteOne({ id: current.id }, { session })"), "integration deletion must use the audit transaction session");
assert((integrations.match(/audit\.insertOne\(/g) ?? []).length >= 2, "integration mutations must persist audit events");
assert((integrations.match(/\{ session \}/g) ?? []).length >= 4, "integration mutation and audit writes must share sessions");

assert(staffPermissions.includes("assignments.updateOne("), "staff capability updates must remain explicit");
assert(staffPermissions.includes("assignments.deleteOne({ userId }, { session })"), "staff capability removal must remain transactional");
assert(staffPermissions.includes("audit.insertOne("), "staff capability changes must remain audited");

assert(test.includes("payment settings must roll back when audit persistence fails"), "dynamic test must prove payment rollback on audit failure");
assert(test.includes("integration endpoint deletion must roll back when audit persistence fails"), "dynamic test must prove integration rollback on audit failure");
assert(packageJson.scripts?.["check:privileged-audit"] === "node scripts/privileged-audit-check.mjs", "privileged audit check must be registered");
assert(packageJson.scripts?.["test:mongodb-privileged-audit"] === "tsx tests/mongodb-privileged-audit.ts", "MongoDB privileged audit test must be registered");
assert(packageJson.scripts?.verify?.includes("check:privileged-audit"), "privileged audit invariant must be part of verify");

for (const [name, text] of [["English", docs], ["Spanish", docsEs]]) {
  const lower = text.toLowerCase();
  assert(lower.includes("fail-closed") || lower.includes("fail closed"), `${name} docs must define fail-closed audit semantics`);
  assert(lower.includes("payment") || lower.includes("pago"), `${name} docs must cover payment settings`);
  assert(lower.includes("integration") || lower.includes("integración"), `${name} docs must cover integration endpoints`);
  assert(lower.includes("capabil") || lower.includes("permiso"), `${name} docs must cover staff capabilities`);
  assert(lower.includes("secret") || lower.includes("clave"), `${name} docs must state that secrets are excluded from audit records`);
}

console.log("Privileged audit fail-closed invariants passed.");
