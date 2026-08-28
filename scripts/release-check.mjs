import { access, readFile } from "node:fs/promises";

const errors = [];
const requiredFiles = [
  "LICENSE",
  "TRADEMARKS.md",
  "TRADEMARKS.es.md",
  "SECURITY.md",
  "CONTRIBUTING.md",
  "CHANGELOG.md",
  "SUPPORT.md",
  "ROADMAP.md",
  "docs/ARCHITECTURE.md",
  "docs/API-CONTRACT.md",
  "docs/IDENTITY.md",
  "docs/BOOKING.md",
  "docs/OPERATIONS.md",
  "docs/ADAPTER-GUIDE.md",
  "docs/PRODUCTION-CHECKLIST.md",
  "docs/DEPLOYMENT.md",
  "docs/RELEASES.md",
  "docs/RELEASES.es.md",
  "docs/MIGRATIONS.md",
  "docs/MIGRATIONS.es.md",
  "docs/UPGRADES.md",
  "docs/UPGRADES.es.md",
  "docs/DEPRECATIONS.md",
  "docs/DEPRECATIONS.es.md"
];

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const readme = await readFile("README.md", "utf8");
const changelog = await readFile("CHANGELOG.md", "utf8");
const envExample = await readFile(".env.example", "utf8");

if (!/^\d+\.\d+\.\d+$/.test(packageJson.version)) {
  errors.push("package.json version must be a stable x.y.z version");
}

if (!readme.includes(`version-${packageJson.version}-`)) {
  errors.push("README version badge does not match package.json");
}

if (!changelog.includes(`## [${packageJson.version}]`)) {
  errors.push("CHANGELOG has no entry matching package.json version");
}

if (packageJson.packageManager !== "npm@11.17.0") {
  errors.push("stable v1.0 toolchain must declare npm@11.17.0");
}

for (const [groupName, dependencies] of [
  ["dependencies", packageJson.dependencies],
  ["devDependencies", packageJson.devDependencies]
]) {
  for (const [dependency, version] of Object.entries(dependencies ?? {})) {
    if (typeof version !== "string" || /^[~^*><=]/.test(version)) {
      errors.push(`${groupName}.${dependency} must use an exact version`);
    }
  }
}

for (const flag of [
  "DEMO_IDENTITY_ENABLED=false",
  "DEMO_BOOKING_ENABLED=false",
  "DEMO_OPERATIONS_ENABLED=false"
]) {
  if (!envExample.includes(flag)) {
    errors.push(`.env.example must contain safe default: ${flag}`);
  }
}

for (const file of requiredFiles) {
  try {
    await access(file);
  } catch {
    errors.push(`missing required release file: ${file}`);
  }
}

if (errors.length) {
  console.error("Release consistency check failed:\n");
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log(`Release consistency check passed for v${packageJson.version}.`);
