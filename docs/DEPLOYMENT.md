# Deployment guide

Open Travel Platform does not require one hosting provider. A deployment needs a Node.js-compatible environment capable of running a Next.js production build/server.

## Runtime

The v1 target is Node.js 24 LTS.

Typical build/start commands:

```bash
npm install
npm run verify
npm start
```

`npm run verify` builds the production application. Run it during CI before deployment rather than relying on runtime compilation.

## Safe production defaults

When the server runs with `NODE_ENV=production`, demo identity, booking and operations default to disabled unless explicitly configured.

For a real deployment, prefer production adapters. Do not enable fictional write adapters simply to make a deployment appear functional.

## Environment separation

Keep development/staging/production configuration separate.

Public configuration:

```text
NEXT_PUBLIC_SITE_NAME
NEXT_PUBLIC_SITE_TAGLINE
NEXT_PUBLIC_DATA_MODE
NEXT_PUBLIC_TRAVEL_API_URL
```

Browser-visible values must be safe to expose publicly.

Server-only capability configuration:

```text
IDENTITY_MODE
DEMO_IDENTITY_ENABLED
BOOKING_MODE
DEMO_BOOKING_ENABLED
OPERATIONS_MODE
DEMO_OPERATIONS_ENABLED
```

Production integrations may add their own server-only values for identity, booking, CRM/ERP or supplier adapters.

## Build verification

CI should verify at minimum:

1. public-source safety checks;
2. release metadata consistency;
3. TypeScript;
4. production build;
5. HTTP smoke tests against the built app;
6. dependency audit.

The repository's GitHub Actions workflow implements this baseline.

## Reverse proxy and TLS

Terminate HTTPS using the selected hosting platform/reverse proxy and redirect plain HTTP to HTTPS where applicable. Configure trusted proxy/header behavior according to the deployment environment rather than hard-coding provider assumptions into the application.

## Stateless vs durable data

The included demo cookies are browser-local fictional state. Real multi-user deployments need durable shared persistence/services for bookings and operations.

Do not rely on local process memory or the demo cookie adapters for production reservation state.

## Rollback

Deploy immutable revisions where possible and retain a known-good release for rollback. Database/schema migrations introduced by future adapters should be backward-compatible or have a documented rollback strategy.
