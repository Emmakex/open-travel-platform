# Roadmap

<p align="center"><strong>English</strong> · <a href="./ROADMAP.es.md">Español</a></p>

Open Travel Platform is the reusable MIT-licensed open-source core. **Kairoseth Travel** is the official commercial/reference implementation deployed at **https://travel.kairoseth.com**.

The roadmap keeps two goals aligned:

1. keep the public core portable, provider-neutral and useful to other agencies/developers;
2. keep hardening Kairoseth Travel without coupling the core to one PSP, supplier, CRM, ERP, CMS, identity vendor or hosting provider.

_Last updated: 28 August 2026._

---

# Current position

The platform is well beyond the original catalogue/booking MVP. Persistent identity, transactional reservations/inventory, traveller pricing, accommodation, independent services, payments, post-purchase traveller data, amendments, rich Operator workflows, granular permissions, documents, reporting and the common integration infrastructure are already implemented.

**Phase 8 is COMPLETE. The Phase 9 — Production hardening engineering baseline is COMPLETE: Phase 9A production security/operability, Phase 9B critical persistence/concurrency/contract validation, Phase 9C observability/recovery/privileged-audit hardening and Phase 9D privacy/regulatory/accessibility/performance readiness are COMPLETE. Phase 10 — Open-source productisation is NEXT.**

Credentialed Stripe/Redsys TEST/LIVE end-to-end validation remains pending until suitable provider accounts are available. That provider-dependent validation should be inserted as soon as credentials exist. It remains an explicit external-dependency release validation and does not reopen the completed Phase 9 engineering baseline. The broad Browser E2E journey remains an informational/non-blocking CI signal by explicit project policy; dedicated accessibility journeys for the cross-application foundation, customer authentication, Traveller Data/privacy, booking/payment and Operator workflows run as blocking workflows. Blocking gates also cover deterministic security, TypeScript/build/smoke, MongoDB concurrency/idempotency/amendments, local HTTP adapter contracts, structured observability/failure transport, privileged audit rollback, encryption-key rotation, MongoDB recovery, real MongoDB query-plan validation and privacy/retention invariants.

---

# Completed foundations

## Foundation, catalogue and identity — COMPLETE

- Next.js / React / TypeScript foundation;
- MongoDB capability adapters;
- CI/release quality gates;
- bilingual EN/ES public and Operator experience;
- destinations, trips, structured itineraries, departures and live inventory;
- GridFS media, covers, galleries and focal points;
- persistent customer and staff authentication;
- separate customer/staff sessions, RBAC, granular capabilities and auth audit;
- public reference deployment at `travel.kairoseth.com`.

## Phase 5 — Commerce foundation — COMPLETE / IMPLEMENTED

### 5A — Provider-neutral payment ledger — COMPLETE
- payment/refund movements separated from reservation state;
- manual bank transfer, cash and external terminal;
- reconciliation protections and provider/idempotency metadata.

### 5B — Travellers and age pricing — COMPLETE
- lead/individual travellers, minors/guardians and age bands;
- per-departure pricing and configurable inventory consumption;
- historical traveller/pricing snapshots.

### 5C–5E — Independent services — COMPLETE
- Activities, Transport and Travel protection catalogues;
- availability/inventory calendars;
- independent service reservations linked optionally to a trip;
- shared payment ledger.

### 5F — Stripe/Redsys unified checkout — IMPLEMENTED
- Admin TEST/LIVE provider configuration and encrypted credentials;
- Stripe signed webhooks/idempotency;
- Redsys signed server notifications;
- browser returns are non-authoritative;
- credentialed TEST/LIVE E2E still pending provider accounts.

### 5G — Deposits, installments and payment terms — COMPLETE
- full/deposit/installment policies;
- due-date snapshots, outstanding balance and next-payment calculation;
- customer schedule and Operator management.

## Phase 6 — Post-purchase and package integrity — COMPLETE

### 6A / 6A.1 — Secure post-purchase traveller data — COMPLETE
- requirement snapshots, deadlines and UX states;
- AES-256-GCM protected storage with TTL retention;
- field-name-only audit;
- passport/DNI scans and health data excluded from the standard flow.

