# Observability baseline

Open Travel Platform emits provider-neutral operational logs as one JSON object per line. The core deliberately writes structured events to standard output/error instead of coupling the project to one hosted monitoring vendor. Deployment infrastructure can forward these JSON lines to the organization’s preferred log/error platform.

## Structured record

Operational records use schema version `1` and contain a bounded set of fields:

- `schemaVersion`
- `timestamp`
- `service`
- `level` (`info`, `warn`, `error`)
- `event`
- `component`
- optional `correlationId`
- optional sanitized scalar `fields`
- optional safe `errorType` and `errorCode`

The logger never serializes an exception message or stack trace. Error messages can contain provider payloads, PII or secrets and are therefore not part of the generic operational contract.

## Request correlation

Instrumented server routes accept `X-Request-Id` only when it is a bounded token using letters, digits, `.`, `_`, `:`, or `-`. Arbitrary text, whitespace and email-like values are rejected and replaced with a generated `req-<uuid>` value.

The resulting correlation ID is returned as `X-Request-Id` so application logs, reverse-proxy logs and caller diagnostics can be joined without exposing customer data.

Current high-value instrumented surfaces:

- internal integration worker;
- Stripe signed webhook;
- Redsys signed notification;
- production readiness probe when not ready or when the readiness check itself fails.

Normal successful readiness probes are intentionally not logged to avoid high-volume noise.

## Redaction and data minimization

The generic logger accepts scalar fields only and drops sensitive field names, including credentials/authentication values, cookies, signatures, customer/contact identifiers, addresses, email/phone, passport/DNI/document/health/traveller data, card data, raw bodies/payloads and provider references.

Safe strings are whitespace-normalized and bounded to 240 characters. Non-finite numbers are dropped. Logging failure itself is fail-safe and cannot turn an application error into a second failure.

Never pass raw HTTP request/response bodies, payment signatures, access tokens, encrypted secrets, protected traveller data or vendor error payloads to operational logging.

## Payment callbacks

Payment callback observability does not change the payment authority model:

- provider signatures remain authoritative;
- browser returns remain non-authoritative;
- duplicate webhook claims remain idempotent;
- database/finalization exceptions return HTTP 500 so the provider can retry;
- logs contain only provider, normalized outcome/reason, event type where safe, duration and correlation metadata.

No amount, currency, checkout/order identifier, provider reference, authorization code, signature or signed body is emitted by the generic logger.

## Integration worker

The worker records safe lifecycle events for unavailable configuration, rejected authentication, deferred/busy execution, completion and failure. It does not serialize the delivery result, endpoint secrets or provider responses into the log line.

## Centralized collection

Production deployments should collect JSON stdout/stderr with the platform’s existing runtime/logging facility and forward it to a central searchable store with retention/access controls. Vendor-specific transports (for example an error SaaS) should be implemented behind a separate optional adapter rather than imported into core domain code.

## Automated gates

- `npm run test:observability` validates request-ID handling, JSON structure and redaction dynamically.
- `npm run check:observability` protects the observability boundary and critical route instrumentation statically.

Both are blocking CI gates. Browser E2E remains a separate informational/non-blocking signal.
