# Deprecation policy

<p align="center"><strong>English</strong> · <a href="./DEPRECATIONS.es.md">Español</a></p>

Status: **Phase 10.5 — COMPLETE**

## Purpose

Deprecation gives operators, contributors and downstream consumers a predictable path away from an old public capability before ordinary removal.

A deprecation is a compatibility commitment: the deprecated surface still works during its declared support window unless an exceptional security issue makes continued operation unsafe.

This policy applies to public core behavior, including:

- repository/adapter interfaces;
- REST/event/signature contracts;
- public configuration/environment variables;
- documented operational commands and deployment modes;
- persistent-data fields or states that external operators must migrate;
- contributor-facing extension points.

Internal implementation details that are not public contracts do not require a public deprecation lifecycle.

## Lifecycle

Public surfaces move through three explicit states:

```text
ACTIVE → DEPRECATED → REMOVED
```

### ACTIVE

The surface is supported according to the current release/compatibility policy.

### DEPRECATED

The surface remains functional but should no longer be selected for new integrations/deployments.

A deprecation notice must identify:

- the deprecated surface unambiguously;
- the replacement or migration destination;
- the first release where it is deprecated;
- the earliest release where ordinary removal may occur;
- required migration/configuration steps;
- compatibility/rollback considerations;
- security implications when relevant.

### REMOVED

The old surface is no longer supported by that release. Removal must be recorded in release notes/CHANGELOG and must respect the previously announced removal boundary unless an emergency security exception applies.

## Ordinary removal rule

Ordinary removal of a public backward-compatible surface happens only in a **MAJOR** release.

A PATCH or MINOR release must not intentionally remove or incompatibly reinterpret a previously supported public contract, configuration name or authority behavior.

The deprecation notice must name an earliest removal major, for example:

```text
Deprecated since: 1.4.0
Replacement: NEW_SETTING
Earliest ordinary removal: 2.0.0
```

A maintainer may keep the deprecated surface longer. The earliest removal version is a lower bound, not an obligation to remove it immediately.

## Deprecation window

For ordinary changes:

1. replacement support ships first or together with the deprecation;
2. the deprecated surface remains usable throughout the rest of its current major line;
3. migration guidance remains available while that major is supported;
4. removal may occur no earlier than the announced next-major boundary.

If no viable replacement exists, the notice must say so and explain the removal/migration consequence explicitly.

## Security exception

A vulnerability or external security requirement may make continued support unsafe.

In that case an accelerated deprecation/removal is allowed only when the release/security notice clearly states:

- why the ordinary lifecycle cannot be followed;
- affected versions/configuration/contracts;
- safe replacement or mitigation;
- required operator action;
- migration/recovery impact;
- effective removal/disablement version.

Security urgency does not justify silently changing meaning in place.

## Configuration deprecation

Environment-variable and runtime-setting names are public operational contracts when documented for self-hosting.

When replacing one:

1. add the new setting;
2. keep the old setting working during the supported window where safe;
3. document deterministic precedence if both are set;
4. emit a server-side deprecation warning when practical;
5. never log the setting's secret value;
6. remove the old setting only at the announced major boundary.

Do not silently reuse a deprecated variable name with different semantics.

A deprecated security-sensitive setting may instead be rejected earlier under the security exception, with explicit release guidance.

## In-process interfaces

Public `repositories/*.ts` interfaces follow core SemVer and [`EXTENSION-COMPATIBILITY.md`](EXTENSION-COMPATIBILITY.md).

When an interface shape must change incompatibly:

- introduce a compatible/additive transition when practical;
- provide a new interface/version/name rather than changing authority silently;
- document how third-party implementations migrate;
- keep the old surface until its announced major removal boundary.

Changing authority, ownership, authentication or idempotency semantics is breaking even if TypeScript still compiles.

## REST/event/signature contracts

Wire deprecation must preserve explicit version identities.

For a normal v1→v2 migration:

1. v2 is introduced explicitly;
2. v1 remains stable and supported during the declared window;
3. consumers select/migrate to v2 deliberately;
4. mutating v2 calls never silently downgrade to v1;
5. v1 removal happens only at/after the announced boundary.

Event schema version and webhook-signature scheme version remain independent dimensions.

## Persistent-data deprecation

Deprecated fields/states in durable data require the migration discipline from [`MIGRATIONS.md`](MIGRATIONS.md).

Prefer:

```text
expand → migrate/backfill → stop old writes → verify → contract/remove
```

Do not delete a field/state merely because current code no longer writes it. Confirm all supported readers, rollback requirements, backups and postconditions first.

## Warnings

Deprecation warnings should be useful and safe.

A warning should contain:

- deprecated identifier;
- replacement identifier or documentation pointer;
- removal boundary/version when known.

A warning must not contain:

- passwords, API keys or tokens;
- protected Traveller Data/customer data;
- full provider payloads;
- secrets from environment variables.

Warnings should be server-side when they concern privileged/server-only configuration.

## CHANGELOG and release notes

The release that begins deprecation must record it under **Deprecated** (or an equivalent explicit section) with replacement and earliest removal information.

The release that removes the surface must record it under **Removed** and include migration/upgrade guidance.

Do not rewrite historical release entries after publication merely because the lifecycle later progresses.

## Support and backports

Deprecation does not create a new LTS commitment.

The current support baseline remains defined by [`UPGRADES.md`](UPGRADES.md) and [`../SUPPORT.md`](../SUPPORT.md). Backports are best-effort unless explicitly announced.

## Contributor rule

A PR that deprecates or removes a public surface must state:

- lifecycle transition (`active→deprecated` or `deprecated→removed`);
- compatibility/SemVer impact;
- replacement;
- first deprecated release and earliest removal release;
- migration/rollback impact;
- documentation and warning changes;
- security exception, if used.

A removal PR that cannot point to the prior deprecation notice is breaking by default and must not be represented as routine PATCH/MINOR maintenance.

## Automation

The permanent Phase 10.5 gate is:

```bash
npm run check:upgrade-deprecations
```

It protects the lifecycle vocabulary, ordinary-major-removal rule, security exception, configuration/wire/data guidance and synchronization with releases, migrations, support, compatibility and contributing documentation.
