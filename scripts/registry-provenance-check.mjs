import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const exists = (file) => fs.existsSync(path.join(root, file));
const assert = (condition, message) => {
  if (!condition) throw new Error(`Registry/provenance invariant failed: ${message}`);
};

const requiredFiles = [
  ".github/workflows/publish-container.yml",
  ".github/workflows/registry-provenance.yml",
  "docs/REGISTRY.md",
  "docs/REGISTRY.es.md",
  "docs/CONTAINERS.md",
  "docs/CONTAINERS.es.md"
];
for (const file of requiredFiles) assert(exists(file), `missing ${file}`);

const workflow = read(".github/workflows/publish-container.yml");
const validationWorkflow = read(".github/workflows/registry-provenance.yml");
const docs = read("docs/REGISTRY.md");
const docsEs = read("docs/REGISTRY.es.md");
const containers = read("docs/CONTAINERS.md");
const containersEs = read("docs/CONTAINERS.es.md");
const packageJson = JSON.parse(read("package.json"));

for (const evidence of [
  'workflows: ["Publish audited release"]',
  "github.event.workflow_run.conclusion == 'success'",
  "github.event.workflow_run.head_branch == 'main'",
  "packages: write",
  "attestations: write",
  "id-token: write",
  "ghcr.io/${{ github.repository_owner }}/open-travel-platform",
  "TAG_COMMIT=",
  '"$TAG_COMMIT" != "$AUDITED_SHA"',
  '"$TAG" == "v1.1.0"',
  "type=raw,value=${{ steps.release.outputs.tag }}",
  "type=raw,value=sha-${{ env.AUDITED_SHA }}",
  "org.opencontainers.image.source=",
  "org.opencontainers.image.revision=",
  "org.opencontainers.image.version=",
  "org.opencontainers.image.licenses=MIT",
  "provenance: mode=max",
  "sbom: true",
  "subject-digest: ${{ steps.build.outputs.digest }}",
  "push-to-registry: true"
]) assert(workflow.includes(evidence), `publish workflow must preserve: ${evidence}`);

const pinnedActions = [
  "actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1",
  "docker/login-action@dbcb813823bdd20940b903addbd779551569679f",
  "docker/setup-buildx-action@37fe631027851001ddb9b187196cc803df7f5f0e",
  "docker/metadata-action@dc802804100637a589fabce1cb79ff13a1411302",
  "docker/build-push-action@53b7df96c91f9c12dcc8a07bcb9ccacbed38856a",
  "actions/attest@1e69f48acb82d1966a394da916b4c1698aa569d6"
];
for (const action of pinnedActions) assert(workflow.includes(action), `publish workflow must pin ${action}`);

for (const forbidden of [
  "type=raw,value=latest",
  "type=semver,pattern={{major}}",
  "type=semver,pattern={{major}}.{{minor}}",
  ":latest"
]) assert(!workflow.includes(forbidden), `moving image alias is forbidden: ${forbidden}`);

assert(packageJson.scripts?.["check:registry-provenance"] === "node scripts/registry-provenance-check.mjs", "package must expose check:registry-provenance");
assert(packageJson.scripts?.verify?.includes("check:registry-provenance"), "check:registry-provenance must remain inside npm run verify");

for (const evidence of [
  "name: Registry publication and provenance",
  "npm run check:registry-provenance"
]) assert(validationWorkflow.includes(evidence), `validation workflow must preserve: ${evidence}`);

for (const [name, text] of [["English", docs], ["Spanish", docsEs]]) {
  const lower = text.toLowerCase();
  assert(text.includes("ghcr.io"), `${name} registry guide must document GHCR`);
  assert(text.includes("@sha256:"), `${name} registry guide must document digest-pinned pulls`);
  assert(text.includes("gh attestation verify oci://"), `${name} registry guide must document attestation verification`);
  assert(lower.includes("sbom"), `${name} registry guide must document SBOM`);
  assert(lower.includes("provenance"), `${name} registry guide must document provenance`);
  assert(lower.includes("v1.1.0"), `${name} registry guide must explain historical v1.1.0 boundary`);
  assert(lower.includes("latest"), `${name} registry guide must explain moving-tag prohibition`);
  assert(lower.includes("kairoseth"), `${name} registry guide must preserve private/commercial boundary`);
}

for (const [name, text] of [["English", containers], ["Spanish", containersEs]]) {
  assert(text.includes("Phase 11.1"), `${name} container guide must retain Phase 11.1 identity`);
  assert(text.toLowerCase().includes("complete") || text.toLowerCase().includes("complet"), `${name} container guide must mark Phase 11.1 complete`);
  assert(text.includes("REGISTRY"), `${name} container guide must link registry publication guidance`);
}

console.log("Registry publication and provenance invariants passed.");
