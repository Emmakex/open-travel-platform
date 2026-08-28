# Phase 9D-5.3 — Bounded mutation throughput

This slice adds mutation performance evidence without turning shared CI into an uncontrolled stress test. It runs only against a **local isolated disposable MongoDB replica set**.

## Scenario

A dedicated departure exposes 16 spaces. The harness launches 32 concurrent reservation attempts through the supported `MongoBookingRepository`.

Correct behavior is intentionally bounded:

- exactly 16 reservations commit;
- exactly 16 attempts are rejected with `DEPARTURE_UNAVAILABLE`;
- departure `reservedSpaces` equals 16 after the saturation race;
- exactly 16 reservation documents exist;
- the transactional outbox contains exactly one `trip.reservation.created` event per committed reservation;
- committed reservation IDs remain unique.

The test then cancels all 16 committed reservations concurrently and requires:

- every cancellation commits once;
- departure inventory returns exactly to zero;
- all 16 reservations are `cancelled`;
- the outbox contains exactly one status-change event per committed reservation.

## Metrics

The harness reports p50/p95/p99 latency and wall-clock throughput for successful reservation creation and cancellation. Expected capacity rejections are measured separately and are not counted as application failures.

Conservative CI p95 budgets catch major regressions. They are **not production SLOs or final capacity guarantees** because GitHub runners, local MongoDB and the synthetic fixture do not represent production topology or traffic distribution.

## Why repository-level mutations

The goal of this slice is the transactional mutation core: inventory allocation, reservation persistence and transactional outbox behavior under contention. HTTP/browser load would add authentication, rendering and network variability already covered by 9D-5.1/9D-5.2, while making post-load transaction diagnosis less deterministic.

A future deployment-specific load exercise may test the full HTTP mutation path, but it must preserve the same inventory/outbox correctness checks and must never target live customer/provider environments without an explicit isolated test plan.

## Relationship to existing concurrency gates

The Phase 9B MongoDB concurrency suite remains the functional authority for rollback, oversell prevention and duplicate cancellation. 9D-5.3 adds timing/throughput regression evidence at a larger bounded contention level; it does not replace the earlier correctness gate.
