# Optional trip package supplements

## Purpose

Trip package supplements are small optional commercial additions that belong to the trip reservation itself. They are intended for choices such as a luggage upgrade, a special dinner, a private upgrade without separate capacity, or another non-inventory supplement.

They are deliberately different from independent travel services.

Use an independent activity, transport or other service when the product has its own date, capacity, availability or reservation lifecycle. Use a package supplement only when no separate inventory needs to be consumed.

## Commercial rules

- supplements are always optional;
- mandatory costs belong in the base trip fare;
- a supplement can be charged once per booking or once for each selected traveller;
- every supplement has English and Spanish customer-facing titles;
- descriptions, when used, must be completed in both languages;
- the supplement uses the trip currency;
- a trip supports up to 20 configured supplements;
- disabled supplements cannot be selected by customers.

## Booking flow

During trip booking the customer can review active supplements after traveller and accommodation choices.

A `per-booking` supplement is selected once and adds one unit to the reservation.

A `per-traveller` supplement lets the customer choose the exact travellers who receive it. The total is the configured unit price multiplied by the number of selected travellers.

The browser only previews the result. The booking action rebuilds the supplement selection from the current trip configuration and the validated reservation travellers before creating the reservation. Unknown, disabled or manipulated selections are rejected.

## Reservation snapshot

Selected supplements are copied onto the reservation as immutable commercial snapshots containing:

- add-on ID and code;
- English and Spanish titles;
- English and Spanish description when provided;
- pricing mode;
- unit price;
- quantity;
- selected traveller IDs for per-traveller supplements;
- final supplement total.

The reservation also stores `packageAddOnTotal`.

Changing a catalogue supplement later does not rewrite historical reservations.

## Price composition

The reservation total is calculated as:

`trip traveller fare + optional accommodation additions + package supplement total`

Included accommodation remains valued and snapshotted but is not added a second time.

## Changes and cancellation

A departure change recalculates the traveller fare and date-sensitive accommodation, while the contracted package supplement snapshot remains unchanged. The supplement amount continues to form part of the reservation total.

Cancelling a reservation does not need to release supplement inventory because package supplements do not own inventory. The snapshot remains on the cancelled reservation for audit/history.

If a product later needs capacity management, it should be migrated to the independent service model rather than adding inventory semantics to package supplements.

## Operator workflow

1. Open a trip in Operator.
2. Go to **Optional package supplements**.
3. Add a supplement.
4. Complete English and Spanish titles.
5. Add matching bilingual descriptions when needed.
6. Set the price.
7. Choose `Once per booking` or `Per selected traveller`.
8. Enable it when it is ready for customers.
9. Save package supplements.
10. Review the public trip page and booking flow in both languages.

## Regression protection

The permanent package supplement invariant check verifies:

- bilingual configuration rules;
- unique codes;
- once-per-booking pricing;
- selected-traveller pricing;
- deduplication of repeated selections;
- rejection of unknown or disabled supplements;
- rejection of traveller IDs outside the reservation;
- preservation of the reservation snapshot after catalogue values change.
