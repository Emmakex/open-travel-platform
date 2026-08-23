# Reservation amendments

Phase 6B adds controlled post-booking changes without deleting or rewriting the original operational history.

## Core rule

A reservation document represents the **current operational state**. Every material post-booking change is also written to a separate immutable amendment timeline so staff can see what changed, who changed it, why it changed and when it changed.

MongoDB collection:

```text
travel_reservation_amendments
```

The payment ledger remains authoritative for money movements and is not rewritten by reservation amendments.

## Phase 6B-1 — traveller corrections

The first slice deliberately supports only corrections that do not require repricing or inventory movement:

- first name;
- last name;
- nationality.

Each correction requires an Operator/Admin reason and stores:

- reservation ID;
- traveller ID;
- amendment type;
- actor identity and role;
- changed fields only;
- previous value;
- new value;
- reason;
- timestamp.

The reservation update and amendment-history insert execute inside the same MongoDB transaction. A partial write must not be possible.

Cancelled reservations cannot be amended.

### Intentionally locked in 6B-1

These fields are read-only for now:

- date of birth;
- age at departure;
- pricing band/code;
- traveller fare;
- inventory consumption;
- guardian relationship;
- departure.

Changing any of those can affect pricing, minors logic or capacity. They are handled in later 6B slices with server-side recalculation and inventory protection.

Advanced post-purchase traveller identity/document data is not exposed or copied into this amendment history. It remains in the encrypted traveller-data store.

## Operator workflow

```text
Operator → Reservations → Reservation detail → Travellers
→ Correct traveller details
```

1. Open the traveller correction control.
2. Correct name and/or nationality.
3. Enter a mandatory reason.
4. Save.
5. The reservation immediately shows the current corrected value.
6. The side panel **Change history** keeps the original value as `before → after` together with actor, reason and timestamp.

## Delivery plan

### 6B-1

- amendment data model and MongoDB indexes;
- transactionally safe amendment writes;
- Operator traveller name/nationality corrections;
- before/after history UI.

### 6B-2

- departure changes;
- reserve new capacity before releasing old capacity;
- atomic inventory movement and rollback.

### 6B-3

- traveller changes that affect age/fare;
- server-authoritative repricing;
- price delta, outstanding balance and refundable balance indicators;
- historical payment transactions remain untouched.

### 6B-4

- linked service additions/removals;
- amendment notifications;
- configurable amendment/cancellation deadlines;
- broader amendment policy controls.

## Production checks for 6B-1

1. Open a non-cancelled trip reservation in Operator.
2. Correct one traveller field and enter a reason.
3. Confirm the new value appears on the reservation.
4. Confirm **Change history** shows the previous and new value.
5. Reload the page and confirm both current state and history persist.
6. Try submitting the same values and confirm it is rejected as `No changes`.
7. Confirm a cancelled reservation has no correction controls.
8. Confirm advanced encrypted document/residence values are not shown in amendment history.
