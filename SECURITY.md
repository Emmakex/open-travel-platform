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
- Session cookies should be HTTP-only, use appropriate `SameSite`/`Secure` settings and have a defined lifetime.

## Demo identity warning

The built-in v0.3 demo session exists only to exercise fictional customer-account UI. It is not a production authentication or authorization mechanism and must never protect real customer, booking or payment data.

Production identity defaults to disabled unless explicitly configured. A production integration should use a real identity/session provider and enforce permissions server-side.

If a secret is committed accidentally, removing it in a later commit is not sufficient. Revoke or rotate the credential and assess Git history exposure.
