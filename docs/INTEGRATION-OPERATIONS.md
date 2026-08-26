# Integration operations: scheduler, replay and observability

Phase 8B turns the Phase 8A outbound integration foundation into an operable delivery subsystem. It does not change the provider-neutral event contract and does not add provider-specific payloads to booking domains.

## What Phase 8B adds

- a server-only scheduled worker entrypoint;
- Bearer-token authentication independent from browser/Admin sessions;
- a durable global worker lease and minimum execution interval;
- bounded scheduler batches;
- Admin health metrics and detailed event/delivery diagnostics;
- audited dead-letter replay/requeue;
- bounded retention of completed successful delivery history;
- retention audit metadata without storing webhook secrets or protected traveller values.

## Scheduler endpoint

```text
POST /api/internal/integrations/process
Authorization: Bearer <KTRAVEL_INTEGRATION_WORKER_TOKEN>
```

There is intentionally no GET execution route. Responses are `no-store` and `nosniff`.

The worker token must be a server-only value with at least 32 characters:

```text
KTRAVEL_INTEGRATION_WORKER_TOKEN=
```

Do not expose it through `NEXT_PUBLIC_*`, HTML, client JavaScript, logs or scheduler URLs.

Example from a trusted deployment scheduler:

```bash
curl --fail-with-body \
  -X POST \
  -H "Authorization: Bearer $KTRAVEL_INTEGRATION_WORKER_TOKEN" \
  https://travel.example.com/api/internal/integrations/process
```

A deployment can call this endpoint from its native cron/scheduler facility. The platform does not claim background execution unless the deployment actually configures a scheduler.

## Worker limits

```text
INTEGRATION_WORKER_BATCH_SIZE=10
INTEGRATION_WORKER_MIN_INTERVAL_SECONDS=60
```

Server-side clamps:

- batch: `1..25`;
- minimum interval: `10..3600` seconds.

The scheduler and the Admin manual processor share a durable MongoDB worker lock. Individual deliveries also keep their Phase 8A leases, so a crashed process can recover without double-claiming active work.

Typical worker responses:

- `200` — authenticated run completed;
- `401` — Bearer token missing or invalid;
- `429` — another run owns the worker lease or the minimum interval has not elapsed; `Retry-After` is returned;
- `503` — `KTRAVEL_INTEGRATION_WORKER_TOKEN` is not configured;
- `500` — worker execution failed; the response remains generic and details belong in server logs/Admin diagnostics.

## Admin observability

`/operator/integrations` remains Admin-only and now includes:

- pending delivery count;
- delivering count internally used for health calculations;
- retrying count;
- dead-letter count;
- oldest currently due delivery;
- attempt success/failure rates for the last 24 hours;
- worker-auth configuration status;
- configured scheduled batch, minimum interval and retention window.

Recent delivery rows open a dedicated delivery diagnostic page. Event details are available from the delivery and event views.

Diagnostics intentionally do **not** render:

- signing secrets;
- the worker Bearer token;
- encrypted secret material;
- protected post-purchase traveller identity/document values.

The event page only shows the already-defined provider-neutral operational envelope.

## Dead-letter replay

Only a current `dead-letter` delivery can be manually requeued, and the server enforces the Admin role again even though the UI is Admin-only.

Replay behavior:

1. the delivery state and replay audit event are written in one MongoDB transaction;
2. the delivery returns to `pending`;
3. the current retry-cycle attempt counter resets to zero;
4. the existing durable attempt history is preserved;
5. the prior dead-letter/error/HTTP state is cleared from the live delivery record;
6. a new bounded retry cycle starts through the normal worker.

Replay audit stores identifiers, actor, previous attempt count and timestamp. It does not store signing secrets or protected traveller payloads.

## Health-rate semantics

The recent success/failure percentages are based on **delivery attempts** observed during the last 24 hours:

- success = attempt outcome `succeeded`;
- failure = attempt outcome `retrying` or `dead-letter`.

If there are no attempts in the window, rates are reported as unavailable rather than as a misleading 0%.

## Retention

```text
INTEGRATION_COMPLETED_RETENTION_DAYS=180
```

Server-side clamp: `30..3650` days.

Each scheduled/Admin worker run performs a bounded retention pass over old **successful** delivery history. At most 1,000 successful deliveries are considered per cleanup pass.

For eligible completed successes, the cleanup can remove:

- successful delivery records;
- their delivery-attempt rows;
- old event envelopes only when no remaining delivery still references the event.

The automatic completed-history policy does **not** purge:

- dead-letter deliveries;
- pending/retrying/delivering work;
- manual replay audit records;
- endpoint configuration audit records.

Each cleanup that removes data writes aggregate retention audit metadata: cutoff, retention days, and counts removed. It does not persist webhook payload copies or secrets.

## Security model

Phase 8B keeps all Phase 8A webhook protections:

- HTTPS-only destinations;
- DNS validation and private/reserved network rejection;
- DNS revalidation before each send;
- validated-IP pinning with original TLS SNI/HTTP Host;
- no redirects;
- bounded timeout and response size;
- HMAC-SHA256 signatures;
- encrypted write-only endpoint signing secrets;
- transactional event outbox and idempotent event/endpoint delivery pairs.

The scheduler endpoint adds a separate server-only credential. It never accepts an Admin cookie as a substitute for the worker Bearer token.

## Deployment checklist

1. Configure MongoDB and Phase 8A `INTEGRATION_SECRETS_KEY`.
2. Generate a high-entropy `KTRAVEL_INTEGRATION_WORKER_TOKEN` with at least 32 characters.
3. Configure batch/interval/retention values or keep safe defaults.
4. Configure the deployment scheduler to POST the internal worker endpoint using the Authorization header.
5. Confirm a manual/scheduled run in `/operator/integrations`.
6. Verify health metrics and delivery detail pages.
7. Test a controlled failing endpoint until retry/dead-letter behavior is visible.
8. Requeue that dead-letter from Admin and confirm the replay audit entry.

## Quality gate

```bash
npm run check:integration-operations
```

The invariant is included in `npm run verify` and GitHub CI.
