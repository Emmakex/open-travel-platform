import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const exists = (file) => fs.existsSync(path.join(root, file));
const assert = (condition, message) => {
  if (!condition) throw new Error(`Branding/trademark invariant failed: ${message}`);
};

const policyEn = "TRADEMARKS.md";
const policyEs = "TRADEMARKS.es.md";
const workflowFile = ".github/workflows/branding-policy.yml";

for (const file of [
  policyEn,
  policyEs,
  "LICENSE",
  "README.md",
  "README.es.md",
  "ROADMAP.md",
  "ROADMAP.es.md",
  "CONTRIBUTING.md",
  "SUPPORT.md",
  ".github/PULL_REQUEST_TEMPLATE.md",
  ".github/RELEASE_TEMPLATE.md",
  workflowFile
]) {
  assert(exists(file), `missing ${file}`);
}

const en = read(policyEn);
const es = read(policyEs);

for (const token of [
  "Phase 10.7 — COMPLETE",
  "Open Travel Platform",
  "Kairoseth Travel",
  "https://travel.kairoseth.com",
  "MIT License",
  "does **not** claim",
  "Built with Open Travel Platform",
  "not an official Kairoseth Travel service",
  "No implied endorsement",
  "npm run check:branding-policy"
]) {
  assert(en.includes(token), `English policy must include ${token}`);
}

for (const token of [
  "Fase 10.7 — COMPLETADA",
  "Open Travel Platform",
  "Kairoseth Travel",
  "https://travel.kairoseth.com",
  "licencia MIT",
  "**no** afirma",
  "Built with Open Travel Platform",
  "No es un servicio oficial de Kairoseth Travel",
  "Sin endorsement implícito",
  "npm run check:branding-policy"
]) {
  assert(es.includes(token), `Spanish policy must include ${token}`);
}

assert(en.includes("software rights do not automatically grant"), "English policy must separate software and brand rights");
assert(es.includes("derechos sobre el software no conceden automáticamente"), "Spanish policy must separate software and brand rights");
assert(en.includes("Only a deployment or distribution controlled or expressly authorized"), "English policy must reserve official designation");
assert(es.includes("Solo un despliegue o distribución controlado o expresamente autorizado"), "Spanish policy must reserve official designation");

const license = read("LICENSE");
assert(license.startsWith("MIT License"), "repository software license must remain MIT");
assert(license.includes("Copyright (c) 2026 Eduardo Yauri"), "MIT copyright notice must remain present");

for (const [name, source] of [
  ["README", read("README.md")],
  ["README.es", read("README.es.md")],
  ["ROADMAP", read("ROADMAP.md")],
  ["ROADMAP.es", read("ROADMAP.es.md")]
]) {
  assert(source.includes("TRADEMARKS"), `${name} must link the branding/trademark policy`);
  assert(source.includes("Kairoseth Travel"), `${name} must preserve the commercial/reference identity`);
  assert(source.includes("travel.kairoseth.com"), `${name} must preserve the official reference deployment`);
  assert(source.includes("10.7"), `${name} must record Phase 10.7`);
}

const contributing = read("CONTRIBUTING.md");
assert(contributing.includes("Branding / trademark impact"), "CONTRIBUTING must require branding/trademark impact review");
assert(contributing.includes("TRADEMARKS.md"), "CONTRIBUTING must link the branding/trademark policy");

const support = read("SUPPORT.md");
assert(support.includes("TRADEMARKS.md"), "SUPPORT must distinguish support identity from branding/official status");
assert(support.includes("official"), "SUPPORT must address official support/status wording");

const pr = read(".github/PULL_REQUEST_TEMPLATE.md");
assert(pr.includes("Branding / trademark impact"), "PR template must expose branding/trademark impact");
assert(pr.includes("Kairoseth Travel"), "PR template must distinguish official Kairoseth Travel wording");

const releaseTemplate = read(".github/RELEASE_TEMPLATE.md");
assert(releaseTemplate.includes("npm run check:branding-policy"), "release template must run branding policy gate");
assert(releaseTemplate.includes("Branding / trademark"), "release template must review branding/trademark impact");

const releaseCheck = read("scripts/release-check.mjs");
assert(releaseCheck.includes('"TRADEMARKS.md"'), "release-check must require English trademark policy");
assert(releaseCheck.includes('"TRADEMARKS.es.md"'), "release-check must require Spanish trademark policy");

const packageJson = JSON.parse(read("package.json"));
assert(
  packageJson.scripts?.["check:branding-policy"] === "node scripts/branding-policy-check.mjs",
  "package.json must expose check:branding-policy"
);
assert(packageJson.scripts?.verify?.includes("check:branding-policy"), "check:branding-policy must remain part of npm run verify");

const workflow = read(workflowFile);
assert(workflow.includes("npm run check:branding-policy"), "dedicated workflow must execute branding policy gate");
assert(workflow.includes("npm run check:contribution-templates"), "branding workflow must preserve contribution-template gate");
assert(workflow.includes("npm run check:upgrade-deprecations"), "branding workflow must preserve upgrade/deprecation gate");

const changelog = read("CHANGELOG.md");
assert(changelog.includes("Phase 10.7"), "CHANGELOG must record Phase 10.7");

console.log("Branding, trademark, MIT-license separation and official reference identity invariants passed.");