### 6B — Reservation amendments — COMPLETE
- explicit actor/reason/before/after history;
- traveller corrections, atomic departure changes and inventory reallocation;
- financial delta without rewriting historical payment movements;
- controlled refund-review state and change-policy snapshots.

### 6C — Accommodation, room inventory and package supplements — COMPLETE
- reusable accommodation/room catalogue;
- seasonal/occupancy pricing;
- transactional trip + room inventory;
- traveller-to-room allocation;
- included/optional accommodation accounting;
- package supplements and post-booking supplement amendments.

---

# Phase 7A — Rich operations workflow — COMPLETE

- reservation ownership, notes, priority, tags and timeline;
- tasks/follow-ups with assignee, due date, status and comments;
- supplier fulfilment per trip/service/accommodation component;
- supplier status/reference/cost/deadline plus internal notes/audit;
- advanced search, filters, sorting and operational queues;
- post-booking package amendment workflow;
- Admin + granular Operator capability matrix with audited permission changes.

Supplier data does not rewrite customer totals or the payment ledger.

---

# Phase 7B — Documents, exports and reporting — COMPLETE

### 7B-1 — Booking confirmation PDFs — COMPLETE
- customer and Operator confirmations with EN/ES rendering;
- finance shown only when permission allows it;
- private `no-store` document endpoints.

### 7B-2 — Traveller manifests and rooming lists — COMPLETE
- departure manifests and rooming lists from reservation snapshots;
- protected Operator-only PDF routes;
- protected traveller values and internal supplier data excluded.

### 7B-3 — Vouchers and printable dossier — COMPLETE
- customer-safe accommodation/service vouchers;
- consolidated internal Operator dossier;
- exact supplier-reference disclosure requires separate explicit approval/audit;
- supplier costs, notes and protected traveller values excluded from customer vouchers.

### 7B-4 — CSV/XLSX and finance reporting — COMPLETE
- capability-aware `/operator/reports` workspace;
- reservations/services/customers CSV/XLSX;
- reconciliation, outstanding/overdue and revenue reports;
- currency-safe grouping;
- formula-injection mitigation;
- persistent export audit without storing cell values;
- purpose-bound, fail-closed protected traveller export.

---

# Phase 8 — External integrations — COMPLETE

Goal: connect real business systems through explicit adapters without leaking vendor payloads into core domains.

## 8A — Provider-neutral outbound integrations — COMPLETE

- versioned trip/service reservation events;
- transactional MongoDB outbox in the same reservation mutation;
- unique delivery per `(eventId, endpointId)`;
- Admin-managed signed HTTPS webhooks;
- encrypted signing secrets;
- SSRF/DNS-rebinding protections and validated-IP pinning;
- bounded timeout/response, leasing, retry/backoff, attempt history and dead-letter;
- protected post-purchase traveller data excluded from the generic event contract;
- permanent `check:outbound-integrations` gate.

## 8B — Scheduled delivery, replay and observability — COMPLETE

- server-only integration worker endpoint with Bearer auth;
- durable global worker lease and bounded cadence/batch;
- Admin dead-letter replay with preserved attempt history;
- event/delivery diagnostics and queue health metrics;
- completed-success retention policy and retention audit;
- permanent `check:integration-operations` gate.

## 8C — Business adapters — COMPLETE

### 8C-1 — Generic REST booking adapter — COMPLETE

- `BOOKING_MODE=rest` behind `BookingRepository`;
- versioned `/v1` contract and server-only Bearer auth;
- production HTTPS, redirect rejection, bounded transport;
- runtime validation, ownership/scope revalidation;
- idempotent create/cancel retries;
- payment ledger, staff operations, catalogue and traveller data remain separate capabilities;
- permanent `check:rest-booking-adapter` gate.

### 8C-2 — Supplier fulfilment adapter boundary — COMPLETE

