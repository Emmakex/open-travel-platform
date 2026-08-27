# Centralized failure transport

Open Travel Platform keeps operational failure reporting provider-neutral. The core produces a small normalized failure event and can optionally deliver it to a trusted HTTPS collector. A deployment-specific collector can then forward those events to Sentry, Datadog, Grafana/Alertmanager, an internal NOC, or another monitoring platform without coupling the MIT core to one vendor.

## Deployment mode

```env
FAILURE_TRANSPORT_MODE=disabled
```

`disabled` is the default. Structured JSON logs from `lib/observability.ts` remain available on stdout/stderr even when external failure delivery is disabled.

To enable the reference REST transport:

```env
FAILURE_TRANSPORT_MODE=rest
REST_FAILURE_TRANSPORT_URL=https://monitoring.example.com/open-travel/failures
REST_FAILURE_TRANSPORT_BEARER_TOKEN=
REST_FAILURE_TRANSPORT_TIMEOUT_MS=1500
REST_FAILURE_TRANSPORT_MAX_RESPONSE_BYTES=65536
```

Production endpoints must use HTTPS. HTTP is accepted only for localhost during development. Credentials are server-only and must never use `NEXT_PUBLIC_*` variables.

## Contract

The REST adapter sends exactly one `POST` per reported failure. It deliberately does not retry: monitoring delivery is non-authoritative, and automatic retries during an outage can amplify an alert storm or delay an already failing payment/integration path.

Headers:

- `Content-Type: application/json`
- `Accept: application/json`
- `X-OTP-Failure-Contract-Version: 1`
- `X-OTP-Request-Id` when a validated correlation ID exists
- optional server-only `Authorization: Bearer ...`

The request body contains a single normalized `failure` object:

```json
{
  "failure": {
    "schemaVersion": 1,
    "occurredAt": "2026-08-27T05:00:00.000Z",
    "event": "payment.webhook.failed",
    "component": "payment-webhook",
    "severity": "error",
    "correlationId": "req-example-0001",
    "fingerprint": "<sha256>",
    "fields": {
      "provider": "stripe",
      "reason": "provider-unavailable"
    },
    "errorType": "Error",
    "errorCode": "PAYMENT_PROVIDER_UNAVAILABLE"
  }
}
```

The fingerprint is deterministic for the normalized event/component/error type/error code. It is a grouping key, not an idempotency key. Separate occurrences are still delivered once each so an external monitoring system can count frequency while grouping equivalent failures.

## Severity policy

- `warning`: service is degraded or not ready but the failure is not necessarily data-loss/transactional failure;
- `error`: an operational path failed and needs investigation/retry;
- `critical`: reserved for conditions that require immediate operational escalation.

Invalid provider signatures, malformed callbacks, duplicate webhook deliveries and routine worker rate limiting remain local structured logs; they are not automatically promoted to the external failure transport.

## Privacy boundary

The failure transport reuses the same sanitizer as structured operational logging. Generic failure events exclude fields whose names indicate credentials/tokens/signatures/cookies, raw bodies/payloads, customer/contact identifiers, email/phone/address, traveller/passport/DNI/document/health data, card data, provider references and monetary amount/currency/price/cost values.

Exception `message` and `stack` are never serialized. Only a safe exception type and stable safe error code may be emitted. Vendor-specific monitoring enrichments that need more data must live outside the generic core and must define their own lawful purpose and retention policy.

## Failure semantics

Failure reporting is best-effort. A monitoring outage must never change booking, payment, integration or readiness authority. The REST call is bounded by timeout and response-size limits, rejects redirects, uses `cache: no-store`, and never retries automatically.

If the collector rejects or cannot receive an event, the original operation keeps its own response semantics and a local structured event `observability.failure-transport.failed` is emitted. The transport must not recursively report its own failure.

The failure collector is deliberately not a dependency of `/api/health/ready`; monitoring failure must not make the application unready by itself.

## Current instrumented surfaces

The generic boundary is used for high-value operational failures in:

- Stripe server webhook processing;
- Redsys server notification processing;
- the scheduled integration worker;
- production readiness failures/degraded readiness.

More surfaces can adopt `reportOperationalFailure()` without adding vendor SDKs to core domain code.

## Validation

Blocking CI includes:

```bash
npm run check:failure-transport
npm run test:failure-transport
```

The dynamic test uses real local Node HTTP transport and validates authentication, contract headers, stable fingerprinting, sensitive-data exclusion, single-attempt delivery and best-effort failure behavior.

Browser E2E remains an informational/non-blocking signal by project policy; the failure-transport checks are deterministic blocking gates.
