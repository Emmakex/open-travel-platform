# Payment idempotency validation

Phase 9B validates payment finalization and webhook replay behavior against a real MongoDB replica set.

## Ledger provider-reference invariant

`travel_payment_transactions` treats `(provider, providerReference)` as an idempotency key whenever `providerReference` is present.

The database now enforces that contract through the partial unique index:

```text
travel_payment_provider_reference_unique
```

The repository still performs an early lookup for a friendly deterministic result, but correctness no longer depends on that read. If two requests race after both observing no existing row, the unique index arbitrates the write.

- the same provider reference + same reservation/type/amount/currency resolves to the already committed movement;
- the same provider reference for a different financial movement fails with `PAYMENT_REFERENCE_CONFLICT`;
- a succeeded movement produces one deterministic `payment.transaction.succeeded` integration event and one ERP delivery when ERP synchronization is configured.

### Existing database migration

The previous non-unique index was named `travel_payment_provider_reference`. Index initialization removes that legacy index and creates the unique replacement.

If an existing database already contains duplicate `(provider, providerReference)` values, creation of the new unique index fails deliberately. Operators must inspect and reconcile those historical duplicates rather than allowing the application to continue with ambiguous financial references.

## Webhook replay invariant

`travel_payment_webhook_events` retains the existing unique `(provider, eventId)` index. `claimPaymentWebhookEvent()` inserts the claim before payment finalization.

Repeated delivery of the same provider event therefore returns a duplicate acknowledgement without rerunning finalization.

Different legitimate provider event IDs may still refer to the same checkout. The payment and checkout layers must therefore also tolerate concurrent finalization of the same pending transaction. The replica-set test verifies that:

- the ledger finishes as `succeeded` once;
- the checkout finishes as `paid`;
- the provider reference is retained once;
- the succeeded financial integration event is emitted once;
- the ERP delivery is enqueued once;
- replay after the checkout is already paid does not create another event.

## Redsys reference choice

Redsys checkout lookup is keyed by `Ds_Order`. The ledger now also stores `Ds_Order` as the Redsys `providerReference` during notification finalization.

The authorization code remains part of the webhook event ID for replay discrimination but is not treated as the globally unique merchant payment key.

## Real CI test

`npm run test:mongodb-payment-idempotency` runs only against a disposable local CI database and refuses remote MongoDB hosts or database names outside the `ktravel_ci_` prefix.

GitHub Actions runs it after the booking concurrency test against the same temporary MongoDB 8.0 replica set, with the payment ledger enabled and a non-delivering ERP REST destination configured only so outbox creation can be asserted.
