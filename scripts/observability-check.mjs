import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const assert = (condition, message) => {
  if (!condition) throw new Error(`Observability invariant failed: ${message}`);
};

const packageJson = JSON.parse(read("package.json"));
const observability = read("lib/observability.ts");
const test = read("tests/observability.ts");
const worker = read("app/api/internal/integrations/process/route.ts");
const stripe = read("app/api/payments/stripe/webhook/route.ts");
const redsys = read("app/api/payments/redsys/notify/route.ts");
const readiness = read("app/api/health/ready/route.ts");
const workflow = read(".github/workflows/ci.yml");
const docs = read("docs/OBSERVABILITY.md");
const docsEs = read("docs/OBSERVABILITY.es.md");

assert(packageJson.scripts?.["test:observability"] === "tsx tests/observability.ts", "dynamic observability test script must exist");
assert(packageJson.scripts?.["check:observability"] === "node scripts/observability-check.mjs", "static observability check script must exist");
assert(packageJson.scripts?.verify?.includes("check:observability"), "observability invariant must be part of verify");

assert(observability.includes('schemaVersion = 1'), "structured log schema must be versioned");
assert(observability.includes('serviceName = "open-travel-platform"'), "structured logs must identify the service");
assert(observability.includes('requestIdPattern'), "request correlation IDs must be validated");
assert(observability.includes('randomUUID'), "unsafe/missing request IDs must be replaced server-side");
assert(observability.includes('sensitiveKeyPattern'), "logger must retain a central sensitive-key denylist");
for (const sensitiveToken of ["authorization", "password", "secret", "signature", "email", "passport", "health", "traveller", "raw", "payload", "card", "customer", "reference"]) {
  assert(observability.includes(sensitiveToken), `sensitive-key policy must cover ${sensitiveToken}`);
}
assert(!observability.includes("error.message"), "generic operational logs must never serialize error.message");
assert(!observability.includes("error.stack"), "generic operational logs must never serialize error.stack");
assert(observability.includes("console.error(line)") && observability.includes("console.warn(line)") && observability.includes("console.info(line)"), "central logger must emit one JSON line to standard streams");
assert(observability.includes("Logging must never turn an operational failure into a secondary failure"), "logger must remain fail-safe");

for (const [name, route] of [
  ["integration worker", worker],
  ["Stripe webhook", stripe],
  ["Redsys notification", redsys],
  ["readiness", readiness]
]) {
  assert(route.includes("getRequestCorrelationId"), `${name} must derive a safe request correlation ID`);
  assert(route.includes("correlationHeaders"), `${name} must return X-Request-Id to callers`);
  assert(route.includes("emitOperationalLog"), `${name} must use the structured observability boundary`);
}
assert(!worker.includes("console.error("), "integration worker must not log raw Error objects directly");
assert(stripe.includes('event: "payment.webhook.failed"'), "Stripe failures must expose a normalized operational event");
assert(redsys.includes('event: "payment.notification.failed"'), "Redsys failures must expose a normalized operational event");
assert(readiness.includes('event: "health.readiness.not-ready"'), "not-ready state must be visible operationally");
assert(readiness.includes('event: "health.readiness.failed"'), "readiness exceptions must be visible operationally");

assert(test.includes("customer@example.test") && test.includes("secret-token-123"), "dynamic test must include realistic sensitive fixtures");
assert(test.includes("Sensitive value leaked into logs"), "dynamic test must assert sensitive values never reach output");
assert(test.includes("Error stacks must not be serialized"), "dynamic test must assert error stack redaction");
assert(test.includes("Each operational event must emit exactly one JSON line"), "dynamic test must protect one-line JSON output");

assert(workflow.includes("Observability invariant check"), "blocking CI must run observability invariant");
assert(workflow.includes("Structured observability test"), "blocking CI must run dynamic observability test");
assert(workflow.includes("npm run check:observability") && workflow.includes("npm run test:observability"), "CI must execute both observability gates");

assert(docs.includes("X-Request-Id"), "English observability docs must explain request correlation");
assert(docs.toLowerCase().includes("stdout/stderr"), "English observability docs must describe provider-neutral collection");
assert(docs.toLowerCase().includes("error") && docs.toLowerCase().includes("stack"), "English observability docs must document error redaction");
assert(docs.toLowerCase().includes("browser e2e") && docs.toLowerCase().includes("non-blocking"), "English docs must preserve browser E2E policy");

assert(docsEs.includes("X-Request-Id"), "Spanish observability docs must explain request correlation");
assert(docsEs.toLowerCase().includes("stdout/stderr"), "Spanish observability docs must describe provider-neutral collection");
assert(docsEs.toLowerCase().includes("error") && docsEs.toLowerCase().includes("stack"), "Spanish observability docs must document error redaction");
assert(
  docsEs.toLowerCase().includes("browser e2e") &&
    (docsEs.toLowerCase().includes("no bloqueante") || docsEs.toLowerCase().includes("non-blocking")),
  "Spanish docs must preserve browser E2E policy"
);

console.log("Structured operational observability invariants passed.");
