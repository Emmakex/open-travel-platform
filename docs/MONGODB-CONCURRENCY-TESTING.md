# MongoDB concurrency validation

Phase 9B adds a real MongoDB replica-set integration test for booking integrity. This is intentionally separate from demo-mode smoke tests and source-only invariants.

## What is exercised

`npm run test:mongodb-concurrency` executes `MongoBookingRepository` against a disposable local MongoDB replica set and verifies:

- multi-document transaction rollback when departure inventory is reserved but a later accommodation-inventory step fails;
- concurrent booking attempts cannot oversell a departure;
- only committed reservations persist;
- the transactional integration outbox contains exactly one creation event per committed reservation;
- duplicate concurrent cancellation releases departure inventory once and emits one status-change event;
- cancelling all committed reservations restores departure inventory to zero.

## Destructive-test safety

The test drops its database before and after execution. It therefore refuses to run unless both conditions are true:

1. `MONGODB_DB_NAME` starts with `ktravel_ci_`;
2. `MONGODB_URI` points to `localhost` or `127.0.0.1` using `mongodb://`.

This prevents the CI harness from being pointed accidentally at MongoDB Atlas or another remote database.

## CI topology

GitHub Actions starts a dedicated `mongo:8.0.29` container with `--replSet rs0`, initializes a single-node replica set, waits for a writable primary and then executes the repository-level test.

A standalone MongoDB process without a replica set is not sufficient because the booking repository relies on real multi-document transactions.

The normal `npm run verify` command includes the static `check:mongodb-concurrency` contract gate but does not require MongoDB. The real database test runs in its own CI job so local development and safe demo builds stay credential-free.

## Local execution

Run a disposable local replica set and set, for example:

```text
MONGODB_URI=mongodb://127.0.0.1:27017/?replicaSet=rs0
MONGODB_DB_NAME=ktravel_ci_local
```

Then run:

```bash
npm run test:mongodb-concurrency
```

Never change the safety guard to permit a production or shared database merely to make the test easier to run.
