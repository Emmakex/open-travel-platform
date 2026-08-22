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
TRAVEL_DATA_MODE
MONGODB_URI
MONGODB_DB_NAME
IDENTITY_MODE
DEMO_IDENTITY_ENABLED
BOOKING_MODE
DEMO_BOOKING_ENABLED
OPERATIONS_MODE
DEMO_OPERATIONS_ENABLED
```

Never put a MongoDB URI, database password or privileged token in `NEXT_PUBLIC_*` variables.

## MongoDB catalogue rollout

A safe migration from the built-in demo catalogue to MongoDB is intentionally staged:

1. deploy the MongoDB-capable code while keeping `TRAVEL_DATA_MODE=demo`;
2. set `MONGODB_URI` and optionally `MONGODB_DB_NAME` in the hosting platform;
3. sign into the protected operator demo and open `/operator/catalogue`;
4. verify the MongoDB connection/counts;
5. use **Seed missing demo catalogue** once to insert the existing destinations/trips and create indexes;
6. set `TRAVEL_DATA_MODE=mongodb`;
7. redeploy and verify home, destinations, trips, booking and operator pages.

The seed is idempotent and inserts only records whose stable `id` is not already present. It does not overwrite existing catalogue records.

### Atlas networking

The runtime hosting the application must be allowed to connect to the Atlas cluster. Configure Atlas network access and a least-privilege database user appropriate for the deployment. Do not commit connection strings to GitHub.

## Build verification

CI should verify at minimum:

1. public-source safety checks;
2. release metadata consistency;
3. TypeScript;
4. production build;
5. HTTP smoke tests against the built app;
6. dependency audit.

The repository's GitHub Actions workflow implements this baseline and runs catalogue smoke tests in demo mode, so CI does not require production database credentials.

## Reverse proxy and TLS

Terminate HTTPS using the selected hosting platform/reverse proxy and redirect plain HTTP to HTTPS where applicable. Configure trusted proxy/header behavior according to the deployment environment rather than hard-coding provider assumptions into the application.

## Stateless vs durable data

MongoDB can now provide durable destination/trip catalogue storage. The included demo identity, booking and operations cookies are still browser-local fictional state.

Real multi-user deployments need durable shared persistence/services for bookings and operations as separate capability migrations. Do not rely on local process memory or the demo cookie adapters for production reservation state.

## Rollback

Deploy immutable revisions where possible and retain a known-good release for rollback. Because catalogue storage is selected by `TRAVEL_DATA_MODE`, a deployment can temporarily return to `demo` mode without deleting MongoDB data while investigating adapter/connectivity problems.

Database/schema migrations introduced by future adapters should be backward-compatible or have a documented rollback strategy.
