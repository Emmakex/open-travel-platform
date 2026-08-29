import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const exists = (file) => fs.existsSync(path.join(root, file));
const assert = (condition, message) => {
  if (!condition) throw new Error(`Release audit invariant failed: ${message}`);
};

const packageJson = JSON.parse(read('package.json'));
const packageLock = JSON.parse(read('package-lock.json'));
const version = packageJson.version;
const tag = `v${version}`;

assert(/^\d+\.\d+\.\d+$/.test(version), 'package version must be stable x.y.z');

const requiredFiles = [
  'README.md',
  'README.es.md',
  'ROADMAP.md',
  'ROADMAP.es.md',
  'CHANGELOG.md',
  'CONTRIBUTING.md',
  '.github/RELEASE_TEMPLATE.md',
  '.github/workflows/release-audit.yml',
  '.github/workflows/publish-release.yml',
  '.github/workflows/publish-container.yml',
  '.github/workflows/verify-published-distribution.yml',
  `docs/RELEASE-AUDIT-${version}.md`,
  `docs/RELEASE-AUDIT-${version}.es.md`,
  `docs/RELEASE-NOTES-${version}.md`,
  `docs/RELEASE-NOTES-${version}.es.md`
];
for (const file of requiredFiles) assert(exists(file), `missing ${file}`);

const readme = read('README.md');
const readmeEs = read('README.es.md');
const changelog = read('CHANGELOG.md');
const audit = read(`docs/RELEASE-AUDIT-${version}.md`);
const auditEs = read(`docs/RELEASE-AUDIT-${version}.es.md`);
const notes = read(`docs/RELEASE-NOTES-${version}.md`);
const notesEs = read(`docs/RELEASE-NOTES-${version}.es.md`);
const publishWorkflow = read('.github/workflows/publish-release.yml');
const verifyWorkflow = read('.github/workflows/verify-published-distribution.yml');

for (const [name, source] of [['README', readme], ['README.es', readmeEs]]) {
  assert(source.includes(`version-${version}-`), `${name} badge must match ${version}`);
}
assert(changelog.includes('## [Unreleased]'), 'CHANGELOG must retain Unreleased');
assert(changelog.includes(`## [${version}] - `), `CHANGELOG must contain ${version}`);

for (const [name, source] of [['release audit', audit], ['release audit ES', auditEs]]) {
  assert(source.includes(`RELEASE APPROVED FOR ${tag}`), `${name} must explicitly approve ${tag}`);
  assert(source.includes(version), `${name} must identify ${version}`);
  assert(source.includes('MINOR') || source.includes('PATCH') || source.includes('MAJOR'), `${name} must classify SemVer impact`);
}
assert(notes.includes(`Open Travel Platform v${version}`), 'English release notes must identify current version');
assert(notesEs.includes(`Open Travel Platform v${version}`), 'Spanish release notes must identify current version');

assert(packageJson.scripts?.['check:release-audit'] === 'node scripts/release-audit-check.mjs', 'package must expose check:release-audit');
assert(packageJson.scripts?.verify?.includes('check:release-audit'), 'npm run verify must include check:release-audit');

const rootLock = packageLock.packages?.[''];
assert(rootLock, 'package-lock must retain root package record');
assert(JSON.stringify(rootLock.dependencies ?? {}) === JSON.stringify(packageJson.dependencies ?? {}), 'runtime dependency lock must match package.json');
assert(JSON.stringify(rootLock.devDependencies ?? {}) === JSON.stringify(packageJson.devDependencies ?? {}), 'dev dependency lock must match package.json');

assert(publishWorkflow.includes('workflows: ["Release audit"]'), 'release publication must depend on generic Release audit');
assert(publishWorkflow.includes('RELEASE-AUDIT-${VERSION}.md'), 'publisher must consume the version-specific release audit');
assert(publishWorkflow.includes('RELEASE-NOTES-${VERSION}.md'), 'publisher must consume version-specific release notes');
assert(publishWorkflow.includes('git ls-remote'), 'publisher must preserve immutable tag history');
assert(publishWorkflow.includes('gh release create'), 'publisher must create GitHub Release for a new audited version');

assert(verifyWorkflow.includes('workflows: ["Publish audited container"]'), 'distribution verification must run after audited container publication');
assert(verifyWorkflow.includes('docker pull "${IMAGE}:${TAG}"'), 'verification must perform a real registry pull');
assert(verifyWorkflow.includes('docker pull "${IMAGE}@${DIGEST}"'), 'verification must pull/run by immutable digest');
assert(verifyWorkflow.includes('.Provenance'), 'verification must inspect BuildKit provenance');
assert(verifyWorkflow.includes('.SBOM'), 'verification must inspect BuildKit SBOM');
assert(verifyWorkflow.includes('gh attestation verify'), 'verification must verify GitHub artifact attestation');
assert(verifyWorkflow.includes('/api/health/live'), 'verification must exercise liveness');
assert(verifyWorkflow.includes('/api/health/ready'), 'verification must exercise readiness');
assert(verifyWorkflow.includes('distribution-verification-${VERSION}.json'), 'verification must record immutable distribution identity');

console.log(`Audited release invariants passed for ${tag}.`);
