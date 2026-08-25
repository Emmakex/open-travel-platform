# Operator and admin workflows

Open Travel Platform keeps customer booking capabilities separate from staff operations. The production/reference implementation uses MongoDB-backed operations with server-side authorization, audit history and transactional inventory handling.

## Capability boundary

`BookingRepository` is customer-facing: availability, identity-scoped reservation reads, reservation creation and permitted customer cancellation.

`OperationsRepository` is staff-facing: cross-customer reservation reads, operational summaries, status transitions and status audit events.

Additional internal workflow data introduced for day-to-day agency work is deliberately stored outside the commercial reservation document. Customer routes do not read this data.

## Roles and authorization

The identity domain defines:

- `customer` — customer account and booking surfaces;
- `operator` — reservation/service operations;
- `admin` — operations plus privileged administration such as staff and payment-provider configuration.

Every `/operator` page resolves the active staff identity server-side. Every mutation repeats authorization on the server; hiding a button is never considered authorization.

## Reservation status workflow

Supported reservation transitions are:

```text
pending   -> confirmed
pending   -> cancelled
confirmed -> cancelled
cancelled -> terminal
```

Cancellation releases trip inventory and any booked accommodation inventory inside the protected MongoDB operation.

## Status audit and amendment history

Status transitions are stored in `travel_operations_audit` with reservation, actor, role, before/after status and timestamp.

Reservation amendments use a separate immutable history (`travel_reservation_amendments`) for traveller corrections and departure changes. Payment transactions remain historical facts and are never rewritten by reservation operations.

## Internal reservation workflow

The Operator reservation workspace adds internal team context without putting it into the customer-visible reservation document.

### Current operational state

Stored separately in `travel_reservation_operations`:

- assigned staff owner;
- owner display-name snapshot;
- priority: `low`, `normal`, `high`, `urgent`;
- up to 10 normalized tags;
- last internal update metadata.

The selected owner is validated server-side against an active staff account. An arbitrary browser-submitted staff ID is rejected.

The collection includes indexes for owner, priority and tags so later queue/search work can filter efficiently without redesigning the model.

### Internal notes

Stored separately in `travel_reservation_internal_notes`.

- notes are staff-only;
- maximum 2,000 characters;
- plain text only in the standard UI;
- author ID, display name, role and timestamp are stored;
- notes are append-only in the current workflow rather than silently overwriting previous team context;
- customer account and customer reservation actions do not import the internal workflow layer.

### Operational audit events

Changes to owner, priority and tags create records in `travel_reservation_operations_events`.

Each event includes:

- reservation ID;
- actor ID, display name and role;
- changed fields with before/after snapshots;
- timestamp.

Internal notes and workflow events are combined into the reservation's operational timeline.

## Operator UX

`/operator/reservations` shows the current owner, priority and a tag preview for each reservation.

Each reservation exposes two protected views:

```text
/operator/reservations/[id]          commercial/financial reservation detail
/operator/reservations/[id]/workflow internal team workspace
```

A shared staff-only navigation links both views.

The workspace is intentionally separate from My account. Internal notes, tags and ownership are not rendered to the customer and are protected by a permanent CI invariant check.

## Quality gate

```bash
npm run check:operations
```

The gate validates priority/tag/note rules and verifies that customer account/reservation routes do not import internal reservation workflow storage.

## Configuration

Production operations remain opt-in through environment configuration. See `.env.example` and `lib/operations-config.ts` for supported modes.

MongoDB mode is the persistent production/reference path. Demo mode remains useful for fictional/read-only evaluation but must not be confused with durable multi-user operations.

## Extension direction

The internal workflow collections are intentionally separate capability boundaries so later phases can add:

- tasks and follow-ups;
- supplier fulfilment states;
- saved operational queues and filters;
- package-supplement amendments;
- more granular staff permissions.

These additions should preserve the same principles: staff-only data stays out of customer surfaces, mutations are server-authorized, and history is added rather than silently rewritten.
