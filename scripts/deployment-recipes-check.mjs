import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

function read(relativePath) {
  const fullPath = path.join(root, relativePath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Deployment recipe invariant failed: missing ${relativePath}`);
  }
  return fs.readFileSync(fullPath, 'utf8');
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(`Deployment recipe invariant failed: ${message}`);
  }
}

function includes(source, token, message) {
  assert(source.includes(token), message);
}

function excludes(source, token, message) {
  assert(!source.includes(token), message);
}

const demoCompose = read('deploy/compose/compose.demo.yml');
const productionCompose = read('deploy/compose/compose.production.yml');
const deployment = read('deploy/kubernetes/base/deployment.yaml');
const service = read('deploy/kubernetes/base/service.yaml');
const configMap = read('deploy/kubernetes/base/configmap.yaml');
const kustomization = read('deploy/kubernetes/base/kustomization.yaml');
const workflow = read('.github/workflows/deployment-recipes.yml');
const releaseTemplate = read('.github/RELEASE_TEMPLATE.md');
const docsEn = read('docs/DEPLOYMENT-RECIPES.md');
const docsEs = read('docs/DEPLOYMENT-RECIPES.es.md');
const readmeEn = read('README.md');
const readmeEs = read('README.es.md');
const roadmapEn = read('ROADMAP.md');
const roadmapEs = read('ROADMAP.es.md');
const changelog = read('CHANGELOG.md');
const contributing = read('CONTRIBUTING.md');
const packageJson = read('package.json');

includes(demoCompose, 'build:', 'demo Compose must build the audited repository Dockerfile');
includes(demoCompose, '../../.env.demo.example', 'demo Compose must use the public secret-free demo profile');
includes(demoCompose, '127.0.0.1:3000:3000', 'demo Compose must bind to loopback by default');
includes(demoCompose, 'user: "10001:10001"', 'demo Compose must preserve the non-root runtime identity');
includes(demoCompose, 'read_only: true', 'demo Compose must use a read-only root filesystem');
includes(demoCompose, 'no-new-privileges:true', 'demo Compose must disable privilege escalation');

includes(productionCompose, '${OTP_IMAGE:?', 'production Compose must require an explicit immutable image reference');
excludes(productionCompose, 'build:', 'production Compose must consume a published artifact rather than rebuild source');
excludes(productionCompose, ':latest', 'production Compose must not use latest');
includes(productionCompose, '${OTP_ENV_FILE:-.env.production}', 'production Compose must inject runtime configuration externally');
includes(productionCompose, '${OTP_BIND_ADDRESS:-127.0.0.1}', 'production Compose must bind to loopback by default');
includes(productionCompose, 'user: "10001:10001"', 'production Compose must preserve the non-root runtime identity');
includes(productionCompose, 'read_only: true', 'production Compose must use a read-only root filesystem');
includes(productionCompose, 'cap_drop:', 'production Compose must drop Linux capabilities');
includes(productionCompose, 'no-new-privileges:true', 'production Compose must disable privilege escalation');

assert(/image:\s+ghcr\.io\/emmakex\/open-travel-platform@sha256:[0-9a-f]{64}/.test(deployment), 'Kubernetes image must be pinned by OCI digest');
excludes(deployment, ':latest', 'Kubernetes must not use latest');
includes(deployment, 'automountServiceAccountToken: false', 'Kubernetes must not mount a service-account token by default');
includes(deployment, 'enableServiceLinks: false', 'Kubernetes must not inject implicit service-link environment data');
includes(deployment, 'runAsNonRoot: true', 'Kubernetes pod must require non-root execution');
includes(deployment, 'runAsUser: 10001', 'Kubernetes container must preserve UID 10001');
includes(deployment, 'runAsGroup: 10001', 'Kubernetes container must preserve GID 10001');
includes(deployment, 'allowPrivilegeEscalation: false', 'Kubernetes must disable privilege escalation');
includes(deployment, 'readOnlyRootFilesystem: true', 'Kubernetes must use a read-only root filesystem');
includes(deployment, 'type: RuntimeDefault', 'Kubernetes must use the runtime-default seccomp profile');
includes(deployment, '- ALL', 'Kubernetes must drop all Linux capabilities');
includes(deployment, 'path: /api/health/live', 'Kubernetes must keep the liveness probe');
includes(deployment, 'path: /api/health/ready', 'Kubernetes must keep the readiness probe');
includes(deployment, 'configMapRef:', 'Kubernetes must inject non-secret runtime configuration externally');
includes(deployment, 'secretRef:', 'Kubernetes must reference externally managed secrets');
includes(deployment, 'emptyDir:', 'Kubernetes must provide only bounded ephemeral /tmp storage to the app container');

includes(service, 'type: ClusterIP', 'Kubernetes service must remain provider-neutral and internal by default');
includes(service, 'targetPort: http', 'Kubernetes service must target the named application port');
excludes(configMap.toLowerCase(), 'mongodb_uri', 'Kubernetes ConfigMap must not contain privileged MongoDB credentials');
excludes(configMap.toLowerCase(), 'password', 'Kubernetes ConfigMap must not contain passwords');
excludes(configMap.toLowerCase(), 'secret', 'Kubernetes ConfigMap must not contain secrets');
includes(kustomization, 'deployment.yaml', 'Kubernetes kustomization must include the Deployment');
includes(kustomization, 'service.yaml', 'Kubernetes kustomization must include the Service');
includes(kustomization, 'configmap.yaml', 'Kubernetes kustomization must include the ConfigMap');

for (const [name, source] of [
  ['demo Compose', demoCompose],
  ['production Compose', productionCompose],
  ['Kubernetes deployment', deployment],
  ['Kubernetes service', service],
]) {
  excludes(source.toLowerCase(), 'mongo:', `${name} must not bundle MongoDB`);
  excludes(source.toLowerCase(), 'mongodb:', `${name} must not bundle MongoDB`);
}

includes(workflow, 'npm run check:deployment-recipes', 'deployment workflow must run the permanent gate');
includes(workflow, 'docker compose -f deploy/compose/compose.demo.yml', 'deployment workflow must exercise the real demo Compose recipe');
includes(workflow, 'kubectl kustomize deploy/kubernetes/base', 'deployment workflow must render the Kubernetes baseline');
includes(workflow, '/api/health/live', 'deployment workflow must smoke liveness');
includes(workflow, '/api/health/ready', 'deployment workflow must smoke readiness');
includes(workflow, 'id -u', 'deployment workflow must verify the non-root runtime identity');

for (const [name, source] of [
  ['English deployment guide', docsEn],
  ['Spanish deployment guide', docsEs],
]) {
  includes(source, 'ghcr.io/emmakex/open-travel-platform@sha256:', `${name} must document digest-pinned deployment`);
  includes(source, '/api/health/live', `${name} must document liveness`);
  includes(source, '/api/health/ready', `${name} must document readiness`);
  includes(source, '10001', `${name} must document the non-root runtime identity`);
  includes(source, 'MongoDB', `${name} must document the external durable-state boundary`);
}

for (const [name, source] of [
  ['README.md', readmeEn],
  ['README.es.md', readmeEs],
  ['ROADMAP.md', roadmapEn],
  ['ROADMAP.es.md', roadmapEs],
  ['CHANGELOG.md', changelog],
  ['CONTRIBUTING.md', contributing],
  ['.github/RELEASE_TEMPLATE.md', releaseTemplate],
]) {
  includes(source, 'check:deployment-recipes', `${name} must remain synchronized with the Phase 11.3 permanent gate`);
}

includes(readmeEn, '11.3 Orchestrator/deployment recipes', 'English README must record Phase 11.3 status');
includes(readmeEs, '11.3 Recetas de orquestación/despliegue', 'Spanish README must record Phase 11.3 status');
includes(roadmapEn, '11.3     Deployment recipes / orchestrator examples ---------- COMPLETE', 'English ROADMAP must record Phase 11.3 completion');
includes(roadmapEs, '11.3     Recetas de despliegue / orquestadores ---------------- COMPLETADA', 'Spanish ROADMAP must record Phase 11.3 completion');
includes(changelog, 'Phase 11.3 Docker Compose demo recipe', 'CHANGELOG must record Phase 11.3');
includes(contributing, '**Phase 11.3**', 'CONTRIBUTING must record the Phase 11.3 deployment contract');
includes(releaseTemplate, '## Deployment recipes / orchestrators', 'release template must review deployment-recipe impact');

includes(packageJson, '"check:deployment-recipes": "node scripts/deployment-recipes-check.mjs"', 'package.json must expose check:deployment-recipes');
includes(packageJson, 'npm run check:deployment-recipes', 'npm run verify must include the deployment recipe gate');

console.log('Provider-neutral deployment recipe invariants passed.');
