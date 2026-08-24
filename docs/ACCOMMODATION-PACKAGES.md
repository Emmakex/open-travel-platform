# Accommodation and trip packages

## Purpose

Accommodation is a reusable catalogue product. A hotel/lodge is created once, owns its room types and room inventory, and can then be linked to one or more trips.

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

Room types can now define:

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

## Pricing boundary

`baseNightlyRate` is a reference/base room rate. It is not yet the complete package-pricing engine.

Seasonal rate periods, supplements, child-sharing adjustments and booking-time package pricing belong to the next accommodation pricing slices.

Historical trip `fromPrice` and traveller pricing are not silently rewritten when an accommodation component is linked.

## Inventory boundary

Room inventory remains in `travel_accommodation_inventory` and is never copied onto the trip.

Phase 6C-2 does not yet consume or release room inventory when a trip reservation is created/cancelled. That operation will be added transactionally when accommodation selection becomes part of booking.

## Operator workflow

1. Create the accommodation and room types.
2. Save it.
3. Edit the accommodation and configure room kind, meal plan and base nightly rate.
4. Open a trip.
5. In **Trip accommodation**, add a stay.
6. Select accommodation and room.
7. Set check-in day and nights.
8. Choose Included or Optional.
9. Save the trip accommodation.

## Validation checklist

- a room can only be selected from its real accommodation;
- check-in day is at least day 1;
- nights are at least 1;
- check-in day + nights cannot exceed trip duration;
- the accommodation remains reusable in another trip;
- changing a link does not duplicate room inventory;
- room base rate × nights is shown only as a reference in Operator;
- public trip pages show hotel/room/nights without exposing internal IDs or reference calculations.
