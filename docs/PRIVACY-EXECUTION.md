# Privacy-right execution: exports, restriction and erasure

This document describes the technical execution layer that follows the privacy-request workflow. It is designed with the EU GDPR and Spanish AEPD guidance in mind, but it is **not legal advice, a legal-basis decision, or a compliance certification** for a particular deployment.

Official references used for the technical baseline:

- GDPR (Regulation (EU) 2016/679), especially Articles 15, 17, 18 and 20: https://eur-lex.europa.eu/eli/reg/2016/679/oj
- AEPD right of access: https://www.aepd.es/derechos-y-deberes/conoce-tus-derechos/derecho-de-acceso
- AEPD right to erasure: https://www.aepd.es/derechos-y-deberes/conoce-tus-derechos/derecho-de-supresion-al-olvido
- AEPD restriction guidance: https://www.aepd.es/derechos-y-deberes/conoce-tus-derechos/derecho-la-limitacion-del-tratamiento
- AEPD portability FAQ: https://www.aepd.es/preguntas-frecuentes/1-tus-derechos/2-tus-derechos-de-proteccion-de-datos/FAQ-0113-que-es-el-derecho-a-la-portabilidad-de-los-datos

## Execution precondition

Creating a privacy request never executes an export, restriction or erasure by itself.

An Admin must first review the case and move it to `action-pending`. The execution layer then applies right-specific gates:

- access / portability: explicit Admin release approval is required before the customer download endpoint becomes available;
- restriction: explicit Admin confirmation is required;
- erasure: explicit Admin confirmation **and** `retentionState=clear` are required.

Terminal cases (`completed`, `declined`, `withdrawn`) cannot start new data operations.

## Access and portability exports

Approved exports are delivered as `application/json`, with a stable `schemaVersion` and machine-readable structure.

The customer route is authenticated, identity-scoped, returned as an attachment and marked `private, no-store`.

### Access package

The access package may include:

- safe customer profile fields;
- customer-owned trip reservations;
- customer-owned service reservations;
- active protected Traveller Data decrypted only for that customer and only when the configured keyring is available;
- payment/refund movement history related to the customer's reservation identifiers;
- privacy-case history;
- customer-relevant booking status history with unrelated staff identity removed.

It deliberately excludes passwords, password hashes/salts, raw session tokens, token hashes, provider credentials and unrelated staff/internal identifiers.

If active encrypted Traveller Data exists but the keyring is unavailable, export generation fails closed rather than silently returning an incomplete package.

### Portability package

The portability package is narrower. It focuses on account information and booking/service/traveller data supplied through or generated directly from the customer's use of the platform in a structured JSON format.

Payment/accounting history, privacy-case internals and staff audit history are excluded from the portability package. Whether Article 20 applies to a particular processing activity still depends on the legal conditions of that deployment; the software does not choose the legal basis.

## Restriction of processing

The current technical restriction executor suspends the customer account and revokes all persisted customer sessions. It **does not delete business records**.

This reflects the important distinction that restriction can require data to remain stored while ordinary processing/use is suspended. Product- or deployment-specific downstream processors may require additional restriction propagation outside the open-source core.

## Erasure executor

Erasure is fail-closed unless the privacy case has passed retention review with `retentionState=clear`.

The bounded online executor:

- disables and anonymises the customer profile;
- replaces direct reservation ownership with a deterministic request-scoped pseudonym;
- clears traveller names, dates of birth and nationality from trip/service snapshots while preserving booking, inventory and financial structure;
- pseudonymises customer actors in service status history;
- revokes customer sessions;
- removes protected Traveller Data owned by that identity;
- removes free-text payment notes and customer actor identifiers while retaining the authoritative monetary ledger;
- pseudonymises authentication-audit subject linkage and removes its email hash;
- pseudonymises privacy-case/audit identity linkage;
- pseudonymises customer-targeted operational tasks;
- removes retained customer integration-event copies and their delivery/attempt records.

The original technical account ID remains the primary key of the disabled account record, but directly identifying profile fields are replaced/removed and secondary case/business ownership is moved to the deterministic pseudonym. Deployments with stricter deletion requirements may add a later offline compaction/migration after all retention and referential constraints are satisfied.

## Bounded online execution and offline migration

The online erasure path is intentionally bounded to at most 500 trip reservations and 500 service reservations for one identity. Accounts above that limit fail with `PRIVACY_EXECUTION_REQUIRES_OFFLINE_MIGRATION` instead of attempting an unbounded web-request transaction.

Large-account handling belongs in a controlled offline migration/runbook with backups, dry-run inventory and post-run verification.

## Retry model

Primary account/reservation erasure is transactional. Secondary-link cleanup runs in a second transaction and is idempotent.

The runner first checks the persisted erasure execution record. If primary erasure already succeeded, a retry reuses the same pseudonym and only converges the secondary cleanup. This makes process interruption or transient secondary cleanup failure recoverable without generating a second pseudonym or re-running destructive primary work.

## Closing the privacy case

Execution and case closure are separate operations. After verifying the technical result, Admin should close the request with the appropriate structured outcome (`fulfilled`, `partially-fulfilled`, `retention-required`, etc.).

This separation prevents a destructive action from implicitly asserting that every legal/communication obligation of the request has been completed.
