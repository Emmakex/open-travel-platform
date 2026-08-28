# Performance and load readiness

Phase **9D-5** establishes repeatable performance/load evidence for Open Travel Platform and the Kairoseth Travel reference deployment without coupling the MIT core to one hosting provider or adding speculative database indexes.

The CI baselines are regression signals. They deliberately separate local application behavior from deployment-specific production capacity and external provider latency.

## 9D-5.1 — Public/read-only HTTP baseline

A blocking production-build baseline exercises representative GET surfaces against a disposable local MongoDB replica set:

- `/api/health/live`;
- `/`;
- `/trips/barcelona-city-break/book`;
- `/account/sign-in`;
- `/operator/sign-in`.

Each scenario warms the route and emits minimum/mean, p50/p95/p99/max latency, requests per second, concurrency and failure count. Any unexpected status or transport failure is blocking.

The first accepted CI evidence completed **150 requests with 0 failures**. Observed p95 values were approximately 35–59 ms on the measured application routes, with liveness around 52 ms in that run. These figures are historical runner evidence, not fixed production expectations.

## 9D-5.2 — Authenticated critical reads

The authenticated baseline prepares one customer, one Admin session and one real MongoDB reservation before measurement. It uses the same persistent session creation APIs and cookie names as the application; no test-only authentication bypass exists.

Measured workload remains GET/read-only and covers:

- `/account`;
- `/account/reservations`;
- customer reservation detail;
- `/operator`;
- `/operator/reservations`;
- Operator reservation detail;
- Operator reservation workflow.

The first accepted CI evidence completed **156 authenticated requests with 0 failures and no authentication redirects**. Observed p95 values ranged from about 45.58 ms to 111.26 ms on that runner.

## 9D-5.3 — Bounded mutation throughput and post-load correctness

Mutation performance is isolated from the HTTP/read baselines. A disposable local MongoDB 8 replica set receives **32 concurrent reservation attempts against exactly 16 available spaces**.

The accepted result must be mathematically exact:

- 16 committed reservations;
- 16 expected `DEPARTURE_UNAVAILABLE` rejections;
- no oversell;
- unique committed reservation IDs;
- exactly one transactional outbox creation event per commit;
- concurrent cancellation of all committed reservations;
- final departure inventory exactly zero;
- exactly one cancellation event per committed reservation.

The first accepted run recorded create p95 **554.78 ms**, cancellation p95 **323.5 ms**, 16/16 expected capacity outcomes and `postLoadCorrectness: passed`.

Phase 9B remains the broader functional authority for rollback, oversell protection and duplicate-cancellation correctness. 9D-5.3 adds repeatable timing evidence at a larger bounded contention level.

## 9D-5.4 — Runtime resources, bounded spike and recovery

The closeout baseline owns a production `next start` process on Linux, samples `/proc` and runs two read-only mixed-route phases:

- sustained load: **240 requests / concurrency 12**;
- bounded spike: **320 requests / concurrency 32**.

It observes:

- resident set size (**RSS / VmRSS**);
- process high-water RSS (**VmHWM**);
- open file descriptors;
- process thread count;
- p50/p95/p99 latency and throughput.

The server must survive the spike, every measured request must return HTTP 200, post-load liveness must succeed, resource growth must remain within conservative CI ceilings and file descriptors must recover near the pre-load baseline. See `PERFORMANCE-RUNTIME-RESOURCE.md` for the detailed contract.

The first accepted run completed **560 requests with 0 failures**. Sustained load recorded p95 **109.10 ms** at approximately **184.01 requests/second**; the higher-concurrency spike recorded p95 **233.10 ms** at approximately **227.17 requests/second**. Process RSS moved from **193.78 MB** at the warmed baseline to a measured maximum/post-load value of **395.74 MB** (**+201.96 MB**), file descriptors moved from **40 to 84**, and the thread count remained **15 → 15**. The application remained alive and post-load liveness passed. These are accepted GitHub-runner observations, not production sizing figures.

## CI budgets are not production SLOs

GitHub-hosted runners are noisy and do not represent production infrastructure, network distance, CDN behavior, Atlas tier sizing or real traffic distribution. The CI thresholds are regression budgets intended to catch large deterioration, leaks or unbounded resource growth in a repeatable environment. They are **not production SLOs, capacity promises or customer-facing latency guarantees**.

Production targets must be calibrated from the actual Kairoseth Travel deployment and any other deployment using this core.

## Production capacity signals

At minimum, production monitoring should establish rolling baselines and alerts for:

- p50/p95/p99 server response latency per critical route family;
- request rate, 4xx/5xx and transport failures;
- RSS, heap, CPU and event-loop delay;
- file-descriptor/socket pressure;
- active requests and connection counts;
- MongoDB pool pressure, slow-query evidence and Atlas saturation;
- integration worker queue depth/lag;
- external Stripe/Redsys/provider latency separately from local application latency.

Re-run production-like capacity tests after meaningful changes to catalogue size, traffic distribution, hosting tier, database tier, Node/Next runtime or integration topology.

## Capacity assumptions

The blocking CI evidence intentionally assumes:

- one application process on a GitHub Linux runner;
- one local MongoDB 8 replica-set member;
- seeded controlled catalogue/departure data;
- no external Stripe, Redsys, CRM, ERP or supplier network calls;
- bounded synthetic concurrency;
- no extra CDN/cache layer beyond the production Next.js build.

These assumptions make regression comparison repeatable. They do not describe final production topology or maximum safe traffic.

## Database boundary

Phase 9C-8 already validates supported MongoDB indexes and representative query plans with real `explain("executionStats")` evidence. A slow HTTP or runtime-resource scenario is not, by itself, justification for adding an index. Database changes require query-plan evidence and must preserve the existing index-performance gates.

## Provider boundary

Credentialed Stripe/Redsys TEST/LIVE end-to-end validation remains a separate provider-dependent production-hardening requirement. The performance harnesses do not simulate external PSP behavior, and provider latency must not be interpreted as local application capacity.

## Phase 9D-5 evidence set

The completed engineering baseline consists of:

1. **9D-5.1** public/read-only HTTP latency and throughput;
2. **9D-5.2** authenticated customer and Operator read load with real persistent sessions;
3. **9D-5.3** bounded booking/cancellation mutation throughput with post-load transactional correctness;
4. **9D-5.4** runtime RSS/file-descriptor/thread observations, bounded spike survival/recovery and production capacity guidance.

Together these layers provide repeatable regression evidence while keeping actual production sizing deployment-specific.
