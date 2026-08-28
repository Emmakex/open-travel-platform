# Browser E2E regression guide

This guide records browser-test failures that must not be rediscovered in every pull request.

## Historical reference: PR #115

PR #115 (`Phase 9D-4: accessible booking and payment feedback`) exposed two recurring Playwright failure modes:

1. **Test-scope leakage.** The historical `test:e2e` command temporarily expanded from one controlled persistent booking journey to every Playwright spec. New accessibility specs then ran under environments that were not designed for them.
2. **Locale-sensitive assertions.** The persistent Operator journey expected the raw literal `pending`, while the UI correctly rendered the localized status label `Pending` / `Pendiente`.

The fixes were:

- keep the historical browser journey explicitly scoped to `tests/e2e/persistent-booking.spec.ts --project=chromium`;
- give each new browser gate its own explicit spec path and controlled environment;
- never assert user-facing Operator copy in only one language when the surface is localized;
- prefer stable IDs and semantic attributes for behaviour checks, and bilingual role/name regexes when the accessible name itself is the requirement.

## Follow-up regression: PR #116

PR #116 exposed the selector form of the same problem. A generic `form button[type="submit"]` selector matched the EN/ES language controls plus the intended form action, causing a Playwright strict-mode violation even though the application, MongoDB seed, typecheck and production build were healthy.

The permanent rule is: **do not target generic submit buttons on localized pages.** Use a semantic role plus a locale-safe accessible name for the intended action, for example `Create my account|Crear mi cuenta`, `Confirm reservation|Confirmar reserva` or `Sign in to operations|Entrar en operaciones`.

## Mandatory rules for new browser PRs

Before adding or changing a Playwright gate:

- **Do not use a bare `playwright test` command** in a package script or dedicated workflow. Name the exact spec and Chromium project.
- **Do not broaden `test:e2e`.** It is the historical persistent customer booking → Operator verification journey and must remain isolated.
- **Treat Operator/customer copy as localized.** Assertions against headings, statuses, buttons, form names or accessible names must support EN/ES, or use locale-neutral IDs/attributes when text is not the subject of the test.
- **Do not use generic submit selectors on localized pages.** Language controls may also be forms/buttons. Target the intended action with `getByRole("button", { name: /EN|ES/ })` or another stable semantic relationship.
- **Prefer semantic selectors.** Use `getByRole`, stable IDs, `role`, `aria-live`, `aria-invalid`, `aria-describedby` and other programmatic relationships over fragile visual or structural selectors.
- **Keep environments explicit.** MongoDB database names must remain CI-only/disposable, the production Next.js server must be used, and each workflow must declare the required identity/booking/operations modes.
- **Run source invariants before Chromium.** A browser workflow should fail early on configuration or contract regressions before spending time on the browser journey.

## PR #116 application

PR #116 applies and extends the PR #115 regression pattern to Operator accessibility coverage:

- the Operator accessibility spec remains isolated under `test:accessibility-operator`;
- localized form names and action buttons accept both English and Spanish;
- the journey uses named semantic buttons instead of generic submit selectors;
- the Operator accessibility invariant rejects `form button[type="submit"]` in this browser journey and protects the bilingual expectations.

## Review checklist

For every future PR that adds a browser spec, reviewers should ask:

- Is the spec executed by an explicit dedicated command?
- Could this change accidentally cause another workflow to discover the new spec?
- Does any assertion depend on English-only or Spanish-only UI copy?
- Does any generic `submit` selector risk matching locale or auxiliary forms?
- Can a stable semantic selector replace a text literal or structural CSS selector?
- Does the test environment provide exactly the persistent services/capabilities the journey requires?

If any answer is unclear, compare the change against PR #115 and the PR #116 follow-up before merging.
