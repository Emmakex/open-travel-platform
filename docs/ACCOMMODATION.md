# Accommodation foundation

Accommodation is a dedicated domain in Open Travel Platform. It is intentionally separate from generic activities, transport and travel-protection services because room occupancy, room inventory and package pricing have different lifecycle rules.

## Current scope

The first accommodation slice provides:

- reusable accommodation products;
- English and Spanish customer-facing content;
- room types with stable IDs and codes;
- adult/child/total occupancy rules;
- optional child maximum age;
- room inventory by date range;
- open/closed inventory periods;
- safe catalogue editing in Operator;
- public accommodation catalogue and detail pages.

Room pricing, supplements, reservations and package composition are intentionally not part of this first slice.

## MongoDB collections

```text
travel_accommodations
travel_accommodation_inventory
```

`travel_accommodations` stores the current reusable product and room definitions.

`travel_accommodation_inventory` stores room capacity by room type and date range. Inventory is separate from the product so later booking transactions can reserve/release rooms atomically without rewriting the catalogue document.

## Room occupancy

Each room type defines:

- minimum adults;
- maximum adults;
- maximum children;
- maximum total occupancy;
- optional maximum child age.

The current foundation requires at least one adult. Total occupancy cannot exceed the theoretical adult + child capacity, and a child age is only stored when children are allowed.

These rules are the future source of truth for room assignment and package pricing. They are not presentation-only metadata.

## Inventory safety

Inventory periods for the same room type may not overlap.

`reserved` is system-managed. Operator edits capacity, not the number already reserved.

When an inventory period already has reservations:

- capacity cannot be reduced below `reserved`;
- removing the period from the editor closes it instead of deleting it;
- the reserved count remains intact.

Accommodation and inventory changes are stored within one MongoDB transaction.

## Operator workflow

```text
Operator → Accommodation → New accommodation
```

1. Enter property content and publication state.
2. Add at least one room type.
3. Define occupancy limits.
4. Add optional inventory periods.
5. Save.
6. Publish only when the customer-facing content is ready.

## Public routes

```text
/accommodations
/accommodations/[slug]
```

The detail page displays room types, occupancy rules and upcoming open inventory. Booking is deliberately unavailable until the pricing and reservation layers are implemented.

## Production test checklist

1. Create a Draft accommodation with one Double room.
2. Save and reload; confirm the stable room ID/code and occupancy persist.
3. Add a second room type and confirm both persist.
4. Add one inventory period and confirm it appears after reload.
5. Attempt overlapping inventory periods for the same room type and confirm validation rejects the save.
6. Create overlapping dates for different room types and confirm they are accepted.
7. Publish the accommodation and confirm it appears under `/accommodations`.
8. Confirm EN/ES content falls back correctly when a Spanish field is empty.
9. Confirm mobile navigation exposes Accommodation.
10. Confirm the normal CI accommodation invariant check passes.

## Next slices

The planned progression is:

- room pricing and occupancy pricing;
- single/double/twin/triple and child-sharing rules;
- seasonal supplements and optional extras;
- room reservations with transactional inventory;
- package composition connecting trips, accommodation and reusable services;
- server-side package pricing with permanent invariant tests.
