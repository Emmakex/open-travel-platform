import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const exists = (file) => fs.existsSync(path.join(root, file));
const assert = (condition, message) => {
  if (!condition) throw new Error(`Branding policy invariant failed: ${message}`);
};

const required = [
  "LICENSE",
  "TRADEMARKS.md",
  "TRADEMARKS.es.md",
  "README.md",
  "README.es.md",
  "ROADMAP.md",
  "ROADMAP.es.md",
  "CONTRIBUTING.md",
  ".github/PULL_REQUEST_TEMPLATE.md",
  ".github/RELEASE_TEMPLATE.md",
  ".github/workflows/branding-policy.yml",
  ".env.example"
];
for (const file of required) assert(exists(file), `missing ${file}`);

const license = read("LICENSE");
assert(license.startsWith("MIT License"), "software license must remain MIT");
assert(license.includes("Permission is hereby granted, free of charge"), "MIT grant text must remain intact");

const en = read("TRADEMARKS.md");
const es = read("TRADEMARKS.es.md");

for (const [name, source] of [["English", en], ["Spanish", es]]) {
  assert(source.includes("Open Travel Platform"), `${name} policy must identify Open Travel Platform`);
  assert(source.includes("Kairoseth Travel"), `${name} policy must identify Kairoseth Travel`);
  assert(source.includes("travel.kairoseth.com"), `${name} policy must identify the reference deployment`);
  assert(source.includes("NEXT_PUBLIC_SITE_NAME"), `${name} policy must document rebranding configuration`);
  assert(source.includes("KTRAVEL_*"), `${name} policy must classify legacy KTRAVEL_* identifiers`);
  assert(source.includes("ACTIVE") || source.includes("deprec"), `${name} policy must respect lifecycle/compatibility rules`);
  assert(!source.includes("® ") && !source.includes("®\n"), `${name} policy must not apply an unverified registered-mark symbol`);
}

assert(en.includes("does not change or restrict the MIT code license"), "English policy must separate MIT code rights from branding identity");
assert(en.includes("does not state or imply that any identifier is registered"), "English policy must not claim unverified registration");
assert(en.includes("based on Open Travel Platform"), "English policy must allow truthful derivative attribution");
assert(en.includes("own primary product name and visual identity"), "English policy must require distinct branding for independent modified services");
assert(en.includes("legacy technical configuration identifiers"), "English policy must classify KTRAVEL_* as technical legacy identifiers");
assert(en.includes("does not revoke or reduce rights already granted under the MIT License"), "English policy must preserve MIT rights when correcting confusing branding");

assert(es.includes("no cambia ni restringe la licencia MIT del código"), "Spanish policy must separate MIT rights from branding identity");
assert(es.includes("no afirma ni implica que ningún identificador esté registrado"), "Spanish policy must not claim unverified registration");
assert(es.includes("basado en Open Travel Platform"), "Spanish policy must allow truthful derivative attribution");
assert(es.includes("su propio nombre principal e identidad visual"), "Spanish policy must require distinct branding for independent modified services");
assert(es.includes("identificadores técnicos legacy de configuración"), "Spanish policy must classify KTRAVEL_* as technical legacy identifiers");
assert(es.includes("no revoca ni reduce los derechos ya concedidos por la licencia MIT"), "Spanish policy must preserve MIT rights when correcting confusing branding");

const env = read(".env.example");
assert(env.includes("Independent public/commercial deployments"), ".env.example must explain independent deployment rebranding");
assert(env.includes("KTRAVEL_* names are retained legacy technical configuration identifiers"), ".env.example must distinguish KTRAVEL_* technical identifiers from branding");
assert(env.includes("NEXT_PUBLIC_SITE_NAME=Open Travel Platform"), "upstream/demo default identity must remain explicit");

const config = read("lib/config.ts");
assert(config.includes('process.env.NEXT_PUBLIC_SITE_NAME ?? "Open Travel Platform"'), "upstream application default identity must remain explicit");

const pr = read(".github/PULL_REQUEST_TEMPLATE.md");
assert(pr.includes("Branding / identity"), "PR template must classify branding/identity impact");
assert(pr.includes("TRADEMARKS.md"), "PR template must link branding policy");

const releaseTemplate = read(".github/RELEASE_TEMPLATE.md");
assert(releaseTemplate.includes("Branding / identity impact"), "release template must record branding/identity changes");

for (const file of ["README.md", "README.es.md", "ROADMAP.md", "ROADMAP.es.md", "CONTRIBUTING.md"]) {
  const source = read(file);
  assert(source.includes("TRADEMARKS"), `${file} must link the branding policy`);
  assert(source.includes("check:branding-policy"), `${file} must document the permanent branding gate`);
}

const pkg = JSON.parse(read("package.json"));
assert(pkg.scripts?.["check:branding-policy"] === "node scripts/branding-policy-check.mjs", "package.json must expose check:branding-policy");
assert(pkg.scripts?.verify?.includes("check:branding-policy"), "check:branding-policy must remain part of npm run verify");

const releaseCheck = read("scripts/release-check.mjs");
assert(releaseCheck.includes('"TRADEMARKS.md"'), "release consistency must require TRADEMARKS.md");
assert(releaseCheck.includes('"TRADEMARKS.es.md"'), "release consistency must require TRADEMARKS.es.md");

const workflow = read(".github/workflows/branding-policy.yml");
assert(workflow.includes("npm run check:branding-policy"), "dedicated workflow must execute branding policy gate");
assert(workflow.includes("npm run check:contribution-templates"), "dedicated workflow must preserve contribution template gate");
assert(workflow.includes("npm run check:upgrade-deprecations"), "dedicated workflow must preserve upgrade/deprecation gate");

const changelog = read("CHANGELOG.md");
assert(changelog.includes("Phase 10.7"), "CHANGELOG must record Phase 10.7");

console.log("Branding, identity, MIT-license separation and CI invariants passed.");
