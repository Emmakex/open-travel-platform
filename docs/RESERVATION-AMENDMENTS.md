# Reservation amendments

Phase 6B adds controlled post-booking changes without deleting or rewriting operational history.

## Core rule

A reservation document represents the **current operational state**. Every material post-booking change is also written to a separate immutable amendment timeline so staff can see what changed, who changed it, why it changed and when it changed.

MongoDB collection:

```text
travel_reservation_amendments
```

The payment ledger remains authoritative for money movements and is never rewritten by reservation amendments.

## Phase 6B-1 — traveller corrections

Operator/Admin may correct first name, last name and nationality without changing pricing or inventory. Every correction requires a reason and stores changed fields as `before → after`, actor identity/role and timestamp.

The reservation update and amendment-history insert execute inside the same MongoDB transaction. Cancelled reservations cannot be amended. Advanced encrypted post-purchase traveller data remains separate and is never copied into amendment history.

## Phase 6B-2 — departure changes

Operator/Admin may move a non-cancelled trip reservation to another future departure when the complete traveller composition fits.

Changing departure can change a traveller's age at departure. The server therefore recalculates:

- age at departure;
- traveller pricing band/code;
- traveller fare;
- inventory consumption;
- reservation unit/lead price;
- reservation total.

Existing traveller IDs are preserved so post-purchase traveller data remains attached to the same people.

### Atomic inventory rule

The MongoDB transaction performs the complete change as one unit:

1. Load the reservation, target departure and current trip pricing.
2. Recalculate the traveller composition against the target departure date.
3. Reserve the required capacity on the target departure.
4. Release capacity from the previous departure.
5. Update the reservation dates/pricing/inventory snapshot.
6. Store one immutable amendment with before/after values, price delta and inventory movement metadata.

If any write fails, the transaction is rolled back and the original reservation and both departure inventories remain unchanged.

If the target date makes the traveller composition invalid — for example the lead traveller would be under 18, a minor lacks a valid responsible adult, or no pricing band covers an age — the move is rejected before inventory is changed.

### Financial rule

A departure change may change the reservation total. Historical payment transactions remain unchanged. Existing payment terms can become stale when their saved total differs from the amended reservation total; the payment-term layer detects that mismatch and falls back safely. Explicit additional-balance/refundable-balance UX is handled in the next financial amendment block.

### Linked services

Independent activity, transport and travel-protection reservations are not automatically moved when the trip departure changes. Operator is reminded to review them separately until linked-service amendment rules are implemented.

## Operator workflow

```text
Operator → Reservations → Reservation detail
```

### Correct traveller details

1. Open **Correct traveller details**.
2. Correct first name, last name and/or nationality.
3. Enter a mandatory reason.
4. Save.
5. The current reservation is updated and **Change history** preserves the original value.

### Change departure

1. Open the reservation detail.
2. Review **Change departure**.
3. Choose one of the alternative departures with enough capacity.
4. Review dates, required/available spaces, recalculated total and price difference shown in the selector.
5. Enter a mandatory reason.
6. Save.
7. Review the new dates, traveller fares, payment summary and **Change history**.

## Delivery plan

### 6B-1 — complete

- amendment data model and MongoDB indexes;
- transactionally safe amendment writes;
- Operator traveller name/nationality corrections;
- before/after history UI.

### 6B-2 — current delivery

- future departure alternatives filtered by capacity;
- server-side age/fare/inventory recalculation for the target date;
- reserve new capacity before releasing old capacity;
- atomic rollback on any failure;
- reservation date/pricing snapshot update;
- price delta and inventory movement stored in amendment history;
- Operator UX with recalculated totals and mandatory reason.

### 6B-3

- explicit outstanding/additional-balance indicator after amendments;
- explicit refundable-balance indicator when amended total is below net paid amount;
- controlled follow-up actions without rewriting historical payment transactions.

### 6B-4

- linked service additions/removals and review workflow;
- amendment notifications;
- configurable amendment/cancellation deadlines;
- broader amendment policy controls.

## Production checks

### Traveller correction

1. Open a non-cancelled trip reservation in Operator.
2. Correct one traveller field and enter a reason.
3. Confirm the new value appears and persists after reload.
4. Confirm **Change history** shows previous/new value, reason, actor and time.
5. Submit unchanged values and confirm the request is rejected.

### Departure change

1. Use a reservation whose trip has at least two future departures.
2. Confirm only alternatives with enough capacity appear.
3. Choose an alternative and enter a reason.
4. Confirm the reservation dates update.
5. Confirm traveller age/fare changes when the new date crosses a pricing boundary.
6. Confirm target departure capacity increases and previous departure capacity decreases by the correct amounts.
7. Confirm **Change history** records old/new departure, dates, any price change and reason.
8. Confirm existing payment transactions are unchanged.
9. Confirm a cancelled reservation cannot be moved.
10. Simulate/verify insufficient target capacity and confirm no partial change is applied.

## Automated invariant check

`scripts/reservation-amendment-check.mjs` verifies that moving the same traveller composition across an age-boundary date recalculates age band, fare, guardian cleanup and inventory consumption correctly. Standard CI runs this check before TypeScript/build validation.
