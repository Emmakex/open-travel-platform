# Security Policy

## Supported versions

Security fixes are targeted at the latest stable `1.x` release and the current `main` branch. Older pre-1.0 milestones are historical and are not maintained as separate supported release lines.

## Reporting a vulnerability

Please do not disclose exploitable vulnerabilities, secrets or personal data in a public issue.

Report security concerns privately to **eduardoyauri@emmake.com** with:

- affected component or file;
- reproduction steps;
- expected impact;
- suggested mitigation, if known.

Do not include real credentials or personal data unless strictly necessary; revoke exposed credentials before sending a report whenever possible.

## Repository security rules

- Never commit `.env` files other than `.env.example`.
- Never place secrets in `NEXT_PUBLIC_*` variables.
- Do not commit production API keys, passwords, cookies, private keys or access tokens.
- External integrations must be configurable and must not ship real production credentials.
- Demo data must not contain real customer information.
- Authentication providers must be integrated on trusted server-side boundaries.
- Private-resource authorization must not rely only on browser-visible state or UI role checks.
- Browser-supplied role values must never become authoritative permissions.
- Customer routes/actions must enforce customer access server-side.
- Staff routes/actions must enforce `operator`/`admin` access server-side.
- Persistent session tokens must remain opaque, hashed at rest, revocable server-side and bounded by expiration.
- Session cookies should remain HTTP-only, use appropriate `SameSite`/`Secure` settings and have a defined lifetime.
- Cookie-authenticated browser Route Handler mutations must validate their trusted Origin before privileged work. Provider webhooks and server-to-server workers must use their own signature/token trust boundary instead.
- Authentication and password-recovery surfaces must retain distributed abuse controls. Rate-limit storage must not introduce raw emails or client IPs into the security bucket collection.
- Forwarded client-IP headers are not trusted by default; enable proxy IP trust only when the deployment edge strips spoofed forwarding headers and writes authoritative values itself.
- Reservation ownership must be checked server-side before customer reads or mutations.
- Prices, totals, availability and capacity used for booking decisions must be resolved or revalidated on trusted server-side sources rather than accepted from browser input.
- Operational status transitions must be validated on the server and should produce durable audit records in production.
- Production integrations should apply rate limiting, abuse controls, observability and incident-response procedures appropriate to their deployment.
- Production HTTP responses should preserve the repository's CSP/security-header baseline unless a reviewed deployment-specific policy is stricter.
- Liveness/readiness endpoints must never disclose connection strings, secrets, raw database errors or protected customer data.

## Built-in Phase 9A baseline

The core includes a production security / operability baseline that is continuously checked by `npm run check:production-security`.

It currently covers:

- global Content Security Policy and defensive HTTP headers;
- production HSTS and insecure-request upgrade;
- explicit trusted-Origin validation for cookie-authenticated Route Handler mutations;
- persistent MongoDB authentication throttling with SHA-256 bucket identifiers and TTL cleanup;
- opt-in trusted-proxy client-IP throttling;
- hashed/expiring persistent session tokens and server-side revocation;
- `/api/health/live` and `/api/health/ready`;
- `KTRAVEL_DEPLOYMENT_PROFILE=demo|live`, where the live profile rejects demo capabilities and key infrastructure/configuration failures;
- CI smoke checks for security headers, health endpoints and foreign-Origin mutation rejection.

This baseline is intentionally provider-neutral and is not a claim that every deployment is production-ready by default. Review `docs/PRODUCTION-SECURITY.md` and `docs/PRODUCTION-CHECKLIST.md` before launch.

## Demo capability warnings

### Identity

The built-in demo identities exist only to exercise fictional customer and staff UI. They are not production authentication or authorization mechanisms and must never protect real customer, booking, payment or operational data.

The demo staff entry intentionally allows choosing between fixed fictional operator/admin identities. This is acceptable only because the demo contains no real privileged data. A production integration must derive roles from a trusted identity provider/backend and re-authorize requests server-side.

### Booking

The demo booking adapter stores a small number of fictional reservation records in an HTTP-only cookie. It does not provide production persistence, inventory locking, tamper-resistant booking integrity, concurrency protection or payment guarantees.

Real bookings must use trusted persistence/booking infrastructure, revalidate inventory and pricing, enforce reservation ownership and define idempotency/concurrency rules.

### Operations

The demo operations adapter reads the same fictional browser-local reservation records and keeps a small fictional audit history. It is not a production backoffice, permissions system or compliance audit log.

Real staff workflows should use trusted multi-user persistence, server-side RBAC/ABAC as appropriate, validated state transitions and durable append-only audit/event infrastructure.

## Production defaults

The public reference deployment may intentionally use the `demo` readiness profile. A real deployment should switch to `KTRAVEL_DEPLOYMENT_PROFILE=live` only after its selected capabilities and infrastructure have been configured and verified.

The live readiness profile is a fail-closed operational signal, not a substitute for browser E2E, payment-provider testing, backup/restore drills, privacy/regulatory review, observability or penetration testing.

Review `docs/PRODUCTION-CHECKLIST.md`, `docs/PRODUCTION-SECURITY.md` and `docs/DEPLOYMENT.md` before any real deployment.

## Accidental secret exposure

Removing a committed secret in a later commit is not sufficient. Revoke or rotate it immediately, assess Git history/log exposure and determine whether history rewriting or additional incident response is required.