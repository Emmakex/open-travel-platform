# Booking, availability and reservations

v0.4 introduces booking as a separate capability boundary rather than embedding reservation logic inside catalogue pages.

```text
Trip / account UI
      |
      v
Server action validation
      |
      v
BookingRepository
      |
      +--> DemoBookingRepository
      |
      +--> Future booking engine / database / supplier adapter
```

## Domain

The booking domain defines:

- `AvailabilityWindow`
- `Reservation`
- `ReservationStatus`
- `CreateReservationInput`

Current demo statuses are `pending`, `confirmed` and `cancelled`. New demo reservations start as `pending` and may be cancelled by the same fictional identity.

## Server-side validation

The browser does **not** submit a trusted price or total.

When a reservation is created, the server:

1. resolves the current identity;
2. resolves the requested trip from `TravelRepository`;
3. loads valid availability from `BookingRepository`;
4. verifies the selected availability belongs to that trip;
5. validates party size and remaining spaces;
6. takes the unit price and currency from the trusted trip record;
7. calculates the total server-side;
8. creates the reservation through `BookingRepository`.

A production adapter must apply the same principle and should re-check supplier inventory/pricing atomically before confirming a booking.

## Demo persistence

The built-in `DemoBookingRepository` stores at most five fictional reservations in an HTTP-only cookie so forks can exercise create/list/detail/cancel flows without a database.

The cookie:

- contains fictional demo data only;
- is HTTP-only;
- uses `SameSite=Lax`;
- uses `Secure` in production;
- expires after eight hours;
- is parsed defensively before display.

It is **not** a production persistence, integrity or authorization mechanism.

## Production defaults

```text
BOOKING_MODE=demo
DEMO_BOOKING_ENABLED=false
```

Development defaults to demo mode. Production defaults to booking disabled when `BOOKING_MODE` is omitted. Demo writes in production require both `BOOKING_MODE=demo` and `DEMO_BOOKING_ENABLED=true`.

A real deployment should replace the demo adapter with a trusted persistence or booking-engine adapter.

## Authorization

Reservation lookup and cancellation are scoped by both `identityId` and `reservationId`. A production implementation must continue to enforce ownership/permissions server-side and must never rely only on client-side filtering.

## Out of scope for v0.4

The current milestone does not implement:

- payments;
- supplier holds;
- real inventory locking;
- refunds;
- traveller PII collection;
- confirmation emails;
- operator approval.

Those capabilities must be introduced behind separate trusted boundaries rather than added directly to public UI components.
