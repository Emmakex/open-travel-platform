# Performance and load readiness

Phase **9D-5** establishes repeatable performance/load evidence for Open Travel Platform and the Kairoseth Travel reference deployment without coupling the core to one hosting provider or adding speculative database indexes.

## 9D-5.1 — CI HTTP baseline

The first slice is a **read-only** blocking CI baseline against a production build and a disposable local MongoDB replica set.

The baseline covers representative request surfaces:

- process liveness: `/api/health/live`;
- public catalogue: `/`;
- trip booking read/render path: `/trips/barcelona-city-break/book`;
- customer authentication entry point: `/account/sign-in`;
- Operator authentication entry point: `/operator/sign-in`.

It does not submit bookings, payments, customer profile mutations or Operator actions under concurrent CI load. Stateful mutation/concurrency correctness is already covered by the dedicated MongoDB transaction/idempotency suites and should not be mixed with this HTTP latency baseline.

## Metrics

Each scenario performs a short warm-up and then a bounded number of concurrent requests. The test emits structured JSON containing:

- minimum and mean latency;
- **p50**, **p95** and **p99** latency;
- maximum latency;
- requests per second;
- request count, configured concurrency and failure count.

Any unexpected HTTP response or transport failure fails the baseline. Each scenario also enforces a deliberately conservative p95 CI budget.

## CI budgets are not production SLOs

GitHub-hosted runners are noisy and do not represent production infrastructure, network distance, CDN behavior, Atlas tier sizing or real traffic distribution. The current p95 thresholds are regression budgets intended to catch large performance deterioration in a repeatable environment; they are **not production SLOs, capacity promises or customer-facing latency guarantees**.

Production follow-up should establish environment-specific targets from observed traffic and infrastructure. Recommended starting signals are:

- p50/p95/p99 server response latency per critical route family;
- request/error rate and saturation during peak periods;
- MongoDB connection-pool pressure and slow-query evidence;
- CPU/memory/event-loop saturation on the application runtime;
- queue/worker lag for integration processing;
- payment/provider latency tracked separately from local application latency.

## Capacity assumptions

The CI baseline intentionally assumes:

- one application process on a GitHub Linux runner;
- one local MongoDB 8 replica-set member;
- seeded controlled catalogue and departure data;
- no external Stripe, Redsys, CRM, ERP or supplier network calls;
- bounded concurrency (currently 6–8 workers per scenario);
- no CDN/cache layer beyond what the production Next.js build itself provides.

These assumptions make regression comparison repeatable. They do not describe the final production topology.

## Database boundary

Phase 9C already validates the supported MongoDB index inventory and representative query plans using real `explain("executionStats")` evidence. Phase 9D-5 must build on that baseline. A slow HTTP scenario is not, by itself, justification for adding an index. Any database change requires query-plan evidence and should preserve the existing index-performance gates.

## Follow-up slices

After this read-only baseline, 9D-5 should add:

1. persistent authenticated customer-account and Operator read-path load using controlled seeded sessions/data;
2. bounded mutation throughput tests in isolated databases where transactional correctness can be rechecked after the load;
3. memory/CPU/event-loop and connection-pool observations where the deployment runtime exposes trustworthy telemetry;
4. production follow-up thresholds based on Kairoseth Travel traffic and hosting characteristics.

Credentialed Stripe/Redsys TEST/LIVE end-to-end validation remains a separate provider-dependent requirement and is not simulated by this load harness.
