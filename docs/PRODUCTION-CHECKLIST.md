# Production readiness checklist

Open Travel Platform includes persistent catalogue, identity, booking, operations, payments and integration capabilities, but every real deployment still requires deployment-specific configuration, release identity and migration validation.

Use this checklist before changing `KTRAVEL_DEPLOYMENT_PROFILE` to `live` or promoting a new production release.

## Release identity and migration review

- [ ] Read `docs/RELEASES.md` and `docs/MIGRATIONS.md`.
- [ ] Record the exact target Git tag/SHA; do not deploy an unpinned moving branch.
- [ ] For a public release, confirm `package.json` version, README badge, CHANGELOG release entry and immutable `vX.Y.Z` tag agree.
- [ ] Confirm the release was cut from reviewed and verified `main`.
- [ ] Run `npm ci`, `npm run check:release`, `npm run check:release-migrations` and `npm run verify` on the exact revision.
- [ ] Classify migration impact: none, configuration, additive persistent data, data backfill, public wire contract, encryption/key or destructive/irreversible.
- [ ] If migration is required, define deployment order, compatibility window and explicit verification postconditions.
- [ ] Prefer **expand → migrate → contract** for compatible persistent-data evolution.
- [ ] Confirm application startup/import/request paths do not perform hidden destructive migrations.
- [ ] Define rollback as application-only, reverse migration, backup restore or irreversible/forward-only.
- [ ] Take and verify the required backup/restore point before destructive or high-risk persistent changes.
- [ ] Record migration completion and active release identity without recording secrets.

## Container artifact and registry verification

When deploying a container, review `docs/CONTAINERS.md`; when using a published image, also review `docs/REGISTRY.md`.

- [ ] Run `npm run check:container` and `npm run check:registry-provenance` on the exact source revision when applicable.
- [ ] Confirm the release source tag resolves to the expected audited `main` commit.
- [ ] Use only exact SemVer/source-SHA image tags for discovery; do not depend on `latest`, major-only, minor-only or `stable` aliases.
- [ ] Resolve and record the exact OCI digest before rollout.
- [ ] Deploy the image by `ghcr.io/emmakex/open-travel-platform@sha256:<digest>` or an explicitly verified mirror of that digest.
- [ ] Confirm OCI source/revision/version/license metadata matches the intended release and source SHA.
- [ ] Confirm SBOM and BuildKit provenance are present for the published release image.
- [ ] Verify the GitHub artifact attestation for the OCI digest with `gh attestation verify`.
- [ ] Confirm the final image remains non-root and no production credentials/private Kairoseth/customer adapters are baked into layers.
- [ ] Record release/tag/source SHA/image digest together in deployment records.
- [ ] For rollback, select a previously verified immutable digest rather than moving an existing tag.

## Application and deployment profile

- [ ] Set `KTRAVEL_PUBLIC_URL` to the canonical public HTTPS URL.
- [ ] Set the public site name/tagline for the deployment.
- [ ] Replace fictional catalogue/availability data or configure the intended production adapter.
- [ ] Confirm `NEXT_PUBLIC_DATA_MODE`, `TRAVEL_DATA_MODE`, `IDENTITY_MODE`, `STAFF_AUTH_MODE`, `BOOKING_MODE` and `OPERATIONS_MODE` do not use `demo` for real data.
- [ ] Confirm `DEMO_IDENTITY_ENABLED`, `DEMO_BOOKING_ENABLED` and `DEMO_OPERATIONS_ENABLED` are disabled for real data.
- [ ] Set `KTRAVEL_DEPLOYMENT_PROFILE=live` only after production capabilities are configured.
- [ ] Confirm `GET /api/health/live` returns 200.
- [ ] Confirm `GET /api/health/ready` returns 200 in the final environment.
- [ ] Run deployment-specific integration and browser E2E tests.

## HTTP and browser security

- [ ] Verify CSP, `nosniff`, frame protection, referrer policy and HSTS.
- [ ] Confirm HTTPS termination and HTTP redirect behavior.
- [ ] Keep `KTRAVEL_ALLOWED_BROWSER_ORIGINS` empty unless an additional exact trusted origin is required.
- [ ] Keep `KTRAVEL_TRUST_PROXY_IP_HEADERS=false` unless the trusted proxy cleans forwarding headers and provides authoritative client IPs.
- [ ] Review payment-compatible CSP for additional hosted payment UI.
- [ ] Review `docs/PRODUCTION-SECURITY.md`.

## Identity and authorization

- [ ] Use persistent customer/staff identity or an explicitly reviewed external adapter.
- [ ] Confirm customer routes reject staff identities and staff routes reject customer identities.
- [ ] Confirm Operator/Admin capabilities follow least privilege.
- [ ] Remove `KTRAVEL_BOOTSTRAP_ADMIN_PASSWORD` after the first administrator is created and verified.
- [ ] Confirm session lifetimes/revocation behavior.
- [ ] Exercise account lockout, auth throttling and password recovery.
- [ ] Review authentication/staff permission audit behavior.

