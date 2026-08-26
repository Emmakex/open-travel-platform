# Production security and operability baseline

Phase 9A adds a reusable production-hardening baseline around the existing application capabilities. It does **not** replace deployment-specific penetration testing, monitoring, backup/recovery, regulatory review or credentialed payment E2E.

## 1. HTTP security headers

`next.config.ts` applies the baseline globally:

- `Content-Security-Policy`;
- `Referrer-Policy: strict-origin-when-cross-origin`;
- `X-Content-Type-Options: nosniff`;
- `X-Frame-Options: DENY`;
- `Permissions-Policy` disabling camera, microphone, geolocation and browsing topics;
- `Cross-Origin-Opener-Policy: same-origin-allow-popups`;
- `Origin-Agent-Cluster: ?1`;
- `X-DNS-Prefetch-Control: off`;
- `X-Permitted-Cross-Domain-Policies: none`.

Production builds additionally send HSTS and `upgrade-insecure-requests`.

The CSP deliberately keeps HTTPS external forms/frames available because payment providers such as Redsys/Stripe may require hosted redirects, forms or frames. Inline styles/scripts remain permitted where the current Next.js runtime requires them. `unsafe-eval` is not allowed. A nonce-based CSP can be evaluated later as a stricter deployment-specific enhancement.

## 2. CSRF / browser mutation model

There are two browser mutation boundaries.

### Next Server Actions

The application uses Next Server Actions for most forms. Next performs its own Server Action Origin/Host protection. The core therefore does not add a second custom CSRF-token mechanism that would duplicate or conflict with that boundary.

### Cookie-authenticated Route Handlers

Explicit Route Handlers that accept browser mutations validate `Origin` through `browserMutationHasTrustedOrigin()` before authenticated mutation work:

- media upload;
- media deletion;
- protected traveller-data export POST.

Allowed origins are:

1. the request's own origin;
2. `KTRAVEL_PUBLIC_URL`;
3. exact origins listed in `KTRAVEL_ALLOWED_BROWSER_ORIGINS`.

Wildcards are intentionally unsupported.

Provider/server callbacks are different trust boundaries and must **not** use browser Origin as authentication:

- Stripe webhook: Stripe signature verification;
- Redsys notification: Redsys signature verification;
- integration worker: server-only Bearer authentication.

## 3. Authentication abuse controls

The existing account lockout remains in place. Phase 9A adds a second distributed rate-limit layer around:

- customer sign-in;
- staff sign-in;
- customer registration;
- customer password-reset requests;
- staff password-reset requests.

The collection is:

`travel_security_rate_limits`

Properties:

- MongoDB-backed so limits are shared by all application instances;
- atomic fixed-window counters;
- TTL cleanup;
- SHA-256 bucket identifiers;
- no raw email address or IP address stored in the rate-limit collection.

Current defaults:

| Scope | Subject limit | Client limit | Window |
| --- | ---: | ---: | ---: |
| Customer sign-in | 10 | 30 | 15 min |
| Staff sign-in | 8 | 20 | 15 min |
| Customer registration | 3 | 10 | 60 min |
| Customer password reset | 3 | 10 | 60 min |
| Staff password reset | 3 | 10 | 60 min |

The subject bucket is always active. The client-IP bucket is active only when trusted proxy IP headers are explicitly enabled.

Password-reset throttling preserves the same generic success response, avoiding account-enumeration signals.

## 4. Trusted proxy IP headers

Default:

```text
KTRAVEL_TRUST_PROXY_IP_HEADERS=false
```

Do not enable this simply because a proxy header exists.

Set it to `true` only when the selected edge/reverse proxy:

1. removes untrusted client-supplied forwarding headers; and
2. writes the authoritative client address itself.

When enabled, the server accepts the first valid address from:

- `CF-Connecting-IP`;
- `X-Real-IP`;
- first `X-Forwarded-For` entry.

Addresses are syntactically validated before use and are hashed before persistence.

## 5. Session baseline

Persistent customer and staff sessions already use:

- 32-byte random opaque tokens;
- SHA-256 token hashes in MongoDB rather than plaintext tokens;
- TTL indexes on session expiry;
- server-side revocation;
- `HttpOnly` session cookies;
- `Secure` cookies in production;
- `SameSite=Lax` for customer sessions;
- `SameSite=Strict` for staff sessions;
- separate customer/staff session boundaries;
- 30-day customer session lifetime;
- 8-hour staff session lifetime;
- all-session revocation after password changes.

These are application defaults, not a substitute for organization-specific session/lifecycle policy review.

## 6. Health and readiness

### Liveness

`GET /api/health/live`

Answers whether the Node.js application process can serve requests. It intentionally does not perform database or downstream calls.

### Readiness

`GET /api/health/ready`

Returns HTTP 200 when the configured application profile is ready, otherwise HTTP 503.

Both endpoints are dynamic, non-cacheable and marked `noindex`.

### Deployment profiles

```text
KTRAVEL_DEPLOYMENT_PROFILE=demo
```

`demo` keeps the reference/demo deployment usable without pretending that demo capabilities are production-ready.

For a real production rollout use:

```text
KTRAVEL_DEPLOYMENT_PROFILE=live
```

In `live`, readiness fails when:

- the canonical public URL is not valid HTTPS;
- a core catalogue/identity/staff/booking/operations capability is still in `demo` mode;
- a demo safety switch is enabled;
- MongoDB is required by the selected capabilities but is missing/unreachable;
- supplier/CRM/ERP REST delivery is enabled without a 32+ character integration worker token.

When MongoDB is required, readiness executes a MongoDB `ping`. The public response exposes only safe check categories, never connection strings, credentials or database errors.

## 7. Reverse proxies and multiple browser origins

`KTRAVEL_PUBLIC_URL` should be the canonical externally visible HTTPS URL.

If a legitimate browser mutation can originate from an additional exact origin, configure for example:

```text
KTRAVEL_ALLOWED_BROWSER_ORIGINS=https://ops.example.com,https://travel.example.com
```

Avoid broad allowlists. Each added origin becomes trusted for cookie-authenticated Route Handler mutation checks.

## 8. CI gate

Run:

```bash
npm run check:production-security
```

It verifies the baseline contracts including:

- defensive headers/CSP;
- no `unsafe-eval`;
- explicit browser Origin checks;
- external webhook/worker trust-boundary separation;
- hashed persistent rate-limit storage and TTL;
- auth/recovery throttling;
- hashed/expiring sessions and secure cookie attributes;
- liveness/readiness contracts;
- live-profile readiness rules;
- required environment documentation.

The GitHub Actions smoke test additionally starts the production build, verifies security headers and health endpoints, and confirms a foreign-Origin media POST receives 403 before privileged processing.

## 9. Still part of Phase 9

Phase 9A is a baseline. Production hardening still includes:

- credentialed Stripe/Redsys TEST/LIVE E2E;
- browser E2E for critical journeys;
- MongoDB concurrency/integration tests;
- centralized structured logs/error reporting;
- privileged-action audit review;
- key rotation/recovery procedures;
- backup/restore and disaster-recovery drills;
- GDPR/privacy/export/deletion/retention workflows;
- market-specific legal/regulatory review;
- accessibility and performance testing.
