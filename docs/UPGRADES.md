# Upgrade policy

<p align="center"><strong>English</strong> · <a href="./UPGRADES.es.md">Español</a></p>

Status: **Phase 10.5 — COMPLETE**

## Purpose

Open Travel Platform treats an upgrade as an operational change, not only a package replacement. Operators must be able to identify the exact source and target releases, understand compatibility/migration impact, validate the target revision and recover if the rollout fails.

This policy complements [`RELEASES.md`](RELEASES.md), [`MIGRATIONS.md`](MIGRATIONS.md) and [`DEPRECATIONS.md`](DEPRECATIONS.md).

## Supported upgrade baseline

Open Travel Platform does not promise an LTS branch unless one is explicitly announced in release documentation.

The default public support baseline is:

- the latest stable release in the current major is the primary supported target;
- direct upgrades within the same major are supported when all documented migrations between source and target are applied;
- a major-version upgrade is supported from the latest stable release of the immediately previous major when the target major documents its migration path;
- skipping a major version is **not guaranteed** unless the target release explicitly documents that path;
- backports to older releases are best-effort and must not be assumed unless a release/security notice explicitly says they are provided.

A deployment may remain on an older release, but compatibility, security fixes and support expectations are governed by the published release/deprecation notices rather than by the age of the deployment.

## Upgrade identity

Before changing a deployment, record:

```text
current core version/tag
current exact Git SHA/artifact
current deployment configuration revision
current persistent-data state / backup point
current active keyring identifiers when relevant
target core version/tag and SHA
```

Never describe an upgrade only as “latest”. Use immutable version/tag/SHA identifiers.

## Compatibility classification

Before upgrading, read the complete release history between source and target and classify each relevant change:

- **PATCH** — backward-compatible fix;
- **MINOR** — backward-compatible addition;
- **MAJOR** — may contain breaking public changes and requires explicit migration review;
- **configuration migration** — environment/runtime settings change;
- **persistent-data migration** — MongoDB/index/data transformation;
- **wire-contract migration** — REST/event/signature/version change;
- **cryptographic migration** — keyring/re-encryption change;
- **deprecation/removal** — old capability/configuration/contract reaches a lifecycle boundary.

The SemVer source of truth is [`RELEASES.md`](RELEASES.md); migration classes are defined in [`MIGRATIONS.md`](MIGRATIONS.md).

## Required upgrade sequence

For a production deployment:

1. **Identify source and target exactly.** Record both versions/tags/SHAs.
2. **Read CHANGELOG and release notes** for every intervening release.
3. **Review deprecations/removals.** Confirm no still-used capability is past its supported removal boundary.
4. **Review migration requirements** and choose the required expand/migrate/contract sequence.
5. **Verify backup/recovery** before persistent or irreversible work.
6. **Test the target on staging** or an equivalent representative environment with production-like capability modes.
7. **Run locked validation** on the target source:

```bash
npm ci
npm run check:release
npm run check:release-migrations
npm run check:upgrade-deprecations
npm run verify
```

8. **Apply deliberate migrations** using documented operator-controlled commands/procedures. Startup must not be relied on for destructive migration.
9. **Deploy the immutable target artifact.**
10. **Verify health and business invariants** including enabled customer, Operator, payment and integration paths.
11. **Observe the rollout** long enough to catch asynchronous integration/payment failures.
12. **Record completion** with the exact deployed version/SHA and migration state.

## Same-major upgrades

PATCH and MINOR releases in the same major must preserve public backward compatibility according to the release and extension-contract policies.

A same-major upgrade can still require an **additive** operational migration, for example a new index or optional backfill. Such a migration must keep the declared compatibility window and must not make the release a hidden breaking change.

Required configuration introduced in a same-major release should provide a safe compatibility/default-disabled path where practical. Reinterpreting an existing setting incompatibly is breaking.

## Major upgrades

A new MAJOR may remove previously deprecated surfaces or introduce other intentional incompatibilities.

A major-upgrade guide must identify:

- minimum supported source release;
- removed/deprecated surfaces;
- replacement configuration/contracts;
- required data/key migrations;
- ordering/compatibility window;
- verification steps;
- rollback/recovery constraints.

If the previous application version cannot read the migrated state, that limitation must be explicit before the migration runs.

## Configuration upgrades

Configuration names are public operational contracts.

When replacing a setting:

1. introduce the replacement;
2. document precedence while both are accepted;
3. mark the old setting deprecated;
4. emit a safe server-side warning when practical;
5. remove the old setting only according to [`DEPRECATIONS.md`](DEPRECATIONS.md).

Do not silently reuse an old environment-variable name with incompatible semantics. Never include secret values in deprecation/upgrade warnings.

## API and integration upgrades

Public wire upgrades follow [`EXTENSION-COMPATIBILITY.md`](EXTENSION-COMPATIBILITY.md).

- existing v1 behavior remains stable during its supported lifecycle;
- v2 is selected deliberately;
- mutating v2 operations do not silently downgrade to v1;
- consumers must have a documented migration window before ordinary removal of the old contract;
- authority/authentication/idempotency changes are treated as breaking even when payload shape looks compatible.

## Persistent-data upgrades

Use the migration discipline from [`MIGRATIONS.md`](MIGRATIONS.md): **expand → migrate → contract** when compatibility can be preserved.

Do not deploy a contract/destructive cleanup before all supported readers are ready and recovery conditions are satisfied.

## Rollback and failed upgrades

Before upgrade execution, classify recovery as one of:

- **application-only rollback** — previous release can read the current state;
- **reverse migration** — tested reverse operation exists;
- **backup restore** — data restore is required;
- **forward-only recovery** — irreversible migration prevents rollback.

A failed upgrade must not be “fixed” by moving/reusing a Git tag. Deploy a known-good immutable artifact and use the documented recovery path.

## Security updates

Security advisories may require a faster supported-upgrade path or accelerated deprecation/removal. The exact supported source/target versions and any emergency migration steps must be stated in the security/release notice.

Security urgency does not permit ambiguous version identity, hidden destructive migration or secret disclosure.

## Verification record

For production upgrades, retain a sanitized operational record containing:

- source and target version/SHA;
- migration identifiers executed;
- backup/restore point where applicable;
- verification outcome;
- rollback/recovery classification;
- deployment completion time.

Do not record production secrets or protected traveller/customer data.

## Automation

The lifecycle policy is protected by:

```bash
npm run check:upgrade-deprecations
npm run verify
```

The gate verifies that upgrade/deprecation rules stay synchronized with release, migration, compatibility, support and contributor documentation.
