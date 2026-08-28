import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const assert = (condition, message) => {
  if (!condition) throw new Error(`Self-host invariant failed: ${message}`);
};

const packageJson = JSON.parse(read("package.json"));
const nextConfig = read("next.config.ts");
const prepare = read("scripts/prepare-standalone.mjs");
const workflow = read(".github/workflows/self-host-standalone.yml");
const deployment = read("docs/DEPLOYMENT.md");
const deploymentEs = read("docs/DEPLOYMENT.es.md");

assert(nextConfig.includes('output: "standalone"'), "Next.js must keep output: standalone");
assert(packageJson.scripts?.["package:standalone"] === "node scripts/prepare-standalone.mjs", "package must expose package:standalone");
assert(packageJson.scripts?.["check:self-host"] === "node scripts/self-host-standalone-check.mjs", "package must expose check:self-host");

for (const evidence of [
  '.next", "standalone"',
  '"server.js"',
  '.next", "static"',
  '"public"',
  "npm run build",
  "output: standalone"
]) assert(prepare.includes(evidence), `packager must preserve: ${evidence}`);

for (const evidence of [
  "name: Self-host standalone",
  "node-version: 24",
  "npm ci --no-fund",
  "npm run setup:demo",
  "npm run check:self-host",
  "npm run build",
  "npm run package:standalone",
  "node --env-file=.env.demo.example .next/standalone/server.js",
  "/api/health/live",
  "/media/barcelona-cover.svg"
]) assert(workflow.includes(evidence), `workflow must preserve: ${evidence}`);
assert(!workflow.includes("MONGODB_URI"), "standalone packaging smoke must not require MongoDB");

for (const [name, text] of [["English", deployment], ["Spanish", deploymentEs]]) {
  const lower = text.toLowerCase();
  assert(text.includes("npm ci"), `${name} deployment guide must use npm ci`);
  assert(text.includes("npm run package:standalone"), `${name} deployment guide must document standalone packaging`);
  assert(text.includes("node .next/standalone/server.js"), `${name} deployment guide must document the real standalone entrypoint`);
  assert(text.includes("/api/health/ready"), `${name} deployment guide must document readiness`);
  assert(lower.includes("reverse proxy") || lower.includes("proxy inverso"), `${name} deployment guide must document reverse proxy deployment`);
  assert(lower.includes("immutable" ) || lower.includes("inmutable"), `${name} deployment guide must recommend immutable releases`);
  assert(lower.includes("provider-neutral"), `${name} deployment guide must preserve provider-neutral scope`);
  assert(lower.includes("kairoseth"), `${name} deployment guide must clarify the Kairoseth reference boundary`);
}

console.log("Self-host standalone invariants passed.");
