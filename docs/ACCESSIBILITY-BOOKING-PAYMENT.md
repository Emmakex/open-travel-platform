# Booking and payment accessibility slice

This document records the Phase 9D-4 accessibility work for booking feedback and the customer payment journey in Open Travel Platform / Kairoseth Travel.

It is an engineering baseline, **not a WCAG certification or legal-conformance claim**. The target remains WCAG 2.2 AA-oriented implementation together with manual keyboard, screen-reader and content review.

## Booking feedback

Trip and service booking pages expose server-returned booking failures through stable `role="alert"` regions with `aria-live="assertive"`. This means errors caused by stale availability, traveller validation, inventory, accommodation or package rules are not communicated only by visual styling.

The trip traveller form also provides client-side recovery for required traveller details before submission. When the user attempts to confirm an incomplete traveller form:

- the form exposes a stable assertive error summary;
- each affected field receives `aria-invalid="true"`;
- the control is associated with its visible inline error through `aria-describedby`;
- focus moves to the first invalid traveller field;
- correcting a field removes its stale error relationship immediately.

This client-side recovery is usability and accessibility guidance only. Server-side traveller parsing, age/pricing bands, responsible-adult rules, inventory, accommodation and package validation remain authoritative and run again on every accepted submission.

## Checkout feedback

The authenticated checkout distinguishes:

- actionable payment/provider failures via `role="alert"` and `aria-live="assertive"`;
- non-error payment states such as cancelled, fully paid, pending confirmation, unavailable online payment or outdated schedules via `role="status"` and `aria-live="polite"`;
- the payment summary through a named description list;
- the available payment-method area through an accessible name;
- provider forms associated with a returned checkout error when one is present.

The platform does not expose provider credentials or payment payloads in these accessibility surfaces.

## Provider handoff and return

The Redsys bridge exposes the redirect message as a polite status while preserving the manual “Continue to Redsys” fallback button. The provider return page exposes one atomic status region: failed payments are assertive alerts, while paid or still-pending results are polite statuses.

Provider-hosted pages are outside the open-source application's DOM and must be reviewed separately for each production provider/account. Credentialed Stripe/Redsys TEST/LIVE validation remains an external-account gate.

## Blocking browser evidence

A dedicated Chromium smoke test uses a disposable MongoDB replica set and controlled catalogue seed to verify:

1. trip booking server errors are assertive alerts;
2. an incomplete traveller form exposes inline field errors, `aria-invalid` relationships and focus recovery to the first invalid field;
3. a real customer can register and create a persistent trip reservation;
4. the authenticated checkout exposes a provider error as an alert;
5. the payment summary has a stable accessible name;
6. the no-provider/current checkout state is exposed politely.

The browser test does not contact Stripe or Redsys.

## Remaining Phase 9D-4 work

Follow-up accessibility slices still include richer service-booking recovery, Operator workflows, broader contrast/content review, and manual assistive-technology journeys across English and Spanish surfaces.
