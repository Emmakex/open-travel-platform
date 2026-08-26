# Deployment guide

Open Travel Platform does not require one hosting provider. A deployment needs a Node.js-compatible environment capable of running a Next.js production build/server and any durable services selected by its adapters.

## Runtime

The current target is Node.js 24 LTS.

Typical build/start commands:

```bash
npm install
npm run verify
npm start
```

`npm run verify` builds the production application. Run it during CI before deployment rather than relying on runtime compilation.

## Deployment profile

Phase 9A introduces an explicit readiness profile:

```text
KTRAVEL_DEPLOYMENT_PROFILE=demo
```

Use `demo` for the public reference/demo experience while fictional capabilities remain enabled.

A real production rollout should switch to:

```text
KTRAVEL_DEPLOYMENT_PROFILE=live
```

`live` does not enable capabilities. It makes readiness stricter so `/api/health/ready` returns 503 when core demo modes remain active, the canonical public URL is not HTTPS, required MongoDB is unavailable, or enabled outbound REST adapters lack the server worker token.

Do not use `live` as a cosmetic status flag. Treat it as the final production-readiness contract.

## Environment separation

Keep development, staging and production configuration separate.

Public/browser-safe configuration includes values such as:

```text
NEXT_PUBLIC_SITE_NAME
NEXT_PUBLIC_SITE_TAGLINE
NEXT_PUBLIC_DATA_MODE
NEXT_PUBLIC_TRAVEL_API_URL
```

Browser-visible values must be safe to expose publicly.

Important server-only configuration includes:

```text
KTRAVEL_PUBLIC_URL
KTRAVEL_DEPLOYMENT_PROFILE
TRAVEL_DATA_MODE
MONGODB_URI
MONGODB_DB_NAME
IDENTITY_MODE
STAFF_AUTH_MODE
BOOKING_MODE
OPERATIONS_MODE
PAYMENT_LEDGER_MODE
PAYMENT_SECRETS_KEY
TRAVELLER_DATA_KEY
INTEGRATION_SECRETS_KEY
KTRAVEL_INTEGRATION_WORKER_TOKEN
```

Never put a MongoDB URI, database password, encryption key or privileged token in `NEXT_PUBLIC_*` variables.

Use `.env.example` as the current configuration reference.

## Safe capability selection

For a real deployment:

- use production catalogue data through MongoDB or the configured API adapter;
- use persistent customer/staff identity or a reviewed external identity provider;
- use durable booking and operations persistence/adapters;
- keep `DEMO_IDENTITY_ENABLED`, `DEMO_BOOKING_ENABLED` and `DEMO_OPERATIONS_ENABLED` off for real data;
- configure the payment ledger explicitly when payments are used;
- enable supplier/CRM/ERP adapters only when their downstream services and worker scheduling are ready.

Do not enable fictional write adapters simply to make a deployment appear functional.

## Health endpoints

Two non-cacheable endpoints are available:

```text
GET /api/health/live
GET /api/health/ready
```

`/api/health/live` is a cheap process-level liveness check and intentionally does not call MongoDB or downstream services.

`/api/health/ready` evaluates the selected deployment profile and required infrastructure. When selected capabilities require MongoDB it performs a `ping`. In `live`, enabled supplier/CRM/ERP REST adapters also require a configured 32+ character integration worker token.

Use both endpoints for external monitoring:

- liveness: detect a dead/unresponsive process;
- readiness: detect a process that is running but cannot safely serve the configured production workload.

The readiness response exposes only safe check categories, not credentials or raw database errors.

## HTTP security and reverse proxy

Production responses include the Phase 9A security-header baseline from `next.config.ts`, including CSP, frame protection, `nosniff`, referrer policy and HSTS.

Terminate HTTPS using the selected hosting platform/reverse proxy and redirect plain HTTP to HTTPS where applicable.

`KTRAVEL_PUBLIC_URL` must be the canonical externally visible HTTPS origin.

Cookie-authenticated Route Handler mutations validate browser `Origin`. If another exact trusted browser origin is required, list it explicitly:

```text
KTRAVEL_ALLOWED_BROWSER_ORIGINS=https://ops.example.com
```

Wildcards are not supported.

### Trusted proxy client IP

Auth rate limiting always applies by normalized subject. Optional per-client-IP buckets can be enabled with:

