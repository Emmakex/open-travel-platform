# Persistent browser E2E validation

Phase 9B executes the critical customer-to-operations booking journey in Chromium against the production Next.js server and a disposable MongoDB replica set.

## Critical journey

`tests/e2e/persistent-booking.spec.ts` verifies through browser UI only:

1. a new customer opens `/account/register` and creates a persistent MongoDB account;
2. the authenticated customer opens the real Barcelona trip booking page;
3. the customer selects the controlled MongoDB departure and enters a real adult traveller;
4. `Confirm reservation` submits the actual Server Action and redirects to the protected reservation detail;
5. the customer detail shows the generated reservation reference and traveller;
6. a separate browser context opens `/operator/sign-in`;
7. the one-time persistent bootstrap Admin is created/authenticated through the normal staff flow;
8. the Admin opens `/operator/reservations/{reservationId}` and sees the exact same reservation and traveller.

The test does not inject session cookies or call repository methods to create the customer/reservation.

## Runtime topology

GitHub Actions runs a dedicated `Browser E2E (non-blocking)` job with:

- exact `@playwright/test` 1.62.1;
- Chromium installed by Playwright;
- `mongo:8.0.29` as a single-node replica set;
- `TRAVEL_DATA_MODE=mongodb`;
- `IDENTITY_MODE=mongodb`;
- `STAFF_AUTH_MODE=mongodb`;
- `BOOKING_MODE=mongodb`;
- `OPERATIONS_MODE=mongodb`;
- `PAYMENT_LEDGER_MODE=mongodb`;
- demo identity/booking/operations switches disabled;
- `npm run build` followed by Playwright's `npm start` web server.

This deliberately exercises the built production application instead of `next dev`.

## CI policy

The browser E2E job is currently **informational and non-blocking**. It always runs and remains visible in GitHub Actions, including its failure diagnostics, but a browser-only failure does not fail the overall CI workflow or block a merge.

The following production gates remain blocking: static invariants, MongoDB booking concurrency/rollback, payment and webhook idempotency, TypeScript, production build, HTTP smoke tests and dependency audit.

This policy lets the team keep the browser journey as a useful regression signal while it is being stabilized. It should only be promoted back to a blocking gate after the journey is consistently reliable in CI.

## Seed safety

`tests/e2e/seed.ts` drops and seeds its database, so it refuses to run unless:

- `MONGODB_DB_NAME` starts with `ktravel_ci_`;
- `MONGODB_URI` uses `mongodb://`;
- the MongoDB hostname is `localhost` or `127.0.0.1`.

It reuses `seedDemoCatalogueToMongo()` and adds one controlled future departure for `trip-barcelona-city`.

## Staff bootstrap

The CI job provides a disposable `KTRAVEL_BOOTSTRAP_ADMIN_EMAIL`, password and display name. The Admin is created by the application's existing `ensureBootstrapAdmin()` flow when the staff sign-in surface is opened. The test does not insert a privileged user directly into MongoDB.

## Local execution

With a disposable local replica set running and the persistent environment variables configured:

```bash
npm run test:e2e:seed
npm run build
npx playwright install chromium
npm run test:e2e
```

Never point the seed command at Atlas or a shared database.
