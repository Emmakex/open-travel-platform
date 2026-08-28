import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const exists = (file) => fs.existsSync(path.join(root, file));
const assert = (condition, message) => {
  if (!condition) throw new Error(`Phase 10 release invariant failed: ${message}`);
};

const requiredFiles = [
  "README.md",
  "README.es.md",
  "ROADMAP.md",
  "ROADMAP.es.md",
  "CHANGELOG.md",
  "LICENSE",
  "TRADEMARKS.md",
  "TRADEMARKS.es.md",
  "SUPPORT.md",
  "CONTRIBUTING.md",
  "docs/PHASE-10-RELEASE-AUDIT.md",
  "docs/PHASE-10-RELEASE-AUDIT.es.md",
  "docs/RELEASE-NOTES-1.1.0.md",
  "docs/RELEASE-NOTES-1.1.0.es.md",
  "docs/RELEASES.md",
  "docs/MIGRATIONS.md",
  "docs/UPGRADES.md",
  "docs/DEPRECATIONS.md",
  "docs/CONTRIBUTION-TEMPLATES.md",
  "docs/EXTENSION-POINT-INVENTORY.md",
  "docs/EXTENSION-COMPATIBILITY.md",
  "docs/REFERENCE-ADAPTERS.md",
  "docs/EXTENSION-VALIDATION.md",
  ".github/PULL_REQUEST_TEMPLATE.md",
  ".github/RELEASE_TEMPLATE.md",
  ".github/workflows/phase-10-release-audit.yml",
  ".github/workflows/publish-release.yml"
];

for (const file of requiredFiles) assert(exists(file), `missing ${file}`);

const packageJson = JSON.parse(read("package.json"));
const readme = read("README.md");
const readmeEs = read("README.es.md");
const roadmap = read("ROADMAP.md");
const roadmapEs = read("ROADMAP.es.md");
const changelog = read("CHANGELOG.md");
const audit = read("docs/PHASE-10-RELEASE-AUDIT.md");
const auditEs = read("docs/PHASE-10-RELEASE-AUDIT.es.md");
const notes = read("docs/RELEASE-NOTES-1.1.0.md");
const notesEs = read("docs/RELEASE-NOTES-1.1.0.es.md");

assert(packageJson.version === "1.1.0", "package version must be 1.1.0");
assert(packageJson.scripts?.["check:phase-10-release"] === "node scripts/phase-10-release-check.mjs", "package must expose check:phase-10-release");
assert(packageJson.scripts?.verify?.includes("check:phase-10-release"), "final release gate must remain inside npm run verify");

for (const [name, source] of [["README", readme], ["README.es", readmeEs]]) {
  assert(source.includes("version-1.1.0-"), `${name} badge must be v1.1.0`);
  assert(source.includes("10.8"), `${name} must record Phase 10.8`);
  assert(source.includes("check:phase-10-release"), `${name} must document final release gate`);
  assert(source.includes("PHASE-10-RELEASE-AUDIT"), `${name} must link final audit`);
}

assert(readme.includes("Phase 10 — Open-source productisation: COMPLETE"), "English README must close Phase 10");
assert(readmeEs.includes("Fase 10 — Productización open-source: COMPLETADA"), "Spanish README must close Phase 10");

for (const [name, source] of [["ROADMAP", roadmap], ["ROADMAP.es", roadmapEs]]) {
  for (let slice = 1; slice <= 8; slice += 1) assert(source.includes(`10.${slice}`), `${name} must record slice 10.${slice}`);
  assert(source.includes("1.1.0"), `${name} must record the v1.1.0 closeout release`);
  assert(source.includes("PHASE-10-RELEASE-AUDIT"), `${name} must link final audit`);
}
assert(roadmap.includes("Phase 10 — Open-source productisation — COMPLETE"), "English ROADMAP must close Phase 10");
assert(roadmapEs.includes("Fase 10 — Productización open-source — COMPLETADA"), "Spanish ROADMAP must close Phase 10");

assert(changelog.includes("## [Unreleased]"), "CHANGELOG must retain Unreleased");
assert(changelog.includes("## [1.1.0] - 2026-08-28"), "CHANGELOG must contain final v1.1.0 entry");
assert(changelog.includes("Phase 10"), "CHANGELOG must record Phase 10 completion");
assert(changelog.includes("no historical Git tag") || changelog.includes("no historical `v1.0.0` tag"), "CHANGELOG must transparently record pre-policy 1.0.0 tag history");

for (const [name, source] of [["audit", audit], ["audit.es", auditEs]]) {
  assert(source.includes("1.1.0"), `${name} must identify release 1.1.0`);
  assert(source.includes("10.8"), `${name} must identify Phase 10.8`);
  assert(source.includes("Stripe/Redsys"), `${name} must preserve external provider validation status`);
  assert(source.includes("v1.0.0"), `${name} must document historical tag decision`);
}

assert(notes.includes("Open Travel Platform v1.1.0"), "English release notes must target v1.1.0");
assert(notes.includes("backward-compatible MINOR"), "English release notes must state SemVer classification");
assert(notesEs.includes("Open Travel Platform v1.1.0"), "Spanish release notes must target v1.1.0");
assert(notesEs.includes("MINOR backward-compatible"), "Spanish release notes must state SemVer classification");

const permanentGates = [
  "check:extension-contracts",
  "check:release-migrations",
  "check:upgrade-deprecations",
  "check:contribution-templates",
  "check:branding-policy",
  "check:phase-10-release"
];
for (const gate of permanentGates) assert(packageJson.scripts?.verify?.includes(gate), `verify must retain ${gate}`);

const auditWorkflow = read(".github/workflows/phase-10-release-audit.yml");
assert(auditWorkflow.includes("npm run check:phase-10-release"), "audit workflow must run final gate");
assert(auditWorkflow.includes("npm run verify"), "audit workflow must run full verify");
assert(auditWorkflow.includes("npm run package:standalone"), "audit workflow must package standalone runtime");

const publishWorkflow = read(".github/workflows/publish-release.yml");
assert(publishWorkflow.includes("workflow_run"), "release publication must be downstream of audited workflow");
assert(publishWorkflow.includes("Phase 10 release audit"), "publication must depend on named release audit workflow");
assert(publishWorkflow.includes("contents: write"), "publication workflow needs scoped contents write permission");
assert(publishWorkflow.includes("git ls-remote"), "publication must check existing immutable tag before creation");
assert(publishWorkflow.includes("gh release create"), "publication must create GitHub Release from release notes");
assert(publishWorkflow.includes("RELEASE-NOTES-1.1.0.md"), "publication must use reviewed v1.1.0 notes");

assert(read("LICENSE").startsWith("MIT License"), "software license must remain MIT");
assert(read("TRADEMARKS.md").includes("does **not** claim"), "branding policy must keep registration claim bounded");

console.log("Phase 10 final documentation, release identity, permanent gates and publication invariants passed for v1.1.0.");