```text
KTRAVEL_TRUST_PROXY_IP_HEADERS=true
```

Enable this only when the hosting/reverse-proxy edge removes spoofed forwarding headers and writes authoritative client-IP values itself. Otherwise leave it `false`.

See `docs/PRODUCTION-SECURITY.md` for the full trust model.

## MongoDB rollout

A safe migration from demo/reference data to MongoDB is intentionally staged:

1. deploy MongoDB-capable code while keeping the existing read mode;
2. set `MONGODB_URI` and optionally `MONGODB_DB_NAME` in protected hosting configuration;
3. confirm `/api/health/ready` and the protected Operator diagnostics relevant to the selected capability;
4. seed/migrate only the intended records;
5. switch the capability mode to `mongodb`;
6. redeploy and exercise customer and Operator workflows;
7. keep the previous immutable release available for rollback.

### Atlas networking

The runtime hosting the application must be allowed to connect to the Atlas cluster. Configure Atlas Network Access and a least-privilege database user appropriate for the deployment. Do not commit connection strings to GitHub.

## Persistent staff bootstrap

The first MongoDB staff administrator can be bootstrapped with the one-time `KTRAVEL_BOOTSTRAP_ADMIN_*` variables.

After the administrator exists and sign-in is verified:

1. remove `KTRAVEL_BOOTSTRAP_ADMIN_PASSWORD` from the hosting environment;
2. redeploy;
3. verify staff sign-in and `/api/health/ready` again.

Do not leave a bootstrap password configured as a permanent administrative credential.

## Payment rollout

Stripe/Redsys implementations exist behind the provider-neutral payment boundary, but credentials are deployment-specific.

Recommended sequence:

1. configure TEST provider profiles and `PAYMENT_SECRETS_KEY`;
2. run complete provider TEST checkout + signed callback + ledger reconciliation;
3. replay/duplicate callbacks to confirm idempotency;
4. exercise refunds where supported;
5. verify amounts/currency/provider references against the provider dashboard;
6. only then configure LIVE credentials;
7. repeat controlled LIVE smoke transactions before opening general traffic.

Browser return URLs never replace provider callback verification.

## Outbound integration worker

When supplier fulfilment, CRM or ERP/accounting REST adapters are enabled, configure:

```text
KTRAVEL_INTEGRATION_WORKER_TOKEN=<high-entropy 32+ chars>
```

Then configure the hosting scheduler to call:

```text
POST /api/internal/integrations/process
Authorization: Bearer <token>
```

Use the cadence documented in integration operations and monitor dead letters/readiness. The same durable worker/retry infrastructure is shared by generic webhooks and business adapters.

## Encryption keys and recovery

The platform uses separate server-only master keys for different data classes:

- `PAYMENT_SECRETS_KEY` — encrypted provider credentials;
- `TRAVELLER_DATA_KEY` — protected post-purchase traveller data;
- `INTEGRATION_SECRETS_KEY` — outbound webhook signing secrets.

Generate each independently, keep it stable and back it up through the organization's protected secret-management/recovery process. Removing or rotating a key without a controlled re-encryption migration can make stored ciphertext unreadable.

Never log or commit these keys.

## Build verification

CI verifies at minimum:

1. public-source safety/secret-pattern checks;
2. release metadata consistency;
3. domain-specific invariants;
4. production security baseline;
5. TypeScript;
6. production build;
7. HTTP/security-header/health smoke tests;
8. dependency audit.

The repository's GitHub Actions workflow uses safe demo/disabled capability defaults, so CI does not require production credentials.

## Backups and rollback

Deploy immutable revisions where possible and retain a known-good release for rollback.

A real production rollback plan must cover both application code and durable state:

- exact application release SHA;
- MongoDB backup/restore point;
- backwards-compatible schema/index changes where possible;
- encryption-key availability;
- payment/integration side effects that cannot be undone by rolling code back.

Perform a documented restore/disaster-recovery exercise before launch rather than treating backups as sufficient by themselves.

## Final production review

Before launch review:

- `docs/PRODUCTION-CHECKLIST.md`;
- `docs/PRODUCTION-SECURITY.md`;
- `SECURITY.md`;
- payment and integration adapter documentation;
- applicable privacy, travel, payment and consumer-law requirements for the operating market.
