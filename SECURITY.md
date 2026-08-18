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

If a secret is committed accidentally, removing it in a later commit is not sufficient. Revoke or rotate the credential and assess Git history exposure.
