## Summary

Describe the focused change, the problem it solves and why it belongs in the provider-neutral core.

## Scope / capability boundary

- Affected capability or extension boundary:
- Does this introduce/change a public repository, adapter, REST/event/signature contract or configuration surface?
- Does this introduce vendor/customer-specific behavior? If yes, explain why it remains optional/provider-neutral.

## Release / compatibility impact

Select and explain the expected impact:

- [ ] PATCH — backward-compatible fix
- [ ] MINOR — backward-compatible addition
- [ ] MAJOR — breaking public change
- [ ] No public release impact

If a public surface changes, link/update the applicable compatibility, upgrade and deprecation guidance.

## Migration / lifecycle impact

- [ ] No migration required
- [ ] Configuration migration
- [ ] Persistent-data/index/backfill migration
- [ ] Wire/event/signature migration
- [ ] Encryption/key migration
- [ ] Destructive/irreversible migration

Lifecycle transition, if applicable:

- [ ] None
- [ ] `ACTIVE → DEPRECATED`
- [ ] `DEPRECATED → REMOVED`
- [ ] Accelerated security exception

For deprecations/removals state the replacement, first deprecated release, earliest ordinary removal release and rollback/recovery impact.

## Authority / security / privacy

- Does authority, authentication, authorization, ownership, idempotency, pricing, inventory, booking or payment semantics change?
- Does this touch protected Traveller Data/customer data, secrets or privileged audit?
- Are browser-visible environment variables safe to expose publicly?
- Are provider payloads still contained and normalized at adapter boundaries?

## UX / accessibility — visible changes only

- [ ] Desktop layout reviewed
- [ ] Mobile/responsive layout reviewed
- [ ] Loading, empty, success, validation and error states reviewed where applicable
- [ ] Keyboard/focus behavior reviewed for interactive controls
- [ ] EN/ES visible copy remains consistent where applicable
- [ ] No phase/PR/WIP/debug/internal-development copy is exposed to users
- [ ] N/A — no visible UI impact (explain below)

## Validation

- [ ] `npm ci`
- [ ] `npm run check:extension-contracts`
- [ ] `npm run check:release-migrations`
- [ ] `npm run check:upgrade-deprecations`
- [ ] `npm run verify`
- [ ] Relevant runtime/integration/E2E flow tested when applicable
- [ ] No private customer data, credentials or protected deployment values committed

## Documentation / operations

- [ ] Relevant EN/ES documentation updated
- [ ] README / ROADMAP / CHANGELOG updated when project/release state changes
- [ ] `.env.example` / deployment guidance updated when configuration changes
- [ ] Migration verification and rollback/recovery documented when state changes
- [ ] N/A — no documentation/operations impact

## Phase completion gate — when this PR closes a project slice

- [ ] Implementation/scope complete
- [ ] Validation complete
- [ ] EN/ES docs + README/ROADMAP/CHANGELOG synchronized
- [ ] Diff reviewed for scope discipline
- [ ] Required CI green
- [ ] Merge to `main` pending/completed as appropriate
- [ ] `main` verification will occur before the next phase starts
