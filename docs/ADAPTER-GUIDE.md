# Adapter implementation guide

Open Travel Platform is provider-neutral. Product routes consume capability interfaces; production integrations implement those interfaces behind trusted adapters.

## Travel catalogue

Interface: `repositories/travel-repository.ts`

Responsibilities:
- list destinations;
- resolve a destination by slug;
- list trips;
- resolve a trip by slug.

A production adapter may use a CMS, database, REST/GraphQL service or supplier catalogue. Normalize provider payloads into the domain types before returning them to UI code. Do not expose provider-specific response objects across the repository boundary.

## Identity

Interface: `repositories/identity-repository.ts`

Responsibilities:
- resolve the current trusted identity;
- resolve a customer profile for an authorized customer identity.

Typical implementations may wrap Auth.js, OAuth/OIDC, SSO or an external session service. Roles must come from a trusted server-side identity source rather than a value selected in the browser.

## Customer booking

Interface: `repositories/booking-repository.ts`

Responsibilities:
- read availability;
- read an identity-scoped reservation list/detail;
- create a reservation;
- perform allowed customer cancellation.

The application validates trip, availability, party size and trusted catalogue pricing before calling `createReservation`. A production adapter should still enforce transactional and inventory rules because availability can change between validation and persistence.

Use idempotency and concurrency controls where duplicate or competing booking writes are possible.

The bundled `BOOKING_MODE=rest` implementation demonstrates the reference `/v1` contract, runtime validation, ownership checks, production HTTPS, server-only authentication and stable idempotency keys. See [`REST-BOOKING-ADAPTER.md`](REST-BOOKING-ADAPTER.md).

## Staff operations

Interface: `repositories/operations-repository.ts`

Responsibilities:
- list operational reservations;
- resolve reservation detail;
- compute/read operational summary data;
- change allowed reservation states;
- expose audit events.

This boundary is intentionally separate from customer booking. A CRM, ERP or backoffice adapter may expose broader internal capabilities without granting those methods to customer code. Production operations must repeat authorization and transition validation server-side.

## Supplier fulfilment

Interface: `repositories/supplier-fulfilment-adapter.ts`

Responsibilities:
- submit a supplier request;
- synchronize a normalized external supplier status/reference;
- cancel an existing supplier request.

The external adapter is deliberately subordinate to the local fulfilment workflow. A remote response must be audited before local application and then re-enter `saveSupplierFulfilment()` so the existing transition rules remain authoritative.

Provider-specific adapters must not mutate customer totals, payment/refund accounting, inventory, supplier cost, traveller records or protected post-purchase data. Keep authentication and provider payload/status mapping inside the adapter.

The generic REST reference adapter uses a versioned `/v1/fulfilment` contract. `request` must return `requested`; `cancel` must return `cancelled`; confirmation/rejection is obtained through the `status` operation. Mutating operations use stable idempotency keys.

See [`SUPPLIER-FULFILMENT-ADAPTER.md`](SUPPLIER-FULFILMENT-ADAPTER.md).

## Composition

Current composition lives under `lib/`:

```text
getTravelRepository()
getIdentityRepository()
getBookingRepository()
getOperationsRepository()
getSupplierFulfilmentAdapter()
```

A fork can add modes/adapters without changing page-level interfaces. Prefer explicit configuration over detecting providers implicitly.

## Error translation

Adapters should convert infrastructure failures into stable application-level errors rather than exposing raw database errors, private infrastructure details or provider request dumps to the browser.

Operational logs should use correlation/reference IDs and appropriate redaction rules.

## Browser/server boundary

Never place privileged configuration in `NEXT_PUBLIC_*` variables. Browser-visible configuration is public by definition. Privileged adapters should execute on server-side boundaries and read protected configuration from the deployment environment.

## Testing a new adapter

Before production use:
1. confirm domain mapping for valid and invalid provider payloads;
2. verify not-found/error behavior;
3. test authorization independently from UI visibility;
4. test concurrency/idempotency for booking or supplier writes;
5. test allowed and rejected reservation/fulfilment transitions;
6. confirm protected values are not exposed to browser code or external provider payloads;
7. confirm provider responses cannot rewrite customer pricing/payment accounting through the adapter boundary;
8. run `npm run verify` and the deployment-specific integration suite.
