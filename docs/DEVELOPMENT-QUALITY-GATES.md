# Development quality gates

These rules apply to **every change, feature, bug fix and refactor** that can affect a user-visible experience in Open Travel Platform / Kairoseth Travel.

They are part of the Definition of Done and are not optional polish.

## Rule 1 — UX validation is mandatory

Any change that affects a page, component, form, state, workflow, message or interaction must be reviewed from the user's point of view before merge.

A visible change is not complete until the reviewer has checked:

- desktop layout;
- mobile/responsive layout;
- visual hierarchy and spacing;
- labels, inputs, buttons and touch targets;
- loading, empty, success, validation and error states where applicable;
- keyboard/focus usability for interactive controls;
- EN/ES consistency for visible copy;
- no overflow, clipped controls or raw browser-looking form fields;
- actions are named in product/user language, not implementation language;
- the workflow is understandable without knowing the development roadmap.

If a change is not user-visible, the PR may mark this gate as not applicable and explain why.

## Rule 2 — Internal development copy must never ship in the UI

Public/customer/staff interfaces must describe the **product and the action**, never the development process.

Do not expose copy such as:

- roadmap or phase names (`Phase 6B`, `Fase 6B`, etc.);
- PR/issue numbers;
- `WIP`, `TODO`, `FIXME` or debug messages;
- implementation notes such as “first slice”, “temporary block”, “internal test” or similar development explanations;
- technical wording that only makes sense to developers when a normal product label exists.

Development context belongs in:

- pull-request descriptions;
- issues;
- roadmap documents;
- architecture/development docs;
- code comments when appropriate.

## Automated enforcement

`npm run check:ux` scans user-facing source roots (`app` and `components`) for common internal-development markers.

CI runs this check on every pull request and on `main`.

The automated check is intentionally only one layer. It does **not** replace visual review because layout quality, readability, interaction design and responsive behavior require human inspection.

## Pull-request gate

Every PR with visible changes must complete the UX/content checklist in `.github/pull_request_template.md` before merge.

The required sequence is:

1. implement;
2. run automated checks;
3. visually validate affected screens and states;
4. review visible copy for product language only;
5. merge only when both automated and manual gates pass.

## Definition of Done

A change is done only when functionality, security, data integrity, UX and visible copy are all acceptable for production.
