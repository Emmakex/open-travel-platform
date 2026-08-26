# Production readiness checklist

Open Travel Platform now includes persistent catalogue, identity, booking, operations, payments and integration capabilities, but a real deployment still requires deployment-specific configuration and validation.

Use this checklist before changing `KTRAVEL_DEPLOYMENT_PROFILE` to `live`.

## Application and deployment profile

- [ ] Set `KTRAVEL_PUBLIC_URL` to the canonical public HTTPS URL.
- [ ] Set the public site name/tagline for the deployment.
- [ ] Replace fictional catalogue/availability data or configure the intended production adapter.
- [ ] Confirm `NEXT_PUBLIC_DATA_MODE`, `TRAVEL_DATA_MODE`, `IDENTITY_MODE`, `STAFF_AUTH_MODE`, `BOOKING_MODE` and `OPERATIONS_MODE` do not use `demo` for a real deployment.
- [ ] Confirm `DEMO_IDENTITY_ENABLED`, `DEMO_BOOKING_ENABLED` and `DEMO_OPERATIONS_ENABLED` are not enabled for real data.
- [ ] Set `KTRAVEL_DEPLOYMENT_PROFILE=live` only after the production capabilities are configured.
- [ ] Confirm `GET /api/health/live` returns 200.
- [ ] Confirm `GET /api/health/ready` returns 200 in the final environment.
- [ ] Run `npm run verify` on the exact revision being deployed.
- [ ] Run deployment-specific integration and browser E2E tests.

## HTTP and browser security

- [ ] Verify the production response includes CSP, `nosniff`, frame protection, referrer policy and HSTS.
- [ ] Confirm the deployment terminates HTTPS correctly and redirects plain HTTP where applicable.
- [ ] Keep `KTRAVEL_ALLOWED_BROWSER_ORIGINS` empty unless an additional exact trusted browser origin is genuinely required.
- [ ] Keep `KTRAVEL_TRUST_PROXY_IP_HEADERS=false` unless the reverse proxy is confirmed to overwrite/clean forwarding headers.
- [ ] If proxy IP trust is enabled, verify the real client address is supplied by the trusted edge and cannot be spoofed by the browser.
- [ ] Review the payment-compatible CSP against any additional hosted payment UI introduced by the deployment.
- [ ] Review `docs/PRODUCTION-SECURITY.md`.

## Identity and authorization

- [ ] Use persistent staff/customer identity or an explicitly reviewed external identity adapter.
- [ ] Confirm customer routes reject staff identities and staff routes reject customer identities.
- [ ] Confirm Operator/Admin capabilities follow least privilege.
- [ ] Remove `KTRAVEL_BOOTSTRAP_ADMIN_PASSWORD` after the first persistent administrator is created and verified.
- [ ] Confirm customer/staff session lifetimes and revocation behavior match organizational policy.
- [ ] Exercise account lockout, auth rate limiting and password recovery.
- [ ] Review authentication audit events and staff permission audit behavior.
- [ ] If adding enterprise SSO later, preserve the server-authoritative role/capability boundary.

## MongoDB and durable state

- [ ] Use a least-privilege MongoDB application user.
- [ ] Restrict Atlas Network Access to the deployment's real outbound network where possible.
- [ ] Confirm the application can reconnect after a process restart.
- [ ] Review indexes and query performance with representative production-scale data.
- [ ] Define backup frequency, retention and restore ownership.
- [ ] Perform a documented restore test before launch.
- [ ] Define migration and rollback procedures for schema/index changes.

## Booking and inventory

- [ ] Revalidate availability/pricing at the final authoritative write boundary.
- [ ] Exercise concurrent booking attempts against the same constrained departure/inventory.
- [ ] Confirm idempotency/concurrency controls on booking creation.
- [ ] Confirm trip/service/accommodation cancellation and amendment policies for the target business.
- [ ] Verify prices, currency and totals come from trusted server-side state.
- [ ] Verify traveller/minor pricing and inventory-consumption rules with real business cases.

