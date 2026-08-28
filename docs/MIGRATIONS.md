# Migration conventions

<p align="center"><strong>English</strong> · <a href="./MIGRATIONS.es.md">Español</a></p>

Status: **Phase 10.4 — COMPLETE**

## Purpose

A migration is any release change that requires an operator or deployment to transform configuration, persistent state, cryptographic state or a public contract rather than simply replace application code.

Migration work must be explicit, reviewable and recoverable. Open Travel Platform does **not** use hidden destructive migrations during application startup.

Upgrade sequencing is defined by [`UPGRADES.md`](UPGRADES.md); lifecycle/removal boundaries are defined by [`DEPRECATIONS.md`](DEPRECATIONS.md).

## Migration classes

### A. Configuration-only

Examples include an optional environment variable with a safe default or a new opt-in adapter mode.

Preferred pattern:

1. ship support with a safe/default-disabled state;
2. document the variable in `.env.example` and deployment docs;
3. opt in per deployment.

A new required environment variable with no safe compatibility window is a deployment-breaking change. Replacing an existing variable also follows the deprecation lifecycle; do not silently reinterpret its old name.

### B. Additive persistent-data change

Examples include optional MongoDB fields, a new collection or a compatible index.

Preferred strategy: **expand → migrate → contract**.

During expand, old and new readers should remain compatible where practical. Backfill follows. The contract/destructive step happens only after the declared compatibility/deprecation window and rollback requirements are satisfied.

### C. Data transformation/backfill

A data migration must be:

- deterministic;
- bounded and observable;
- safe to retry or explicitly resumable;
- scoped to intended records;
- auditable where protected/privileged data is involved;
- validated before destructive cleanup.

A migration must not silently reinterpret money, currency, inventory, identity, reservation or payment history.

### D. Wire/public-contract migration

REST/event/signature changes follow [`EXTENSION-COMPATIBILITY.md`](EXTENSION-COMPATIBILITY.md) and [`DEPRECATIONS.md`](DEPRECATIONS.md).

Breaking changes require a deliberate parallel/new version, migration window and announced removal boundary. Mutating v2 operations never silently downgrade to v1.

### E. Encryption/key migration

Protected Traveller Data/key changes use the documented keyring and re-encryption mechanisms. Rotation preserves recovery/rollback requirements until old ciphertext is no longer needed.

See [`TRAVELLER-DATA.md`](TRAVELLER-DATA.md).

### F. Destructive/irreversible migration

Examples:

- deleting fields/collections;
- changing semantics so old code cannot read them;
- irreversible data reduction;
- removing an old wire version after deprecation.

These require an explicit recovery plan before release. If rollback requires backup restore, that must be stated and tested. Ordinary public removal cannot use a destructive migration to bypass the major-only removal rule.

## No destructive startup migrations

Application startup, import-time evaluation and ordinary request handling must not automatically run destructive persistent-data migrations.

Reasons:

- multiple instances may start concurrently;
- health checks should not mutate schemas unexpectedly;
- partial startup failure makes rollback ambiguous;
- operators need control over backup, timing and verification.

Use a deliberate migration command/script for operational changes.

## Migration script conventions

New operational migration scripts should document:

- migration identifier/name;
- source assumptions and minimum supported source release;
- target state/release;
- scope/query;
- idempotent or resumable behavior;
- dry-run/read-only inspection when practical;
- expected operational impact;
- verification method;
- rollback/recovery method.

Never embed production credentials or customer-specific identifiers in public scripts.

## Production sequence

For a migration-bearing release:

1. **Identify exact source and target releases/SHAs** using [`UPGRADES.md`](UPGRADES.md).
2. **Classify compatibility, deprecations/removals and migration type.**
3. **Take/verify required backup** before destructive/high-risk work.
4. **Record current application release and database state.**
5. **Deploy expand-compatible code first** when possible.
6. **Run the migration deliberately** with operator authorization.
7. **Verify migration results** using counts/invariants/domain checks, not only exit status.
8. **Observe health and business invariants.**
9. **Perform contract/destructive cleanup only after the lifecycle window.**
10. **Record completion** with target version/SHA and recovery classification.

## MongoDB guidance

Prefer additive changes over destructive in-place reinterpretation.

For large backfills:

- process bounded batches;
- use stable query criteria/cursors;
- make restart behavior explicit;
- avoid unbounded memory use;
- monitor load/locks/latency;
- validate indexes before/after where relevant.

Existing backup/restore and index validation remain part of production safety.

## Payment and financial data

Payment/refund ledger history is authoritative. Migration code preserves movement identity/idempotency, amount/currency semantics, provider references, chronology/audit history and payment/refund distinction.

Do not recalculate historical payment amounts from mutable current booking data.

## Booking/inventory data

Migration work affecting reservations/inventory preserves transactional invariants and must not create or lose capacity implicitly.

If state-machine meaning changes, treat it as breaking and document compatibility, deprecation and rollback explicitly.

## Protected Traveller Data

Protected Traveller Data requires minimum-necessary access and must never be written to logs, migration summaries or public artifacts.

Outputs use counts, safe IDs/correlation references and redacted diagnostics.

## Verification

Every non-trivial migration defines postconditions such as:

- expected record counts;
- no records left in legacy state;
- uniqueness/index invariants;
- domain totals preserved where required;
- encrypted records readable with intended keyring;
- old/new consumers behaving according to the declared lifecycle window.

Exit code alone is not sufficient for high-impact migrations.

## Rollback and recovery

Before running a migration, state whether recovery is:

- **application-only** — previous release can read current state;
- **reverse migration** — tested reverse transformation exists;
- **backup restore** — restore is required;
- **irreversible/forward-only** — rollback is impossible.

Irreversible migrations require explicit review and release notes before execution.

## Release and lifecycle documentation

Every migration-bearing release records in `CHANGELOG.md`:

- migration required: yes/no;
- affected capability/state;
- source/target support assumptions;
- compatibility/deprecation window;
- operator procedure;
- verification step;
- rollback/recovery path.

See [`RELEASES.md`](RELEASES.md), [`UPGRADES.md`](UPGRADES.md) and [`DEPRECATIONS.md`](DEPRECATIONS.md).

## Automation

```bash
npm run check:release-migrations
npm run check:upgrade-deprecations
npm run verify
```

The gates cannot prove every future migration safe, but they prevent silent loss of the required release, upgrade, deprecation and migration contracts.
