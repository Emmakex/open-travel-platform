# Privileged audit hardening

Phase 9C-4 makes high-impact administrative mutations **fail-closed** with their persistent audit record. A privileged change is not considered committed unless the business mutation and its audit event commit together in the same MongoDB transaction.

## Covered privileged surfaces

### Payment provider settings

Stripe and Redsys TEST/LIVE configuration changes are committed transactionally with `travel_payment_provider_audit`.

The audit records only operational metadata such as provider, environment, enabled state, actor identity/role and timestamp. API keys, webhook secrets, Redsys signing keys and other secret values are never written to audit records.

If the audit insert fails, the payment-provider settings replacement is rolled back automatically. This prevents a privileged credential/configuration change from existing without a corresponding audit event.

### Outbound integration endpoints

Webhook endpoint creation, update and deletion are committed transactionally with `travel_integration_endpoint_audit`.

Audit metadata is intentionally bounded to endpoint identity, action, actor, enabled state, subscribed event names and timestamp. The encrypted signing secret is not copied into audit history.

If audit persistence fails, endpoint creation/update/deletion is rolled back.

### Staff capability assignments

Explicit staff capability assignment and removal already use MongoDB transactions with `travel_staff_capability_audit`. Phase 9C-4 preserves that contract as the reference behavior for other privileged mutations.

## Fail-closed rule

For an audited privileged mutation:

```text
read current authoritative state
        ↓
apply privileged mutation
        ↓
insert bounded audit event
        ↓
commit one MongoDB transaction
```

Any exception before commit aborts the transaction. The application must not catch an audit failure and proceed with the privileged mutation.

This is deliberately stricter than ordinary observability. Structured logs and `FailureTransport` are operational diagnostics and remain best-effort/non-authoritative; persistent privileged audit is part of the mutation's integrity boundary.

## Audit privacy boundary

Persistent audit should answer **who changed what category of privileged state, when, and to which high-level state** without becoming a second secret or personal-data store.

Do not place any of the following in generic privileged audit records:

- API keys, signing secrets, passwords, session tokens or encryption keys;
- raw provider/webhook payloads;
- customer or traveller personal data;
- full protected post-purchase values;
- payment card data or other payment credentials.

When detailed forensic evidence is needed, correlate the bounded audit event with structured operational logs using safe identifiers and timestamps rather than duplicating sensitive payloads.

## MongoDB requirement

Fail-closed privileged audit requires MongoDB transaction support. Production MongoDB/Atlas deployments must therefore provide a replica set or another transaction-capable topology. This is already aligned with transactional booking, inventory and outbox requirements.

## Validation

The blocking validation includes:

- static invariants proving payment, integration and staff-permission mutations use MongoDB sessions/transactions;
- a real MongoDB replica-set test that intentionally makes the audit write fail;
- proof that a rejected payment settings change leaves the previous configuration intact;
- proof that a rejected integration endpoint deletion leaves the endpoint intact.

A future Phase 9C block will separately address encryption-key recovery/rotation procedures and re-encryption. Audit hardening does not by itself make master keys safely rotatable.
