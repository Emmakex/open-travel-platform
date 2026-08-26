# Phase 9B — Critical E2E and concurrency validation

Phase 9B proves critical booking and payment behavior under realistic infrastructure conditions rather than expanding product scope.

## Current slice

The first slice validates `MongoBookingRepository` against a real MongoDB replica set in CI, including rollback, oversell prevention, transactional outbox consistency and idempotent cancellation inventory release.

## Next slices

1. payment finalization/webhook idempotency integration tests;
2. browser E2E for registration → booking → account → Operator visibility;
3. package/service/payment browser flows where provider credentials are not required;
4. credentialed Stripe/Redsys TEST/LIVE E2E when suitable provider accounts are available.

Phase 9B is not complete until the critical journeys have executable CI coverage and the roadmap/README are updated after those gates are green.
