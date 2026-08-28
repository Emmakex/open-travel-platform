# Phase 9D-5.4 — Runtime resource and capacity baseline

Phase **9D-5.4** closes the CI-side performance/load readiness baseline by observing the application process itself while a production Next.js build is under bounded sustained load and a higher-concurrency spike.

## What this validates

The blocking Linux CI workflow starts a disposable local MongoDB 8 replica set, seeds controlled travel data, builds the production application and then lets the test own the `next start` process lifecycle.

The measured workload remains **read-only**. It mixes representative local GET requests across:

- `/api/health/live`;
- `/`;
- `/trips/barcelona-city-break/book`;
- `/account/sign-in`;
- `/operator/sign-in`.

The test first warms these routes, records a process baseline, then runs:

- **sustained load:** 240 requests at concurrency 12;
- **bounded spike:** 320 requests at concurrency 32.

Every request must return HTTP 200. The process must remain alive throughout the spike and `/api/health/live` must still succeed after the load.

## Runtime signals

Linux `/proc` is sampled while the load runs. The baseline records:

- resident set size (**RSS / VmRSS**);
- process high-water RSS (**VmHWM**);
- open **file descriptors**;
- process thread count.

The CI gate applies deliberately conservative ceilings to absolute RSS, RSS growth, file-descriptor growth, post-load descriptor recovery and thread growth. These checks are intended to catch obvious leaks, runaway resource growth and failure to recover after a bounded burst.

The test also emits p50/p95/p99 latency and throughput for both sustained and spike phases.

## CI budgets are not production SLOs

The runtime budgets are **not production SLOs**, sizing guarantees or customer-facing capacity commitments. GitHub-hosted runners differ from the Kairoseth Travel production environment in CPU allocation, memory, network, filesystem, process model, CDN/cache behavior and MongoDB topology.

A green CI run means that the reference application remains bounded and recoverable under this repeatable synthetic profile. It does not prove the maximum safe production traffic level.

## Production capacity thresholds

For each production deployment, establish thresholds from real telemetry and traffic rather than copying CI numbers. At minimum track:

- p50/p95/p99 response latency by route family;
- 4xx/5xx and transport-failure rates;
- application RSS, heap, CPU and event-loop delay;
- file-descriptor and socket pressure;
- active requests and connection counts;
- MongoDB connection-pool usage, slow queries and Atlas saturation signals;
- integration worker queue depth/lag;
- payment-provider latency separately from local application latency.

Recommended operational triggers should be expressed as trends and sustained windows, for example:

1. investigate when p95 latency materially departs from the deployment's rolling baseline for several consecutive intervals;
2. scale or reduce load before RSS/heap approaches the hosting memory limit or repeated GC pressure degrades latency;
3. investigate file-descriptor/socket growth that does not return toward baseline after traffic falls;
4. investigate database pool saturation or slow-query evidence before adding infrastructure or indexes;
5. re-run a production-like load test after meaningful changes to catalogue size, traffic shape, hosting tier, database tier or server runtime.

## Database and provider boundary

This slice does not add indexes. Phase 9C-8 remains authoritative for query-plan evidence, and Phase 9D-5.3 remains authoritative for bounded mutation throughput plus post-load booking/inventory/outbox correctness.

Stripe/Redsys credentialed TEST/LIVE validation remains a separate provider-dependent requirement. External PSP latency must not be folded into the local application resource baseline.

## Phase 9D-5 evidence set

With 9D-5.4, the performance/load readiness baseline consists of:

- **9D-5.1:** public/read-only HTTP latency and throughput;
- **9D-5.2:** authenticated customer and Operator read load using real persistent sessions;
- **9D-5.3:** bounded reservation/cancellation mutation throughput with post-load correctness;
- **9D-5.4:** runtime RSS/file-descriptor/thread observations, bounded spike survival and production capacity guidance.

These four slices provide a repeatable regression baseline while keeping final capacity planning deployment-specific.
