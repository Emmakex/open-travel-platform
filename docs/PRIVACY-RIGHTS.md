# Privacy rights operational foundation

Phase 9D-1 adds a technical workflow for authenticated privacy-rights cases. It is designed around the EU GDPR rights model and the Spanish AEPD guidance, but **it is not a legal-compliance certification and it does not choose a legal basis or statutory retention period for a deployment**.

Primary official references used for this technical baseline:

- GDPR (Regulation (EU) 2016/679), Articles 12, 15–20: https://eur-lex.europa.eu/eli/reg/2016/679/oj
- Spanish Data Protection Agency (AEPD), exercise of rights: https://www.aepd.es/derechos-y-deberes/ejerce-tus-derechos

## Supported request types

An authenticated customer can submit and track:

- access;
- rectification;
- erasure;
- restriction of processing;
- objection;
- data portability.

Only one open case of the same type is retained per customer at a time. Once a case is terminal, a later request of the same type can be created normally.

## Deadline model

`receivedAt` is recorded by the server and the initial `dueAt` is one UTC calendar month later, with safe end-of-month clamping.

The Admin workflow can record a one- or two-additional-calendar-month extension only with a structured `complexity` or `request-volume` reason. `dueAt` remains the original deadline; `extendedDueAt` records the current extended deadline so the original timeline is not overwritten.

The software does not decide whether an extension is legally justified. Operators remain responsible for timely communication and for applying the actual law to the case.

## Identity and minimisation boundary

Customer requests originate from an authenticated persistent customer session. The case stores:

- customer identity ID;
- request type and workflow status;
- receipt/deadline timestamps;
- structured retention/extension/outcome codes;
- bounded audit metadata.

It deliberately does **not** copy customer email, passwords, password hashes/salts, session tokens/hashes, provider credentials, encrypted traveller payloads, document numbers or free-form case narratives into the privacy-case collections.

If additional identity verification is needed, Admin can move the case to `verification-required`. Phase 9D-1 does not store identity-document copies for that verification.

## Erasure is reviewed, not automatic

An erasure request starts with `retentionState=pending`.

The Admin workflow can resolve it to:

- `clear` — no retention hold recorded by this technical review;
- `hold` — a structured reason is required: `legal-obligation`, `legal-claims`, `rights-of-others` or `other-applicable-basis`.

A case cannot be closed as `completed` while its erasure retention review remains pending. This fail-closed rule prevents a UI action from claiming erasure was handled before the retention boundary has been assessed.

**Phase 9D-1 never hard-deletes reservations, payment ledger movements, customer accounts, audit history or Traveller Data as a consequence of submitting or closing a request.** The actual access/portability export and erasure/restriction executor is a later 9D slice and must apply an explicit allowlist plus the deployment's reviewed retention/legal-hold policy.

## Case states and audit

The lifecycle is:

```text
received
  ├─ verification-required
  ├─ in-review
  │    ├─ action-pending
  │    └─ verification-required
  └─ declined

in-review / action-pending
  ├─ completed
  └─ declined

customer may withdraw any non-terminal case
```

Staff cannot set `withdrawn`; only the owning customer can withdraw an open case. Terminal cases cannot be mutated.

Request creation, withdrawal, staff status changes, deadline extensions and retention review are persisted with bounded audit events. Customer request creation and its audit event commit in the same MongoDB transaction; audit failure rolls the request back.

Closing a staff-reviewed case requires a structured outcome (`fulfilled`, `partially-fulfilled`, `identity-not-verified`, `not-applicable` or `retention-required`).

## Technical personal-data inventory

`lib/privacy-data-inventory.ts` is the initial allowlisted technical inventory for Phase 9D-2. It classifies current stores by access/export boundary and erasure/retention behavior without pretending to determine the deployment's legal basis.

Important boundaries already recorded include:

- customer profile versus credential/security internals;
- TTL-managed customer sessions;
- pseudonymous authentication audit;
- trip and service reservations;
- authoritative payment/refund ledger;
- encrypted Traveller Data and field-name-only audit;
- operations audit;
- the privacy-rights case itself.

The inventory must be reviewed whenever a new collection containing customer-linked or personal data is introduced.

## Validation

The blocking MongoDB validation proves:

- calendar-month deadline behavior, including leap-year/month-end boundaries;
- one-open-case-per-right duplicate protection;
- transactional request + audit persistence;
- rollback when privacy audit persistence fails;
- customer-only withdrawal;
- erasure completion blocked while retention review is pending;
- structured retention reason required for a hold;
- structured outcome required to close a staff-reviewed case;
- terminal cases cannot be mutated;
- no credential/protected-traveller fields are copied into case/audit storage.

## Next privacy slice

Phase 9D-2 should implement the actual access/portability package and controlled erasure/restriction executor. It must use the inventory allowlist, preserve rights of others and protected internal data, respect retention/legal holds, log execution without copying exported personal data into audit, and remain reversible where deletion is not legally/operationally appropriate.
