# Getting started from a fresh clone

Phase 10.1 established the reproducible infrastructure-free evaluation path. Phase 10.2 added the provider-neutral standalone deployment path, and Phase 10.3 is now formalizing public extension contracts and reference adapters.

## Requirements

- Node.js 24 LTS
- npm 11 (the repository declares the expected npm version)
- Git

MongoDB, SMTP, Stripe, Redsys, CRM, ERP and supplier integrations are **not required** for the local demo profile.

## Fast local demo

```bash
git clone https://github.com/Emmakex/open-travel-platform.git
cd open-travel-platform
npm ci
npm run setup:demo
npm run dev
```

Open `http://localhost:3000`.

`npm run setup:demo` copies `.env.demo.example` to `.env.local`. It refuses to overwrite an existing `.env.local` by default. If you intentionally want to replace an existing local configuration, use:

```bash
npm run setup:demo -- --force
```

## What the demo profile enables

The demo profile uses the built-in fictional catalogue, temporary customer/staff identities and in-memory/demo booking and operations capabilities. It deliberately disables the persistent payment ledger and all outbound supplier, CRM, ERP and failure-transport integrations.

This is an evaluation profile, not a production configuration. Demo identities, demo booking writes and demo operations writes must not be enabled in a live deployment.

## Production-build smoke test

For a quick local check of the optimized Next.js build:

```bash
npm run typecheck
npm run build
npm start
```

Then verify at least:

- `http://localhost:3000/`
- `http://localhost:3000/trips`
- `http://localhost:3000/destinations`
- `http://localhost:3000/operator/sign-in`
- `http://localhost:3000/api/health/live`

The dedicated `Fresh clone demo` GitHub Actions workflow repeats the clean-checkout evaluation path and treats failure as blocking.

`npm start` is convenient for this local smoke. It is **not** the documented self-host production entrypoint. Provider-neutral self-host deployments use the prepared Next.js standalone runtime:

```bash
npm run build
npm run package:standalone
HOSTNAME=0.0.0.0 PORT=3000 node .next/standalone/server.js
```

See [`DEPLOYMENT.md`](DEPLOYMENT.md) for the complete runtime, secrets, reverse-proxy/TLS, readiness and rollback model.

## Moving beyond the demo

Use `.env.example` as the full configuration inventory when enabling persistent or production capabilities. Add capabilities deliberately rather than copying demo switches into production:

1. MongoDB for persistent catalogue/identity/booking/operations as required.
2. SMTP for transactional email.
3. provider credentials only for the payment provider you actually enable.
4. integration worker credentials only when outbound integrations are enabled.
5. production secret keyrings for encrypted payment, traveller-data and integration secrets.
6. `KTRAVEL_DEPLOYMENT_PROFILE=live` only after `/api/health/ready` is healthy with the intended live capability set.

Never commit `.env.local`, provider credentials, encryption keys or tokens.

## Extending the platform

Phase 10.3 is the active productisation block for public extension contracts.

Before implementing a new integration or changing an existing public adapter boundary, read:

- [`EXTENSION-CONTRACTS.md`](EXTENSION-CONTRACTS.md) — authority, compatibility/versioning and completion rules;
- [`ADAPTER-GUIDE.md`](ADAPTER-GUIDE.md) — implementation checklist;
- the capability-specific adapter contract where applicable.

External systems receive only the authority explicitly granted by their capability contract. Provider-specific payloads should remain inside adapters, and downstream systems such as CRM/ERP must not silently become booking/payment authority.

## Scope boundary

The public repository remains provider-neutral. `travel.kairoseth.com` is the Kairoseth reference/commercial deployment, not a required dependency for a fresh clone of Open Travel Platform. Kairoseth/customer-specific adapters may remain private while consuming the public extension contracts.