# Accommodation and trip packages

## Purpose

Accommodation is a reusable catalogue product. A hotel/lodge is created once, owns its room types, photography, pricing rules and room inventory, and can then be linked to one or more trips.

A trip never receives a copied hotel document or duplicated room inventory.

## Phase 6C-1

The accommodation foundation provides:

- accommodation catalogue products;
- room types;
- adult/child occupancy rules;
- room inventory periods;
- protected capacity rules;
- public accommodation pages;
- media-library cover images.

## Phase 6C-2

Room types can define:

- commercial room kind: single, double, twin, triple, family, suite or other;
- meal plan;
- base reference rate per room/night.

Trip accommodation components reference:

- accommodation ID;
- room type ID;
- check-in day within the trip;
- number of nights;
- whether the stay is included or optional.

The server verifies that the room belongs to the selected accommodation and that the stay fits inside the trip duration.

## Phase 6C-3

### Property and room galleries

Accommodation has two reusable media levels:

- one property-level gallery for exterior, common areas and the overall stay;
- one independent gallery for every room type.

Both levels use the shared media library and direct upload flow. Room photography follows the room when that room is reused by multiple trips.

### Seasonal and occupancy pricing

Accommodation can define date-based surcharge/discount rules and reusable occupancy rules for single supplements, triple discounts, child sharing and custom scenarios.

Matching seasonal rules are evaluated night by night. Occupancy rules can constrain room type, adult/child counts and child ages, and matching rules may stack.

Operator can preview the accommodation value for each trip departure with a reference occupancy before the product is sold.

## Phase 6C-4

### Booking-time room allocation

Trip booking now uses the actual travellers rather than the reference occupancy.

For every included or selected optional accommodation component the server:

1. calculates each traveller's age on the accommodation check-in date;
2. classifies hotel child/adult occupancy using the room's configured child-age rule;
3. finds the minimum valid number of rooms;
4. distributes the reservation travellers across those rooms;
5. validates adult, child and maximum occupancy limits;
6. prices every allocated room with the same seasonal/occupancy engine from Phase 6C-3;
7. checks that room inventory covers every night of the stay.

The browser shows the proposed room distribution before confirmation, but the server recalculates it from the submitted travellers. Client totals and room assignments are never trusted as booking inputs.

### Included versus optional accommodation

`included` means the stay is already part of the trip/package fare. Its current accommodation value is calculated and snapshotted for operations, but it is **not added to the trip fare a second time**.

`optional` means the customer must select the stay. Its calculated value is added to the reservation total when selected.

This separation avoids accidental double charging while preserving the real accommodation cost/value in the reservation snapshot.

### Reservation snapshot

New reservations can store:

- property and room references/names;
- check-in and check-out dates;
- nights and meal plan;
- exact room count;
- traveller IDs allocated to every room;
- hotel adult count and child ages per room;
- base, seasonal and occupancy pricing breakdown per room;
- calculated accommodation total;
- amount actually added to the reservation total;
- room-inventory period IDs and room quantities consumed.

Existing reservations are not backfilled or silently changed.

### Transactional inventory

Departure capacity and accommodation room inventory are reserved inside the same MongoDB transaction as the reservation insert.

If either the departure or any required room block becomes unavailable, the whole booking rolls back.

Customer and Operator cancellations release departure and room inventory in the same transaction. A release failure also rolls the cancellation back instead of leaving inventory inconsistent.

### Departure changes

Reservations that already contain accommodation snapshots also move their accommodation when Operator changes the trip departure.

The transaction:

1. reprices travellers for the new departure;
2. reserves the new departure capacity;
3. recalculates room allocation and accommodation pricing for the new dates;
4. reserves any positive room-inventory delta;
5. releases room inventory no longer needed;
6. releases the previous departure capacity;
7. updates the reservation snapshot and amendment history.

Room movements are netted by inventory period. If the old and new stay use the same period, the reservation does not need artificial duplicate capacity.

The amendment preserves the accommodation snapshot before and after the change.

## Currency boundary

Phase 6C-4 does not introduce an FX engine. A linked accommodation must use the same currency as the trip before it can be sold through the trip booking flow.

A mismatch blocks the reservation rather than silently converting an amount with an undefined exchange rate.

## Inventory ownership

Room inventory remains authoritative in `travel_accommodation_inventory` and is never copied into the trip catalogue record.

The reservation stores a historical allocation snapshot so room inventory can later be released or moved safely.

## Operator workflow

1. Create the accommodation and room types.
2. Configure occupancy and room inventory.
3. Configure room kind, meal plan and base nightly rate.
4. Add seasonal and occupancy pricing rules.
5. Add the property gallery and each room gallery.
6. Link the accommodation/room to a trip.
7. Choose Included or Optional, check-in day and nights.
8. Create room inventory that covers the trip departure dates.
9. Make a new reservation with real travellers.
10. Review the generated room allocation in Customer account and Operator.
11. Cancel or change departure to validate transactional room release/reallocation.

## Validation checklist

- room assignment uses real traveller dates of birth;
- every traveller appears in exactly one allocated room per selected stay;
- room occupancy rules are satisfied;
- hotel child ages are evaluated at check-in;
- included accommodation is not charged twice;
- selected optional accommodation is added to the reservation total;
- unselected optional accommodation consumes no room inventory;
- every stay night is covered by open room inventory;
- insufficient room inventory blocks the entire reservation;
- cancellation releases both departure and room inventory;
- departure change reserves the replacement before releasing obsolete inventory;
- old/new accommodation snapshots are retained in amendment history;
- old reservations without accommodation snapshots continue to work unchanged.
