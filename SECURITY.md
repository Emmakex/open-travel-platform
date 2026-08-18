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
- Session cookies should be HTTP-only, use appropriate `SameSite`/`Secure` settings and have a defined lifetime.
- Reservation ownership must be checked server-side before customer reads or mutations.
- Prices, totals, availability and capacity used for booking decisions must be resolved or revalidated on trusted server-side sources rather than accepted from browser input.
- Operational status transitions must be validated on the server and should produce durable audit records in production.
- Production integrations should apply rate limiting, abuse controls, observability and incident-response procedures appropriate to their deployment.

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

When production mode variables are omitted, identity, booking and operations demo capabilities default to disabled. Enabling the fictional demo capabilities in a public production deployment must never expose real customer, booking, payment or privileged operational data.

Review `docs/PRODUCTION-CHECKLIST.md` before any real deployment.

## Accidental secret exposure

Removing a committed secret in a later commit is not sufficient. Revoke or rotate it immediately, assess Git history/log exposure and determine whether history rewriting or additional incident response is required.
