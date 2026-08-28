# Development quality gates

These rules apply to every Open Travel Platform / Kairoseth Travel change that can affect product behavior, public contracts, persisted state, deployment behavior or user-visible experience.

They are part of the Definition of Done and are not optional polish.

## Rule 1 — UX validation is mandatory

Any change that affects a page, component, form, state, workflow, message or interaction must be reviewed from the user's point of view before merge.

A visible change is not complete until the reviewer has checked:

- desktop and mobile/responsive layout;
- visual hierarchy and spacing;
- labels, inputs, buttons and touch targets;
- loading, empty, success, validation and error states where applicable;
- keyboard/focus usability;
- EN/ES consistency for visible copy;
- no overflow, clipped controls or raw browser-looking form fields;
- product/user language rather than implementation language.

If a change is not user-visible, the PR may mark this gate as not applicable and explain why.

## Rule 2 — Internal development copy must never ship in the UI

Public/customer/staff interfaces must describe the product and action, never the development process.

Do not expose roadmap/phase names, PR/issue numbers, WIP/TODO/FIXME/debug messages or internal implementation notes in user-facing copy.

Development context belongs in pull requests, issues, roadmap/architecture/development docs or code comments where appropriate.

## Rule 3 — Public extension contracts must remain explicit

Changes to public repositories/adapters must preserve the Phase 10.3 extension model or deliberately update it under the compatibility policy.

Run:

```bash
npm run check:extension-contracts
```

The permanent extension gate protects the public interface inventory, authority boundaries, version identifiers, provider-neutral interface purity and reference-adapter safeguards.

See:

- [`EXTENSION-CONTRACTS.md`](EXTENSION-CONTRACTS.md)
- [`EXTENSION-COMPATIBILITY.md`](EXTENSION-COMPATIBILITY.md)
- [`EXTENSION-VALIDATION.md`](EXTENSION-VALIDATION.md)

## Rule 4 — Release and migration impact must be classified

Every non-trivial change must state whether it affects:

- SemVer compatibility;
- required environment/configuration;
- persistent MongoDB data or indexes;
- booking/inventory/payment historical semantics;
- public REST/event/signature contracts;
- encrypted/protected data or keys;
- deployment order or rollback.

Run:

```bash
npm run check:release
npm run check:release-migrations
```

The Phase 10.4 gate protects the release identity and migration conventions documented in:

- [`RELEASES.md`](RELEASES.md)
- [`MIGRATIONS.md`](MIGRATIONS.md)

Persistent-data evolution should use **expand → migrate → contract** where possible. Hidden destructive migrations during application startup are prohibited.

The dedicated blocking workflow is:

```text
.github/workflows/release-migrations.yml
```

## Automated enforcement

Important project-level commands include:

```bash
npm run check:ux
npm run check:extension-contracts
npm run check:release
npm run check:release-migrations
npm run verify
```

`npm run verify` is the complete local static/build validation path and includes the extension and release/migration gates.

GitHub Actions additionally runs dedicated MongoDB, HTTP contract, recovery, privacy, accessibility and performance/resource workflows.

Automated checks do not replace human UX review, compatibility classification or deployment/migration review.

## Pull-request gate

Every PR should complete the relevant checklist before merge. The required project sequence is:

1. implement the scoped change;
2. run focused tests/checks;
3. classify authority/compatibility/release/migration impact;
4. visually validate affected screens when applicable;
5. synchronize relevant EN/ES docs, README, ROADMAP and CHANGELOG;
6. review the final diff;
7. open the PR;
8. require all mandatory CI to be green;
9. merge to `main`;
10. verify `main` before starting the next phase/slice.

## Definition of Done

A change is done only when functionality, security, data integrity, UX, public-contract compatibility, release/migration safety and documentation are acceptable for production.
