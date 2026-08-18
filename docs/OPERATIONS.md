# Operator and admin workflows

v0.5 adds internal reservation operations as a capability separate from customer booking.

## Why a separate repository exists

`BookingRepository` is customer-facing: availability, identity-scoped reservation reads, creation and customer cancellation.

`OperationsRepository` is staff-facing: cross-customer demo queue reads, operational summaries, status transitions and audit events.

Keeping these capabilities separate avoids giving customer UI a broad administrative API merely because both features work with reservations.

## Roles

The identity domain defines:

- `customer` — may access customer account/booking surfaces;
- `operator` — may access staff reservation operations;
- `admin` — may access staff reservation operations and is reserved for broader future administration.

Demo identities are fixed server-side fixtures. The browser does not submit a role that becomes authoritative.

## Server authorization

Every `/operator` page resolves the current identity server-side and requires `operator` or `admin` before reading staff data.

Every operational mutation repeats that role check. UI visibility is never treated as authorization.

Customer account, reservation and booking actions separately require the `customer` role.

## Demo status workflow

The fictional operations adapter allows only:

```text
pending   -> confirmed
pending   -> cancelled
confirmed -> cancelled
cancelled -> terminal
```

Requests for unsupported transitions are rejected on the server.

## Audit trail

Each successful demo staff transition records:

- reservation ID;
- actor identity ID;
- actor role;
- previous status;
- new status;
- timestamp.

The demo audit is stored in an HTTP-only cookie and capped at ten events. It exists to demonstrate the interface and is not a production audit system.

A production audit implementation should be append-only, durable, access-controlled and independent from client-modifiable state.

## Demo persistence

The current browser-local demo uses HTTP-only cookies for fictional reservations and audit entries so no database is required.

This means the operator demo sees only the fictional reservations created in the same browser session. That limitation is intentional and must not be confused with multi-user backoffice storage.

## Production configuration

```text
OPERATIONS_MODE=disabled
DEMO_OPERATIONS_ENABLED=false
```

Production defaults operations to disabled when `OPERATIONS_MODE` is omitted. Enabling the demo adapter in production requires both:

```text
OPERATIONS_MODE=demo
DEMO_OPERATIONS_ENABLED=true
```

This is intended only for an explicitly fictional public demo.

## Replacing the demo adapter

A production `OperationsRepository` can be backed by:

- a booking engine;
- CRM/ERP;
- tour-operator backoffice;
- internal database/service;
- supplier aggregation layer.

The adapter must enforce authorization and status-transition rules on a trusted server-side boundary and must not trust customer/browser state as the source of truth.
