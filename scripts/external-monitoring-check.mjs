import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const assert = (condition, message) => {
  if (!condition) throw new Error(`External monitoring invariant failed: ${message}`);
};

const live = read("app/api/health/live/route.ts");
const monitor = read("app/api/health/monitor/route.ts");
const routing = read("lib/alert-routing.ts");
const failureReporting = read("lib/failure-reporting.ts");
const test = read("tests/external-monitoring.ts");
const docs = read("docs/EXTERNAL-MONITORING.md");
const docsEs = read("docs/EXTERNAL-MONITORING.es.md");
const packageJson = JSON.parse(read("package.json"));

for (const [name, route] of [["liveness", live], ["external monitor", monitor]]) {
  assert(route.includes('"X-OTP-Health-Contract-Version"'), `${name} must expose an explicit health contract version`);
  assert(route.includes('"Cache-Control": "no-store, max-age=0"'), `${name} must disable caching`);
  assert(route.includes('"X-Content-Type-Options": "nosniff"'), `${name} must send nosniff`);
  assert(route.includes("correlationHeaders"), `${name} must propagate safe request correlation`);
}

assert(!live.includes("getProductionReadiness"), "liveness must not depend on readiness or external infrastructure");
assert(monitor.includes("getProductionReadiness"), "external monitor endpoint must reflect the readiness contract");
assert(monitor.includes('status: readiness.ready ? "ok" : "degraded"'), "external monitor must map readiness to a stable minimal status");
assert(!monitor.includes("checks:"), "external monitor response must not expose internal readiness checks");
assert(!monitor.includes("profile:"), "external monitor response must not expose deployment profile");

for (const route of ["availability", "payments", "integrations", "platform"]) {
  assert(routing.includes(`"${route}"`), `routing policy must define ${route}`);
}
for (const runbook of ["availability-health", "payment-processing", "integration-delivery", "platform-operations"]) {
  assert(routing.includes(`"${runbook}"`), `routing policy must define ${runbook}`);
}
assert(routing.includes('if (severity === "critical") return "page"'), "critical failures must page");
assert(routing.includes('if (severity === "error") return "urgent"'), "error failures must be urgent");
assert(failureReporting.includes("getOperationalAlertRouting"), "failure reporting must apply centralized routing");
for (const field of ["alertRoute", "runbook", "escalation"]) {
  assert(failureReporting.includes(`"${field}"`), `failure transport allowlist must include ${field}`);
}
assert(failureReporting.includes("...input.fields") && failureReporting.indexOf("...input.fields") < failureReporting.indexOf("alertRoute: routing.route"), "central routing must override caller-supplied routing fields");

assert(test.includes("external monitoring must not disclose readiness internals"), "dynamic test must prove readiness internals are not disclosed");
assert(test.includes("callers must not override central alert routing"), "dynamic test must prove routing cannot be caller-overridden");
assert(test.includes("live readiness failure must be externally detectable"), "dynamic test must prove degraded readiness returns failure status");

assert(packageJson.scripts?.["check:external-monitoring"] === "node scripts/external-monitoring-check.mjs", "static monitoring check must be registered");
assert(packageJson.scripts?.["test:external-monitoring"] === "tsx tests/external-monitoring.ts", "dynamic monitoring test must be registered");
assert(packageJson.scripts?.verify?.includes("check:external-monitoring"), "monitoring invariant must be part of verify");

for (const [name, text] of [["English", docs], ["Spanish", docsEs]]) {
  const lower = text.toLowerCase();
  assert(text.includes("/api/health/live"), `${name} docs must document liveness monitoring`);
  assert(text.includes("/api/health/monitor"), `${name} docs must document external readiness monitoring`);
  assert(lower.includes("failuretransport") || lower.includes("failure transport"), `${name} docs must explain the internal failure channel`);
  assert(lower.includes("independent") || lower.includes("independiente"), `${name} docs must require independent external polling`);
  assert(lower.includes("runbook"), `${name} docs must document runbook routing`);
  assert(lower.includes("availability") && lower.includes("payments") && lower.includes("integrations"), `${name} docs must document alert routes`);
}

console.log("External monitoring and actionable alert-routing invariants passed.");
