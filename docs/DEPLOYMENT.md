# Deployment guide

Open Travel Platform is provider-neutral and does not require one hosting vendor. The repository builds a Next.js `standalone` runtime that can be deployed on a VM, container platform, PaaS or another Node.js 24-compatible environment together with the durable services selected by the deployment.

`travel.kairoseth.com` is the Kairoseth reference/commercial deployment. It is not a runtime dependency of the MIT core and its private infrastructure is not required to self-host Open Travel Platform.

## Supported runtime shape

The current target is Node.js 24 LTS and npm 11. The repository versions `package-lock.json`; use the reproducible install path:

```bash
npm ci
npm run verify
```

`next.config.ts` uses `output: "standalone"`. The deployable application entrypoint is therefore **not** `next start`. Build and prepare the transportable runtime with:

```bash
npm run build
npm run package:standalone
```

`npm run package:standalone` keeps Next.js' traced standalone server and adds the assets that Next.js does not copy into the standalone folder automatically:

- `.next/static` → `.next/standalone/.next/static`
- `public` → `.next/standalone/public`

The resulting runtime root is `.next/standalone`. Start it with deployment environment variables already injected:

```bash
HOSTNAME=0.0.0.0 PORT=3000 node .next/standalone/server.js
```

Do not copy `.env.local` or production secrets into an image/artifact. Supply server-only configuration through the hosting platform's protected runtime environment or secret manager.

The blocking `Self-host standalone` workflow proves clean install → build → package → standalone server → HTTP/static-asset smoke without MongoDB or external provider credentials. This validates the public packaging contract, not production capacity.

## Build-time versus runtime configuration

`NEXT_PUBLIC_*` values are browser-visible and can be embedded at build time. Treat them as public configuration. If a deployment changes branding, public API origins or other `NEXT_PUBLIC_*` values, rebuild the artifact.

Server-only values such as MongoDB credentials, encryption keys, payment secrets and worker tokens must be injected securely at runtime. Never put privileged values in `NEXT_PUBLIC_*` variables.

Use `.env.example` as the full capability inventory and `.env.demo.example` only for local/infrastructure-free evaluation.

## Deployment profile

The readiness contract uses:

```text
KTRAVEL_DEPLOYMENT_PROFILE=demo
```

for evaluation/reference deployments, and:

```text
KTRAVEL_DEPLOYMENT_PROFILE=live
```

for a real production rollout.

`live` does not automatically enable capabilities. It makes `/api/health/ready` stricter so a deployment cannot present itself as ready while core demo modes remain active, the canonical URL is not HTTPS, required MongoDB is unavailable, or enabled integration adapters lack required server-side configuration.

Do not use `live` as a cosmetic flag. Change it only after the intended persistent capabilities and production secrets are configured.

## Minimum production environment

The exact environment is capability-driven, but a live deployment normally needs:

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

Add only the credentials required by enabled capabilities. Examples include `MONGODB_URI`, SMTP configuration, payment-provider profiles, `PAYMENT_SECRETS_KEY`, `TRAVELLER_DATA_KEY`, `INTEGRATION_SECRETS_KEY` and `KTRAVEL_INTEGRATION_WORKER_TOKEN`.

A deployment with an integration disabled must not need its credentials simply to boot.

## Health endpoints

Two non-cacheable endpoints are available:

```text
GET /api/health/live
GET /api/health/ready
```

`/api/health/live` is process-level liveness and intentionally avoids dependency checks. `/api/health/ready` evaluates the selected deployment profile and required infrastructure.

Recommended orchestration semantics:

- **liveness**: restart/alert when the process itself is unhealthy;
- **readiness**: remove the instance from traffic when configured dependencies or production requirements are not ready.

Do not use liveness as a substitute for readiness.

## Reverse proxy and HTTPS

Place the standalone Node process behind the selected TLS/reverse proxy or managed ingress in production. The edge should:

1. terminate HTTPS using the canonical hostname;
2. redirect plain HTTP where applicable;
3. forward requests to the private application port;
4. preserve or deliberately overwrite forwarding headers according to the trust model;
5. enforce infrastructure-level request/body limits appropriate to the deployment.

`KTRAVEL_PUBLIC_URL` must match the externally visible HTTPS origin.

Cookie-authenticated mutations validate browser `Origin`. Additional exact browser origins may be listed in `KTRAVEL_ALLOWED_BROWSER_ORIGINS`; wildcards are not supported.