- provider-neutral `SupplierFulfilmentAdapter`;
- opt-in REST v1 request/status/cancel flow;
- deterministic idempotency and stable provider errors;
- external response audit before local application;
- responses re-enter the existing local fulfilment state machine;
- invalid transitions are never forced;
- supplier costs/currency are preserved locally;
- customer voucher reference disclosure remains separate;
- permanent `check:supplier-fulfilment-adapter` gate.

### 8C-3 — CRM synchronization adapter — COMPLETE

- provider-neutral downstream-only `CrmSyncAdapter`;
- opt-in `CRM_SYNC_MODE=disabled|rest` and REST v1 reference implementation;
- contact and reservation upsert contracts with strict allowlists;
- customer registration/profile changes enqueue CRM triggers transactionally;
- `customer.*` events are not available to generic webhook subscriptions;
- CRM reuses the existing integration outbox/worker/retry/dead-letter/replay pipeline instead of creating a second queue;
- reservation events upsert the contact before the reservation;
- stable event-derived idempotency keys;
- payment values, supplier data, inventory mutation instructions, traveller arrays and protected post-purchase fields excluded from the generic CRM contract;
- CRM external IDs stored separately in `travel_crm_sync_links`;
- non-PII sync outcome audit in `travel_crm_sync_audit`;
- Admin diagnostics at `/operator/integrations/crm`;
- permanent `check:crm-sync-adapter` gate.

### 8C-4 — ERP/accounting adapter — COMPLETE

- provider-neutral downstream-only `ErpAccountingAdapter`;
- opt-in `ERP_ACCOUNTING_MODE=disabled|rest` and REST v1 movement upsert reference adapter;
- only authoritative local `succeeded` payment/refund ledger movements are eligible;
- payment/refund finalization and its ERP outbox trigger commit in the same MongoDB transaction;
- exact source amount, currency, provider and immutable payment reference are preserved;
- deterministic event IDs and stable event-derived idempotency keys;
- ERP financial events are not exposed to generic webhook subscriptions and are not consumed by CRM;
- the existing integration worker provides retry/backoff, dead-letter, replay and health visibility without a second queue;
- external references are stored separately in `travel_erp_accounting_links`;
- acknowledgement audit in `travel_erp_accounting_audit` excludes amounts, currency, provider references, customer PII and raw HTTP bodies;
- Admin diagnostics at `/operator/integrations/erp`;
- the generic core exports accounting-ready movements and deliberately does not claim jurisdiction-specific legal invoice generation without authoritative tax/billing data;
- vendor-specific chart-of-accounts/tax mapping remains inside downstream adapters;
- permanent `check:erp-accounting-adapter` gate.

### Optional future adapters

These are extensions rather than blockers for the completed Phase 8 core integration boundary:

- CMS/catalogue source adapter;
- enterprise identity/SSO where useful;
- additional payment providers when commercially justified;
- jurisdiction/vendor-specific invoicing adapters after authoritative fiscal data is modeled.

---

# Phase 9 — Production hardening — COMPLETE (engineering baseline)

The engineering hardening baseline for the broad product surface is complete. Provider-credential validation remains separately tracked where external accounts are required.

## 9A — Production security / operability baseline — COMPLETE

- global CSP and defensive HTTP headers;
- production-only HSTS and insecure-request upgrade;
- explicit same-origin validation on cookie-authenticated Route Handler mutations;
- Stripe/Redsys callbacks remain provider-signature authenticated and the internal integration worker remains Bearer authenticated;
- persistent MongoDB auth throttling for customer/staff sign-in, customer registration and password-reset requests;
- rate-limit buckets store only SHA-256 identifiers, never raw email/IP values;
- optional per-client throttling is enabled only when trusted proxy IP headers are explicitly opted in;
- existing opaque session tokens remain hashed at rest with TTL expiry, server-side revocation and secure cookie attributes;
- `/api/health/live` process liveness endpoint;
- `/api/health/ready` configuration/infrastructure readiness endpoint;
- explicit `KTRAVEL_DEPLOYMENT_PROFILE=demo|live` contract;
- live readiness rejects demo capabilities, invalid public HTTPS configuration, unavailable required MongoDB and missing outbound worker auth;
- production security guide EN/ES plus modernized deployment guide/checklist;
- permanent `check:production-security` gate and CI smoke checks for headers, health and foreign-Origin mutation rejection.

