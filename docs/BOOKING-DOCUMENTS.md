# Booking documents

<p align="center"><strong>English</strong> · <a href="./BOOKING-DOCUMENTS.es.md">Español</a></p>

Open Travel Platform provides a reusable server-side document layer for customer-facing booking documents. Kairoseth Travel uses it as the reference implementation.

## Booking confirmation PDF

Trip reservations can generate a bilingual EN/ES booking confirmation PDF from the current reservation snapshot.

Customer route:

```text
/account/reservations/:id/confirmation
```

Operator route:

```text
/operator/reservations/:id/confirmation
```

Operator staff can also use the protected document workspace:

```text
/operator/documents
```

## What the confirmation contains

The PDF can contain:

- reservation reference and current status;
- trip name and booked travel dates;
- booking creation date;
- party size and reservation total;
- customer contact summary;
- traveller names from the reservation snapshot;
- booked accommodation, room type, dates, nights, room count and meal plan;
- package supplements and their booked totals;
- customer payment status, net paid amount and outstanding balance when the caller is allowed to access that information.

The document is a reservation summary. It explicitly states that it does not replace a fiscal invoice.

## Authorization and privacy

### Customer

A customer can only download a confirmation for a reservation owned by their own authenticated identity. The repository lookup is scoped by both `identityId` and reservation ID.

### Operator

Generating a confirmation from Operator requires the `reservations` staff capability.

Payment details are only loaded into an Operator-generated PDF when the staff identity also has the `finance` capability. A Reservations-only Operator can still create the customer-facing booking summary, but payment status/paid/outstanding values are omitted.

### Deliberately excluded data

The booking confirmation renderer does **not** load or expose:

- encrypted post-purchase traveller/document data;
- passport/DNI fields collected after booking;
- internal reservation notes;
- task/follow-up comments;
- supplier references/localizers;
- internal supplier costs;
- supplier notes or fulfilment audit events;
- internal amendment reasons;
- staff authentication/security data.

This separation is intentional. More sensitive exports must have their own authorization, audit and retention contract rather than reusing a customer-facing confirmation document.

## Technical architecture

The reusable renderer is implemented in:

```text
lib/booking-confirmation-document.ts
```

It uses `pdf-lib` on the Node.js runtime and returns PDF bytes directly. No external browser, office suite, PDF service or deployment-specific binary is required.

The document endpoints are dynamic and use private `no-store` cache headers.

The renderer is intentionally independent from MongoDB and authentication. Routes are responsible for loading only authorized data and passing the safe document input to the renderer. This makes the document layer reusable for future adapters and deployments.

## CI invariant

`npm run check:booking-documents` generates real EN and ES PDFs and verifies:

- valid `%PDF-` output;
- safe filename generation;
- customer ownership-scoped access;
- Reservations capability on Operator routes;
- Finance gating for payment details;
- protected Operator documents workspace;
- absence of post-purchase traveller-data and supplier dependencies from the renderer.

The check is part of both `npm run verify` and GitHub Actions CI.

## Next document work

The shared document foundation can now be extended for:

- rooming lists;
- traveller lists;
- vouchers;
- printable reservation dossiers;
- controlled CSV/XLSX exports;
- audited sensitive-data exports where a legitimate operational use requires them.
