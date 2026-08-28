import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const exists = (file) => fs.existsSync(path.join(root, file));
const assert = (condition, message) => {
  if (!condition) throw new Error(`Upgrade/deprecation policy invariant failed: ${message}`);
};

const requiredDocs = [
  "docs/UPGRADES.md",
  "docs/UPGRADES.es.md",
  "docs/DEPRECATIONS.md",
  "docs/DEPRECATIONS.es.md"
];

for (const file of requiredDocs) assert(exists(file), `missing ${file}`);

const packageJson = JSON.parse(read("package.json"));
const releaseCheck = read("scripts/release-check.mjs");
const upgrades = read("docs/UPGRADES.md");
const upgradesEs = read("docs/UPGRADES.es.md");
const deprecations = read("docs/DEPRECATIONS.md");
const deprecationsEs = read("docs/DEPRECATIONS.es.md");
const releases = read("docs/RELEASES.md");
const migrations = read("docs/MIGRATIONS.md");
const compatibility = read("docs/EXTENSION-COMPATIBILITY.md");
const support = read("SUPPORT.md");
const contributing = read("CONTRIBUTING.md");
const readme = read("README.md");
const readmeEs = read("README.es.md");
const roadmap = read("ROADMAP.md");
const roadmapEs = read("ROADMAP.es.md");
const changelog = read("CHANGELOG.md");
const workflow = read(".github/workflows/upgrade-deprecations.yml");

assert(
  packageJson.scripts?.["check:upgrade-deprecations"] === "node scripts/upgrade-deprecation-check.mjs",
  "package.json must expose check:upgrade-deprecations"
);
assert(
  packageJson.scripts?.verify?.includes("check:upgrade-deprecations"),
  "check:upgrade-deprecations must remain part of npm run verify"
);

for (const file of requiredDocs) {
  assert(releaseCheck.includes(`\"${file}\"`), `release-check.mjs must require ${file}`);
}

assert(upgrades.includes("latest stable release in the current major"), "upgrade policy must define primary supported target");
assert(upgrades.includes("skipping a major version is **not guaranteed**"), "upgrade policy must define skip-major behavior");
assert(upgrades.includes("best-effort") && upgrades.includes("LTS"), "upgrade policy must define support/backport expectations");
assert(upgrades.includes("npm run check:upgrade-deprecations") && upgrades.includes("npm run verify"), "upgrade procedure must include permanent validation");
assert(upgrades.includes("MIGRATIONS.md") && upgrades.includes("DEPRECATIONS.md"), "upgrade policy must integrate migration/deprecation policies");
assert(upgrades.includes("application-only rollback") && upgrades.includes("forward-only recovery"), "upgrade policy must classify recovery");
assert(upgrades.includes("Never describe an upgrade only as “latest”"), "upgrade identity must use immutable versions/SHAs");

assert(upgradesEs.includes("última release estable del major actual"), "Spanish upgrade policy must define primary supported target");
assert(upgradesEs.includes("saltar un major **no está garantizado**"), "Spanish upgrade policy must define skip-major behavior");
assert(upgradesEs.includes("best-effort") && upgradesEs.includes("LTS"), "Spanish upgrade policy must define support/backport expectations");
assert(upgradesEs.includes("check:upgrade-deprecations") && upgradesEs.includes("MIGRATIONS.es.md"), "Spanish upgrade policy must integrate validation/migrations");

assert(deprecations.includes("ACTIVE → DEPRECATED → REMOVED"), "deprecation lifecycle must be explicit");
assert(deprecations.includes("only in a **MAJOR** release"), "ordinary public removal must be major-only");
assert(deprecations.includes("earliest release where ordinary removal may occur"), "deprecation notice must declare earliest removal");
assert(deprecations.includes("replacement or migration destination"), "deprecation notice must identify replacement");
assert(deprecations.includes("Security exception"), "deprecation policy must define security exception");
assert(deprecations.includes("must not contain") && deprecations.includes("passwords, API keys or tokens"), "deprecation warnings must protect secrets");
assert(deprecations.includes("Deprecated") && deprecations.includes("Removed"), "CHANGELOG lifecycle categories must be required");
assert(deprecations.includes("expand → migrate/backfill → stop old writes → verify → contract/remove"), "persistent-data deprecation ordering must be documented");

assert(deprecationsEs.includes("ACTIVE → DEPRECATED → REMOVED"), "Spanish deprecation lifecycle must be explicit");
assert(deprecationsEs.includes("únicamente en una release **MAJOR**"), "Spanish ordinary removal must be major-only");
assert(deprecationsEs.includes("Excepción de seguridad"), "Spanish deprecation policy must define security exception");
assert(deprecationsEs.includes("Deprecated") && deprecationsEs.includes("Removed"), "Spanish CHANGELOG lifecycle categories must be required");

assert(releases.includes("UPGRADES.md") && releases.includes("DEPRECATIONS.md"), "release policy must link upgrade/deprecation lifecycle");
assert(migrations.includes("UPGRADES.md") && migrations.includes("DEPRECATIONS.md"), "migration policy must link upgrade/deprecation lifecycle");
assert(compatibility.includes("DEPRECATIONS.md"), "extension compatibility must defer removal lifecycle to deprecation policy");
assert(support.includes("latest stable release in the current major") && support.includes("no guaranteed LTS"), "SUPPORT must state public support baseline");
assert(contributing.includes("Upgrade and deprecation impact"), "CONTRIBUTING must require upgrade/deprecation classification");
assert(contributing.includes("docs/UPGRADES.md") && contributing.includes("docs/DEPRECATIONS.md"), "CONTRIBUTING must link lifecycle policies");

for (const [name, source] of [
  ["README", readme],
  ["README.es", readmeEs],
  ["ROADMAP", roadmap],
  ["ROADMAP.es", roadmapEs]
]) {
  assert(source.includes("UPGRADES") && source.includes("DEPRECATIONS"), `${name} must link upgrade/deprecation policies`);
}

assert(changelog.includes("Phase 10.5"), "CHANGELOG must record Phase 10.5");
assert(workflow.includes("Upgrade and deprecation lifecycle gate"), "dedicated workflow must run lifecycle gate");
assert(workflow.includes("npm run check:upgrade-deprecations"), "dedicated workflow must execute check:upgrade-deprecations");
assert(workflow.includes("npm run check:release-migrations"), "dedicated workflow must preserve release/migration validation");
assert(workflow.includes("npm run check:extension-contracts"), "dedicated workflow must preserve extension compatibility validation");

console.log("Upgrade and deprecation lifecycle invariants passed.");
