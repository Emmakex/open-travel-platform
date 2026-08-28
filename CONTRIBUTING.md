# Contributing

Thanks for helping improve Open Travel Platform.

## Development setup

1. Fork or clone the repository.
2. Use Node.js 24 LTS and the npm version declared in `packageManager`.
3. Install the locked dependency graph with `npm ci`.
4. Run the non-destructive demo bootstrap for ordinary local work.
5. Keep external integrations disabled unless the change specifically targets that adapter/capability.

```bash
npm ci
npm run setup:demo
npm run dev
```

The demo bootstrap is infrastructure-free and does not require MongoDB, SMTP, payment-provider, CRM, ERP or supplier credentials. It refuses to overwrite an existing `.env.local` unless explicitly forced.

Use `.env.example` only when you need to configure persistent/live capabilities. Never commit production credentials or customer data.

## Required validation

Before opening a pull request, run:

```bash
npm run verify
```

`verify` runs the permanent safety/domain/security/extension-adjacent invariants, TypeScript validation and production build. Dedicated GitHub Actions workflows additionally exercise real MongoDB replica sets, local HTTP contracts, accessibility journeys, recovery and performance/resource baselines.

The broad registration -> booking -> customer -> Operator browser journey remains informational/non-blocking by explicit project policy; dedicated critical gates remain blocking.

## Architecture rules

- Keep `domain/` independent from Next.js, browser APIs, persistence and vendor SDKs.
- Add provider integrations behind repository/adapter boundaries instead of importing vendor SDKs throughout UI code.
- Do not expand `BookingRepository` into a staff administration API; internal workflows belong behind `OperationsRepository`.
- Keep authorization checks on trusted server-side boundaries. UI visibility is never sufficient authorization.
- Revalidate prices, availability, capacity, ownership and state transitions server-side for real write operations.
- Keep demo data fictional and free of real personal/customer information.
- Do not add production endpoints, credentials, cookies, access tokens or customer data to the repository.
- Document every environment variable in `.env.example` and deployment docs.
- New demo capabilities must default to disabled in production unless explicitly opted in.
- Provider-specific payloads must remain inside adapters and be normalized before entering shared domain types.
- A downstream provider must never silently gain booking, inventory, pricing or payment authority outside its explicit contract.

## Extensions and adapters

Phase 10.3 formalizes the public extension model. Before introducing or changing an adapter, read:

- [`docs/EXTENSION-CONTRACTS.md`](docs/EXTENSION-CONTRACTS.md) — authority, compatibility/versioning and Phase 10.3 contract;
- [`docs/ADAPTER-GUIDE.md`](docs/ADAPTER-GUIDE.md) — implementation rules and reference checklist;
- the capability-specific contract document for Booking, Supplier fulfilment, CRM, ERP/accounting or outbound integrations.

A production integration should implement the smallest appropriate capability interface and keep provider-specific authentication, payloads and status mapping inside its adapter.

Changes to public extension contracts should state whether they are backward-compatible or breaking. Provider API changes should be absorbed inside the adapter whenever possible rather than forcing unnecessary core-contract changes.

## Pull requests

A pull request should explain:

- what changes and why;
- affected capability/extension boundary;
- authority/security implications;
- whether a public contract changes and its compatibility impact;
- configuration or migration requirements;
- how the change was validated.

Small, focused pull requests are preferred. Breaking changes after 1.0 require clear migration/versioning guidance.

Kairoseth-specific or customer-specific adapters may remain outside the public MIT core when appropriate. The public core may define the contract they consume, but should not depend on proprietary implementations.

## Security reports

Do not disclose exploitable vulnerabilities or secrets in public issues. Follow `SECURITY.md` for private reporting guidance.