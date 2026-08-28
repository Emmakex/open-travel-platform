import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const exists = (file) => fs.existsSync(path.join(root, file));
const assert = (condition, message) => {
  if (!condition) throw new Error(`Release/migration convention invariant failed: ${message}`);
};

const requiredDocs = [
  "docs/RELEASES.md",
  "docs/RELEASES.es.md",
  "docs/MIGRATIONS.md",
  "docs/MIGRATIONS.es.md"
];

for (const file of requiredDocs) assert(exists(file), `missing ${file}`);

const packageJson = JSON.parse(read("package.json"));
const releaseCheck = read("scripts/release-check.mjs");
const releases = read("docs/RELEASES.md");
const releasesEs = read("docs/RELEASES.es.md");
const migrations = read("docs/MIGRATIONS.md");
const migrationsEs = read("docs/MIGRATIONS.es.md");
const readme = read("README.md");
const readmeEs = read("README.es.md");
const roadmap = read("ROADMAP.md");
const roadmapEs = read("ROADMAP.es.md");
const contributing = read("CONTRIBUTING.md");
const changelog = read("CHANGELOG.md");
const workflow = read(".github/workflows/release-migrations.yml");

assert(
  packageJson.scripts?.["check:release-migrations"] === "node scripts/release-migration-check.mjs",
  "package.json must expose check:release-migrations"
);
assert(
  packageJson.scripts?.verify?.includes("check:release-migrations"),
  "check:release-migrations must remain part of npm run verify"
);

for (const file of requiredDocs) {
  assert(releaseCheck.includes(`\"${file}\"`), `release-check.mjs must require ${file}`);
}

assert(releases.includes("Semantic Versioning"), "release policy must name Semantic Versioning");
assert(releases.includes("vX.Y.Z"), "release policy must define vX.Y.Z Git tags");
assert(releases.includes("Tags are immutable"), "release policy must keep published tags immutable");
assert(releases.includes("npm ci") && releases.includes("npm run verify"), "release procedure must use locked install and full validation");
assert(releases.includes("package.json") && releases.includes("CHANGELOG.md"), "release identity must include package and changelog");
assert(releases.includes("merged to `main`") && releases.includes("Verify `main`"), "release must be cut from verified main");
assert(releases.includes("MIGRATIONS.md"), "release policy must require migration review");
assert(releases.includes("Rollback"), "release policy must define rollback behavior");

assert(releasesEs.includes("Semantic Versioning"), "Spanish release policy must name Semantic Versioning");
assert(releasesEs.includes("vX.Y.Z"), "Spanish release policy must define vX.Y.Z tags");
assert(releasesEs.includes("tags son inmutables"), "Spanish release policy must keep tags immutable");
assert(releasesEs.includes("npm ci") && releasesEs.includes("npm run verify"), "Spanish release procedure must use locked validation");
assert(releasesEs.includes("MIGRATIONS.es.md"), "Spanish release policy must require migration review");

assert(migrations.includes("expand → migrate → contract"), "migration policy must require expand/migrate/contract for compatible data evolution");
assert(migrations.includes("idempotent") && migrations.includes("resumable"), "migration policy must address retry/resume safety");
assert(migrations.includes("backup") && migrations.includes("Rollback and recovery"), "migration policy must define backup and recovery");
assert(migrations.includes("does **not** use hidden destructive migrations during application startup"), "destructive startup migrations must be prohibited");
assert(migrations.includes("MongoDB guidance"), "migration policy must cover MongoDB");
assert(migrations.includes("Payment and financial data"), "migration policy must protect financial history");
assert(migrations.includes("Protected Traveller Data"), "migration policy must cover protected Traveller Data");
assert(migrations.includes("EXTENSION-COMPATIBILITY.md"), "wire migrations must use extension compatibility rules");

assert(migrationsEs.includes("expand → migrate → contract"), "Spanish migration policy must require expand/migrate/contract");
assert(migrationsEs.includes("idempotente") && migrationsEs.includes("resumible"), "Spanish migration policy must address retry/resume safety");
assert(migrationsEs.includes("backup") && migrationsEs.includes("Rollback/recuperación"), "Spanish migration policy must define backup and recovery");
assert(migrationsEs.includes("no** ejecuta migraciones destructivas ocultas durante el startup") || migrationsEs.includes("**no** ejecuta migraciones destructivas ocultas durante el startup"), "Spanish policy must prohibit hidden destructive startup migrations");
assert(migrationsEs.includes("Traveller Data protegido"), "Spanish migration policy must cover protected Traveller Data");

for (const [name, source] of [
  ["README", readme],
  ["README.es", readmeEs],
  ["ROADMAP", roadmap],
  ["ROADMAP.es", roadmapEs]
]) {
  assert(source.includes("RELEASES") && source.includes("MIGRATIONS"), `${name} must link release and migration conventions`);
}

assert(contributing.includes("Release and migration impact"), "CONTRIBUTING must require release/migration impact classification");
assert(contributing.includes("docs/RELEASES.md") && contributing.includes("docs/MIGRATIONS.md"), "CONTRIBUTING must link release/migration policies");
assert(changelog.includes("Phase 10.4"), "CHANGELOG must record Phase 10.4");

assert(workflow.includes("Release and migration convention gate"), "dedicated workflow must run the convention gate");
assert(workflow.includes("npm run check:release-migrations"), "dedicated workflow must execute check:release-migrations");
assert(workflow.includes("npm run check:release"), "dedicated workflow must retain release consistency validation");

console.log("Release and migration convention invariants passed.");
