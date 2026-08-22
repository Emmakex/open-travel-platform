# Service availability and inventory

Phase 5D introduces independent availability for Activity and Transport products. Insurance remains quote-based and does not use dated inventory slots.

## Collection

`travel_service_availability`

Each slot stores:

- service ID and service type
- service date
- start/end time
- inventory mode (`people` or `units`)
- capacity
- reserved inventory
- open/closed status
- optional slot-level price override

The collection is intentionally separate from trip departures. Activity and transport inventory must not consume trip capacity unless a later booking explicitly contains both products.

## Inventory semantics

Activities use participant inventory (`people`).

Transport inventory is inferred from the commercial pricing model:

- `per-unit` -> unit inventory (for example, private vehicles)
- other pricing modes -> passenger inventory

Transport products can also keep a capacity-per-unit value on the product itself.

## Safe operator edits

Operator can create, edit, close and remove service slots. Reserved inventory is never accepted from the browser and is preserved server-side.

A capacity cannot be reduced below the already reserved quantity. If a slot with reservations is removed from the Operator form, it is closed rather than deleted.

## Public catalogue

Published Activity and Transport detail pages show only:

- future slots
- open slots
- slots with remaining inventory

Closed, past and sold-out slots are not advertised.

Public catalogue and detail pages remain accessible without authentication. Authentication will be introduced only at the service booking/purchase step.

## Insurance

Insurance products do not use availability slots. Their future quote/booking flow will validate:

- destination
- trip start/end dates
- trip duration against `maxTripDays` when configured
- travellers and age composition
- pricing rules for the insurance product

This keeps insurance eligibility separate from physical inventory.

## Next step

Phase 5E will introduce a unified service booking/order model so a customer can reserve an Activity, Transport or Insurance product independently or attach it to an existing trip reservation.
