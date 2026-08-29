# Provider-neutral deployment recipes

> Phase 11.3 deployment/orchestrator baseline. This slice is only officially complete after its PR is green, merged to `main` and the merged `main` revision is verified.

Open Travel Platform keeps deployment examples deliberately small and provider-neutral. They reuse the OCI runtime defined in [`CONTAINERS.md`](CONTAINERS.md) and the immutable registry/provenance contract in [`REGISTRY.md`](REGISTRY.md); they do not introduce a second application packaging model.

## Important release note

The immutable `v1.1.0` source tag predates the Dockerfile, so **there is intentionally no retroactive v1.1.0 container image**. The production recipes below are templates for a future audited image published by the Phase 11.2 workflow. Phase 11.4 will verify the first published distribution artifact end to end.

Production image identity must look like:

```text
ghcr.io/emmakex/open-travel-platform@sha256:<verified-digest>
```

Never deploy `latest`, a major/minor moving alias or an unverified digest.

## Supported recipe surfaces

- `deploy/compose/compose.demo.yml` — local evaluation and controlled smoke using the repository Dockerfile and secret-free demo profile.
- `deploy/compose/compose.production.yml` — controlled self-host recipe consuming an already-published immutable OCI digest.
- `deploy/kubernetes/base/` — provider-neutral Kubernetes Deployment, ClusterIP Service and safe non-secret ConfigMap baseline.

These recipes do **not** bundle MongoDB, TLS certificates, ingress controllers, secret managers or proprietary Kairoseth/customer adapters.

## Docker Compose demo

The demo recipe builds the same repository Dockerfile verified by Phase 11.1 and uses `.env.demo.example`.

```bash
docker compose -f deploy/compose/compose.demo.yml up -d --build --wait
curl --fail http://127.0.0.1:3000/api/health/live
curl --fail http://127.0.0.1:3000/api/health/ready
docker compose -f deploy/compose/compose.demo.yml exec -T app id -u
docker compose -f deploy/compose/compose.demo.yml down --volumes
```

Expected UID is `10001`. The service binds only to `127.0.0.1:3000`, uses a read-only root filesystem, a bounded ephemeral `/tmp`, drops Linux capabilities and enables `no-new-privileges`.

This path is for evaluation/smoke, not for pretending demo-mode state is a production database.

## Docker Compose production recipe

Prepare a runtime environment file outside the repository. Start from `.env.example`, select the real persistence/auth/integration modes you need, and inject credentials at runtime only.

Set the immutable image reference explicitly:

```bash
export OTP_IMAGE='ghcr.io/emmakex/open-travel-platform@sha256:<verified-digest>'
export OTP_ENV_FILE='/absolute/path/to/open-travel-platform.production.env'
export OTP_BIND_ADDRESS='127.0.0.1'
export OTP_PORT='3000'

docker compose -f deploy/compose/compose.production.yml config
docker compose -f deploy/compose/compose.production.yml pull
docker compose -f deploy/compose/compose.production.yml up -d --wait
```

The production Compose file contains no `build:` block by design. It consumes the audited artifact rather than rebuilding source on the deployment host.

### External state

MongoDB and other durable services remain external operational dependencies. Do not add a bundled production MongoDB container to this recipe. Configure replica-set/concurrency, backup/restore, encryption/privacy and index requirements using the existing production documentation before routing live traffic.

## Kubernetes baseline

`deploy/kubernetes/base/deployment.yaml` deliberately contains an all-zero digest placeholder:

```text
ghcr.io/emmakex/open-travel-platform@sha256:0000000000000000000000000000000000000000000000000000000000000000
```

Copy the baseline into an operator-controlled overlay and replace that placeholder with the **verified** digest before deployment. Do not commit production credentials to the public repository.

The baseline expects:

- ConfigMap `open-travel-platform-runtime` for safe non-secret runtime values;
- externally managed Secret `open-travel-platform-secrets` for privileged runtime configuration;
- externally managed MongoDB/stateful dependencies;
- external TLS/ingress or load-balancer configuration.

