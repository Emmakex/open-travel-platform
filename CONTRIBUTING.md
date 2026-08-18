# Contributing

Thanks for helping improve Open Travel Platform.

## Development setup

1. Fork or clone the repository.
2. Use Node.js 24 LTS and the npm version declared in `packageManager`.
3. Install the exact direct dependency/toolchain versions declared in `package.json` with `npm install`.
4. Copy `.env.example` to `.env.local` only when local overrides are needed.
5. Keep demo adapters enabled for local work unless the change specifically targets an integration adapter.

```bash
npm install
cp .env.example .env.local
npm run dev
```

The repository pins all direct runtime and development dependencies. CI additionally generates a fresh dependency lock and performs a clean `npm ci` installation before validation so pull requests are tested from a clean resolved graph.

## Required validation

Before opening a pull request, run:

```bash
npm run verify
```

`verify` checks public-source safety, release consistency, TypeScript and the production build. GitHub Actions additionally starts the built application, performs HTTP smoke tests and runs the dependency audit.

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

## Adapters

A production integration should implement the smallest appropriate capability interface and keep provider-specific payloads inside its adapter. See `docs/ADAPTER-GUIDE.md` before introducing a new provider.

## Pull requests

A pull request should explain:

- what changes and why;
- affected capability boundary;
- architecture/security implications;
- configuration or migration requirements;
- how the change was validated.

Small, focused pull requests are preferred. Breaking changes after 1.0 should include clear migration guidance.

## Security reports

Do not disclose exploitable vulnerabilities or secrets in public issues. Follow `SECURITY.md` for private reporting guidance.
