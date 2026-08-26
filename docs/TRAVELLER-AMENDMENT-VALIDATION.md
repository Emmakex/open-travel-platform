# Traveller pricing and amendment validation

Phase 9B validates traveller/minor pricing and reservation amendments against a real disposable MongoDB replica set. This is a blocking CI gate; it does not rely on browser E2E or mocks.

## What the integration test proves

`tests/mongodb-traveller-amendments.ts` exercises production pricing and amendment code directly:

- age is calculated against the departure date, not the current date;
- the exact birthday boundary is covered: a traveller is 17 on 2099-06-14 and 18 on 2099-06-15;
- a minor without an adult guardian is rejected;
- departure-specific age-band prices are snapshotted;
- configurable `consumesInventory` rules are respected;
- changing departure recalculates age, price and inventory demand atomically;
- a child becoming an adult can change both customer total and inventory consumption;
- the amendment records actor, role, reason, before/after values, `priceDelta`, currency and inventory movement;
- existing successful payment ledger movements are not rewritten by repricing or traveller identity corrections;
- a traveller identity correction records its own audit entry without repricing the booking;
- insufficient capacity on the target departure aborts the transaction;
- a failed move leaves source inventory, target inventory, reservation state and amendment history unchanged.

## CI topology

The test runs in the existing blocking `mongodb-concurrency` GitHub Actions job with:

- `mongo:8.0.29`;
- a single-node replica set so MongoDB transactions are real;
- `OPERATIONS_MODE=mongodb` for the amendment step;
- a disposable database name beginning with `ktravel_ci_`.

Run locally only against a disposable local replica set:

```bash
OPERATIONS_MODE=mongodb \
MONGODB_URI='mongodb://127.0.0.1:27017/?replicaSet=rs0' \
MONGODB_DB_NAME='ktravel_ci_traveller_local' \
npm run test:mongodb-traveller-amendments
```

The test refuses remote MongoDB hosts and non-CI database names because it calls `dropDatabase()`.

## Financial authority

An amendment may change the current reservation total and records the delta explicitly, but historical payment/refund movements remain immutable. Reconciliation continues to compare the authoritative current reservation total against the append-only payment ledger rather than rewriting settled history.

## Browser E2E policy

The Playwright browser journey remains informational/non-blocking by project decision. Traveller/amendment validation is separate and blocking because it exercises deterministic domain and MongoDB transaction guarantees directly.

## Permanent gate

`npm run check:traveller-amendment-validation` protects the test topology and core assertions from being silently removed from CI.