Example secret creation from a local protected env file:

```bash
kubectl create secret generic open-travel-platform-secrets \
  --from-env-file=/secure/path/open-travel-platform.secrets.env \
  --dry-run=client -o yaml | kubectl apply -f -
```

Do not store the generated Secret YAML in the public repository.

Render the provider-neutral base locally:

```bash
kubectl kustomize deploy/kubernetes/base
```

After replacing the digest in your controlled overlay:

```bash
kubectl apply -k /path/to/your/overlay
kubectl rollout status deployment/open-travel-platform
```

## Runtime security contract

Both recipes preserve the container security baseline:

- non-root UID/GID `10001:10001`;
- read-only root filesystem;
- bounded ephemeral `/tmp` only;
- no privilege escalation;
- all Linux capabilities dropped;
- Kubernetes `RuntimeDefault` seccomp profile;
- privileged values supplied at runtime, never baked into the image.

## Liveness and readiness

Use the endpoints for different purposes:

```text
/api/health/live   process liveness
/api/health/ready  production traffic readiness
```

Kubernetes wires both probes explicitly. Compose uses liveness for container health; any reverse proxy/load balancer admitting production traffic must check `/api/health/ready` or equivalent readiness semantics.

A process can be live while required production dependencies are not ready. Never replace readiness with a simple TCP-open check.

## Reverse proxy and TLS

Compose binds to loopback by default so an operator-controlled reverse proxy can terminate TLS on the same host. Kubernetes exposes only a `ClusterIP` Service by default. Choose your own ingress/controller/load-balancer; none is mandatory for the core.

At the edge:

- terminate TLS using certificates managed outside the application image;
- preserve the original `Host` and scheme/proxy metadata required by your deployment;
- do not trust forwarded client-IP headers unless `KTRAVEL_TRUST_PROXY_IP_HEADERS` and the surrounding trusted-proxy topology are deliberately configured;
- keep admin/operator surfaces behind the same authentication and server-side authorization boundaries as direct deployment;
- route live traffic only when `/api/health/ready` is healthy.

## Upgrade by digest

1. finish the normal source release gate;
2. verify the published OCI digest and GitHub attestation as described in `REGISTRY.md`;
3. record the currently deployed digest;
4. apply configuration/data migrations using `MIGRATIONS.md` / `UPGRADES.md` before the contract step where required;
5. change only the application image to the new verified digest;
6. wait for readiness/rollout completion;
7. run critical HTTP/application smoke checks;
8. keep the previous digest available for recovery.

For Compose, change `OTP_IMAGE` and run `pull` + `up -d --wait`. For Kubernetes, change the digest in the controlled overlay and wait for `kubectl rollout status`.

## Rollback by digest

Rollback is explicit, not alias-based. Restore the previously recorded digest and reapply the deployment recipe. If a release included non-backward-compatible data/configuration changes, follow the documented recovery path rather than assuming an application-only rollback is safe.

Do not use a moving tag to "roll back" because its historical identity is ambiguous.

## Validation

Static invariants:

```bash
npm run check:deployment-recipes
```

The blocking `Deployment recipe validation` GitHub Actions workflow additionally:

- renders both Compose recipes;
- renders the Kubernetes Kustomize baseline;
- performs a real Compose Docker build/start;
- verifies UID/GID `10001:10001`;
- requires HTTP success from `/api/health/live` and `/api/health/ready`.

`check:deployment-recipes` is part of `npm run verify`.

## Non-goals

Phase 11.3 does not:

- publish a new source release or OCI image;
- choose a mandatory cloud, Kubernetes distribution, ingress or secret manager;
- bundle production MongoDB/stateful services;
- put Kairoseth/customer credentials or proprietary adapters in the MIT core;
- replace the release/provenance controls from Phases 10 and 11.2.

The first published distribution artifact and clean pull/run verification belong to Phase 11.4.
