import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const assert = (condition, message) => {
  if (!condition) throw new Error(`Performance/load invariant failed: ${message}`);
};

const packageJson = JSON.parse(read("package.json"));
const test = read("tests/performance-http-baseline.ts");
const workflow = read(".github/workflows/performance-load.yml");
const docs = read("docs/PERFORMANCE-LOAD-READINESS.md");
const docsEs = read("docs/PERFORMANCE-LOAD-READINESS.es.md");

assert(packageJson.scripts?.["test:performance-load"] === "tsx tests/performance-http-baseline.ts", "package script must expose the HTTP performance baseline");
assert(packageJson.scripts?.["check:performance-load"] === "node scripts/performance-load-check.mjs", "package script must expose the performance invariant gate");

for (const evidence of [
  'method: "GET"',
  'path: "/api/health/live"',
  'path: "/"',
  'path: "/trips/barcelona-city-break/book"',
  'path: "/account/sign-in"',
  'path: "/operator/sign-in"',
  "p50Ms",
  "p95Ms",
  "p99Ms",
  "requestsPerSecond",
  "AbortSignal.timeout(8_000)",
  "local disposable application server"
]) {
  assert(test.includes(evidence), `baseline test must include: ${evidence}`);
}
assert(!test.includes('method: "POST"'), "baseline must remain read-only and must not load-test mutations in shared CI");
assert(test.includes("result.failures > 0"), "unexpected responses must fail the baseline");
assert(test.includes("result.p95Ms > scenario.p95BudgetMs"), "p95 budget must be enforced per scenario");

for (const evidence of [
  "name: Performance load baseline",
  "mongo:8.0.29",
  "npm run test:e2e:seed",
  "npm run check:performance-load",
  "npm run typecheck",
  "npm run build",
  "npm run test:performance-load",
  "PERFORMANCE_BASE_URL: http://127.0.0.1:3000",
  "KTRAVEL_DEPLOYMENT_PROFILE: demo"
]) {
  assert(workflow.includes(evidence), `workflow must include: ${evidence}`);
}
assert(workflow.includes("ktravel_ci_performance_"), "performance workflow must use a CI-only disposable MongoDB database");
assert(workflow.includes("curl --fail --silent http://127.0.0.1:3000/api/health/live"), "workflow must wait for local liveness before load generation");

for (const [name, text] of [["English", docs], ["Spanish", docsEs]]) {
  const lower = text.toLowerCase();
  assert(lower.includes("9d-5"), `${name} docs must identify the Phase 9D-5 scope`);
  assert(lower.includes("p50") && lower.includes("p95") && lower.includes("p99"), `${name} docs must explain percentile output`);
  assert(lower.includes("ci") && (lower.includes("slo") || lower.includes("production")), `${name} docs must distinguish CI baselines from production capacity/SLOs`);
  assert(lower.includes("read-only") || lower.includes("solo lectura"), `${name} docs must document the non-mutating baseline boundary`);
}

console.log("Performance/load baseline invariants passed.");
