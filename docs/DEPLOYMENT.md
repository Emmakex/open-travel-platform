# Deployment guide

Open Travel Platform is provider-neutral and does not require one hosting vendor. The repository builds a Next.js `standalone` runtime that can be deployed on a VM, container platform, PaaS or another Node.js 24-compatible environment together with the durable services selected by the deployment.

`travel.kairoseth.com` is the Kairoseth reference/commercial deployment. It is not a runtime dependency of the MIT core.

Before a production rollout, read:

- [`RELEASES.md`](RELEASES.md) — release identity, SemVer, immutable tags and release sequence;
- [`MIGRATIONS.md`](MIGRATIONS.md) — configuration/data/wire/key migration classes, verification and rollback;
- [`CONTAINERS.md`](CONTAINERS.md) — provider-neutral OCI/Docker build, non-root runtime, runtime-only secrets and health checks when using containers;
- [`REGISTRY.md`](REGISTRY.md) — audited GHCR publication, immutable image identities, digest deployment, SBOM/provenance and attestation verification;
- [`PRODUCTION-CHECKLIST.md`](PRODUCTION-CHECKLIST.md) — final production review.

## Exact release identity

Production should deploy an exact reviewed release/commit, not an unpinned moving branch.

For a public release, the following identifiers must agree:

```text
package.json  -> X.Y.Z
Git tag       -> vX.Y.Z
CHANGELOG     -> ## [X.Y.Z] - YYYY-MM-DD
```

Build from the exact tagged source and its committed lockfile. Record the exact release/tag/commit in deployment operations so incidents and rollbacks can identify what was running.

Published tags are immutable. A deployment rollback selects an earlier known-good immutable release; it never moves or reuses a tag.

## Supported runtime shape

The current target is Node.js 24 LTS and npm 11. Use the reproducible install path:

```bash
npm ci
npm run check:release
npm run check:release-migrations
npm run verify
```

`next.config.ts` uses `output: "standalone"`. Build and prepare the transportable runtime with:

```bash
npm run build
npm run package:standalone
```

The prepared runtime lives at `.next/standalone`. Start it with protected runtime configuration already injected:

```bash
HOSTNAME=0.0.0.0 PORT=3000 node .next/standalone/server.js
```

Do not copy `.env.local` or production secrets into an artifact. Supply server-only configuration through the hosting platform's protected environment or secret manager.

The blocking `Self-host standalone` workflow validates clean install → build → package → standalone server → HTTP/static smoke without production secrets.

## Container deployment path

Phase 11.1 packages that same standalone runtime as a provider-neutral OCI/Docker image. It does not create a second application runtime.

```bash
docker build -t open-travel-platform:local .

docker run --rm \
  --env-file .env.demo.example \
  -p 127.0.0.1:3000:3000 \
  open-travel-platform:local
```

The final image runs as non-root user `app` (`10001:10001`). Privileged configuration remains runtime-injected; do not bake production `.env` files, MongoDB credentials, payment secrets, encryption keys or adapter tokens into layers.

The image healthcheck uses `/api/health/live`; production ingress/orchestrators should use `/api/health/ready` before routing traffic. Run `npm run check:container` for the static contract and rely on the blocking `Container distribution` workflow for a real Docker build/start/health/HTTP smoke.

See [`CONTAINERS.md`](CONTAINERS.md).

## Published container identity

Phase 11.2 defines GHCR as the public reference registry for audited releases without making it a runtime dependency. When a release is eligible for registry publication, use only its exact SemVer/source-SHA tags and resolve the immutable OCI digest.

```text
ghcr.io/emmakex/open-travel-platform:vX.Y.Z
ghcr.io/emmakex/open-travel-platform:sha-<full-source-sha>
ghcr.io/emmakex/open-travel-platform@sha256:<digest>
```

Production should deploy the digest, verify its GitHub artifact attestation and record release/tag/source-SHA/digest together. Do not use `latest`, major-only, minor-only or other moving aliases.

Run:

```bash
npm run check:registry-provenance
```

and follow [`REGISTRY.md`](REGISTRY.md) for SBOM/provenance/attestation verification. Historical `v1.1.0` is not a container release because its immutable source tag predates the Dockerfile.

## Build-time versus runtime configuration

