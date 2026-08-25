# Granular staff permissions

<p align="center"><strong>English</strong> · <a href="./STAFF-PERMISSIONS.es.md">Español</a></p>

Kairoseth Travel keeps the simple `operator` / `admin` staff roles and adds server-authoritative capabilities for deployments that need narrower access.

## Access model

- `admin` is a full-access superuser and always receives every capability, including administration.
- an existing `operator` with no explicit capability assignment keeps the legacy Operator profile for backward compatibility;
- once an administrator saves an Operator permission matrix, that explicit assignment becomes authoritative;
- new Operator accounts receive an explicit assignment when they are created from **Operator → Staff access**;
- the `administration` capability cannot be assigned to Operators.

This avoids a manual migration that could unexpectedly lock existing staff out while allowing deployments to move each account to least privilege deliberately.

## Capabilities

| Capability | Main protected areas |
| --- | --- |
| `reservations` | trip/service reservation queues, reservation status, booking amendments, customer reservation operations |
| `catalogue` | trips, destinations, services, accommodation, room inventory, pricing, availability and media |
| `finance` | payment status, ledger movements, refunds, outstanding balances, payment terms and reminders |
| `traveller-data` | protected post-purchase traveller-data completion/status |
| `suppliers` | supplier fulfilment, supplier references, internal supplier cost and supplier follow-up |
| `tasks` | internal tasks, comments, assignments, deadlines and task workspaces |
| `administration` | administrator-only access; never assignable to Operator accounts |

Reservation prices and commercial booking totals remain part of the reservation record. The Finance capability specifically protects payment/refund/accounting state and payment terms. Basic traveller details captured as part of the booking remain available to reservation staff, while protected post-purchase traveller-data status requires `traveller-data`.

## Enforcement

Permission enforcement is deliberately layered:

1. protected Operator route layouts call `requireStaffCapability(...)`;
2. sensitive server actions repeat the capability check before any write;
3. shared pages only fetch sensitive finance/task/supplier/traveller datasets when the current identity has the matching capability;
4. navigation and panels hide areas the user cannot access;
5. admin-only account management remains protected by `requireAdminIdentity()`.

Hiding a button is never treated as an authorization boundary.

## Persistence and audit

Explicit Operator assignments are stored in:

- `travel_staff_capabilities`

Permission changes are audited in:

- `travel_staff_capability_audit`

Every real assignment change records:

- target staff user;
- previous mode (`legacy` or `explicit`) and previous capability set when present;
- new mode and capability set;
- administrator identity that made the change;
- timestamp.

The assignment update and its audit event are written in the same MongoDB transaction. A no-op save does not create a misleading audit event.

## Operational procedure

1. Sign in as Admin.
2. Open **Operator → Staff access**.
3. Create a new Operator or open an existing Operator in the team directory.
4. Select only the capabilities required for that person's job.
5. Save permissions.
6. Review **Permission audit** on the same page to confirm the before/after change.
7. Test the account: unauthorized sections should not be loaded or shown, and direct URL/action attempts are rejected server-side.

Administrator accounts cannot be restricted through this matrix, reducing the risk of accidentally removing the final administrative access path.

## CI invariant

`npm run check:staff-permissions` verifies the role/capability semantics and permanent protection points for reservations, catalogue, finance, traveller data, suppliers, tasks, media and permission auditing. It is part of `npm run verify` and therefore part of the normal CI release gate.