## 9B — Critical E2E and persistence/concurrency validation — COMPLETE (core baseline)

### 9B-1 — Persistent browser journey — IMPLEMENTED / INFORMATIONAL
- registration → booking → customer account → Operator journey exists in Playwright/Chromium;
- persistent MongoDB-backed seed/build/journey runs in its own CI job;
- `Browser E2E (non-blocking)` is intentionally informational and retains diagnostics without blocking delivery.

### 9B-2 — MongoDB booking concurrency / rollback — COMPLETE
- disposable local MongoDB 8 replica set in CI;
- concurrent booking race proves capacity is never oversold;
- transactional rollback covers downstream inventory failure;
- duplicate cancellation releases inventory and emits status change exactly once.

### 9B-3 — Payment and webhook idempotency — COMPLETE
- real MongoDB payment finalization/idempotency validation;
- duplicate provider/webhook delivery does not duplicate authoritative movements;
- transactional ERP trigger behavior remains consistent with finalized ledger movements.

### 9B-4 — Traveller/minor pricing and amendments — COMPLETE
- exact age-at-departure boundary validation, including 17 → 18 on the new departure date;
- guardian requirements and child/adult pricing/inventory snapshots;
- atomic departure amendment inventory movement and explicit price delta;
- historical payment movements remain immutable;
- traveller corrections do not trigger unintended repricing;
- insufficient target capacity proves full transaction rollback.

### 9B-5 — REST adapter contract/integration validation — COMPLETE
- real local HTTP server on ephemeral localhost port; no mocked `fetch`;
- Booking, Supplier fulfilment, CRM and ERP/accounting adapters exercised through their real transport code;
- Bearer auth, contract-version headers, JSON MIME, bounded responses and redirect/timeout protections retained;
- transient failures retry at most once with stable idempotency keys;
- non-transient 4xx responses are not retried;
- Booking ownership/trip/departure scope mismatches fail closed;
- Supplier/CRM/ERP outbound allowlists prevent commercial/protected fields from leaking;
- Supplier, CRM and ERP reject non-JSON successful responses consistently with Booking;
- permanent blocking `check:adapter-contract-validation` plus `test:rest-adapter-contracts` CI gates.

### Provider-credential validation — DEFERRED EXTERNAL DEPENDENCY
- credentialed Stripe/Redsys TEST/LIVE E2E remains required before claiming those providers fully production-validated;
- it should be inserted immediately when suitable provider accounts/credentials are available;
- lack of provider credentials does not block Phase 9D work.

## 9C — Observability, recovery and privileged audit hardening — COMPLETE

### 9C-1 — Structured operational observability — COMPLETE
- provider-neutral JSON-line logging to stdout/stderr with schema version, service, event, component and severity;
- validated inbound `X-Request-Id` correlation with server-generated UUID fallback;
- central sensitive-key redaction covering credentials, customer/contact/traveller data, raw payloads, card values, provider references and monetary fields;
- generic exceptions expose only safe error type/code, never `message` or `stack`;
- integration worker, Stripe, Redsys and readiness surfaces instrumented;
- blocking `check:observability` and dynamic `test:observability` gates;
- EN/ES observability documentation.

