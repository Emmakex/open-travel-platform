# Accessible Traveller Data and privacy workflows

This Phase 9D-4 slice covers customer Traveller Data and privacy-rights interactions. It complements `ACCESSIBILITY-BASELINE.md` and remains WCAG 2.2 AA-oriented engineering, not a certification claim.

## Traveller Data

- Every required control has a stable unique ID and explicit label association.
- A returned validation failure preserves only the existing technical `travellerId` as workflow context so attention can return to the affected traveller.
- Fields for that traveller expose `aria-invalid` and reference the shared error with `aria-describedby`.
- The first affected field receives focus after a returned validation error.
- Validation/save failures use an assertive `role="alert"` region.
- Progress and saved confirmations use polite `role="status"` regions.
- Encryption, retention and ownership authority are unchanged by this accessibility slice.

## Privacy rights

- The privacy-right selector has stable help/error relationships through `aria-describedby`.
- Invalid-right feedback uses `role="alert"`; created and withdrawn confirmations use polite `role="status"` regions.
- Repeated case actions include the right type in their accessible names, for example `Withdraw Access request` and `Download approved JSON for Access`.
- Export-preparation text exposes status semantics without changing release approval or export authority.

## Blocking validation

A dedicated Chromium test uses persistent customer authentication and disposable MongoDB. It creates a real booking, adds only a CI-local Traveller Data requirements snapshot, verifies validation focus/error relationships, creates real privacy requests and checks contextual action names.

The test does not store production secrets or alter production/customer data.

## Remaining Phase 9D-4 work

Booking/payment interactions, Operator forms, broad contrast/content review and manual assistive-technology journeys remain pending before accessibility readiness can be closed.
