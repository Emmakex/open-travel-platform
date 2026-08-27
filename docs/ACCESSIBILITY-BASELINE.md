# Accessibility readiness baseline

This document describes the Phase 9D-4 accessibility engineering baseline for Open Travel Platform / Kairoseth Travel.

It is **not legal advice, an accessibility certification, or a claim that automated tests establish WCAG conformance**. Accessibility requires a combination of implementation, automated checks, keyboard/assistive-technology testing and human review of representative user journeys.

## Official references

- W3C Web Content Accessibility Guidelines (WCAG) 2.2: https://www.w3.org/TR/WCAG22/
- Directive (EU) 2019/882 (European Accessibility Act): https://eur-lex.europa.eu/eli/dir/2019/882/oj
- Spain, Ley 11/2023 implementing accessibility requirements for specified products and services: https://www.boe.es/buscar/act.php?id=BOE-A-2023-11022

W3C recommends WCAG 2.2 as the current WCAG 2 target and states that WCAG 2.2 extends WCAG 2.1 compatibly. The platform therefore uses **WCAG 2.2 AA-oriented engineering criteria** for new work while avoiding a blanket certification claim.

For Spain, Ley 11/2023 expressly includes e-commerce services and the websites/mobile services of travel agencies and tour operators in its scope, subject to the law's definitions, exclusions and exceptions. Its Title I became effective on 28 June 2025. The same law contains an exemption for microenterprises providing services and a documented disproportionate-burden mechanism. Whether a particular deployment is legally in scope must be assessed for that operator; the open-source core does not decide this automatically.

## Baseline implemented in 9D-4

The global shell provides:

- a bilingual keyboard-visible “Skip to main content” link before repeated navigation;
- a stable focus target around page content without introducing a second nested `<main>` landmark;
- a strong `:focus-visible` outline for links, buttons, form controls, summaries and explicitly focusable elements;
- focus styling loaded after the older global styles, so controls that previously used `outline: none` still receive a visible keyboard focus indicator;
- `prefers-reduced-motion: reduce` handling that disables smooth scrolling and collapses animation/transition durations;
- forced-colors focus treatment for high-contrast environments;
- existing document language, header/footer landmarks and named navigation landmarks remain preserved.

## Blocking browser smoke coverage

A dedicated Chromium accessibility smoke test verifies the stable global contract:

1. document language and a single page `<main>` landmark on the public home route;
2. first keyboard Tab reaches the skip link;
3. activating the skip link moves focus to the main-content target;
4. keyboard focus remains visibly outlined on the next navigation control;
5. desktop primary navigation has an accessible name;
6. reduced-motion preference disables smooth scrolling/long transitions;
7. the home page does not create horizontal document overflow at 320 CSS px.

These checks are deliberately small and deterministic enough to block CI. They do not replace a full accessibility audit.

## Manual review gate

Before claiming a release is accessibility-ready, review representative English and Spanish journeys manually, including at least:

- public browse → trip/service detail → booking;
- sign-in / registration / recovery / accessible authentication;
- customer account, traveller-data completion and privacy requests;
- payment choice and any provider-hosted handoff/return UI under the operator's control;
- Operator sign-in, reservation queue, reservation detail and common mutations.

For each journey review:

- keyboard-only operation, logical focus order and no keyboard trap;
- focus not obscured by sticky/fixed UI;
- semantic headings/landmarks and meaningful accessible names;
- form labels, instructions, required state, error identification and error recovery;
- status changes announced where needed rather than conveyed only visually;
- text/background and non-text contrast;
- zoom to 200% and reflow/small viewport behavior;
- pointer target size/spacing and alternatives to dragging gestures;
- images/media alternatives where content is meaningful;
- screen-reader operation on a representative desktop/mobile combination;
- third-party content/payment surfaces documented separately when they are not controlled by the platform.

## Scope and residual risk

The first 9D-4 slice establishes the cross-application keyboard/focus/motion/reflow contract. Individual feature forms and dynamic status regions still require targeted review and fixes in follow-up accessibility slices.

An automated green build must never be presented as proof that every WCAG success criterion or every obligation of Ley 11/2023 is satisfied. Deployment-specific legal scope, third-party services, content quality and manual assistive-technology findings remain separate release inputs.
