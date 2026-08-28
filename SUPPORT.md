# Support

Open Travel Platform is an open-source starter maintained on a best-effort basis.

## Supported release baseline

The **latest stable release in the current major** is the primary supported target for public bug reports and upgrade guidance.

Open Travel Platform currently provides **no guaranteed LTS branch**. Older-release fixes and security backports are best-effort unless a release or security notice explicitly announces a supported backport.

Upgrade expectations are defined in [`docs/UPGRADES.md`](docs/UPGRADES.md):

- same-major upgrades are supported when documented migrations between source and target are applied;
- a major upgrade is supported from the latest stable release of the immediately previous major when the target major documents that path;
- skip-major upgrades are not guaranteed unless documented explicitly;
- deprecated surfaces remain governed by [`docs/DEPRECATIONS.md`](docs/DEPRECATIONS.md), not by an implied indefinite-support promise.

A deployment can remain on an older release, but maintainers may ask for reproduction on the latest stable release before diagnosing a bug that could already be fixed.

## Questions and implementation help

Use GitHub issues for reproducible project bugs and focused feature proposals. For general implementation questions, include enough context for another contributor to understand the environment, adapter mode and expected behavior.

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
- whether the issue reproduces on the latest stable release.

Never include private customer data, credentials, protected Traveller Data or production configuration secrets.
