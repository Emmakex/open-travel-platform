# Vouchers and reservation dossiers

<p align="center"><strong>English</strong> · <a href="./VOUCHERS-DOSSIERS.es.md">Español</a></p>

Phase 7B-3 adds customer-safe vouchers and an internal printable Operator dossier on top of the existing booking-confirmation and departure-document layer.

## Document types

### Accommodation voucher

Available for a **confirmed trip reservation with accommodation**.

The customer and authorized Operator can download the same customer-safe document. It is generated from the reservation snapshot and includes:

- reservation reference;
- trip and travel dates;
- traveller names;
- accommodation and room type;
- check-in/check-out dates;
- meal plan;
- snapshotted room allocation;
- an approved supplier confirmation/localizer when one has explicitly been cleared for customer disclosure;
- document version/status and UTC generation timestamp.

It does not read protected post-purchase traveller storage and does not include supplier costs or internal notes.

### Service voucher

Available for a **confirmed independent service reservation**.

The customer and authorized Operator can download the same customer-safe voucher for activities, transport or travel protection. It includes the contracted service snapshot, date/time or covered trip dates, traveller names and an approved supplier reference when applicable.

### Operator reservation dossier

The dossier is an **internal operational document** available to staff with the Reservations capability.

It consolidates:

- reservation status and dates;
- customer contact summary;
- ordinary traveller snapshot data;
- accommodation allocation;
- package supplements;
- linked service reservations;
- payment summary only when the current staff account has Finance capability;
- supplier fulfilment summary only when the current staff account has Suppliers capability;
- document version/status and UTC generation timestamp.

The dossier intentionally excludes protected post-purchase document/residence values, supplier costs and internal free-text notes.

## Supplier-reference disclosure boundary

Supplier references are internal by default.

A reference can appear on a customer voucher only after a staff member with Suppliers capability explicitly approves **that exact current reference** in the Supplier fulfilment panel.

The approval is persisted separately from the fulfilment record and audited. The disclosure record stores the exact approved reference. Customer-safe projection requires all of the following:

1. the fulfilment component still has a supplier reference;
2. disclosure is currently enabled;
3. the approved reference exactly matches the current supplier reference.

If the supplier reference is changed later, the previous approval no longer matches and the new value is automatically hidden until it is explicitly approved again. This prevents a previously approved locator from silently authorizing a replacement value.

## Access rules

Customer routes always resolve the current authenticated customer and load only a reservation owned by that identity.

Voucher routes also require the reservation to be `confirmed`. Accommodation vouchers additionally require a snapshotted accommodation booking.

Operator voucher/dossier routes require the Reservations capability. The dossier independently checks Finance and Suppliers capabilities before loading those data sets.

All generated PDF endpoints use:

```text
Cache-Control: private, no-store, max-age=0
X-Content-Type-Options: nosniff
```

## Routes

```text
/account/reservations/[id]/accommodation-voucher
/account/services/[id]/voucher

/operator/reservations/[id]/accommodation-voucher
/operator/service-reservations/[id]/voucher
/operator/reservations/[id]/dossier
```

The main Operator entry point is `/operator/documents`.

## Persistence

Reference-disclosure policy is stored separately from fulfilment operational data:

```text
travel_supplier_reference_disclosures
travel_supplier_reference_disclosure_audit
```

The audit record captures staff identity/role, target/component, before/after visibility, the exact approved reference and timestamp. Customer routes never read this audit history.

## Quality gate

Run:

```bash
npm run check:voucher-documents
```

The invariant check generates real EN/ES PDFs and verifies ownership/authorization, confirmation guards, private response headers, exact-reference approval, audit persistence and renderer privacy boundaries.

`npm run verify` and GitHub CI include this gate together with the existing booking/departure document, fulfilment and staff-permission checks.
