# Support

Open Travel Platform is a stable open-source baseline maintained on a **best-effort maintenance-only basis**.

The active feature roadmap is frozen at **v1.2.0**. See [`MAINTENANCE.md`](MAINTENANCE.md) for the maintenance boundary.

## Supported release baseline

Under the existing public lifecycle contract, the **latest stable release in the current major** remains the primary supported target. In maintenance mode, that baseline is currently **v1.2.0** and any future maintenance/security release explicitly published from it.

Open Travel Platform currently provides **no guaranteed LTS branch**. Older-release fixes and security backports are best-effort unless a release or security notice explicitly announces a supported backport.

Upgrade expectations are defined in [`docs/UPGRADES.md`](docs/UPGRADES.md):

- same-major upgrades are supported when documented migrations between source and target are applied;
- a major upgrade is supported from the latest stable release of the immediately previous major when the target major documents that path;
- skip-major upgrades are not guaranteed unless documented explicitly;
- deprecated surfaces remain governed by [`docs/DEPRECATIONS.md`](docs/DEPRECATIONS.md), not by an implied indefinite-support promise.

A deployment can remain on an older release, but maintainers may ask for reproduction on the stable baseline before diagnosing a bug that could already be fixed.

## What maintenance may be accepted

Public repository work is limited to preserving the stable baseline, especially:

- security fixes;
- critical correctness, reliability or data-integrity fixes;
- compatibility/runtime changes necessary to keep the baseline operable;
- dependency changes required for security or continued operation;
- documentation corrections and narrowly scoped release/distribution fixes.

New product features, commercial UX work, new business integrations, private/customer adapters and Kairoseth-specific product evolution are not part of the active OTP roadmap. Feature proposals may be closed as `not planned` even when they are reasonable for a fork or downstream product.

## Project support vs official commercial status

Open-source support status and commercial/branding status are separate.

Using, forking, self-hosting or contributing to Open Travel Platform does not make a deployment **official Kairoseth Travel** and does not imply Kairoseth sponsorship, certification or commercial support.

The official commercial/reference deployment is `https://travel.kairoseth.com`. Active product development continues there separately from this maintenance-only public baseline. Third-party deployments may truthfully describe themselves as based on or compatible with Open Travel Platform, but official-status wording and Kairoseth/Kairoseth Travel branding follow [`TRADEMARKS.md`](TRADEMARKS.md).

A separately agreed commercial support or partnership relationship, if any, is governed by that separate agreement and is not created by the MIT software license or this public support document.

## Questions and implementation help

Use GitHub issues for reproducible maintenance bugs affecting the stable OTP baseline. General feature-development requests are outside the active project roadmap.

For implementation questions, include enough context for another user to understand the environment, adapter mode and expected behavior, but note that this repository does not promise consulting or commercial implementation support.

## Security

Do not report exploitable security issues or protected data in a public issue. Follow [`SECURITY.md`](SECURITY.md).

Security advisories may define an accelerated supported-upgrade path or deprecation/removal exception when continued support is unsafe. The advisory/release notice is authoritative for that case.

## What to include in a bug report

- Open Travel Platform version/tag and exact commit when known;
- Node.js version;
- operating/deployment environment;
- active data/identity/booking/operations modes;
- reproduction steps;
- expected vs actual behavior;
- sanitized logs when useful;
- whether the issue reproduces on the stable v1.2.0 baseline or a later maintenance release.

Never include private customer data, credentials, protected Traveller Data or production configuration secrets.