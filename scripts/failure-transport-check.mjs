import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const assert = (condition, message) => {
  if (!condition) throw new Error(`Failure transport invariant failed: ${message}`);
};

const contract = read("repositories/failure-transport.ts");
const config = read("lib/failure-transport-config.ts");
const composition = read("lib/failure-transport.ts");
const reporting = read("lib/failure-reporting.ts");
const observability = read("lib/observability.ts");
const adapter = read("adapters/rest-failure-transport.ts");
const worker = read("app/api/internal/integrations/process/route.ts");
const stripe = read("app/api/payments/stripe/webhook/route.ts");
const redsys = read("app/api/payments/redsys/notify/route.ts");
const readiness = read("app/api/health/ready/route.ts");
const test = read("tests/failure-transport.ts");
const workflow = read(".github/workflows/ci.yml");
const envExample = read(".env.example");
const docs = read("docs/FAILURE-TRANSPORT.md");
const docsEs = read("docs/FAILURE-TRANSPORT.es.md");
const packageJson = JSON.parse(read("package.json"));

assert(contract.includes('"warning" | "error" | "critical"'), "failure severity contract must be explicit");
assert(contract.includes("fingerprint: string"), "failure contract must expose a grouping fingerprint");
assert(contract.includes("deliver(event: FailureTransportEvent): Promise<void>"), "provider-neutral FailureTransport interface must exist");

assert(config.includes('requestedMode === "rest" ? "rest" : "disabled"'), "failure transport must be disabled by default");
assert(config.includes("FAILURE_TRANSPORT_MODE") && config.includes("REST_FAILURE_TRANSPORT_URL"), "runtime mode and URL must be server-side configuration");
assert(config.includes('process.env.NODE_ENV === "production" && url.protocol !== "https:"'), "production failure transport must require HTTPS");
assert(config.includes("localDevelopmentTarget"), "HTTP must be limited to localhost development targets");
assert(config.includes("REST_FAILURE_TRANSPORT_BEARER_TOKEN"), "optional Bearer token must remain server-only");
assert(!config.includes("NEXT_PUBLIC_"), "failure transport config must not depend on public environment variables");
assert(config.includes("REST_FAILURE_TRANSPORT_TIMEOUT_MS") && config.includes("REST_FAILURE_TRANSPORT_MAX_RESPONSE_BYTES"), "transport timeout and response cap must be configurable and bounded");

assert(composition.includes("RestFailureTransport") && composition.includes("return null"), "composition must support disabled and REST modes");
assert(adapter.includes('failureTransportContractHeader = "X-OTP-Failure-Contract-Version"'), "REST transport must version its contract");
assert(adapter.includes('method: "POST"'), "REST transport must use POST");
assert(adapter.includes('cache: "no-store"'), "REST transport must disable caching");
assert(adapter.includes('redirect: "error"'), "REST transport must reject redirects");
assert(adapter.includes("AbortSignal.timeout"), "REST transport must enforce a timeout");
assert(adapter.includes("consumeBoundedResponse"), "REST transport must cap response bytes");
assert(!adapter.includes("for (let attempt") && !adapter.includes("transientStatuses"), "failure transport must not retry automatically");
assert(adapter.includes('headers.set("Authorization", `Bearer ${config.bearerToken}`)'), "REST transport must support server-only Bearer auth");

assert(reporting.includes('createHash("sha256")'), "failure grouping fingerprint must use SHA-256");
assert(reporting.includes("sanitizeOperationalFields") && reporting.includes("describeOperationalError"), "failure transport must reuse the structured-log sanitizer");
assert(reporting.includes("sanitizeOperationalCorrelationId"), "failure transport must independently revalidate correlation IDs");
assert(reporting.includes("failureFieldAllowlist") && reporting.includes("failureFieldAllowlist.has(key)"), "external failure fields must use an explicit allowlist");
for (const allowedField of ["provider", "reason", "eventType", "durationMs", "profile", "mode"]) {
  assert(reporting.includes(`"${allowedField}"`), `failure field allowlist must include ${allowedField}`);
}
assert(reporting.includes("safeOperationalToken(value)"), "allowlisted string values must still satisfy the safe-token grammar");
assert(reporting.includes("emitOperationalLog") && reporting.includes("getFailureTransport"), "central reporting must always keep local structured logging");
assert(reporting.includes('event: "observability.failure-transport.failed"'), "transport failures must remain visible locally");
assert(reporting.includes("return false"), "monitoring transport failures must be best-effort/non-throwing");

