# Transactional reservation emails

Kairoseth Travel reuses the server-side SMTP transport for password recovery and reservation lifecycle notifications.

## Reservation events

When persistent booking and operations are enabled, the application sends best-effort email notifications after the database write has completed successfully:

- `created`: customer receives a reservation-received email and operations receives a new-reservation alert.
- `confirmed`: customer receives a confirmation email and operations receives a status-change alert.
- `cancelled`: customer receives a cancellation email and operations receives a status-change alert.

Email delivery is intentionally outside the MongoDB booking transaction. A temporary SMTP problem must not roll back a reservation or inventory update that has already committed successfully.

## Customer language

Customer emails use the customer's `preferredLocale` (`es` or `en`). Dates and money are formatted for that locale. The trip title is resolved from the current catalogue when possible, with the reservation snapshot as a fallback.

## Operations recipients

Set one or more comma- or semicolon-separated addresses:

```env
KTRAVEL_OPERATIONS_EMAILS=operations@example.com,bookings@example.com
```

If this variable is omitted, internal reservation alerts fall back to `SMTP_FROM_EMAIL`.

## Required SMTP variables

```env
KTRAVEL_PUBLIC_URL=https://travel.kairoseth.com
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM_EMAIL=
SMTP_FROM_NAME=Kairoseth Travel
```

All SMTP credentials are server-only. Do not expose them through `NEXT_PUBLIC_*` variables.

## Included reservation data

Transactional reservation messages include only operational booking information:

- trip name
- departure and return dates
- number of travellers
- unit price and total
- reservation reference
- link to the customer reservation or operator reservation page

They do not include password hashes, session tokens, password-reset tokens, MongoDB connection strings, or other authentication secrets.
