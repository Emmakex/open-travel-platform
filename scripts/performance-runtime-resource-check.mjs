import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const assert = (condition, message) => {
  if (!condition) throw new Error(`Runtime resource invariant failed: ${message}`);
};

const packageJson = JSON.parse(read("package.json"));
const test = read("tests/performance-runtime-resource-baseline.ts");
const workflow = read(".github/workflows/performance-runtime-resource.yml");
const docs = read("docs/PERFORMANCE-RUNTIME-RESOURCE.md");
const docsEs = read("docs/PERFORMANCE-RUNTIME-RESOURCE.es.md");

assert(packageJson.scripts?.["test:performance-runtime-resource"] === "tsx tests/performance-runtime-resource-baseline.ts", "package script must expose the runtime resource baseline");
assert(packageJson.scripts?.["check:performance-runtime-resource"] === "node scripts/performance-runtime-resource-check.mjs", "package script must expose the runtime resource invariant gate");

for (const evidence of [
  "spawn(process.execPath",
  'process.platform !== "linux"',
  'readFileSync(`/proc/${pid}/status`',
  'readdirSync(`/proc/${pid}/fd`)',
  "VmRSS",
  "VmHWM",
  "Threads",
  "SUSTAINED_REQUESTS = 240",
  "SUSTAINED_CONCURRENCY = 12",
  "SPIKE_REQUESTS = 320",
  "SPIKE_CONCURRENCY = 32",
  "RSS_GROWTH_BUDGET_MB",
  "FD_GROWTH_BUDGET",
  "POST_FD_GROWTH_BUDGET",
  "THREAD_GROWTH_BUDGET",
  "postLoadLiveness",
  "serverSurvivedSpike",
  'method: "GET"',
  'redirect: "manual"',
  'response.status === 200'
]) assert(test.includes(evidence), `test must preserve: ${evidence}`);
assert(!test.includes('method: "POST"'), "runtime resource load must remain read-only");
assert(test.includes('"127.0.0.1"') && test.includes("PERFORMANCE_RESOURCE_PORT"), "test must bind only to local loopback");

for (const evidence of [
  "name: Runtime resource performance baseline",
  "runs-on: ubuntu-24.04",
  "mongo:8.0.29",
  "npm run check:performance-runtime-resource",
  "npm run test:e2e:seed",
  "npm run typecheck",
  "npm run build",
  "npm run test:performance-runtime-resource",
  "ktravel_ci_runtime_resource_"
]) assert(workflow.includes(evidence), `workflow must preserve: ${evidence}`);

for (const [name, text] of [["English", docs], ["Spanish", docsEs]]) {
  const lower = text.toLowerCase();
  assert(lower.includes("9d-5.4"), `${name} docs must identify Phase 9D-5.4`);
  assert(lower.includes("rss"), `${name} docs must document RSS observation`);
  assert(lower.includes("file descriptor") || lower.includes("descriptores de archivo"), `${name} docs must document file-descriptor observation`);
  assert(lower.includes("spike") || lower.includes("pico"), `${name} docs must document bounded spike behavior`);
  assert(lower.includes("not production slo") || lower.includes("no son slo") || lower.includes("no es un slo"), `${name} docs must distinguish CI budgets from production SLOs`);
  assert(lower.includes("production") || lower.includes("producción"), `${name} docs must include production capacity follow-up guidance`);
}

console.log("Runtime resource performance invariants passed.");
