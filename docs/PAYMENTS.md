# Kairoseth Travel payment architecture

Kairoseth Travel keeps payment accounting separate from booking and from any specific payment service provider (PSP).

## Why this layer exists

A reservation is the commercial booking record. A payment transaction is a financial movement. They are intentionally separate so Stripe, Redsys, bank transfer or another provider can be added without changing the booking model.

## MongoDB collection

Payment movements are stored in:

- `travel_payment_transactions`

Reservations remain in `travel_reservations`.

## Payment summary states

The UI derives a reservation payment summary from immutable/append-style transaction records:

- `unpaid`
- `pending`
- `partially_paid`
- `paid`
- `partially_refunded`
- `refunded`

The summary exposes:

- reservation total
- gross paid amount
- refunded amount
- net paid amount
- outstanding amount
- refundable amount
- pending payment/refund totals

## Transaction model

Each payment ledger record includes:

- stable internal transaction ID
- reservation ID
- type: `payment` or `refund`
- status: `pending`, `succeeded` or `failed`
- amount and currency
- provider (`manual` today; `stripe`, `redsys`, etc. later)
- method (bank transfer, cash, card, other)
- optional provider/reference ID
- optional internal note
- staff actor identity/role when entered manually
- creation/update timestamps

## Manual movements

Operators can record money received or refunded outside Kairoseth Travel. This is accounting only: pressing **Record payment** does not charge a card.

Manual entries are useful for:

- bank transfers
- cash
- an external card terminal
- reconciliation/migrations

The server prevents manual payments from exceeding the outstanding balance and refunds from exceeding the refundable balance.

## Reservation status vs payment status

Reservation and payment states are deliberately independent. For example:

- a reservation can be `confirmed` but still `unpaid`
- a reservation can be `pending` and already `paid`
- a cancelled reservation can remain `paid` until its refund is processed

Cancelling a reservation does **not** automatically create a refund. Provider-specific refund behavior belongs in the future PSP integration layer.

## Provider integration contract

A PSP adapter should use the payment repository to:

1. create a `pending` transaction before/when payment processing begins;
2. attach the provider reference;
3. update the transaction to `succeeded` or `failed` from a trusted server callback/webhook;
4. create separate refund transactions instead of rewriting successful payment history.

Provider references are checked for idempotent reuse, which prepares the ledger for webhook retries.

## Configuration

`PAYMENT_LEDGER_MODE` is optional.

- `mongodb` enables the persistent ledger.
- `disabled` disables payment writes.

When the variable is omitted, Kairoseth Travel automatically uses the MongoDB payment ledger whenever `BOOKING_MODE=mongodb`.

No payment gateway credentials are required for Phase 5A.

## Next step

Phase 5B can connect Stripe (or another provider) to this ledger while keeping the booking, customer and operations domains unchanged.
