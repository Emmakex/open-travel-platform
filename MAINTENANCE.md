# Open Travel Platform maintenance policy

<p align="center"><strong>English</strong> · <a href="./MAINTENANCE.es.md">Español</a></p>

## Status

Open Travel Platform **v1.2.0** is the stable, provider-neutral open-source baseline.

The public project is now **feature-frozen and maintenance-only**. There is no active feature roadmap after the completed Phase 11 distribution/deployment closeout.

The repository remains public and usable under the MIT license. It is intentionally left unarchived so users can clone it, inspect its history, report relevant defects and maintain their own forks.

## Maintenance scope

Changes may still be considered when they are necessary to preserve the stable baseline, especially:

- security fixes and security-response work;
- critical correctness, reliability or data-integrity fixes;
- compatibility fixes required to keep the documented v1.2.0 baseline buildable or operable;
- dependency/runtime updates required for security or continued operation;
- documentation corrections or clarifications;
- narrowly scoped fixes to the verified release/distribution machinery.

Maintenance work should preserve the existing public contracts and avoid expanding product scope. When a source release is required, normal SemVer, migration, audit and immutable-release rules continue to apply.

## Out of scope

The public OTP roadmap does not plan new commercial/product capabilities, including:

- new end-user or Operator product features;
- commercial UX expansion or Kairoseth-specific design evolution;
- new private/customer adapters or integrations;
- product-specific AI and automation capabilities;
- Kairoseth billing, licensing, packaging or commercial administration;
- customer-specific workflows or infrastructure;
- new roadmap phases intended to grow OTP as the active commercial product.

Feature requests may therefore be closed as `not planned` even when the idea is valid for a downstream product or fork.

## Kairoseth Travel separation

**Kairoseth Travel** is the official commercial/reference implementation and the active product-development line, deployed at <https://travel.kairoseth.com>.

Kairoseth Travel may reuse OTP concepts, contracts or code according to the repository license and architecture boundaries. The dependency direction remains one-way:

```text
Open Travel Platform (public stable baseline)
        ↓
Kairoseth Travel (private/commercial active product)
```

OTP must never depend on private Kairoseth Travel code, customer configuration or proprietary adapters.

New Kairoseth Travel work is not automatically backported to OTP. A future OTP maintenance change, if any, must be deliberately scoped, reviewed and validated as maintenance of the public baseline.

## Stable release identity

The feature-frozen baseline is:

```text
Source release: v1.2.0
Source SHA: aae9b2dcd4529cafba37cc44e7cdfec740731508
Verified OCI image:
ghcr.io/emmakex/open-travel-platform@sha256:aeda693786e6f7c69fd61348a1098acc5bdf09ddaf859cfe16314ce72d7ba6ac
```

The GitHub Release includes `distribution-verification-1.2.0.json`, the machine-readable record of the verified source SHA and OCI digest.

## Support expectations

Open-source maintenance remains best-effort. The project does not promise an active feature roadmap, LTS branch or commercial support through this repository.

Security reporting continues through `SECURITY.md`. Public bug reports should target reproducible issues in the stable OTP baseline and must never contain credentials, customer data or protected Traveller Data.

Commercial Kairoseth Travel development and support are separate from this public maintenance policy.