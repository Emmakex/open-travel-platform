# Operator accessibility closeout

This document records the Phase 9D-4 accessibility closeout for protected Operator workflows in Open Travel Platform / Kairoseth Travel.

It is an engineering baseline oriented toward WCAG 2.2 AA. It is **not** an automated WCAG certification or a legal declaration of conformity. Production deployments still require manual keyboard, screen-reader, zoom/reflow, contrast and content review with representative staff workflows.

## Reservation internal workflow

The reservation workspace now gives its internal workflow section a stable programmatic heading and exposes server-returned outcomes through live regions:

- successful workflow or note updates use `role="status"` with `aria-live="polite"`;
- actionable failures use `role="alert"` with `aria-live="assertive"`;
- the workflow and note forms reference the relevant error region through `aria-describedby`;
- owner, priority, tags and note controls expose `aria-invalid` when the returned validation code identifies them;
- tags keep their visible help text and programmatic description together with returned errors.

No reservation authority, inventory, pricing, customer visibility or audit semantics are changed.

## Tasks and follow-ups

The task surface now exposes creation/update/comment outcomes using the same status-versus-alert contract. Repeated task forms receive contextual accessible names, each task is an `article` with a heading, and task history regions have contextual names.

Returned validation codes can mark title, assignee, due date, status or follow-up controls as invalid. The task authority, transition rules, staff permissions and persisted audit history are unchanged.

## Supplier fulfilment

Supplier fulfilment keeps its existing local-state authority and provider-adapter safety model while improving assistive-technology semantics:

- success/error feedback uses stable polite status and assertive alert regions;
- each component is an `article` named by its component heading;
- repeated supplier forms, external adapter groups, voucher-reference actions and note forms have contextual accessible names;
- supplier/status/cost/note validation can expose `aria-invalid`;
- voucher reference visibility is exposed as a non-error status;
- audit/history regions are named by component.

These changes do not alter supplier transitions, external adapter payloads, supplier costs, customer pricing, payment ledger data or protected Traveller Data boundaries.

## Blocking browser evidence

`tests/e2e/accessibility-operator.spec.ts` runs against persistent MongoDB-backed customer and staff authentication. It creates a real reservation, signs into Operator with the bootstrap Admin and verifies the reservation workspace exposes the expected status/alert severity, form names, error relationships and invalid control state.

The dedicated CI workflow uses a disposable MongoDB 8 replica set, the existing deterministic travel seed, a production build and pinned Chromium.

## Manual review still required

Automated checks cannot establish full conformance. Before a deployment makes a formal accessibility claim, review at minimum:

- complete keyboard-only navigation and operation across representative Operator queues and workspaces;
- NVDA/JAWS on Windows and VoiceOver on macOS/iOS for representative staff journeys;
- focus order and focus recovery after real server-side validation failures;
- 200%/400% zoom and narrow reflow for dense operations screens;
- text, icon and state contrast in the deployed brand theme;
- labels, instructions and error language with real operational content;
- external payment/provider pages separately, because third-party surfaces are outside this core's rendering authority.

Phase 9D-4 therefore closes the core engineering baseline while keeping deployment-specific manual accessibility validation as a release responsibility.