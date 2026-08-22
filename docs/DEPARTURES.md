# Trip departures and inventory

Kairoseth Travel keeps departure inventory separate from catalogue content. Trips live in `travel_trips`; operational departure rows live in the MongoDB collection `travel_departures`.

## Departure shape

```ts
{
  id: "...",
  tripId: "trip-peru-andes",
  departureDate: "2027-04-05",
  returnDate: "2027-04-15",
  capacity: 12,
  reservedSpaces: 2,
  status: "open",
  unitPrice: 1725
}
```

`unitPrice` is optional. When omitted, the trip's `fromPrice` is used.

Statuses:

- `open`: public and bookable while capacity remains
- `closed`: hidden from public booking without deleting the departure
- `sold-out`: explicitly unavailable even if capacity exists

Past departures and departures with no remaining capacity are excluded from public availability.

## Operator workflow

Trip editors manage departures under **Departures & availability**. Operators can add, remove and reorder departure rows, adjust dates, capacity, price and status. `reservedSpaces` is read-only because booking/cancellation flows manage it automatically.

A departure with consumed inventory cannot be deleted until its reservations have been released/cancelled. This prevents catalogue edits from orphaning active reservations.

## Booking flow

When `TRAVEL_DATA_MODE=mongodb`, the demo booking capability uses MongoDB departure inventory instead of `data/demo-availability.ts`:

```text
Trip booking page
  → list open future travel_departures
  → customer selects departure + party size
  → atomic capacity check / increment reservedSpaces
  → reservation created
  → cancellation decrements reservedSpaces
```

The inventory increment uses a MongoDB conditional update, so two concurrent booking requests cannot both consume the same final spaces.

Reservation persistence itself remains behind the existing `BookingRepository` boundary. This phase changes inventory sourcing and consumption without removing that abstraction.