## Payments

- [ ] Configure TEST credentials using the encrypted provider-profile mechanism.
- [ ] Exercise Stripe TEST checkout → signed webhook → ledger finalization → idempotent duplicate webhook.
- [ ] Exercise Redsys TEST checkout → signed server notification → ledger finalization → idempotent duplicate notification.
- [ ] Confirm browser return pages never mark payment successful by themselves.
- [ ] Confirm refund and reconciliation behavior with provider test flows.
- [ ] Verify amount/currency/provider reference snapshots against the provider dashboard.
- [ ] Move to LIVE credentials only after TEST E2E is signed off.
- [ ] Keep payment credentials and `PAYMENT_SECRETS_KEY` server-only and backed up according to key-management policy.

## Protected traveller data and privacy

- [ ] Define which post-purchase traveller fields are operationally necessary per product.
- [ ] Confirm `TRAVELLER_DATA_KEY` is generated once, protected and recoverable according to policy.
- [ ] Review retention periods for advanced traveller records.
- [ ] Exercise protected-data access/export with least-privilege staff permissions.
- [ ] Confirm sensitive export audit is persisted before decrypted bytes are returned.
- [ ] Define GDPR/privacy access, rectification, export, deletion and retention workflows.
- [ ] Review cookie/privacy/legal pages and consent requirements for the target jurisdiction.
- [ ] Never place real customer data in public demo fixtures or the public repository.

## Integrations and downstream adapters

- [ ] Protect `INTEGRATION_SECRETS_KEY` and all downstream bearer tokens.
- [ ] Use HTTPS production endpoints only.
- [ ] Confirm webhook target SSRF controls against the intended endpoints.
- [ ] Configure a 32+ character `KTRAVEL_INTEGRATION_WORKER_TOKEN` when supplier/CRM/ERP REST delivery is enabled.
- [ ] Configure the scheduler to call `POST /api/internal/integrations/process` at the intended cadence.
- [ ] Confirm retry/dead-letter/replay behavior with deliberate downstream failures.
- [ ] Confirm CRM/ERP/supplier systems cannot overwrite local booking/payment authority outside their documented contracts.
- [ ] Review integration retention and dead-letter operational ownership.

## Protected configuration and secrets

- [ ] Keep privileged values out of `NEXT_PUBLIC_*` variables.
- [ ] Store secrets in the hosting platform's protected configuration mechanism.
- [ ] Generate independent stable keys for payment credentials, traveller data and integration signing secrets.
- [ ] Document secure backup/recovery for encryption keys before production data depends on them.
- [ ] Define rotation/re-encryption procedures before rotating master keys.
- [ ] Remove obsolete credentials immediately and rotate any accidentally exposed secret.
- [ ] Review application/runtime logs for accidental sensitive-data output.

## Observability and operations

- [ ] Configure external uptime checks for `/api/health/live` and `/api/health/ready`.
- [ ] Configure centralized structured logs/error reporting.
- [ ] Define alerting for payment failures, integration dead letters and sustained readiness failures.
- [ ] Define deploy rollback and database rollback procedures.
- [ ] Maintain a known-good immutable release for emergency rollback.
- [ ] Confirm dependency/security update ownership and cadence.
- [ ] Run a disaster-recovery exercise covering application revision, MongoDB restore and encryption-key recovery.

## Final launch review

- [ ] Run accessibility and performance review on critical customer/Operator paths.
- [ ] Run browser E2E registration → booking → payment → Operator workflow.
- [ ] Review privileged-action audit coverage.
- [ ] Complete applicable market-specific travel, privacy, payment, invoicing and consumer-law review.
- [ ] Review `SECURITY.md`, `docs/DEPLOYMENT.md` and adapter-specific threat models.
- [ ] Record the exact release SHA and environment configuration used for launch without recording secrets.
