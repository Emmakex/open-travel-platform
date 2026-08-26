# Integration worker operations

<p align="center"><strong>English</strong> · <a href="./INTEGRATION-OPERATIONS.es.md">Español</a></p>

Phase 8B turns the Phase 8A durable outbox into an operational integration subsystem that can run without an Admin browser session.

## Scheduler endpoint

Production schedulers/workers call:

```text
POST /api/internal/integrations/process?limit=25
Authorization: Bearer <INTEGRATION_WORKER_SECRET>
```

Rules:

- `POST` only;
- `INTEGRATION_WORKER_SECRET` is server-only and must contain at least 32 high-entropy characters;
- authentication is compared using a timing-safe digest comparison;
- the token is accepted only from the `Authorization` header, never from URL parameters;
- `limit` must be an integer between 1 and 100;
- responses are `no-store` and `nosniff`;
- a missing server secret fails closed with HTTP 503;
- missing/invalid authorization returns HTTP 401.

The route calls the same durable delivery processor used by the Admin diagnostic action. MongoDB delivery leases provide concurrency/crash recovery when more than one scheduler invocation overlaps.

## Suggested cadence

A deployment may invoke the endpoint every 1–5 minutes depending on expected event volume and delivery latency requirements. The application itself does not create an external scheduler; the hosting platform is responsible for triggering the POST request.

Do not put `INTEGRATION_WORKER_SECRET` in client code, browser JavaScript, `NEXT_PUBLIC_*`, URLs or query parameters.

## Queue health

`/operator/integrations` now reports:

- deliveries due now;
- pending/retrying/delivering/succeeded/dead-letter totals;
- oldest due delivery;
- last-24-hour attempt counts;
- 24h delivery-attempt success rate;
- worker-auth configuration status;
- configured succeeded-history retention period.

The UI never loads decrypted signing secrets to show queue diagnostics.

## Delivery detail

Admin users can open an individual delivery and inspect:

- durable delivery status;
- event and endpoint IDs;
- current-cycle attempt count;
- last HTTP status/error;
- next attempt time;
- versioned event envelope;
- complete retained attempt history;
- manual replay audit history.

The generic event envelope intentionally excludes protected post-purchase traveller values.

## Dead-letter replay

Only deliveries already in `dead-letter` can be manually requeued.

A requeue:

1. requires Admin identity;
2. requires a 10–500 character operational reason;
3. runs the delivery state change and replay-audit insert in one MongoDB transaction;
4. changes the delivery to `retrying` and schedules it immediately;
5. resets the current retry counter to zero so a new bounded retry cycle can run;
6. does **not** delete prior attempt records;
7. records actor, role, reason, prior attempt count and timestamp in `travel_integration_replay_audit`.

This means replay is explicit and traceable rather than a hidden mutation of failed history.

## Retention

Succeeded integration delivery/event/attempt history is retained for a configurable period:

```text
INTEGRATION_HISTORY_RETENTION_DAYS=180
```

The application clamps the value to 30–730 days. Each authenticated scheduler run performs a bounded cleanup batch.

Automatic retention:

- targets only `succeeded` deliveries older than the cutoff;
- removes their attempt history;
- removes an event only when no delivery still references it;
- never automatically removes `dead-letter` deliveries;
- keeps manual replay audit records as operational evidence.

This avoids an unbounded queue-history store while preserving unresolved failures for human review.

## Scheduler examples

Generic curl example:

```bash
curl -fsS -X POST \
  -H "Authorization: Bearer $INTEGRATION_WORKER_SECRET" \
  "https://travel.example.com/api/internal/integrations/process?limit=25"
```

Use the hosting platform's secret store when configuring scheduled jobs. Never hard-code the token in repository files.

## Failure model

The scheduler endpoint returning HTTP 200 means the batch itself executed; individual delivery failures are represented in the returned delivery counters and durable queue state. Delivery retries remain governed by the Phase 8A backoff/dead-letter rules.

A worker endpoint HTTP 500 means the batch could not complete at the application level and the scheduler may retry later. Existing delivery leases expire and can be recovered by a later run.

## Quality gate

Run:

```bash
npm run check:integration-worker
```

The invariant verifies:

- fail-closed server-only authentication;
- minimum worker-secret strength and timing-safe comparison;
- POST-only execution and bounded batch size;
- no query-string worker secrets;
- private response headers;
- Admin-only diagnostics/replay;
- dead-letter-only requeue with mandatory reason and transactional audit;
- queue-health metrics;
- bounded succeeded-history retention with dead-letter preservation.

The check is included in `npm run verify` and GitHub CI.