`NEXT_PUBLIC_*` values are browser-visible and may be embedded at build time. Treat them as public configuration and rebuild when they change.

MongoDB credentials, encryption keys, payment secrets and worker tokens are server-only and must be injected securely at runtime. Never place privileged values in `NEXT_PUBLIC_*`.

Use `.env.example` as the full capability inventory and `.env.demo.example` only for evaluation.

## Migration review before deployment

Before deploying a revision, classify whether it changes:

- required environment/configuration;
- MongoDB collections, documents or indexes;
- payment/financial historical data;
- reservation/inventory semantics;
- public REST/event/signature contracts;
- encrypted/protected Traveller Data or key state.

If no migration is required, record that explicitly in the deployment/release review.

If migration is required, follow [`MIGRATIONS.md`](MIGRATIONS.md). Prefer **expand → migrate → contract** when compatible evolution is possible.

**Do not rely on application startup, import-time code or normal requests to run destructive persistent-data migrations.** Operational migrations must be deliberate, reviewable, verifiable and recoverable.

## Migration-bearing rollout

A safe migration-bearing production sequence is:

1. identify the exact current and target release/commit;
2. classify compatibility and migration type;
3. take and verify the required backup/restore point for high-risk or destructive changes;
4. deploy expand-compatible application changes first when possible;
5. run the migration deliberately with authorized operator access;
6. verify migration postconditions using counts/domain invariants, not only exit status;
7. verify readiness and critical customer/Operator flows;
8. observe business/infrastructure health during the compatibility window;
9. perform contract/destructive cleanup only after rollback requirements are satisfied;
10. record migration completion and the active release identity.

For irreversible changes, release notes must explicitly state that rollback is forward-only or requires backup restore.

## Deployment profile

Use:

```text
KTRAVEL_DEPLOYMENT_PROFILE=demo
```

for evaluation, and:

```text
KTRAVEL_DEPLOYMENT_PROFILE=live
```

for production.

`live` makes `/api/health/ready` fail closed when core demo modes remain active, the canonical URL is not HTTPS, required MongoDB is unavailable, or enabled adapters lack required configuration.

Do not use `live` as a cosmetic flag.

## Minimum production environment

A live deployment normally needs configuration equivalent to:

```text
KTRAVEL_PUBLIC_URL=https://travel.example.com
KTRAVEL_DEPLOYMENT_PROFILE=live
NEXT_PUBLIC_DATA_MODE=<persistent/public mode>
TRAVEL_DATA_MODE=<mongodb|rest as selected>
IDENTITY_MODE=<mongodb|reviewed adapter>
STAFF_AUTH_MODE=<mongodb|reviewed adapter>
BOOKING_MODE=<mongodb|reviewed adapter>
OPERATIONS_MODE=<mongodb|reviewed adapter>
PAYMENT_LEDGER_MODE=<mongodb when payments are enabled>
DEMO_IDENTITY_ENABLED=false
DEMO_BOOKING_ENABLED=false
DEMO_OPERATIONS_ENABLED=false
```

Add only credentials required by enabled capabilities. Disabled integrations should not need placeholder secrets to boot.

## Health endpoints

```text
GET /api/health/live
GET /api/health/ready
```

- **liveness**: process health;
- **readiness**: selected production profile and dependencies.

Use readiness to control traffic. Do not substitute liveness for readiness.

## Reverse proxy and HTTPS

Place the standalone Node process behind TLS/reverse proxy or managed ingress. The edge should:

1. terminate HTTPS on the canonical hostname;
2. redirect plain HTTP where applicable;
3. proxy to the private application port;
4. control forwarding headers according to the trust model;
5. enforce appropriate infrastructure request/body limits.

`KTRAVEL_PUBLIC_URL` must match the external HTTPS origin. Cookie-authenticated mutations validate browser `Origin`; additional exact origins use `KTRAVEL_ALLOWED_BROWSER_ORIGINS`.

Keep `KTRAVEL_TRUST_PROXY_IP_HEADERS=false` unless the trusted edge removes spoofable forwarding headers and supplies authoritative client-IP data. See [`PRODUCTION-SECURITY.md`](PRODUCTION-SECURITY.md).

## MongoDB and durable state

A safe MongoDB deployment includes:

