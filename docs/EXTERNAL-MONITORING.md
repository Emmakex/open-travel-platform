# External monitoring and actionable alert routing

Phase 9C-3 separates two different failure-detection channels so a total application or network outage cannot hide itself.

## Monitoring surfaces

Use an independent external uptime service outside the Open Travel Platform runtime.

### `GET /api/health/live`

Purpose: detect process, ingress, DNS/TLS or complete application unavailability.

- always remains dependency-free;
- returns HTTP `200` while the application process can serve requests;
- exposes only the stable health contract body;
- sends `X-OTP-Health-Contract-Version: 1`;
- sends a validated/generated `X-Request-Id`;
- disables caching and indexing.

Recommended baseline: poll every 60 seconds with a 5-second timeout. Alert after two consecutive failures and resolve after two consecutive successes. A liveness failure should route to **availability** and should normally page the responsible operator because the application may be completely unreachable.

### `GET /api/health/monitor`

Purpose: provide an externally safe readiness signal without exposing internal configuration, database or worker check details.

- returns HTTP `200` with `status: "ok"` when the deployment is ready;
- returns HTTP `503` with `status: "degraded"` when the existing production-readiness contract is not satisfied;
- returns HTTP `503` with `status: "unavailable"` if readiness evaluation itself fails;
- deliberately omits deployment profile and individual readiness checks;
- uses the same versioned health headers as liveness.

Recommended baseline: poll every 60 seconds. Treat two consecutive `503` responses as an actionable availability warning; escalate to urgent/page if degradation remains sustained for approximately five minutes or if customer impact is confirmed.

`/api/health/ready` remains the richer operational diagnostic endpoint. External public monitors should prefer `/api/health/monitor` because it exposes only the minimum stable contract required for uptime/readiness decisions.

## Why external polling must be independent

The optional `FailureTransport` added in Phase 9C-2 reports failures from inside the running application. It cannot report a complete process crash, DNS failure, TLS failure, routing failure, Hostinger outage or loss of network connectivity. Therefore production monitoring must use both:

1. **independent external polling** of `/api/health/live` and `/api/health/monitor`;
2. **internal structured failure delivery** through `FailureTransport` when configured.

Neither channel is authoritative for bookings, payments, inventory or integration state.

## Actionable alert routing

Every normalized failure sent through `FailureTransport` receives central routing metadata. Callers cannot override these values.

| Route | Typical source | Runbook | Default use |
|---|---|---|---|
| `availability` | health/readiness failures | `availability-health` | application/dependency availability |
| `payments` | Stripe/Redsys/payment webhook failures | `payment-processing` | payment processing incidents |
| `integrations` | durable integration worker failures | `integration-delivery` | webhook/CRM/ERP/supplier delivery incidents |
| `platform` | uncategorized operational failures | `platform-operations` | shared platform incidents |

Escalation is derived only from normalized severity:

- `warning` → `notify`
- `error` → `urgent`
- `critical` → `page`

The collector or monitoring provider may map these neutral values to email, SMS, phone, Slack, PagerDuty, Opsgenie or another operational channel. Provider-specific credentials and routing configuration stay outside the open-source core.

## Alert hygiene

- Group equivalent internal failures by the existing SHA-256 `fingerprint`.
- Do not create a new alert for every health poll; let the external monitor apply consecutive-failure and recovery rules.
- Invalid provider signatures, duplicate webhook deliveries and normal rate limiting are local operational signals, not pager events.
- Keep customer/traveller data, provider references, raw payloads, credentials and monetary values outside generic monitoring payloads.
- Correlation IDs are diagnostic only and never authorization credentials.

## Minimal production runbook expectations

### `availability-health`

1. Confirm both external liveness and external readiness state.
2. Check recent deployment/restart activity.
3. Check Hostinger/runtime health and public DNS/TLS reachability.
4. If liveness works but readiness fails, inspect `/api/health/ready` from an authorized operational context and verify required MongoDB/worker configuration.
5. Roll back the most recent deployment when degradation clearly correlates with it.

### `payment-processing`

1. Confirm provider status independently.
2. Inspect normalized payment failure events and correlation IDs.
3. Verify webhook reachability/signature configuration without replaying untrusted browser returns.
4. Preserve the authoritative local ledger and use idempotent provider replay/reconciliation procedures.

### `integration-delivery`

1. Check worker health and lease/rate-limit state.
2. Review dead-letter and recent delivery diagnostics.
3. Confirm downstream endpoint availability independently.
4. Requeue only through the audited replay flow.

### `platform-operations`

1. Identify the emitting component and fingerprint.
2. Correlate with deployment/runtime changes.
3. Escalate to the relevant domain runbook when a more specific cause is established.

## Deployment acceptance

Before calling a deployment production-ready, verify from outside the application host that:

- `/api/health/live` returns `200` and contract version `1`;
- `/api/health/monitor` returns `200` in a healthy live deployment;
- intentionally breaking a required readiness dependency produces `503` without leaking internal check details;
- external monitor notifications reach the intended availability route;
- a controlled internal failure reaches the configured `FailureTransport` with central `alertRoute`, `runbook` and `escalation` fields;
- recovery closes or resolves the external incident according to the chosen monitoring provider policy.
