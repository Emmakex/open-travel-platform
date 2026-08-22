# Traveller and age pricing

Phase 5B replaces the historical `partySize × unitPrice` assumption with traveller-level pricing that is calculated on the server.

## Core rule

A traveller's age is calculated on the **departure date**, not on the date the reservation is created.

Each trip can define contiguous pricing bands such as:

```text
Infant   0–1     150 EUR
Child    2–11    950 EUR
Youth   12–17   1250 EUR
Adult   18+     1500 EUR
```

The names and boundaries are configurable. `adult`, `child` and `infant` are not hard-coded commercial rules.

## Required traveller data

A new traveller-aware reservation collects:

- first name;
- last name;
- date of birth;
- nationality.

The first traveller is the lead traveller and must be at least 18 on the departure date.

Every traveller under 18 must reference a responsible adult travelling in the same reservation. The relationship is recorded as parent, legal guardian or another responsible adult.

More sensitive document fields such as passport/ID numbers are deliberately not required by this phase. They can be added later when a specific product or supplier requires them.

## Pricing bands

Trip-level bands are stored with the trip catalogue record and contain:

- stable ID;
- internal code;
- English and optional Spanish label;
- minimum age;
- optional maximum age;
- base price;
- whether one traveller in the band consumes one trip inventory space.

Valid bands must:

1. start at age 0;
2. have no gaps;
3. have no overlaps;
4. end in an open-ended final band.

The operator UI validates the same model again on the server before saving.

## Departure overrides

A departure can override the base price independently for each traveller band.

For example, a trip may have a base adult price of 1,500 EUR while a high-season departure charges 1,725 EUR. Child and infant prices can be overridden independently rather than inheriting an arbitrary percentage.

## Reservation snapshot

The server never trusts a browser-reported fare. At reservation creation it reloads the trip and departure, calculates every traveller's age, selects the matching pricing band and derives the final amount.

Each reservation stores a snapshot for every traveller containing:

- age at departure;
- pricing band ID/code/label;
- unit price actually contracted;
- inventory-consumption rule;
- guardian relationship for minors when applicable.

This means later catalogue price changes do not rewrite historical reservations.

## Inventory

`partySize` remains the human traveller count, but inventory uses a separate `inventorySpaces` snapshot.

Normally adults and children consume one space. A product can configure another band differently where the underlying inventory model requires it.

Cancellation releases the snapshotted `inventorySpaces`, not blindly the current traveller count.

## Backward compatibility

Trips created before Phase 5B have no explicit traveller bands. Until an operator saves age pricing, Kairoseth Travel creates safe effective bands that all use the historical trip/departure price. This avoids silently discounting children or infants during migration.

When the trip is first saved with explicit bands, those values become authoritative.

## Why this comes before payment-provider integration

The payment layer must receive an authoritative reservation total. Traveller pricing therefore comes before Stripe or another PSP:

```text
Traveller data
   ↓
Age on departure
   ↓
Server pricing bands
   ↓
Departure overrides
   ↓
Reservation snapshots + final total
   ↓
Payment provider
```

Future activities, transport and insurance products can reuse the same traveller/age model while defining their own pricing and inventory rules.
