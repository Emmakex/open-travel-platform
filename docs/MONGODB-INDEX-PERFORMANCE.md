# MongoDB index and performance review

Phase 9C-8 closes the production-hardening index review for the MongoDB-backed critical paths in Open Travel Platform.

The goal is not to maximize the number of indexes. Every extra index adds write amplification, storage and maintenance cost. This review therefore adds only indexes tied to real application query shapes and validates them with `explain("executionStats")` against a disposable MongoDB 8 dataset.

## Added critical indexes

### Reservations

- `travel_reservation_created` → `{ createdAt: -1 }`
  - supports the Operator reservation queue, which lists all reservations newest first;
  - prevents a full in-memory collection scan/sort as reservation volume grows.
- `travel_reservation_status` → `{ status: 1 }`
  - supports status-based reservation summary predicates;
  - complements, rather than replaces, trip/departure/customer compound indexes.

### Protected traveller data

- `traveller_data_customer_active` → `{ identityId, targetType, reservationId, retentionUntil }`
  - matches the customer post-purchase lookup including the retention boundary.
- `traveller_data_reservation_active` → `{ targetType, reservationId, retentionUntil }`
  - matches the Operator completion lookup without requiring customer identity.

The existing TTL index on `retentionUntil` remains authoritative for expiry. These compound indexes optimize reads; they do not change retention semantics.

### Integration worker / history

- `integration_delivery_due_queue` → `{ status, nextAttemptAt, createdAt }`
  - matches pending/retrying due-delivery selection.
- `integration_delivery_lease_queue` → `{ status, leaseUntil, createdAt }`
  - matches stale `delivering` lease recovery.
- `integration_delivery_created` → `{ createdAt: -1 }`
  - supports recent integration-delivery history.

The earlier generic queue index remains compatible and is not destructively removed in this hardening slice. A later measured production review may remove superseded indexes only after Atlas usage metrics prove they are unused.

## Existing indexes reviewed without additions

Payment transactions already have dedicated reservation/history, provider-reference idempotency and status/type indexes. Privileged/operations audit has chronological and reservation-scoped indexes. Operations tasks already have target, assignee and queue indexes. Adding more indexes there without measured evidence would be over-indexing.

## Automated query-plan gate

The dedicated MongoDB workflow seeds thousands of representative records and executes the same filter/sort shapes used by the application. It requires:

- the expected named index to appear in the winning/execution plan;
- no `COLLSCAN` on the validated critical path;
- bounded `totalDocsExamined` for selective/limited queries;
- the combined integration claim predicate to remain index-backed.

The gate uses real MongoDB 8 and `explain("executionStats")`; it does not rely only on static index declarations.

## Production Atlas follow-up

Synthetic CI proves query/index compatibility, not production cardinality or hardware behavior. After deployment, operators should periodically review Atlas Query Profiler / Performance Advisor and slow-query telemetry for:

- query latency and p95/p99 changes;
- keys examined versus documents returned;
- unexpected collection scans;
- index size and write amplification;
- indexes that remain unused over a representative traffic window.

Do not copy CI thresholds directly into production SLOs. Production tuning must use real workload volume and cardinality.

## Safe index lifecycle

1. Add new indexes before depending on them in production.
2. Verify application readiness and representative query plans.
3. Observe Atlas usage over a representative window.
4. Remove an older/superseded index only with evidence that it is not required by another query shape.
5. Roll back code independently from index removal whenever possible; additive indexes make application rollback safer.

This phase intentionally uses additive index changes so deployment rollback does not require an immediate database rollback.
