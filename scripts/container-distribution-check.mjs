import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const exists = (file) => fs.existsSync(path.join(root, file));
const assert = (condition, message) => {
  if (!condition) throw new Error(`Container distribution invariant failed: ${message}`);
};

const requiredFiles = [
  "Dockerfile",
  ".dockerignore",
  "scripts/prepare-standalone.mjs",
  "docs/CONTAINERS.md",
  "docs/CONTAINERS.es.md",
  ".github/workflows/container-distribution.yml"
];
for (const file of requiredFiles) assert(exists(file), `missing ${file}`);

const dockerfile = read("Dockerfile");
const dockerignore = read(".dockerignore");
const packageJson = JSON.parse(read("package.json"));
const workflow = read(".github/workflows/container-distribution.yml");
const docs = read("docs/CONTAINERS.md");
const docsEs = read("docs/CONTAINERS.es.md");

for (const evidence of [
  "FROM node:24-bookworm-slim AS deps",
  "FROM node:24-bookworm-slim AS builder",
  "FROM node:24-bookworm-slim AS runtime",
  "npm ci --no-fund",
  "npm run build && npm run package:standalone",
  "/app/.next/standalone",
  "NODE_ENV=production",
  "HOSTNAME=0.0.0.0",
  "PORT=3000",
  "USER app",
  "EXPOSE 3000",
  "HEALTHCHECK",
  "/api/health/live",
  'CMD ["node", "server.js"]'
]) assert(dockerfile.includes(evidence), `Dockerfile must preserve: ${evidence}`);

assert(/useradd[^\n]*--uid 10001/.test(dockerfile), "runtime must create fixed non-root UID 10001");
assert(/groupadd[^\n]*--gid 10001/.test(dockerfile), "runtime must create fixed non-root GID 10001");
assert(dockerfile.indexOf("USER app") > dockerfile.indexOf("COPY --from=builder"), "USER app must apply to final runtime after copied assets");

const forbiddenDockerTokens = [
  "MONGODB_URI=",
  "SMTP_PASSWORD=",
  "PAYMENT_SECRETS_KEY=",
  "TRAVELLER_DATA_KEY=",
  "INTEGRATION_SECRETS_KEY=",
  "STRIPE_SECRET_KEY=",
  "REDSYS_SECRET_KEY=",
  "REST_BOOKING_BEARER_TOKEN=",
  "KTRAVEL_INTEGRATION_WORKER_TOKEN="
];
for (const token of forbiddenDockerTokens) {
  assert(!dockerfile.includes(token), `Dockerfile must not bake secret/config value ${token}`);
}

for (const pattern of [".env", ".env.*", "node_modules", ".next", ".git"]) {
  assert(dockerignore.includes(pattern), `.dockerignore must exclude ${pattern}`);
}
assert(dockerignore.includes("!.env.example"), ".dockerignore may retain the public production example");
assert(dockerignore.includes("!.env.demo.example"), ".dockerignore may retain the public demo example");

assert(packageJson.scripts?.["check:container"] === "node scripts/container-distribution-check.mjs", "package must expose check:container");
assert(packageJson.scripts?.verify?.includes("check:container"), "check:container must remain inside npm run verify");

for (const evidence of [
  "name: Container distribution",
  "docker build",
  "npm run check:container",
  "--env-file .env.demo.example",
  "127.0.0.1:3000:3000",
  "/api/health/live",
  "/media/barcelona-cover.svg",
  "docker inspect"
]) assert(workflow.includes(evidence), `container workflow must preserve: ${evidence}`);
assert(!workflow.includes("MONGODB_URI"), "container demo smoke must not require MongoDB");

for (const [name, text] of [["English", docs], ["Spanish", docsEs]]) {
  const lower = text.toLowerCase();
  assert(text.includes("docker build"), `${name} container guide must document image build`);
  assert(text.includes("docker run"), `${name} container guide must document runtime start`);
  assert(text.includes(".env.demo.example"), `${name} container guide must document infrastructure-free demo runtime`);
  assert(text.includes("/api/health/live"), `${name} container guide must document liveness`);
  assert(text.includes("/api/health/ready"), `${name} container guide must document readiness`);
  assert(lower.includes("non-root") || lower.includes("no-root"), `${name} container guide must document non-root runtime`);
  assert(lower.includes("runtime"), `${name} container guide must explain runtime configuration`);
  assert(lower.includes("provider-neutral"), `${name} container guide must preserve provider-neutral scope`);
  assert(lower.includes("registry"), `${name} container guide must state registry publication boundary`);
}

console.log("Container distribution invariants passed.");
