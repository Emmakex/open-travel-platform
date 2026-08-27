# Retention and regulatory baseline

This document defines the Phase 9D-3 technical retention boundary for Open Travel Platform / Kairoseth Travel.

It is **not legal advice, a jurisdiction-specific retention schedule, or a compliance certification**. The MIT core deliberately does not hard-code one universal statutory period for bookings, payments, audits or privacy cases. Each production deployment must document and approve its actual retention schedule with the appropriate privacy/legal, finance, security and operations owners.

## Official references used for the baseline

- GDPR / Regulation (EU) 2016/679, especially Article 5(1)(e) storage limitation and Article 17 erasure/exceptions: https://eur-lex.europa.eu/eli/reg/2016/679/oj
- Spanish Commercial Code, Article 30 business-document conservation: https://www.boe.es/buscar/act.php?id=BOE-A-1885-6627
- Spanish General Tax Law 58/2003, especially Articles 66 and 70 on limitation/formal obligations: https://www.boe.es/buscar/act.php?id=BOE-A-2003-23186
- Directive (EU) 2015/2302 on package travel and linked travel arrangements: https://eur-lex.europa.eu/eli/dir/2015/2302/oj
- Spanish consumer law / package travel framework (Real Decreto Legislativo 1/2007): https://www.boe.es/buscar/act.php?id=BOE-A-2007-20555

The references above explain why retention cannot be reduced to “delete everything after N days”. GDPR requires personal data not to be identifiable longer than necessary for the processing purpose, while erasure may be limited where another legal obligation or the establishment, exercise or defence of legal claims applies. Spanish commercial/tax rules can also require business evidence to remain available for periods that differ by record type and circumstance.

## Technical policy model

`lib/privacy-retention-policy.ts` maps every entry in `privacyDataInventory` to one retention strategy and one operational owner.

Strategies:

- `ttl`: the store already carries bounded expiry metadata and can become eligible for expiry only after that timestamp;
- `case-review`: retention depends on the privacy/business case and deployment policy;
- `business-record-review`: booking, payment or operational evidence must be reviewed against contractual, consumer, accounting, tax and claims needs;
- `security-review`: security/audit evidence requires a dedicated security/privacy retention decision.

The registry never returns an instruction to delete business records. Its evaluator only returns:

- `retain`;
- `review-required`;
- `eligible-for-expiry`.

`eligible-for-expiry` is deliberately weaker than “delete now”. Actual deletion remains the responsibility of the store-specific lifecycle/TTL or a separately authorised migration.

## Hold precedence

A documented hold always wins over expiry eligibility.

Examples include an active dispute, fraud/security investigation, accounting/tax review, legal claim or another deployment-approved retention reason. The software does not invent the legal validity of a hold; it preserves the technical ability to block automatic expiry while the authorised owner documents the reason.

## Current matrix

| Inventory area | Owner | Strategy | Automatic destructive action |
| --- | --- | --- | --- |
| Customer account | Privacy | case-review | No |
| Customer sessions | Security | ttl | Existing TTL/revocation only |
| Authentication audit | Security | security-review | No |
| Trip reservations | Operations | business-record-review | No |
| Service reservations | Operations | business-record-review | No |
| Payment ledger | Finance | business-record-review | No |
| Protected Traveller Data | Privacy | ttl | Existing TTL only |
| Operations audit | Operations | business-record-review | No |
| Customer operations tasks | Operations | case-review | No |
| Integration outbox | Operations | case-review | No |
| Privacy-rights cases | Privacy | case-review | No |

## Spain / EU deployment decision checklist

Before a production deployment enables any new retention purge outside an existing TTL-managed store, document at least:

1. data-store/inventory ID and data categories;
2. processing/business purpose;
3. legal/contractual/accounting/security rationale reviewed for that deployment;
4. retention start event and duration or review trigger;
5. final action: delete, anonymise, aggregate or retain under hold;
6. responsible owner and approval date;
7. hold/exception rules and how they override expiry;
8. downstream processor/integration propagation where applicable;
9. backup/restore implications and the point after which restored data must be re-expired or re-anonymised;
10. evidence that the policy is reflected in customer-facing privacy information where required.

The six-year Spanish Commercial Code rule and the four-year General Tax Law limitation framework are **reference inputs**, not universal defaults for every database collection. The applicable period and start event must be decided for the concrete record and processing purpose.

## Relation to 9D-1 and 9D-2

- 9D-1 creates authenticated privacy-rights cases and requires retention review for erasure;
- 9D-2 performs approved access/portability exports, restriction and controlled erasure only when its retention gate allows it;
- 9D-3 supplies the technical retention policy registry and fail-closed expiry evaluation used to keep those decisions consistent with the complete personal-data inventory.

Future regulatory work may add deployment-specific policy persistence and Operator tooling, but the generic core must continue to avoid silently converting legal guidance into irreversible automatic deletion rules.
