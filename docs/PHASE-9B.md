# Phase 9B — Critical E2E and concurrency validation

Phase 9B proves critical booking and payment behavior under realistic infrastructure conditions rather than expanding product scope.

## Completed slice — booking concurrency

`MongoBookingRepository` runs against a real MongoDB replica set in CI, including rollback, oversell prevention, transactional outbox consistency and idempotent cancellation inventory release.

See [`MONGODB-CONCURRENCY-TESTING.md`](MONGODB-CONCURRENCY-TESTING.md).

## Completed slice — payment idempotency

Payment behavior is validated against the same real replica-set boundary:

- unique provider payment references enforced physically by MongoDB;
- safe migration from the legacy non-unique provider-reference index;
- concurrent duplicate movement creation;
- provider webhook event claiming under concurrency;
- simultaneous finalization of one pending checkout;
- deterministic single succeeded-movement event and ERP delivery;
- Redsys merchant order used as the stable ledger reference.

See [`PAYMENT-IDEMPOTENCY-TESTING.md`](PAYMENT-IDEMPOTENCY-TESTING.md).

## Current slice — persistent browser E2E

The current slice adds a real Chromium journey against the built production application with MongoDB-backed capabilities:

- persistent customer registration through the UI;
- authenticated trip booking through the traveller form and Server Action;
- protected customer reservation detail;
- separate persistent Admin authentication through the staff sign-in UI;
- the same generated reservation opened in Operator with the same traveller data;
- no demo identities and no injected session cookies.

See [`BROWSER-E2E-TESTING.md`](BROWSER-E2E-TESTING.md).

## Next slices

1. package/service/payment browser flows where provider credentials are not required;
2. credentialed Stripe/Redsys TEST/LIVE E2E when suitable provider accounts are available.

Phase 9B is not complete until the critical journeys have executable CI coverage and the roadmap/README are updated after those gates are green.