1. least-privilege MongoDB/Atlas application user;
2. restricted network access where practical;
3. protected `MONGODB_URI` / `MONGODB_DB_NAME` configuration;
4. deliberate seeding/migration only for intended data;
5. selected persistent capability modes;
6. readiness and critical-flow verification;
7. immutable previous release plus tested backup/restore ownership.

For backfills use bounded batches, stable query/cursor criteria and explicit restart behavior. Do not commit connection strings.

## First persistent administrator

Use temporary `KTRAVEL_BOOTSTRAP_ADMIN_*` variables for the first MongoDB staff administrator. After successful sign-in:

1. remove the bootstrap password from runtime configuration;
2. redeploy/restart;
3. verify sign-in and readiness again.

Do not keep the bootstrap password permanently.

## Payments

Stripe/Redsys credentials are deployment-specific. Recommended provider rollout:

1. configure TEST profiles and required encryption key;
2. exercise checkout → signed callback → ledger reconciliation;
3. replay duplicate callbacks to verify idempotency;
4. test refunds/reconciliation where supported;
5. compare amount/currency/provider references with the provider dashboard;
6. promote to LIVE only after TEST sign-off;
7. run controlled LIVE smoke transactions before broad traffic.

Browser return URLs never replace signed callback verification. Credentialed TEST/LIVE E2E remains a deployment-specific external validation.

Payment-ledger migrations must preserve authoritative historical movement identity, amount, currency and refund/payment distinction. Never recompute historical movements from mutable current booking state.

## Outbound integrations and workers

When supplier, CRM or ERP/accounting adapters are enabled, configure a high-entropy `KTRAVEL_INTEGRATION_WORKER_TOKEN` and schedule:

```text
POST /api/internal/integrations/process
Authorization: Bearer <token>
```

Monitor retries, dead letters, readiness and downstream latency. Keep unused adapters disabled.

## Encryption keys and protected data

Use independent production keys for payment secrets, Traveller Data and integration secrets. Keep them stable, back them up securely and follow documented keyring/re-encryption procedures for rotation.

Never bake keys into `.next/standalone`, container layers, source control or logs.

Protected Traveller Data migrations must use minimum-necessary access and redacted/count-based output. Never emit protected values into migration logs.

## Immutable release layout

A self-host release should be reproducible from an exact Git tag/SHA. The artifact contains the standalone runtime; runtime configuration remains separate.

Keep the previous immutable artifact available so application rollback does not depend on rebuilding historical source with newer dependencies.

## Backups and rollback

Rollback planning covers both code and durable side effects:

- exact previous release/tag/SHA/artifact;
- MongoDB backup/restore point and tested restore ownership;
- schema/index compatibility window;
- encryption-key availability;
- external payment/integration actions that code rollback cannot undo.

Before each non-trivial migration declare whether rollback is application-only, reverse migration, backup restore, or irreversible/forward-only.

## Production verification

For the exact revision intended for release:

```bash
npm ci
npm run check:release
npm run check:release-migrations
npm run check:container
npm run check:registry-provenance
npm run verify
npm run build
npm run package:standalone
```

When deploying the container artifact, also perform the image build/run validation described in [`CONTAINERS.md`](CONTAINERS.md). For a published image, verify the exact OCI digest and attestation according to [`REGISTRY.md`](REGISTRY.md).

Then verify at minimum:

- `/api/health/live` = 200;
- `/api/health/ready` = 200 when intended dependencies are ready;
- public catalogue/static assets;
- customer authentication/account paths;
- enabled booking/payment flows;
- Operator sign-in and critical queues;
- integration worker behavior when enabled;
- migration-specific postconditions when the release contains a migration.

CI/demo tests do not replace deployment-specific sign-off.

## Final production review

Before launch review:

- [`RELEASES.md`](RELEASES.md);
- [`MIGRATIONS.md`](MIGRATIONS.md);
- [`CONTAINERS.md`](CONTAINERS.md) when deploying a container;
- [`REGISTRY.md`](REGISTRY.md) when deploying a published image;
- [`PRODUCTION-CHECKLIST.md`](PRODUCTION-CHECKLIST.md);
- [`PRODUCTION-SECURITY.md`](PRODUCTION-SECURITY.md);
- [`EXTERNAL-MONITORING.md`](EXTERNAL-MONITORING.md);
- `SECURITY.md`;
- payment/integration docs and applicable market regulation.
