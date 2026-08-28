# Open Travel Platform branding and identity policy

<p align="center"><strong>English</strong> · <a href="./TRADEMARKS.es.md">Español</a></p>

Status: **Phase 10.7 — COMPLETE candidate pending closing PR/CI/merge**

## Purpose

Open Travel Platform is distributed as an MIT-licensed provider-neutral software core. The software license and project identity answer different questions:

- [`LICENSE`](LICENSE) grants the rights to use, copy, modify, merge, publish, distribute, sublicense and sell copies of the MIT-licensed software, subject to its terms;
- this policy explains how project and reference-deployment names may be used so users are not misled about source, affiliation, endorsement or official status.

This policy **does not change or restrict the MIT code license** and does not state or imply that any identifier is registered as a trademark in any jurisdiction. Do not use the `®` symbol for these project identifiers unless a future authoritative notice explicitly confirms registration and the permitted use.

## Project identities

### Open Travel Platform

**Open Travel Platform** is the name used to identify this public open-source core, its upstream repository, documentation and releases.

Truthful descriptive reference to the project is encouraged. Examples include:

- “based on Open Travel Platform”;
- “fork of Open Travel Platform”;
- “compatible with Open Travel Platform v1.x” when compatibility is actually verified;
- “independent support for Open Travel Platform” when the service is clearly identified as independent;
- links, reviews, tutorials, conference talks and technical documentation that accurately refer to the project.

### Kairoseth Travel

**Kairoseth Travel** identifies the official hosted/commercial reference implementation described by this repository. The current reference deployment is `travel.kairoseth.com`.

Third-party forks, deployments, products or services must not call themselves **Kairoseth Travel**, use `Kairoseth`/`Kairoseth Travel` as their primary product/service/domain/account identity, or imply that they are the official hosted service unless explicit permission has been granted by the relevant maintainer/rightsholder.

Truthful descriptive references such as “the Kairoseth Travel reference deployment” are allowed when they do not imply affiliation or endorsement.

## Modified distributions and independent hosted services

The MIT license allows modified software. A modified distribution or independently operated hosted service should use **its own primary product name and visual identity** so users can tell who publishes, operates and supports it.

Recommended wording:

```text
Acme Travel — based on Open Travel Platform
```

or:

```text
Acme Travel is an independent deployment based on Open Travel Platform.
It is not the official Kairoseth Travel service.
```

A modified or independently operated product must not present itself as “official Open Travel Platform”, “official Kairoseth Travel”, “certified”, “approved”, “partner” or equivalent unless that status has been explicitly granted.

## Unmodified source mirrors and forks

Source-code forks and mirrors may preserve repository history and may truthfully identify the upstream project as Open Travel Platform.

A GitHub fork, source mirror or archival copy does not become an official Open Travel Platform release channel merely because it preserves the upstream name in repository metadata or history.

If a fork becomes an independently distributed product or hosted service, use a distinct primary user-facing brand and describe the Open Travel Platform relationship secondarily.

## Default application identity

The demo/evaluation configuration intentionally defaults to:

```text
NEXT_PUBLIC_SITE_NAME=Open Travel Platform
```

That default is appropriate for local evaluation, upstream development and demonstrations of the upstream project.

Independent public/commercial deployments and materially modified distributions should set `NEXT_PUBLIC_SITE_NAME` and related presentation configuration to their own primary identity. They may include a truthful secondary statement such as “Powered by Open Travel Platform” or “Based on Open Travel Platform” when it does not imply official endorsement.

## “Powered by”, “based on” and compatibility wording

The following are generally acceptable when accurate and subordinate to the independent product's own brand:

- “Powered by Open Travel Platform”;
- “Based on Open Travel Platform”;
- “Compatible with Open Travel Platform X.Y”;
- “Independent integration/support for Open Travel Platform”.

Do not use wording that implies certification, official partnership or endorsement that has not been granted.

Compatibility statements should identify a version or contract family when that distinction matters and must not claim compatibility that has not been tested.

## Domains, social accounts and product names

Do not use **Kairoseth**, **Kairoseth Travel**, `travel.kairoseth.com`, or confusingly similar identities as the name of an independent product, hosted service, domain, package, application-store listing or social account without explicit permission.

Do not use **Open Travel Platform** as the primary name of an unrelated or independently modified commercial product/service in a way that makes users reasonably believe it is published, hosted, supported or endorsed by the upstream project.

Descriptive domain/page text that truthfully explains compatibility or origin is different from presenting the project identity as the operator's own brand.

## Logos and visual marks

This repository currently does **not** designate or distribute an official Open Travel Platform or Kairoseth Travel logo package as part of this branding policy. Demo destination/travel artwork is not an official project logo.

If official logo assets are introduced later, their permitted use must be documented explicitly. Do not assume that a source-code license automatically grants permission to present a third-party product as an official branded distribution.

## Official, certified, approved and partner claims

The following terms are reserved for situations where the corresponding status has actually been granted:

- official;
- certified;
- approved;
- endorsed;
- partner / partnership;
- authorized / authorised.

Technical compatibility alone does not create any of these statuses.

## Commercial services, consulting and support

Independent companies and individuals may offer services around MIT-licensed Open Travel Platform software.

Use wording that clearly identifies the service provider, for example:

- “Acme Consulting — independent Open Travel Platform implementation services”;
- “Independent support for Open Travel Platform”.

Avoid names such as “Open Travel Platform Official Support” or “Kairoseth Travel Support” for an unaffiliated service.

## Legacy `KTRAVEL_*` configuration identifiers

The public core currently contains `KTRAVEL_*` environment-variable names retained as **legacy technical configuration identifiers**.

Their presence:

- does not make an independent deployment Kairoseth Travel;
- does not grant permission to use Kairoseth branding;
- does not create an affiliation or endorsement claim.

Because documented environment-variable names are public operational contracts, they must not be silently renamed. Any future namespace migration follows [`docs/DEPRECATIONS.md`](docs/DEPRECATIONS.md), [`docs/UPGRADES.md`](docs/UPGRADES.md) and [`docs/MIGRATIONS.md`](docs/MIGRATIONS.md), with compatible aliases/deprecation before ordinary removal.

## Third-party brands

Names such as Stripe, Redsys, MongoDB, Next.js and other third-party product/vendor names belong to their respective owners. References in this repository are descriptive integration/technology references and do not imply endorsement or partnership.

Third-party branding remains governed by the applicable third-party policies.

## Branding in contributions

A contribution must not:

- introduce customer-specific or vendor-specific branding into the provider-neutral core without a reviewed reason;
- add “official”, “certified”, “partner” or endorsement claims without an authoritative basis;
- silently make Kairoseth-specific branding mandatory for forks/self-hosted deployments;
- add logo/brand assets whose rights and permitted repository use are unclear.

Changes to public names, default presentation identity, domains, package names or legacy branding-related configuration must classify compatibility/migration impact and follow the established release/deprecation policies.

## Permission and clarification

When a proposed use would make a third-party product/service look official, or requires use of Kairoseth/Kairoseth Travel as a primary brand, obtain explicit permission from the relevant project maintainer/rightsholder before publishing that use.

A lack of response is not permission for a restricted/ambiguous use.

## No effect on code rights

A request to correct confusing branding does not revoke or reduce rights already granted under the MIT License to use, modify or redistribute the licensed software. The practical remedy is to distinguish the independent product/service from the upstream/reference identity while continuing to comply with the software license.

## Phase completion rule

Phase 10.7 follows the permanent project gate: implementation, validation, synchronized EN/ES docs, diff review, required CI green, merge to `main`, and verification of `main` before the final Phase 10 release audit starts.