Keep `KTRAVEL_TRUST_PROXY_IP_HEADERS=false` unless the trusted edge removes spoofed forwarding headers and supplies authoritative client-IP data. See `docs/PRODUCTION-SECURITY.md`.

## MongoDB and durable state

A production deployment should use persistent capability modes rather than demo writes. A safe MongoDB rollout is:

1. provision MongoDB/Atlas and a least-privilege application user;
2. restrict network access to the real deployment path where possible;
3. inject `MONGODB_URI` and `MONGODB_DB_NAME` through protected configuration;
4. seed/migrate only intended data;
5. enable the selected MongoDB-backed capability modes;
6. verify `/api/health/ready` and customer/Operator journeys;
7. retain an immutable known-good release and a tested data rollback/restore plan.

Do not commit connection strings.

## First persistent administrator

The first MongoDB staff administrator can be created with the one-time `KTRAVEL_BOOTSTRAP_ADMIN_*` variables. After sign-in succeeds:

1. remove `KTRAVEL_BOOTSTRAP_ADMIN_PASSWORD` from runtime configuration;
2. redeploy/restart with the secret removed;
3. verify staff sign-in and readiness again.

Do not keep the bootstrap password as a permanent administrative credential.

## Payments

Stripe and Redsys implementations live behind the provider-neutral payment boundary, but their credentials are deployment-specific. Recommended release sequence:

1. configure TEST provider profiles and the required encryption key;
2. exercise checkout → signed server callback → ledger reconciliation;
3. replay duplicate callbacks to verify idempotency;
4. exercise refunds/reconciliation where supported;
5. compare amount, currency and provider references with the provider dashboard;
6. promote to LIVE credentials only after controlled TEST sign-off;
7. repeat limited LIVE smoke transactions before general traffic.

Browser return URLs never replace signed provider callback verification. Credentialed Stripe/Redsys TEST/LIVE E2E remains a deployment-specific validation because the public repository intentionally carries no provider accounts or secrets.

## Outbound integrations and workers

When supplier fulfilment, CRM or ERP/accounting REST adapters are enabled, configure a high-entropy `KTRAVEL_INTEGRATION_WORKER_TOKEN` and schedule:

```text
POST /api/internal/integrations/process
Authorization: Bearer <token>
```

Monitor retries, dead letters, readiness and downstream latency. Disabled adapters should remain disabled rather than receiving placeholder credentials.

## Encryption keys and secrets

The platform separates key material by data class, including payment provider secrets, protected Traveller Data and integration signing secrets. Generate independent production keys, keep them stable, store them in a protected secret manager and document secure backup/recovery before ciphertext depends on them.

Never bake keys into `.next/standalone`, container layers, source control or logs. Rotation must follow the documented re-encryption/keyring procedure.

## Immutable release layout

A self-host release should be reproducible from an exact Git SHA. A simple artifact can contain only the prepared standalone runtime plus deployment metadata, for example:

```text
release/
  server.js
  .next/static/...
  public/...
  node_modules/...   # traced subset produced by Next.js standalone output
```

The deployment platform should inject runtime configuration separately. Keep the previous immutable release available so application rollback does not depend on rebuilding old source under new dependencies.

## Backups and rollback

Production rollback must cover both code and durable side effects:

- exact release SHA/artifact;
- MongoDB backup/restore point and tested restore ownership;
- backwards-compatible schema/index evolution where possible;
- encryption-key availability;
- payment/integration actions that cannot be undone by rolling code back.

Run a documented recovery exercise before launch and periodically thereafter.

## Production verification

For the exact revision intended for release:

```bash
npm ci
npm run verify
npm run build
npm run package:standalone
```

Then start the prepared `server.js` with staging/live-like configuration and verify at minimum:

- `/api/health/live` = 200;
- `/api/health/ready` = 200 once the intended dependencies are ready;
- public catalogue pages and static assets;
- customer authentication/account paths;
- booking and payment flows that are enabled;
- Operator sign-in and critical operational queues;
- background integration worker behavior when enabled.

CI credentials and demo smoke tests do not replace this deployment-specific sign-off.

## Final production review

Before launch review:

- `docs/PRODUCTION-CHECKLIST.md`;
- `docs/PRODUCTION-SECURITY.md`;
- `docs/EXTERNAL-MONITORING.md`;
- `SECURITY.md`;
- payment and integration adapter documentation;
- applicable privacy, travel, payment and consumer-law requirements for the operating market.
