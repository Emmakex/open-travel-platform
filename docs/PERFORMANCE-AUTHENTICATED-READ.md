# Phase 9D-5.2 — Authenticated critical read load

This slice extends the Phase 9D-5 HTTP baseline into protected customer and Operator surfaces while preserving the same safety boundary: **measured load is read-only**.

## Real persistent sessions

The test does not introduce a test-only authentication bypass. Setup uses the supported MongoDB identity path:

- registers one persistent customer;
- creates the normal customer session token and sends it using the real `ktravel_session` cookie;
- creates/uses the configured bootstrap Admin and a normal staff session token using `ktravel_staff_session`;
- creates one reservation through the supported MongoDB booking repository so customer and Operator detail routes read the same real record.

Authentication setup, session creation and the single reservation fixture happen **before measurement starts**. They are not counted as load-test requests.

## Measured routes

Customer session:

- `/account`
- `/account/reservations`
- `/account/reservations/{reservationId}`

Staff session:

- `/operator`
- `/operator/reservations`
- `/operator/reservations/{reservationId}`
- `/operator/reservations/{reservationId}/workflow`

Each measured request is GET-only. Redirects to sign-in are considered failures; the baseline therefore verifies that the protected read actually executed under a valid persistent session rather than measuring an unauthenticated fallback page.

## Metrics and budgets

Every scenario records minimum/mean/p50/p95/p99/maximum latency, requests per second, request count, concurrency and failures. CI applies conservative p95 regression budgets because GitHub-hosted runners are variable. These budgets are **not production SLOs or final capacity guarantees**.

The first objective is repeatability: detect large regressions in authenticated server rendering, MongoDB session resolution, reservation reads and Operator aggregation before a change reaches `main`.

## Capacity boundary

The fixture uses one customer, one Admin, one reservation and bounded concurrency. It does not model production data volume, network distance, CDN behavior, Atlas tier sizing, provider latency or peak real-world traffic. Production thresholds must be calibrated separately using Kairoseth Travel traffic and hosting telemetry.

## What this does not test

This slice does not load-test POST mutations, booking creation, payment initiation, supplier actions, privacy execution or task/status transitions. Mutation throughput belongs in an isolated follow-up where transactional and inventory correctness can be verified after the load.