## MongoDB and durable state

- [ ] Use a least-privilege MongoDB application user.
- [ ] Restrict Atlas Network Access where possible.
- [ ] Confirm reconnect after process restart.
- [ ] Review indexes/query plans with representative scale.
- [ ] Define backup frequency, retention and restore ownership.
- [ ] Perform a documented restore test before launch.
- [ ] For migration backfills, use bounded batches/stable cursors and explicit restart/resume behavior.
- [ ] Verify migration postconditions using counts/domain invariants rather than only exit status.

## Booking and inventory

- [ ] Revalidate availability/pricing at the final authoritative write boundary.
- [ ] Exercise concurrent booking attempts against constrained inventory.
- [ ] Confirm booking idempotency/concurrency controls.
- [ ] Verify cancellation/amendment policies for the target business.
- [ ] Verify prices/currency/totals originate from trusted server state.
- [ ] Verify traveller/minor pricing and inventory-consumption rules.
- [ ] If migrating booking/inventory state, prove no capacity is implicitly created/lost and old/new state semantics match the declared compatibility window.

## Payments

- [ ] Configure TEST credentials using encrypted provider profiles.
- [ ] Exercise Stripe TEST checkout → signed webhook → ledger finalization → duplicate webhook idempotency.
- [ ] Exercise Redsys TEST checkout → signed server notification → ledger finalization → duplicate notification idempotency.
- [ ] Confirm browser return pages never mark payment successful by themselves.
- [ ] Confirm refund/reconciliation behavior.
- [ ] Verify amount/currency/provider reference snapshots against provider dashboards.
- [ ] Move to LIVE only after TEST E2E sign-off.
- [ ] Keep payment credentials and `PAYMENT_SECRETS_KEY` server-only and recoverable.
- [ ] If migrating payment data, preserve historical movement identity, amount, currency, chronology and payment/refund distinction; do not recalculate history from mutable booking data.

## Protected traveller data and privacy

- [ ] Define operationally necessary post-purchase traveller fields.
- [ ] Protect and recover `TRAVELLER_DATA_KEY` according to policy.
- [ ] Review retention periods and protected-data permissions.
- [ ] Confirm sensitive export audit is persisted before decrypted bytes are returned.
- [ ] Define GDPR/privacy workflows and legal pages/consent for the target jurisdiction.
- [ ] Never place real customer data in public fixtures/repository.
- [ ] If migrating protected Traveller Data, use minimum-necessary access and ensure migration logs contain only safe counts/IDs/redacted diagnostics.

## Integrations and downstream adapters

- [ ] Protect `INTEGRATION_SECRETS_KEY` and downstream tokens.
- [ ] Use HTTPS production endpoints only.
- [ ] Confirm webhook SSRF controls.
- [ ] Configure a strong `KTRAVEL_INTEGRATION_WORKER_TOKEN` when delivery is enabled.
- [ ] Schedule `POST /api/internal/integrations/process` at the intended cadence.
- [ ] Confirm retry/dead-letter/replay behavior with deliberate failures.
- [ ] Confirm CRM/ERP/supplier systems cannot overwrite local booking/payment authority outside documented contracts.
- [ ] Review retention and dead-letter ownership.

## Protected configuration and secrets

- [ ] Keep privileged values out of `NEXT_PUBLIC_*`.
- [ ] Store secrets in protected hosting configuration.
- [ ] Generate independent stable keys for payments, traveller data and integration secrets.
- [ ] Document backup/recovery before ciphertext depends on keys.
- [ ] Define rotation/re-encryption procedures before rotating master keys.
- [ ] Remove obsolete/exposed credentials immediately.
- [ ] Review logs for sensitive-data leakage.

## Observability and operations

- [ ] Configure uptime checks for `/api/health/live` and `/api/health/ready`.
- [ ] Configure centralized structured logs/error reporting.
- [ ] Define alerts for payment failures, integration dead letters and sustained readiness failures.
- [ ] Maintain a known-good immutable release artifact/tag/digest for emergency rollback.
- [ ] Define code and database rollback/recovery procedures.
- [ ] Confirm dependency/security update ownership.
- [ ] Run a disaster-recovery exercise covering application release, MongoDB restore and encryption-key recovery.

## Final launch review

- [ ] Run accessibility and performance review on critical customer/Operator paths.
- [ ] Run browser E2E registration → booking → payment → Operator workflow.
- [ ] Review privileged-action audit coverage.
- [ ] Complete applicable travel/privacy/payment/invoicing/consumer-law review.
- [ ] Review `SECURITY.md`, `docs/DEPLOYMENT.md`, `docs/RELEASES.md`, `docs/MIGRATIONS.md`, `docs/CONTAINERS.md`, `docs/REGISTRY.md` and adapter threat models.
- [ ] Record exact release/tag/SHA/digest and migration result used for launch without recording secrets.
