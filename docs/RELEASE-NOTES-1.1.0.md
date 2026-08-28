# Open Travel Platform v1.1.0

Release date: **28 August 2026**  
Release type: **MINOR**  
Software license: **MIT**

Open Travel Platform v1.1.0 completes the Phase 10 open-source productisation baseline. The release focuses on reproducible adoption, provider-neutral self-hosting, extension contracts, release/upgrade lifecycle discipline, contribution tooling and explicit separation between MIT software rights and Kairoseth commercial branding.

## Highlights

- reproducible infrastructure-free demo bootstrap;
- provider-neutral Next.js standalone/self-host packaging and validation;
- nine documented public extension interfaces with explicit authority boundaries;
- real reference adapters and permanent contract validation;
- SemVer/release and persistent-data migration conventions;
- supported upgrade paths and `ACTIVE → DEPRECATED → REMOVED` lifecycle;
- canonical PR template, safer issue forms and reusable release checklist;
- branding/trademark policy separating Open Travel Platform core from official Kairoseth Travel identity;
- expanded permanent CI across security, MongoDB concurrency/recovery, privacy, accessibility, performance and browser E2E.

## Compatibility

v1.1.0 is a backward-compatible MINOR release relative to the documented 1.0.0 package baseline.

- no intentional removal of supported public repository/adapter interfaces;
- existing REST v1 contract identifiers remain unchanged;
- existing event/signature version semantics remain unchanged;
- authority boundaries remain provider-neutral;
- no required destructive persistent-data migration;
- no mandatory new provider credential for demo/self-host evaluation.

## Upgrade from 1.0.0 package baseline

1. Preserve deployment configuration and back up persistent state according to `docs/MIGRATIONS.md`.
2. Review `CHANGELOG.md`, `docs/UPGRADES.md` and `docs/DEPRECATIONS.md`.
3. Install from the exact `v1.1.0` tag/commit.
4. Run:

```bash
npm ci
npm run verify
npm run build
npm run package:standalone
```

5. Validate enabled deployment capabilities before production traffic.

No destructive migration is required merely to move from the documented 1.0.0 package baseline to v1.1.0.

## Public extension model

The release formalizes and protects:

- `TravelRepository`
- `IdentityRepository`
- `BookingRepository`
- `OperationsRepository`
- `PaymentRepository`
- `SupplierFulfilmentAdapter`
- `CrmSyncAdapter`
- `ErpAccountingAdapter`
- `FailureTransport`

`PaymentRepository` remains the local provider-neutral financial ledger boundary. Stripe and Redsys remain PSP/checkout integrations rather than implementations that own the ledger.

CRM/ERP integrations remain downstream-only, while supplier fulfilment remains subordinate to audited local workflow transitions.

## Security, privacy and quality

Permanent CI includes checks for:

- public-source safety and production security;
- transactional booking/payment invariants;
- MongoDB concurrency/idempotency, indexes and recovery;
- Traveller Data encryption/key rotation;
- privacy rights/execution/retention;
- privileged audit integrity;
- accessibility flows across customer, booking/payment, privacy and Operator surfaces;
- load, authenticated-read, mutation-throughput and runtime-resource baselines;
- fresh-clone, standalone runtime and persistent browser E2E journeys.

## Release and maintenance policy

v1.1.0 is the first public release published under the Phase 10 convention with an immutable Git tag and GitHub Release.

The repository previously recorded version 1.0.0 but had no historical Git tag/GitHub Release; no retroactive tag is fabricated.

See:

- `docs/RELEASES.md`
- `docs/MIGRATIONS.md`
- `docs/UPGRADES.md`
- `docs/DEPRECATIONS.md`
- `docs/CONTRIBUTION-TEMPLATES.md`

## Branding

Open Travel Platform is the public MIT-licensed provider-neutral core/project.

Kairoseth Travel is the official hosted/commercial reference implementation at:

`https://travel.kairoseth.com`

Use of the MIT software does not itself grant official Kairoseth/Kairoseth Travel status. See `TRADEMARKS.md`.

## Known external validation

Credentialed Stripe/Redsys TEST/LIVE end-to-end validation remains pending suitable provider accounts. This is a provider-dependent validation item and does not block the provider-neutral core release or reopen the completed Phase 9 engineering baseline.

## Documentation

Spanish release notes: [`RELEASE-NOTES-1.1.0.es.md`](RELEASE-NOTES-1.1.0.es.md)

Final Phase 10 audit: [`PHASE-10-RELEASE-AUDIT.md`](PHASE-10-RELEASE-AUDIT.md)
