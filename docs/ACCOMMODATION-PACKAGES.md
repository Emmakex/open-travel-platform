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

Accommodation now has two reusable media levels:

- one property-level gallery for exterior, common areas and the overall stay;
- one independent gallery for every room type.

Both levels use the shared media library and direct upload flow. Room photography follows the room when that room is reused by multiple trips.

The public accommodation page displays the property gallery and room photography. Linked trip cards prefer the selected room image and fall back to the accommodation cover.

### Seasonal pricing

Accommodation can define date-based pricing rules. Each rule contains:

- label;
- start/end date;
- all room types or one room type;
- surcharge or discount;
- fixed amount per room/night or percentage of the room rate.

Matching seasonal rules are evaluated night by night, so a stay can cross two pricing periods correctly.

### Occupancy pricing

Reusable occupancy rules support:

- single supplement;
- triple occupancy discount;
- child-sharing discount;
- custom rules.

Rules can be constrained by:

- room type;
- minimum/maximum adults;
- minimum/maximum children;
- child age range.

Adjustments can be calculated as:

- fixed amount per room/night;
- percentage of the room stay;
- fixed amount per qualifying child/night;
- percentage of the child's proportional room share.

Matching rules can stack. A seasonal surcharge and an occupancy discount can therefore apply to the same stay.

### Package pricing preview

Every trip stay stores a **reference occupancy** used for package planning:

- number of adults;
- optional child ages.

Operator calculates the accommodation value for each departure using:

1. the selected room base nightly rate;
2. real check-in date derived from the trip departure + check-in day;
3. every matching seasonal rule;
4. every matching occupancy rule;
5. number of nights.

The preview exposes base value, seasonal adjustment, occupancy adjustment and final accommodation total per departure.

This calculation is server-compatible and covered by the permanent accommodation invariant tests.

## Pricing boundary

Phase 6C-3 provides the reusable accommodation pricing engine and date/occupancy-aware package preview.

It does **not** silently rewrite historical trip `fromPrice`, traveller pricing or existing reservation snapshots.

Booking-time room allocation will later call the same pricing engine with the travellers' real room distribution before room inventory is consumed.

## Inventory boundary

Room inventory remains in `travel_accommodation_inventory` and is never copied onto the trip.

Phase 6C-3 still does not consume or release room inventory when a trip reservation is created/cancelled. That operation must be transactional and belongs to the next accommodation-booking slice.

## Operator workflow

1. Create the accommodation and room types.
2. Save it.
3. Configure room kind, meal plan and base nightly rate.
4. Add seasonal and occupancy pricing rules.
5. Add the property gallery and each room gallery.
6. Open a trip.
7. In **Trip accommodation**, add a stay.
8. Select accommodation and room.
9. Set check-in day and nights.
10. Choose Included or Optional.
11. Set the reference adults and optional child ages.
12. Review the real pricing preview for each departure.
13. Save the trip accommodation.

## Validation checklist

- a room can only be selected from its real accommodation;
- check-in day is at least day 1;
- nights are at least 1;
- check-in day + nights cannot exceed trip duration;
- reference occupancy must be valid for the selected room;
- child ages must respect the room child-age limit;
- seasonal date ranges are valid;
- percentage discounts/surcharges remain within safe bounds;
- the accommodation remains reusable in another trip;
- changing a link does not duplicate room inventory;
- editing core accommodation data does not delete room rates or galleries;
- public pages never expose internal IDs or pricing implementation details.
