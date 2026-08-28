# Contribution and release templates

<p align="center"><strong>English</strong> · <a href="./CONTRIBUTION-TEMPLATES.es.md">Español</a></p>

Status: **Phase 10.6 — COMPLETE**

## Purpose

Phase 10.6 turns the project policies from Phases 10.3–10.5 into practical contributor and maintainer templates.

The templates do not replace the authoritative architecture/release policies. They make the required questions difficult to omit during ordinary GitHub work.

## Canonical pull request template

The only canonical repository PR template is:

```text
.github/PULL_REQUEST_TEMPLATE.md
```

A second case-variant template must not exist. Duplicate PR templates create ambiguous GitHub behavior and inevitably drift.

The template requires contributors to classify:

- capability/extension boundary;
- SemVer/release impact;
- migration class;
- deprecation/removal lifecycle transition;
- authority/security/privacy impact;
- visible UX/accessibility impact;
- validation performed;
- EN/ES documentation and operations impact;
- phase-close requirements when a PR closes a project slice.

## Issue forms

Supported public issue forms are intentionally small:

- `bug-report.yml` captures exact version/commit, reproducible behavior, environment, regression/upgrade context and a mandatory data-safety confirmation;
- `feature-request.yml` captures the reusable product problem, capability boundary, public-contract impact, provider neutrality, migration/lifecycle impact and authority/security/privacy considerations;
- `config.yml` routes security vulnerabilities to the private security policy and keeps blank issues disabled.

Issue forms gather enough context for triage without forcing every reporter to understand the full maintainer release process.

## Release template

`.github/RELEASE_TEMPLATE.md` is the reusable release-notes checklist for maintainers.

It captures:

- immutable release identity (`X.Y.Z`, `vX.Y.Z`, verified `main` SHA);
- SemVer classification and previous supported release;
- public-contract/configuration compatibility;
- migration class/procedure/verification/recovery;
- deprecations and removals with lifecycle metadata;
- permanent validation commands;
- fresh-clone/standalone/provider validation status;
- documentation completion;
- merge → verify main → immutable tag → GitHub release publication record.

It is a maintainer template, not an automated release action. Tags/releases must still follow `RELEASES.md`, `MIGRATIONS.md`, `UPGRADES.md` and `DEPRECATIONS.md`.

## Security and privacy

Templates must never ask users to paste:

- production credentials or tokens;
- private customer records;
- protected Traveller Data;
- complete provider payloads containing protected data;
- secret environment values.

Security vulnerabilities are routed to `SECURITY.md` rather than public issue discussion.

## Permanent validation

Phase 10.6 adds:

```bash
npm run check:contribution-templates
```

The gate verifies that:

- exactly one canonical PR template remains;
- PR template contains the required release/migration/lifecycle/security/validation sections;
- bug/feature forms preserve safety and compatibility context;
- release template preserves release identity, migration, deprecation and publication requirements;
- this bilingual guide and the central contributor/project docs remain linked;
- the check stays inside `npm run verify` and a dedicated GitHub Actions workflow.

A valid future change can update the protected template vocabulary, but the docs, gate and policy impact must change together.

## Phase completion rule

Phase 10.6 follows the permanent project completion gate: implementation, validation, synchronized EN/ES documentation, diff review, green CI, merge to `main`, and verification of `main` before branding/trademark work starts.
