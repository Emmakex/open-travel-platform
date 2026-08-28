# Migration conventions

<p align="center"><strong>English</strong> · <a href="./MIGRATIONS.es.md">Español</a></p>

Status: **Phase 10.4 — COMPLETE**

## Purpose

A migration is any release change that requires an operator or deployment to transform configuration, persistent state, cryptographic state or a public contract rather than simply replace application code.

Migration work must be explicit, reviewable and recoverable. Open Travel Platform does **not** use hidden destructive migrations during application startup.

## Migration classes

### A. Configuration-only

Examples:

- adding an optional environment variable with a safe default;
- introducing a new opt-in adapter mode.

Preferred pattern:

1. ship support with a safe/default-disabled state;
2. document the variable in `.env.example` and deployment docs;
3. opt in per deployment.

A new required environment variable with no safe compatibility window is a deployment-breaking change and must be classified accordingly.

### B. Additive persistent-data change

Examples:

- adding optional MongoDB fields;
- adding a new collection;
- adding a compatible index.

Preferred strategy: **expand → migrate → contract**.

During expand, old and new application readers should remain compatible where practical. Data backfill follows. Destructive cleanup happens only after the compatibility window and rollback requirements are satisfied.

### C. Data transformation/backfill

A data migration must be:

- deterministic;
- bounded and observable;
- safe to retry or explicitly resumable;
- scoped to the intended records;
- auditable where protected/privileged data is involved;
- validated before destructive cleanup.

A migration should not silently reinterpret money, currency, inventory, identity, reservation or payment history.

### D. Wire/public-contract migration

REST/event/signature changes follow the versioning rules in [`EXTENSION-COMPATIBILITY.md`](EXTENSION-COMPATIBILITY.md).

Breaking contract changes require a deliberate parallel/new version and an explicit migration window. Mutating v2 operations must never silently downgrade to v1.

### E. Encryption/key migration

Protected Traveller Data/key changes must use the documented keyring and re-encryption mechanisms. Key rotation must preserve recovery/rollback requirements until old ciphertext is no longer needed.

See [`TRAVELLER-DATA.md`](TRAVELLER-DATA.md) and the existing key-rotation tooling/tests.

### F. Destructive/irreversible migration

Examples:

- deleting fields/collections;
- changing semantics in a way old code cannot read;
- irreversible data reduction;
- removing an old wire version after deprecation.

These require an explicit recovery plan before release. If rollback requires backup restore, that must be stated and tested.

## No destructive startup migrations

Application startup, import-time module evaluation and ordinary request handling must not automatically run destructive persistent-data migrations.

Reasons:

- multiple application instances may start concurrently;
- deployment health checks should not mutate data schemas unexpectedly;
- failure halfway through startup makes rollback ambiguous;
- operators need control over backup, timing and verification.

A deliberate migration command/script is the preferred boundary for operational data changes.

## Migration script conventions

New operational migration scripts should live under a clearly named migration/migration-support location and should document:

- migration identifier/name;
- source assumptions;
- target state;
- scope/query;
- whether it is idempotent or resumable;
- dry-run/read-only inspection mode when practical;
- expected runtime/operational impact;
- verification method;
- rollback/recovery method.

Never embed production credentials or customer-specific identifiers in public migration scripts.

## Production sequence

For a migration-bearing release:

1. **Classify compatibility and migration type.**
2. **Take/verify the required backup** before destructive or high-risk persistent-state work.
3. **Record the current application/core release and database state.**
4. **Deploy expand-compatible code first** where an expand/migrate/contract strategy is possible.
5. **Run the migration deliberately** with the required operator authorization.
6. **Verify migration results** using counts/invariants/domain checks rather than only command exit status.
7. **Observe application health and business invariants.**
8. **Perform contract/destructive cleanup only after the compatibility window.**
9. **Record completion** in release/deployment operations.

## MongoDB guidance

Prefer additive changes over in-place destructive schema reinterpretation.

For large backfills:

- process bounded batches;
- use stable query criteria/cursors;
- make restart behavior explicit;
- avoid unbounded memory use;
- monitor load/locks/latency;
- validate indexes before and after where relevant.

Existing backup/restore and index validation remain part of production safety.

## Payment and financial data

Payment/refund ledger history is authoritative historical state.

Migration code must preserve:

- movement identity/idempotency;
- amount and currency semantics;
- provider references when applicable;
- chronological/audit history;
- refund/payment distinction.

Do not “recalculate” historical payment amounts from mutable current booking data.

## Booking/inventory data

Migration work affecting reservation or inventory state must preserve transactional invariants and avoid creating/losing capacity implicitly.

If a migration changes state-machine meanings, treat it as a public/domain breaking change and document compatibility/rollback explicitly.

## Protected Traveller Data

Protected Traveller Data requires minimum-necessary access and must never be written to logs, migration summaries or public artifacts.

Migration outputs should use counts, safe IDs/correlation references and redacted diagnostics.

## Verification

Every non-trivial migration must define postconditions, such as:

- expected record counts;
- no records left in legacy state;
- uniqueness/index invariants;
- domain totals unchanged where they should be preserved;
- encrypted records readable with the intended active keyring;
- old/new contract consumers behaving according to the declared window.

Exit code alone is not a sufficient verification strategy for high-impact migrations.

## Rollback and recovery

Before running a migration, state whether rollback is:

- **application-only** — previous release can read the new state;
- **reverse migration** — a tested reverse transformation exists;
- **backup restore** — restore is required;
- **irreversible** — rollback is impossible and recovery is forward-only.

Irreversible migrations require explicit review and release notes before production execution.

## Release documentation

Every migration-bearing release should record in `CHANGELOG.md`:

- migration required: yes/no;
- affected capability/state;
- compatibility window;
- operator command/procedure;
- verification step;
- rollback/recovery path.

See [`RELEASES.md`](RELEASES.md).

## Automation

The permanent Phase 10.4 gate checks that release/migration conventions remain present and synchronized:

```bash
npm run check:release-migrations
npm run verify
```

The gate does not automatically prove every future migration is safe; it ensures the project cannot silently drop the required conventions and contributor/release integration points.

## Phase completion record

Phase 10.4 satisfies the project completion rule. No later Phase 10 slice is considered active until required CI is green, the closing change is merged to `main`, and `main` is verified.