### 9C-2 — Centralized failure visibility transport — COMPLETE
- provider-neutral `FailureTransport` with `disabled|rest` composition;
- exact trusted REST collector, HTTPS required in production, optional server-only Bearer auth, redirect rejection, `no-store`, bounded timeout and response size;
- normalized `warning|error|critical` events with deterministic SHA-256 grouping fingerprint;
- fingerprints group equivalent failures but are not idempotency keys: each occurrence is delivered once;
- outbound payload first reuses the shared sanitizer and then applies a stricter explicit field allowlist plus safe-token validation;
- customer/contact/traveller data, credentials, signatures, raw bodies, provider references and monetary values are excluded from the generic failure channel;
- correlation IDs are independently revalidated before external delivery;
- Stripe/Redsys provider-environment failures, worker failures and degraded/failed readiness can be elevated when configured;
- malformed callbacks, invalid provider signatures, duplicates and routine worker rate limiting remain local logs to avoid alert noise;
- transport is monitoring-only, best-effort and non-authoritative: no automatic retries, no recursive self-reporting and no effect on booking/payment/integration/readiness authority;
- collector availability is deliberately not a readiness dependency;
- real local HTTP validation proves auth, contract version, allowlists, redaction, stable grouping and single-attempt behavior;
- blocking `check:failure-transport` and `test:failure-transport` gates plus EN/ES documentation and `.env.example` contract.

### 9C-3 — External uptime/readiness monitoring + actionable alert routing — COMPLETE
- exact external probe contract for `/api/health/live` and `/api/health/ready`;
- recommended intervals, timeouts and consecutive-failure/recovery thresholds;
- actionable severity/escalation mapping for readiness degradation and normalized failure fingerprints;
- provider-neutral runbook for external monitoring/alert routing without monitoring-vendor SDK coupling in the MIT core;
- monitoring remains outside application authority and protected customer/traveller data;
- blocking external-monitoring configuration/contract validation.

### 9C-4 — Privileged-action audit integrity — COMPLETE
- payment-provider configuration and integration-endpoint mutations commit with their bounded persistent audit event in the same MongoDB transaction;
- staff capability assignment/removal retains the same fail-closed transactional audit contract;
- secrets, customer/traveller personal data, raw provider payloads and protected values are excluded from privileged audit records;
- real MongoDB rollback validation proves audit-write failure rolls back the privileged mutation;
- blocking privileged-audit integrity workflow and EN/ES runbook.

### 9C-5 — Versioned encryption keyring foundation — COMPLETE
- shared AES-256-GCM v1/v2 keyring for payment-provider credentials and integration signing secrets;
- stable non-secret `keyId` plus bounded previous-key maps for staged rotation;
- legacy ciphertext remains readable during migration and malformed/unknown formats fail closed;
- recovery/rotation procedures, environment contract and dedicated blocking keyring validation.

### 9C-6 — Traveller-data key rotation and re-encryption — COMPLETE
- Traveller Data moved onto the versioned keyring with dedicated current/previous-key boundaries;
- bounded transactional re-encryption batches update only ciphertext payloads;
- TTL, completion state and business timestamps remain unchanged;
- ciphertext compare-and-set prevents migration from overwriting concurrent traveller updates;
- decryption/re-encryption/conflict failures roll back the whole batch;
- no false customer-data audit event is produced by cryptographic maintenance;
- real MongoDB tests prove rollback, post-rotation readability and idempotency.

### 9C-7 — MongoDB backup/restore and disaster recovery — COMPLETE
- provider-neutral EN/ES recovery runbook with explicit RPO/RTO and encryption-key recovery boundaries;
- real `mongodump`/`mongorestore` drill against disposable MongoDB 8;
- deliberate source damage followed by restore into an isolated recovery database, never directly over the active database;
- recovered reservation, payment, audit and Traveller Data canaries plus unique/TTL indexes are validated before any cutover;
- backup checksum and rollback/cutover procedure included in the blocking recovery workflow.

### 9C-8 — MongoDB index and query-plan hardening — COMPLETE
- additive query-aligned index baseline for Operator reservation recency/status, active Traveller Data reads and integration due/lease/history paths;
- payments, audit and operations-task indexes reviewed without speculative over-indexing;
- real MongoDB 8 `explain("executionStats")` validation on representative data;
- critical hot paths must use expected indexes, reject `COLLSCAN` and keep documents examined bounded;
- Atlas Query Profiler/Performance Advisor follow-up and safe index-lifecycle guidance documented EN/ES;
- permanent `check:mongodb-index-performance` plus real MongoDB query-plan gate.

## 9D — Privacy, regulatory, accessibility and performance readiness — COMPLETE

