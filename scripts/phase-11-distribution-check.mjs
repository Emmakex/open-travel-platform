import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const exists = (file) => fs.existsSync(path.join(root, file));
const assert = (condition, message) => {
  if (!condition) throw new Error(`Phase 11 distribution invariant failed: ${message}`);
};

const requiredFiles = [
  'Dockerfile',
  '.dockerignore',
  'docs/CONTAINERS.md',
  'docs/CONTAINERS.es.md',
  'docs/REGISTRY.md',
  'docs/REGISTRY.es.md',
  'docs/DEPLOYMENT-RECIPES.md',
  'docs/DEPLOYMENT-RECIPES.es.md',
  'docs/RELEASE-AUDIT-1.2.0.md',
  'docs/RELEASE-AUDIT-1.2.0.es.md',
  'docs/RELEASE-NOTES-1.2.0.md',
  'docs/RELEASE-NOTES-1.2.0.es.md',
  '.github/workflows/container-distribution.yml',
  '.github/workflows/registry-provenance.yml',
  '.github/workflows/publish-container.yml',
  '.github/workflows/deployment-recipes.yml',
  '.github/workflows/release-audit.yml',
  '.github/workflows/verify-published-distribution.yml',
  'scripts/container-distribution-check.mjs',
  'scripts/registry-provenance-check.mjs',
  'scripts/deployment-recipes-check.mjs'
];
for (const file of requiredFiles) assert(exists(file), `missing ${file}`);

const packageJson = JSON.parse(read('package.json'));
const readme = read('README.md');
const readmeEs = read('README.es.md');
const roadmap = read('ROADMAP.md');
const roadmapEs = read('ROADMAP.es.md');
const changelog = read('CHANGELOG.md');
const audit = read('docs/RELEASE-AUDIT-1.2.0.md');
const auditEs = read('docs/RELEASE-AUDIT-1.2.0.es.md');
const notes = read('docs/RELEASE-NOTES-1.2.0.md');
const notesEs = read('docs/RELEASE-NOTES-1.2.0.es.md');
const publishContainer = read('.github/workflows/publish-container.yml');
const verifyDistribution = read('.github/workflows/verify-published-distribution.yml');

for (const [name, source] of [['README', readme], ['README.es', readmeEs]]) {
  for (let slice = 1; slice <= 4; slice += 1) assert(source.includes(`11.${slice}`), `${name} must record Phase 11.${slice}`);
  assert(source.includes('1.2.0'), `${name} must identify the Phase 11 closeout release`);
  assert(source.includes('RELEASE-AUDIT-1.2.0'), `${name} must link the v1.2.0 audit`);
}
assert(readme.includes('Phase 11 — Distribution & deployment ecosystem: COMPLETE'), 'English README must close Phase 11');
assert(readmeEs.includes('Fase 11 — Ecosistema de distribución y despliegue: COMPLETADA'), 'Spanish README must close Phase 11');

for (const [name, source] of [['ROADMAP', roadmap], ['ROADMAP.es', roadmapEs]]) {
  for (let slice = 1; slice <= 4; slice += 1) assert(source.includes(`11.${slice}`), `${name} must record Phase 11.${slice}`);
  assert(source.includes('1.2.0'), `${name} must record the v1.2.0 distribution release`);
}
assert(roadmap.includes('Phase 11 — Distribution & deployment ecosystem — COMPLETE'), 'English ROADMAP must close Phase 11');
assert(roadmapEs.includes('Fase 11 — Ecosistema de distribución y despliegue — COMPLETADA'), 'Spanish ROADMAP must close Phase 11');

assert(changelog.includes('## [1.2.0] - 2026-08-29'), 'CHANGELOG must contain the Phase 11 v1.2.0 release');
assert(changelog.includes('Phase 11'), 'CHANGELOG must record Phase 11 completion');
assert(changelog.includes('first audited public OCI distribution'), 'CHANGELOG must record the first public OCI distribution contract');

for (const [name, source] of [['audit', audit], ['audit ES', auditEs]]) {
  assert(source.includes('RELEASE APPROVED FOR v1.2.0'), `${name} must approve v1.2.0`);
  assert(source.includes('Phase 11'), `${name} must identify Phase 11 closeout`);
  assert(source.includes('v1.1.0'), `${name} must preserve the historical no-image decision`);
  assert(source.includes('MINOR'), `${name} must classify v1.2.0 as MINOR`);
}
assert(notes.includes('Open Travel Platform v1.2.0'), 'English notes must target v1.2.0');
assert(notesEs.includes('Open Travel Platform v1.2.0'), 'Spanish notes must target v1.2.0');

const gates = [
  'check:container',
  'check:registry-provenance',
  'check:deployment-recipes',
  'check:release-audit',
  'check:phase-11-distribution'
];
for (const gate of gates) assert(packageJson.scripts?.verify?.includes(gate), `verify must retain ${gate}`);

assert(publishContainer.includes('provenance: mode=max'), 'container publication must retain max provenance');
assert(publishContainer.includes('sbom: true'), 'container publication must retain SBOM');
assert(publishContainer.includes('Historical v1.1.0'), 'publisher must preserve historical v1.1.0 exclusion');
assert(publishContainer.includes('actions/attest@'), 'publisher must retain GitHub artifact attestation');

for (const token of [
  'docker pull "${IMAGE}:${TAG}"',
  'docker pull "${IMAGE}@${DIGEST}"',
  'org.opencontainers.image.revision',
  'org.opencontainers.image.version',
  'org.opencontainers.image.licenses',
  '.Provenance',
  '.SBOM',
  'gh attestation verify',
  'id -u',
  '/api/health/live',
  '/api/health/ready',
  'distribution-verification-${VERSION}.json',
  'gh release upload'
]) {
  assert(verifyDistribution.includes(token), `published-distribution verification must retain ${token}`);
}

assert(packageJson.scripts?.['check:phase-11-distribution'] === 'node scripts/phase-11-distribution-check.mjs', 'package must expose check:phase-11-distribution');

console.log('Phase 11 distribution closeout invariants passed for the v1.2.0 baseline.');