for (const sensitiveToken of ["amount", "currency", "price", "cost", "signature", "email", "passport", "customer", "reference", "raw", "payload"]) {
  assert(observability.includes(sensitiveToken), `shared privacy denylist must cover ${sensitiveToken}`);
}
assert(!observability.includes("error.message"), "shared sanitizer must not serialize exception messages");
assert(!observability.includes("error.stack"), "shared sanitizer must not serialize exception stacks");

for (const [name, route] of [
  ["integration worker", worker],
  ["Stripe webhook", stripe],
  ["Redsys notification", redsys],
  ["readiness", readiness]
]) {
  assert(route.includes("reportOperationalFailure"), `${name} must use the centralized failure boundary`);
}
assert(stripe.includes('reason: "invalid-signature"') && stripe.includes("logRejected"), "invalid Stripe signatures must remain local rejection logs");
assert(redsys.includes('reason: "invalid-signature"') && redsys.includes("logRejected"), "invalid Redsys signatures must remain local rejection logs");
assert(worker.includes('event: "integration.worker.failed"'), "integration worker failures must be externally visible when configured");
assert(readiness.includes('severity: "warning"') && readiness.includes('event: "health.readiness.not-ready"'), "degraded readiness must use warning severity");

assert(test.includes("createServer") && test.includes("127.0.0.1"), "dynamic validation must use real local HTTP transport");
assert(test.includes("customer@example.test") && test.includes("secret-token-123") && test.includes("P1234567"), "dynamic validation must exercise realistic sensitive fixtures");
assert(test.includes("safe-looking-but-not-allowlisted"), "dynamic validation must prove arbitrary fields cannot leave the core");
assert(test.includes("equivalent failures must share a stable grouping fingerprint"), "dynamic validation must protect fingerprint stability");
assert(test.includes("failure transport must not retry"), "dynamic validation must protect single-attempt delivery");
assert(test.includes("Sensitive value leaked into failure transport"), "dynamic validation must assert sensitive values never leave the core");

assert(packageJson.scripts?.["check:failure-transport"] === "node scripts/failure-transport-check.mjs", "static failure transport script must be registered");
assert(packageJson.scripts?.["test:failure-transport"] === "tsx tests/failure-transport.ts", "dynamic failure transport script must be registered");
assert(packageJson.scripts?.verify?.includes("check:failure-transport"), "failure transport invariant must be part of verify");
assert(workflow.includes("Failure transport invariant check") && workflow.includes("Failure transport integration test"), "blocking CI must contain both failure transport gates");
assert(workflow.includes("npm run check:failure-transport") && workflow.includes("npm run test:failure-transport"), "CI must execute both failure transport gates");

for (const variable of [
  "FAILURE_TRANSPORT_MODE",
  "REST_FAILURE_TRANSPORT_URL",
  "REST_FAILURE_TRANSPORT_BEARER_TOKEN",
  "REST_FAILURE_TRANSPORT_TIMEOUT_MS",
  "REST_FAILURE_TRANSPORT_MAX_RESPONSE_BYTES"
]) {
  assert(envExample.includes(variable), `.env.example must document ${variable}`);
}

for (const [name, text] of [["English", docs], ["Spanish", docsEs]]) {
  assert(text.includes("X-OTP-Failure-Contract-Version"), `${name} docs must document contract versioning`);
  assert(text.toLowerCase().includes("fingerprint"), `${name} docs must document grouping fingerprint semantics`);
  assert(text.toLowerCase().includes("allowlist"), `${name} docs must document strict outbound field allowlisting`);
  assert(text.toLowerCase().includes("no reintenta") || text.toLowerCase().includes("does not retry"), `${name} docs must document no-retry semantics`);
  assert(text.toLowerCase().includes("message") && text.toLowerCase().includes("stack"), `${name} docs must document exception redaction`);
  assert(text.toLowerCase().includes("best-effort"), `${name} docs must document non-authoritative delivery semantics`);
}

console.log("Centralized failure transport invariants passed.");
