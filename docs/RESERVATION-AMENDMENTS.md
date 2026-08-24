# Reservation amendments

Phase 6B implements controlled post-booking changes without deleting or rewriting operational history.

## Core rules

- The reservation document represents the current operational state.
- Material trip changes are stored in `travel_reservation_amendments` as immutable before/after history.
- Historical payment transactions remain authoritative for real money movements and are never rewritten by amendments.
- Activities, transport and travel protection remain independent service reservations and can be linked to a trip with `relatedReservationId`.
- Product change/cancellation rules are snapshotted onto each new reservation. Editing a product later does not alter bookings that already exist.
- Legacy reservations without a saved change policy retain the previous permissive behaviour.

## 6B-1 — traveller corrections

Operator/Admin may correct first name, last name and nationality without repricing or inventory movement. A reason is mandatory and the previous value remains in amendment history.

Date of birth and other fields that can affect age, pricing or capacity are not edited through this simple correction flow.

## 6B-2 — departure changes

A non-cancelled trip reservation can move to another future departure when the target has enough capacity and the saved modification policy still allows it.

The server recalculates against the new departure date:

- age at departure;
- pricing band and traveller fare;
- guardian/minor relationships where applicable;
- inventory consumption;
- reservation total.

MongoDB applies the move atomically: reserve target capacity, release previous capacity, update the reservation and write amendment history. Any failure rolls back the complete change.

## 6B-3 — financial result

After an amendment, the current reservation total is compared with net successfully paid funds.

- **payment due**: current total is higher than net paid;
- **refund review**: net paid is higher than the current total;
- **pending**: a payment/refund is awaiting confirmation;
- **settled**: net paid matches the current total.

No automatic refund is generated. Active reservations can only record a refund up to the real overpayment. Cancelled reservations may use the broader remaining refundable balance. Existing payments/refunds are never edited or deleted.

If saved deposit/installment terms no longer match the amended total, they are marked for staff review.

## 6B-4 — linked services, notifications and deadlines

### Linked services

A service reservation may reference its parent trip reservation through `relatedReservationId`.

The trip detail now surfaces linked activities, transport and travel protection for both Operator and customer. Each linked item remains independent, with its own:

- status;
- service date/time or protection dates;
- price and payment history;
- traveller-data requirements;
- cancellation policy;
- inventory movement.

Cancelling a linked service does **not** mutate the trip reservation. When an inventory-backed service is cancelled, its capacity is released in the same MongoDB transaction as the status change. If capacity cannot be released safely, the cancellation rolls back.

### Change-policy snapshot

Trips and services can configure:

- customer self-service cancellation enabled/disabled;
- customer cancellation cutoff in hours before start;
- staff modification cutoff in hours before start;
- staff cancellation cutoff in hours before start;
- customer email after staff-driven changes enabled/disabled.

A blank cutoff means no time limit. No arbitrary business deadline is imposed by the platform.

For trips without a start time, the departure date boundary is used. Timed activities/transports use their service date and start time. Travel protection uses its trip start date.

The policy is copied onto the reservation when it is created. Existing reservations therefore preserve the conditions they were booked under.

### Enforcement

Policy enforcement happens server-side as well as in the UI:

- customer trip/service cancellation is rejected outside the saved customer window;
- staff trip traveller corrections and departure changes are rejected outside the staff modification window;
- staff trip/service cancellation is rejected outside the staff cancellation window;
- unavailable actions are hidden from the relevant UI and replaced with a clear explanation.

### Notifications

When enabled by the reservation snapshot:

- staff trip amendments send the customer an updated-reservation email;
- staff trip confirmation/cancellation uses the normal reservation email flow;
- staff service confirmation/cancellation sends a service-specific email.

Customer emails contain the current customer-facing reservation details and link back to My account. Internal amendment reasons are not included.

## Operator workflow

### Correct traveller

`Operator → Reservations → Reservation → Travellers → Correct traveller details`

Enter the corrected values and a mandatory reason. The history retains before/after values.

### Change departure

`Operator → Reservations → Reservation → Change departure`

Choose an eligible future departure, review recalculated dates/pricing/capacity, provide a reason and save.

### Review linked services

`Operator → Reservations → Reservation → Linked services`

Open each independent service reservation to confirm or cancel it according to its own saved policy.

### Review financial result

After any price-changing amendment, review **Payments & balance** and resolve either the additional amount due or the refund-review amount without rewriting historical transactions.

## Production checks

1. Configure a trip with customer/staff cutoffs and save it.
2. Create a new trip reservation and confirm the policy is snapshotted.
3. Change the product policy and confirm the existing reservation keeps its original rules.
4. Create a linked activity/transport reservation and confirm it appears in the parent trip for customer and Operator.
5. Cancel an eligible linked service and confirm inventory is released once.
6. Confirm an out-of-window service cancellation is rejected and inventory remains unchanged.
7. Confirm an out-of-window trip departure change/traveller correction is rejected.
8. Confirm unavailable actions disappear from the UI and the user sees a clear deadline message.
9. Perform a staff trip amendment while notifications are enabled and confirm the customer receives an updated-reservation email without internal reason text.
10. Confirm staff service confirmation/cancellation sends the service-specific email when enabled.
11. Disable staff-change email on a new product, create a new reservation and confirm staff changes no longer send that notification.
12. Confirm legacy reservations without a change-policy snapshot continue to operate under the prior behaviour.
13. Re-test 6B-2 inventory rollback and 6B-3 payment/refund states after the policy layer is enabled.

## Automated invariant check

`scripts/reservation-amendment-check.mjs` covers:

- traveller age-band repricing across a departure change;
- additional-balance/refund-review settlement states;
- customer/staff policy cutoff transitions;
- legacy no-policy behaviour;
- notification-policy default behaviour.

Standard CI runs this invariant check before TypeScript/build validation.
