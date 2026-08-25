# Departure traveller and rooming documents

Phase 7B-2 adds operational documents grouped by real trip departure.

## Scope

Operator staff with the **Reservations** capability can generate two private PDFs from **Operator → Documents**:

- **Traveller list** — all travellers attached to non-cancelled reservations for the selected trip departure.
- **Rooming list** — the accommodation and room allocation snapshots stored on those reservations.

The departure grouping key is `tripId + availabilityId`. Cancelled reservations are excluded automatically.

## Traveller list

The traveller list includes only basic booking snapshot data:

- reservation reference and reservation status;
- traveller first and last name;
- lead-traveller marker;
- date of birth;
- age calculated for the booked departure;
- nationality;
- booked pricing label.

It is intended as an operational manifest, not as a secure identity-document export.

## Rooming list

The rooming list follows the accommodation snapshot stored when the reservation was priced/created or later amended. It includes:

- accommodation name;
- check-in/check-out dates and number of nights;
- room type;
- meal plan;
- each reserved room allocation;
- booking reference;
- travellers assigned to each room.

This avoids rebuilding room allocation from the current catalogue after the booking has changed historically.

## Privacy and permissions

Both routes require the server-side **Reservations** capability and return `private, no-store` responses.

These documents deliberately do **not** load or export:

- encrypted post-purchase traveller/document/residence values;
- internal reservation notes;
- task comments;
- supplier references, costs or notes;
- internal amendment reasons;
- payment/provider secrets.

A later 7B delivery will add a separate, explicitly audited export path for protected post-purchase traveller data when there is a legitimate operational need. The normal traveller/rooming documents must not silently become that export channel.

## CI

`npm run check:departure-documents` verifies:

- cancelled reservations are excluded;
- multiple active reservations group into one departure;
- traveller and room allocation rows are stable;
- EN/ES traveller-list PDFs can be generated;
- EN/ES rooming-list PDFs can be generated;
- both private routes require Reservations permission;
- protected traveller-data and supplier modules are not imported by these routes.
