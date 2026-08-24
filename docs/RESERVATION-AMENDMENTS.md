# Reservation amendments

Phase 6B adds controlled post-booking changes without deleting or rewriting operational history.

## Core rule

A reservation document represents the **current operational state**. Every material post-booking change is also written to a separate immutable amendment timeline so staff can see what changed, who changed it, why it changed and when it changed.

MongoDB collection:

```text
travel_reservation_amendments
```

Historical payment transactions remain authoritative for actual money movements and are never rewritten by reservation amendments.

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

### Linked services

Independent activity, transport and travel-protection reservations are not automatically moved when the trip departure changes. Operator is reminded to review them separately until linked-service amendment rules are implemented.

## Phase 6B-3 — financial adjustments

A reservation modification may increase or reduce the current reservation total. Payment history is not edited to make the numbers match. Instead, the current reservation total is compared with the net amount successfully paid.

The payment summary now derives four operational states:

- **payment due** — the current total is above net paid and money remains to collect;
- **refund review** — net paid is above the current total and the excess must be reviewed for a possible refund;
- **pending** — a payment or refund is waiting for confirmation;
- **settled** — net paid matches the current total and there is no pending movement.

Derived values:

- `outstandingAmount = max(current total - net paid, 0)`;
- `overpaidAmount = max(net paid - current total, 0)`;
- `settlementAmount` is the amount that currently needs follow-up;
- `refundableAmount` remains the maximum net amount that can be refunded safely by the payment layer.

No automatic refund is created when the total decreases. Operator sees a **Refund review required** state and must confirm the applicable booking/cancellation conditions before recording a refund.

For active reservations, the normal refund form is surfaced only when there is an actual overpayment. Cancelled reservations may still expose the broader refundable balance because cancellation settlement can require returning all remaining paid funds.

When the current total changes, saved deposit/installment terms may no longer add up to the reservation total. The payment-schedule layer marks those terms as outdated and safely falls back to the current outstanding balance until staff saves revised terms.

Customer-facing copy avoids implementation terminology. The customer sees either the amount still to pay or a clear message that an excess payment is being reviewed by the team.

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

### Review financial result

1. Open **Payments & balance** after a modification that changed the total.
2. If the total increased, review **Amount still to collect** and collect/record the remaining balance.
3. If the total decreased below net paid, review **Refund review required**.
4. Confirm the applicable booking conditions before recording a refund.
5. If payment terms are marked outdated, save new terms for the current total.
6. Confirm the transaction history still contains all original payments/refunds unchanged.

## Delivery plan

### 6B-1 — complete

- amendment data model and MongoDB indexes;
- transactionally safe amendment writes;
- Operator traveller name/nationality corrections;
- before/after history UI.

### 6B-2 — complete

- future departure alternatives filtered by capacity;
- server-side age/fare/inventory recalculation for the target date;
- reserve new capacity before releasing old capacity;
- atomic rollback on any failure;
- reservation date/pricing snapshot update;
- price delta and inventory movement stored in amendment history;
- Operator UX with recalculated totals and mandatory reason.

### 6B-3 — current delivery

- explicit outstanding/additional-balance indicator after amendments;
- explicit overpaid/refund-review indicator when amended total is below net paid amount;
- customer-facing outstanding/refund-review state;
- controlled refund UX without automatic refunds;
- existing payment transactions remain unchanged;
- stale payment terms remain detectable after total changes.

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

### Financial adjustment

1. Start with a reservation that has at least one successful payment.
2. Move it to a departure that increases the total and confirm Operator shows the exact amount still to collect.
3. Confirm the customer's reservation shows the same outstanding amount and offers the existing checkout flow when appropriate.
4. Move/test a reservation whose amended total becomes lower than net paid.
5. Confirm Operator shows **Refund review required** for the excess only.
6. Confirm no refund transaction is created automatically.
7. Confirm the customer's reservation explains that the excess is under review and does not ask for another payment.
8. Record a refund for the reviewed amount and confirm the financial state becomes settled when net paid equals the current total.
9. Confirm original payment transactions were not edited or deleted.
10. Confirm stale deposit/installment terms are marked for staff review after the total changes.

## Automated invariant check

`scripts/reservation-amendment-check.mjs` verifies both departure repricing and financial settlement invariants. It covers a traveller crossing an age boundary and the resulting payment states when the amended total is higher than, lower than, or equal to net paid. Standard CI runs this check before TypeScript/build validation.
