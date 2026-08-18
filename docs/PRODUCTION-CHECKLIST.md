# Production readiness checklist

Open Travel Platform v1.0 is a reusable starter. The demo adapters are intentionally not production infrastructure.

Use this checklist before a real deployment.

## Application

- [ ] Set the public site name/tagline for the deployment.
- [ ] Replace fictional catalogue/availability data or configure a production travel adapter.
- [ ] Review metadata, legal pages, cookie/privacy requirements and locale requirements for the target market.
- [ ] Run `npm run verify` on the exact revision being deployed.
- [ ] Run deployment-specific integration/end-to-end tests.

## Identity and authorization

- [ ] Replace demo identity with a trusted identity/session provider.
- [ ] Map roles from trusted server-side claims/data.
- [ ] Confirm customer routes reject staff identities.
- [ ] Confirm staff routes reject customer identities.
- [ ] Define session lifetime, revocation and account lifecycle policies.
- [ ] Review CSRF/session protections for the chosen identity architecture.

## Booking and inventory

- [ ] Replace demo booking persistence with trusted durable storage or a booking engine.
- [ ] Revalidate availability at the final write boundary.
- [ ] Use idempotency/concurrency controls for booking creation.
- [ ] Define cancellation/amendment business rules explicitly.
- [ ] Ensure prices/currency/totals come from trusted server-side sources.
- [ ] Define supplier timeout/retry behavior.

## Staff operations

- [ ] Replace demo operations with a trusted backoffice/CRM/ERP adapter.
- [ ] Enforce staff authorization on every read/mutation.
- [ ] Validate reservation state transitions server-side.
- [ ] Persist durable audit events for privileged changes.
- [ ] Define least-privilege permissions for operator/admin roles.

## Protected configuration

- [ ] Keep privileged values out of `NEXT_PUBLIC_*` variables.
- [ ] Store protected deployment values in the hosting platform's protected configuration mechanism.
- [ ] Review logs for accidental sensitive-data output.
- [ ] Define rotation/revocation procedures for external integration access.

## Payments

v1.0 intentionally ships no payment adapter.

Before adding payments:
- [ ] use a reputable payment provider/hosted flow where appropriate;
- [ ] never trust browser-reported payment success;
- [ ] verify provider callbacks/server events;
- [ ] use idempotency for payment/booking reconciliation;
- [ ] keep payment state separate from display-only UI state.

## Data and privacy

- [ ] Define what customer data is actually required.
- [ ] Apply data minimization and retention/deletion policies.
- [ ] Define access controls for customer and operational records.
- [ ] Review applicable privacy/cookie/legal requirements for the deployment jurisdiction.
- [ ] Never replace demo fixtures with real personal/customer data in the public repository.

## Operations

- [ ] Configure monitoring, error reporting and uptime checks.
- [ ] Define backup/recovery for durable reservation data.
- [ ] Define deployment rollback procedure.
- [ ] Confirm dependency/security update process.
- [ ] Review `SECURITY.md` and the adapter-specific threat model before launch.