### 9D-1 — Privacy-rights request and retention-review foundation — COMPLETE
- authenticated customer requests for access, rectification, erasure, restriction, objection and portability;
- customer tracking plus Admin-only privacy console;
- one open request per customer/right, bounded deadlines/extensions and transactional request/audit persistence;
- explicit retention review before erasure closure;
- technical personal-data inventory separating exportable/customer data from credentials, security internals and review-bound stores;
- real MongoDB validation for duplicate guards, deadlines, rollback and terminal immutability.

### 9D-2 — Access/portability, restriction and controlled erasure — COMPLETE
- Admin-approved authenticated JSON exports for access and portability;
- portability is deliberately narrower than access and excludes payment/accounting/privacy-case/staff-audit internals;
- protected Traveller Data export fails closed when required encryption keys are unavailable;
- restriction disables the customer account and revokes sessions without deleting business records;
- erasure requires explicit Admin confirmation and a clear retention review;
- account/reservation/traveller identity is anonymised or pseudonymised while booking, inventory and authoritative financial structure are preserved;
- destructive online execution is bounded, transactional where authoritative and retry-safe across secondary cleanup;
- blocking static invariants plus real MongoDB privacy-execution validation.

### 9D-3 — Regulatory retention-policy baseline — COMPLETE
- 1:1 retention policy registry for every personal-data inventory area;
- explicit `ttl`, `case-review`, `business-record-review` and `security-review` strategies with operational ownership;
- documented holds override expiry eligibility;
- evaluator can only return `retain`, `review-required` or `eligible-for-expiry`, never an automatic delete instruction;
- business records such as bookings/payments/audits remain review-driven rather than being assigned a universal statutory database TTL;
- EN/ES deployment guidance references official GDPR, Spanish commercial/tax and EU/Spanish package-travel/consumer sources without claiming legal certification;
- blocking `check:privacy-retention-policy`, unit test and dedicated CI workflow.

### 9D-4 — Accessibility readiness — COMPLETE
- application-wide keyboard baseline with bilingual skip navigation, visible `:focus-visible`, reduced-motion support, forced-colors support and 320px reflow smoke coverage;
- customer sign-in, registration and password-recovery/reset forms expose server errors, invalid controls, help relationships and actionable focus behavior;
- Traveller Data and customer privacy-rights workflows expose stable labels, error/status live regions, contextual action names and targeted invalid/focus recovery semantics;
- trip/service booking and authenticated payment flows expose assertive errors, polite payment states, named payment summaries/method groups and provider-return status semantics without changing payment authority;
- protected Operator reservation workflow, tasks/follow-ups and supplier fulfilment expose contextual form/group names, `aria-invalid`, error relationships and status-versus-alert semantics;
- dedicated blocking Playwright/Chromium workflows exercise persistent MongoDB-backed customer/staff journeys for the critical feature slices;
- EN/ES engineering documentation and permanent source-invariant gates preserve the implementation contract;
- this is a WCAG 2.2 AA-oriented engineering baseline, not a certification: deployment-specific keyboard, screen-reader, contrast, zoom/reflow and real-content review remains a release responsibility.

### 9D-5 — Performance/load readiness — COMPLETE
- 9D-5.1 adds a blocking production-build public/read-only HTTP baseline with structured p50/p95/p99, throughput and failure counts; the first accepted run completed 150 requests with 0 failures;
- 9D-5.2 uses real persistent customer/Admin sessions and a real MongoDB reservation fixture for authenticated critical GET load, with no auth bypass; the first accepted run completed 156 requests with 0 failures and p95 values of roughly 45.58–111.26 ms;
- 9D-5.3 runs 32 concurrent reservation attempts against 16 spaces, requires exactly 16 commits + 16 expected capacity rejections, then cancels all commits and proves final inventory 0 plus exact transactional outbox cardinality; first accepted create/cancel p95 values were 554.78/323.5 ms;
- 9D-5.4 samples a production Next.js Linux process for RSS/VmHWM, file descriptors and threads during 240 requests at concurrency 12 plus a 320-request spike at concurrency 32; the first accepted run had 0 failures, p95 109.10/233.10 ms, RSS 193.78 → 395.74 MB, FDs 40 → 84, threads 15 → 15 and successful post-load liveness;
- CI budgets are regression/leak signals, not production SLOs or sizing guarantees; real deployment thresholds must be calibrated from hosting, Atlas and traffic telemetry;
- Phase 9C-8 query-plan evidence remains authoritative for database/index changes, so slow application scenarios do not justify speculative indexes.

