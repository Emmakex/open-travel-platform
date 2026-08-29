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
  "docs/RELEASES.es.md",
  "docs/MIGRATIONS.md",
  "docs/MIGRATIONS.es.md",
  "docs/UPGRADES.md",
  "docs/UPGRADES.es.md",
  "docs/DEPRECATIONS.md",
  "docs/DEPRECATIONS.es.md",
  "docs/CONTRIBUTION-TEMPLATES.md",
  "docs/CONTRIBUTION-TEMPLATES.es.md",
  "docs/EXTENSION-POINT-INVENTORY.md",
  "docs/EXTENSION-POINT-INVENTORY.es.md",
  "docs/EXTENSION-COMPATIBILITY.md",
  "docs/EXTENSION-COMPATIBILITY.es.md",
  "docs/REFERENCE-ADAPTERS.md",
  "docs/REFERENCE-ADAPTERS.es.md",
  "docs/EXTENSION-VALIDATION.md",
  "docs/EXTENSION-VALIDATION.es.md",
  ".github/PULL_REQUEST_TEMPLATE.md",
  ".github/RELEASE_TEMPLATE.md",
  ".github/workflows/phase-10-release-audit.yml",
  ".github/workflows/publish-release.yml"
];

for (const file of requiredFiles) assert(exists(file), `missing ${file}`);

const packageJson = JSON.parse(read("package.json"));
const packageLock = JSON.parse(read("package-lock.json"));
const readme = read("README.md");
const readmeEs = read("README.es.md");
const roadmap = read("ROADMAP.md");
const roadmapEs = read("ROADMAP.es.md");
const changelog = read("CHANGELOG.md");
const audit = read("docs/PHASE-10-RELEASE-AUDIT.md");
const auditEs = read("docs/PHASE-10-RELEASE-AUDIT.es.md");
const notes = read("docs/RELEASE-NOTES-1.1.0.md");
const notesEs = read("docs/RELEASE-NOTES-1.1.0.es.md");

assert(/^\d+\.\d+\.\d+$/.test(packageJson.version), "current package version must remain stable SemVer");
assert(packageJson.scripts?.["check:phase-10-release"] === "node scripts/phase-10-release-check.mjs", "package must expose check:phase-10-release");
assert(packageJson.scripts?.verify?.includes("check:phase-10-release"), "historical Phase 10 gate must remain inside npm run verify");

const rootLock = packageLock.packages?.[""];
assert(rootLock, "package-lock must retain the root package record");
assert(JSON.stringify(rootLock.dependencies ?? {}) === JSON.stringify(packageJson.dependencies ?? {}), "release must not drift runtime dependency lock");
assert(JSON.stringify(rootLock.devDependencies ?? {}) === JSON.stringify(packageJson.devDependencies ?? {}), "release must not drift dev dependency lock");

for (const [name, source] of [["README", readme], ["README.es", readmeEs]]) {
  assert(source.includes("1.1.0"), `${name} must preserve the v1.1.0 Phase 10 closeout identity`);
  assert(source.includes("10.8"), `${name} must record Phase 10.8`);
  assert(source.includes("check:phase-10-release"), `${name} must document historical Phase 10 gate`);
  assert(source.includes("PHASE-10-RELEASE-AUDIT"), `${name} must link final Phase 10 audit`);
}

assert(readme.includes("Phase 10 — Open-source productisation: COMPLETE"), "English README must keep Phase 10 closed");
assert(readmeEs.includes("Fase 10 — Productización open-source: COMPLETADA"), "Spanish README must keep Phase 10 closed");

for (const [name, source] of [["ROADMAP", roadmap], ["ROADMAP.es", roadmapEs]]) {
  for (let slice = 1; slice <= 8; slice += 1) assert(source.includes(`10.${slice}`), `${name} must record slice 10.${slice}`);
  assert(source.includes("1.1.0"), `${name} must preserve the v1.1.0 closeout release`);
  assert(source.includes("PHASE-10-RELEASE-AUDIT"), `${name} must link final Phase 10 audit`);
}
assert(roadmap.includes("Phase 10 — Open-source productisation — COMPLETE"), "English ROADMAP must keep Phase 10 closed");
assert(roadmapEs.includes("Fase 10 — Productización open-source — COMPLETADA"), "Spanish ROADMAP must keep Phase 10 closed");

assert(changelog.includes("## [Unreleased]"), "CHANGELOG must retain Unreleased");
assert(changelog.includes("## [1.1.0] - 2026-08-28"), "CHANGELOG must retain immutable v1.1.0 history");
assert(changelog.includes("Phase 10"), "CHANGELOG must retain Phase 10 completion");
assert(changelog.includes("no historical Git tag") || changelog.includes("no historical `v1.0.0` tag"), "CHANGELOG must transparently record pre-policy 1.0.0 tag history");

for (const [name, source] of [["audit", audit], ["audit.es", auditEs]]) {
  assert(source.includes("1.1.0"), `${name} must identify release 1.1.0`);
  assert(source.includes("10.8"), `${name} must identify Phase 10.8`);
  assert(source.includes("Stripe/Redsys"), `${name} must preserve external provider validation status`);
  assert(source.includes("v1.0.0"), `${name} must document historical tag decision`);
}

assert(notes.includes("Open Travel Platform v1.1.0"), "English historical release notes must target v1.1.0");
assert(notes.includes("backward-compatible MINOR"), "English v1.1.0 notes must retain SemVer classification");
assert(notesEs.includes("Open Travel Platform v1.1.0"), "Spanish historical release notes must target v1.1.0");
assert(notesEs.includes("MINOR backward-compatible"), "Spanish v1.1.0 notes must retain SemVer classification");

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
assert(auditWorkflow.includes("npm run check:phase-10-release"), "historical Phase 10 workflow must run its gate");
assert(auditWorkflow.includes("npm run verify"), "historical Phase 10 workflow must run full verify");
assert(auditWorkflow.includes("npm run package:standalone"), "historical Phase 10 workflow must package standalone runtime");

const publishWorkflow = read(".github/workflows/publish-release.yml");
assert(publishWorkflow.includes("workflow_run"), "release publication must remain downstream of an audited workflow");
assert(publishWorkflow.includes('workflows: ["Release audit"]'), "future publication must depend on the generic Release audit");
assert(publishWorkflow.includes("contents: write"), "publication workflow needs scoped contents write permission");
assert(publishWorkflow.includes("git ls-remote"), "publication must check existing immutable tag before creation");
assert(publishWorkflow.includes("gh release create"), "publication must create GitHub Release from release notes");
assert(publishWorkflow.includes("RELEASE-AUDIT-${VERSION}.md"), "publication must require a version-specific approval record");
assert(publishWorkflow.includes("RELEASE-NOTES-${VERSION}.md"), "publication must use reviewed version-specific release notes");

assert(read("LICENSE").startsWith("MIT License"), "software license must remain MIT");
assert(read("TRADEMARKS.md").includes("does **not** claim"), "branding policy must keep registration claim bounded");

console.log("Historical Phase 10 v1.1.0 documentation, release identity and permanent-gate invariants passed.");
