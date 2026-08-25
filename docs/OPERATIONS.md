# Operator and admin workflows

Open Travel Platform keeps customer booking capabilities separate from staff operations. The production/reference implementation uses MongoDB-backed operations with server-side authorization, audit history and transactional inventory handling.

## Capability boundary

`BookingRepository` is customer-facing: availability, identity-scoped reservation reads, reservation creation and permitted customer cancellation.

`OperationsRepository` is staff-facing: cross-customer reservation reads, operational summaries, status transitions and status audit events.

Additional internal workflow data for day-to-day agency work is deliberately stored outside the commercial reservation document. Customer routes do not read this data.

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

The collection includes indexes for owner, priority and tags so operational queues can filter efficiently without redesigning the model.

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

Each event includes reservation, actor, changed fields with before/after snapshots and timestamp. Internal notes and workflow events are combined into the reservation's operational timeline.

## Tasks and follow-ups

Operations tasks are a separate internal capability used for work that must be completed later by the team.

A task can target:

```text
trip-reservation
service-reservation
customer
```

The target must exist on the server before the task is created.

### Task record

Stored in `travel_operations_tasks` with:

- title and optional details;
- exact target type and ID;
- status: `open`, `in-progress`, `completed`, `cancelled`;
- optional due date;
- optional assigned active staff member;
- creator identity/role/display name;
- created/updated timestamps;
- completion/cancellation timestamp when applicable.

Assignees are validated server-side against `travel_staff_users`. Disabled or invented staff IDs are rejected.

Cancelled tasks are terminal. Completed tasks can be deliberately reopened to `open` or `in-progress`, and that change remains audited.

### Task changes and comments

Task status, assignee and due-date changes create append-only records in `travel_operations_task_events` with before/after values and actor metadata.

Follow-up comments are stored separately in `travel_operations_task_comments`:

- maximum 2,000 characters;
- staff-only plain text;
- author and timestamp preserved;
- appended rather than rewriting the original task description.

No task mutation changes the commercial reservation, traveller pricing or payment ledger.

### Due-date views

`/operator/tasks` provides protected operational filters:

- Open;
- Mine;
- Overdue;
- Today;
- Upcoming;
- Completed.

The dashboard also exposes open, assigned-to-me, overdue and due-today counts. Date-only due dates are intentionally kept separate from booking/payment deadlines.

`/operator/tasks/new` can create a task against an exact trip reservation, service reservation or customer. Target workspaces preserve the same server-side validation and follow-up history.

## Supplier fulfilment

Supplier fulfilment is a staff-only operational capability for tracking external confirmations without changing the customer-facing reservation or payment ledger.

The server derives valid components from the actual reservation snapshot:

- the main trip package;
- every booked accommodation stay on a trip reservation;
- each independent service reservation.

The browser submits only the target and component key. The server resolves that key again before saving, so an operator cannot create a forged accommodation or service component by manipulating a form.

### Current supplier state

Stored in `travel_supplier_fulfilment`, uniquely by target + reservation + component.

Each item can contain:

- status: `not-requested`, `requested`, `confirmed`, `rejected`, `cancelled`;
- supplier name;
- supplier confirmation/reference/locator;
- optional internal supplier cost and currency;
- confirmation deadline;
- created/updated staff metadata;
- status timestamps.

Supplier costs are operational information only. Updating them never changes `Reservation.totalPrice`, service reservation totals or payment transactions.

Cancelled fulfilment items are terminal. Confirmed or rejected items can be explicitly moved back to `requested` when reconfirmation is required.

### Supplier audit and notes

Changes to supplier, status, reference, cost or deadline create append-only events in `travel_supplier_fulfilment_events` with before/after snapshots and actor metadata.

Internal supplier notes are stored separately in `travel_supplier_fulfilment_notes`:

- maximum 2,000 characters;
- plain text;
- author and timestamp preserved;
- append-only in the standard workflow;
- never rendered in customer account routes.

### Supplier queue

`/operator/fulfilment` shows all active operational components, including components that have not yet been requested. Filters include:

- Active;
- Not requested;
- Requested;
- Confirmed;
- Attention;
- Cancelled.

`Attention` includes rejected components and overdue confirmation deadlines. Untouched components from already-cancelled commercial reservations are excluded from the active queue, while previously saved supplier records remain available for historical follow-up.

The Operator dashboard also surfaces supplier confirmations awaiting response and supplier items requiring attention.

## Operator UX

`/operator/reservations` shows the current owner, priority and a tag preview for each reservation.

Each trip reservation exposes two protected views:

```text
/operator/reservations/[id]           commercial/financial reservation detail
/operator/reservations/[id]/workflow  internal workflow + supplier fulfilment + tasks
```

Task management routes include:

```text
/operator/tasks
/operator/tasks/new
/operator/tasks/target/[type]/[id]
```

Supplier management includes:

```text
/operator/fulfilment
```

Service-reservation task workspaces also expose their supplier fulfilment panel.

These operational areas are intentionally separate from My account. Internal notes, tags, ownership, tasks, supplier references, supplier costs and follow-up comments are never rendered to the customer.

## Quality gates

```bash
npm run check:operations
npm run check:tasks
npm run check:fulfilment
```

The operations gate validates priority/tag/note rules and customer-route privacy boundaries. The task gate validates task target/status/date/text rules, overdue/today semantics and verifies that customer routes do not import task storage. The supplier fulfilment gate validates statuses, transitions, supplier cost/date normalization, overdue semantics and customer/public privacy boundaries.

## Configuration

Production operations remain opt-in through environment configuration. See `.env.example` and `lib/operations-config.ts` for supported modes.

MongoDB mode is the persistent production/reference path. Demo mode remains useful for fictional/read-only evaluation but must not be confused with durable multi-user operations.

Supplier fulfilment does not add new environment variables. Future supplier API adapters should resolve external credentials through their own server-side capability boundary rather than placing provider payloads into the core reservation domain.

## Extension direction

The internal workflow collections remain separate capability boundaries so later work can add:

- stronger operational search and saved queues;
- a reusable supplier directory / supplier API adapters;
- package-supplement amendments;
- more granular staff permissions;
- optional internal reminders/notifications for tasks.

These additions should preserve the same principles: staff-only data stays out of customer surfaces, mutations are server-authorized, and history is added rather than silently rewritten.
