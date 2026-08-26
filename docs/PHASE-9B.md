# Phase 9B — Critical E2E and concurrency validation

Phase 9B proves critical booking and payment behavior under realistic infrastructure conditions rather than expanding product scope.

## Completed slice — booking concurrency

`MongoBookingRepository` now runs against a real MongoDB replica set in CI, including rollback, oversell prevention, transactional outbox consistency and idempotent cancellation inventory release.

See [`MONGODB-CONCURRENCY-TESTING.md`](MONGODB-CONCURRENCY-TESTING.md).

## Current slice — payment idempotency

The current slice validates payment behavior against the same real replica-set boundary:

- unique provider payment references enforced physically by MongoDB;
- safe migration from the legacy non-unique provider-reference index;
- concurrent duplicate movement creation;
- provider webhook event claiming under concurrency;
- simultaneous finalization of one pending checkout;
- deterministic single succeeded-movement event and ERP delivery;
- Redsys merchant order used as the stable ledger reference.

See [`PAYMENT-IDEMPOTENCY-TESTING.md`](PAYMENT-IDEMPOTENCY-TESTING.md).

## Next slices

1. browser E2E for registration → booking → account → Operator visibility;
2. package/service/payment browser flows where provider credentials are not required;
3. credentialed Stripe/Redsys TEST/LIVE E2E when suitable provider accounts are available.

Phase 9B is not complete until the critical journeys have executable CI coverage and the roadmap/README are updated after those gates are green.
