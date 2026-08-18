# Security Policy

## Reporting a vulnerability

Please do not disclose exploitable vulnerabilities, secrets or personal data in a public issue.

Report security concerns privately to **eduardoyauri@emmake.com** with:

- affected component or file;
- reproduction steps;
- expected impact;
- suggested mitigation, if known.

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

## Demo identity warning

The built-in demo identities exist only to exercise fictional customer and staff UI. They are not production authentication or authorization mechanisms and must never protect real customer, booking, payment or operational data.

The demo staff entry intentionally lets a user choose between fixed fictional operator/admin identities. This is acceptable only because the demo contains no real privileged data. A production integration must derive roles from a trusted identity provider/backend.

Production identity defaults to disabled unless explicitly configured.

## Demo booking warning

The demo booking adapter stores at most five fictional reservation records in an HTTP-only cookie. The cookie is intentionally suitable only for demonstration data and does not provide production persistence, inventory locking, tamper-resistant booking integrity or payment protection.

Production booking defaults to disabled unless explicitly configured. Real bookings must use trusted persistence/booking infrastructure, revalidate inventory and pricing, and enforce reservation ownership server-side.

## Demo operations warning

The v0.5 operations adapter reads the same fictional browser-local reservation records and stores at most ten fictional audit events in an HTTP-only cookie. It is not a production backoffice, permissions system or compliance audit log.

Production operations default to disabled unless explicitly configured. Real staff workflows should use trusted multi-user persistence, server-side RBAC/ABAC as appropriate, validated state transitions and durable append-only audit/event infrastructure.

If a secret is committed accidentally, removing it in a later commit is not sufficient. Revoke or rotate the credential and assess Git history exposure.
