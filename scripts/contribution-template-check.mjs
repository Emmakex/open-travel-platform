import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const exists = (file) => fs.existsSync(path.join(root, file));
const assert = (condition, message) => {
  if (!condition) throw new Error(`Contribution template invariant failed: ${message}`);
};

const canonicalPr = ".github/PULL_REQUEST_TEMPLATE.md";
const duplicatePr = ".github/pull_request_template.md";
const bugForm = ".github/ISSUE_TEMPLATE/bug-report.yml";
const featureForm = ".github/ISSUE_TEMPLATE/feature-request.yml";
const issueConfig = ".github/ISSUE_TEMPLATE/config.yml";
const releaseTemplate = ".github/RELEASE_TEMPLATE.md";
const guideEn = "docs/CONTRIBUTION-TEMPLATES.md";
const guideEs = "docs/CONTRIBUTION-TEMPLATES.es.md";
const workflowFile = ".github/workflows/contribution-templates.yml";

for (const file of [canonicalPr, bugForm, featureForm, issueConfig, releaseTemplate, guideEn, guideEs, workflowFile]) {
  assert(exists(file), `missing ${file}`);
}
assert(!exists(duplicatePr), "duplicate lowercase pull request template must not exist");

const pr = read(canonicalPr);
for (const token of [
  "Release / compatibility impact",
  "Migration / lifecycle impact",
  "Authority / security / privacy",
  "UX / accessibility",
  "npm run check:extension-contracts",
  "npm run check:release-migrations",
  "npm run check:upgrade-deprecations",
  "npm run verify",
  "README / ROADMAP / CHANGELOG",
  "Phase completion gate"
]) {
  assert(pr.includes(token), `canonical PR template must include ${token}`);
}
assert(pr.includes("ACTIVE → DEPRECATED") && pr.includes("DEPRECATED → REMOVED"), "PR template must expose lifecycle transitions");
assert(pr.includes("PATCH") && pr.includes("MINOR") && pr.includes("MAJOR"), "PR template must expose SemVer classification");

const bug = read(bugForm);
for (const token of ["Version or commit", "Reproduction steps", "Regression status", "Compatibility or upgrade context", "protected Traveller Data", "security vulnerability"]) {
  assert(bug.toLowerCase().includes(token.toLowerCase()), `bug form must include ${token}`);
}

const feature = read(featureForm);
for (const token of ["Public contract impact", "Provider-neutral", "Upgrade / migration / lifecycle impact", "Authority / security / privacy impact", "credentials", "Traveller Data"]) {
  assert(feature.toLowerCase().includes(token.toLowerCase()), `feature form must include ${token}`);
}

const config = read(issueConfig);
assert(config.includes("blank_issues_enabled: false"), "blank issues must remain disabled");
assert(config.includes("security/policy"), "security reports must remain routed to the security policy");

const release = read(releaseTemplate);
for (const token of [
  "Release identity",
  "Version: `X.Y.Z`",
  "Git tag: `vX.Y.Z`",
  "Verified `main` commit SHA",
  "Upgrade and migration",
  "Deprecations / removals",
  "Rollback/recovery",
  "npm run check:release",
  "npm run check:release-migrations",
  "npm run check:upgrade-deprecations",
  "npm run verify",
  "npm run package:standalone",
  "Immutable `vX.Y.Z` tag",
  "GitHub release"
]) {
  assert(release.includes(token), `release template must include ${token}`);
}

const packageJson = JSON.parse(read("package.json"));
assert(
  packageJson.scripts?.["check:contribution-templates"] === "node scripts/contribution-template-check.mjs",
  "package.json must expose check:contribution-templates"
);
assert(packageJson.scripts?.verify?.includes("check:contribution-templates"), "check:contribution-templates must remain part of npm run verify");

const workflow = read(workflowFile);
assert(workflow.includes("npm run check:contribution-templates"), "dedicated workflow must execute contribution template gate");
assert(workflow.includes("npm run check:upgrade-deprecations"), "dedicated workflow must preserve upgrade/deprecation gate");
assert(workflow.includes("npm run check:release-migrations"), "dedicated workflow must preserve release/migration gate");

const docsEn = read(guideEn);
const docsEs = read(guideEs);
for (const source of [docsEn, docsEs]) {
  assert(source.includes(canonicalPr), "template guide must identify canonical PR template");
  assert(source.includes(releaseTemplate), "template guide must identify release template");
  assert(source.includes("check:contribution-templates"), "template guide must document permanent gate");
}

for (const file of ["CONTRIBUTING.md", "README.md", "README.es.md", "ROADMAP.md", "ROADMAP.es.md"]) {
  const source = read(file);
  assert(source.includes("CONTRIBUTION-TEMPLATES"), `${file} must link the Phase 10.6 contribution template guide`);
  assert(source.includes("check:contribution-templates"), `${file} must document the Phase 10.6 gate`);
}

const changelog = read("CHANGELOG.md");
assert(changelog.includes("Phase 10.6"), "CHANGELOG must record Phase 10.6");

console.log("Contribution, issue and release template invariants passed.");