Credentialed Stripe/Redsys TEST/LIVE validation remains a production-hardening requirement and should be inserted immediately when provider accounts are available.

---

# Phase 10 — Open-source productisation — IN PROGRESS

### 10.1 — Reproducible fresh-clone/demo bootstrap — COMPLETE
- versioned npm 11 lockfile makes `npm ci` work from a clean clone;
- safe `.env.demo.example` and non-destructive `npm run setup:demo` require no MongoDB, SMTP, PSP, CRM, ERP or supplier account;
- EN/ES getting-started guides preserve the provider-neutral Kairoseth boundary;
- blocking clean-checkout build/start/HTTP smoke proves the public onboarding contract.

### 10.2 — Provider-neutral self-host standalone deployment — COMPLETE
- `npm run package:standalone` turns Next.js `output: standalone` into a transportable runtime with `.next/static` and `public` assets;
- blocking self-host CI starts the real `.next/standalone/server.js` and validates public pages, liveness and a public asset without external infrastructure;
- the runtime resource baseline now measures that same standalone process instead of the Next.js CLI;
- deployment guidance is bilingual and covers build-time/runtime configuration, live readiness, reverse proxy/TLS, MongoDB, payments, workers, secrets, immutable releases and rollback;
- `travel.kairoseth.com` remains a reference/commercial deployment, not a dependency of the MIT core.

### 10.3 — Extension contracts and reference adapters — NEXT
- consolidate public extension points and stable provider-neutral adapter contracts;
- add contributor-facing examples for implementing adapters without granting downstream systems authority over core booking/payment state;
- define compatibility/versioning expectations for extension contracts before broader ecosystem work.

Later Phase 10 slices will cover release/migration conventions, contribution templates and trademark/branding policy while keeping proprietary Kairoseth/customer adapters outside the MIT core where appropriate.

---

# Suggested delivery order

```text
9A    Production security / operability baseline — COMPLETE
  ↓
9B    Critical persistence/concurrency/contract validation — COMPLETE
  ↓
9C-1  Structured operational observability — COMPLETE
  ↓
9C-2  Centralized failure visibility transport — COMPLETE
  ↓
9C-3  External uptime/readiness monitoring + alert routing — COMPLETE
  ↓
9C-4  Privileged-action audit integrity — COMPLETE
  ↓
9C-5  Versioned encryption keyring foundation — COMPLETE
  ↓
9C-6  Traveller-data key rotation/re-encryption — COMPLETE
  ↓
9C-7  MongoDB backup/restore/disaster recovery — COMPLETE
  ↓
9C-8  MongoDB index/query-plan hardening — COMPLETE
  ↓
9D-1  Privacy-rights + retention-review foundation — COMPLETE
  ↓
9D-2  Access/portability + restriction + controlled erasure — COMPLETE
  ↓
9D-3  Regulatory retention-policy baseline — COMPLETE
  ↓
9D-4  Accessibility readiness — COMPLETE
  ↓
9D-5  Performance/load readiness — COMPLETE
  ↓
10.1  Fresh-clone/demo bootstrap — COMPLETE
  ↓
10.2  Self-host standalone deployment — COMPLETE
  ↓
10.3  Extension contracts/reference adapters — NEXT
  ↓
optional adapters driven by commercial need
```

---

# Core non-goals

Open Travel Platform must not become permanently tied to one payment gateway, CMS, CRM/ERP, booking supplier, identity vendor, monitoring vendor, hosting platform or Kairoseth-only infrastructure.

The public core remains MIT licensed and reusable. Kairoseth Travel can add hosted/commercial services, premium/private adapters and customer-specific integrations around that core.