# Branding and trademark policy

<p align="center"><strong>English</strong> · <a href="./TRADEMARKS.es.md">Español</a></p>

Status: **Phase 10.7 — COMPLETE**

## Purpose

Open Travel Platform is released under the MIT License. The MIT License grants broad rights to use, modify, distribute and sell copies of the **software**, but it does not by itself grant permission to present an independent product, service or fork as an official Kairoseth product.

This policy separates software licensing from project and commercial branding.

This document does **not** claim that any name or logo is registered in every jurisdiction. It defines the project's usage policy for its names, logos, wordmarks and related brand identity, whether registered or unregistered.

## Project and commercial identities

For this policy, the project marks include:

- **Open Travel Platform** — the public MIT-licensed provider-neutral core/project name;
- **Kairoseth** — the umbrella commercial/product brand;
- **Kairoseth Travel** — the official hosted/commercial reference implementation;
- associated logos, wordmarks, distinctive visual identities and official badges when published by the project/rights holder.

The official reference deployment is:

```text
https://travel.kairoseth.com
```

Only a deployment or distribution controlled or expressly authorized by the relevant rights holder may describe itself as **official Kairoseth Travel** or otherwise imply that it is the official hosted/reference service.

## MIT code rights vs brand rights

The MIT License in [`LICENSE`](LICENSE) continues to govern the repository software.

You may fork, modify, self-host, redistribute and commercially use the code subject to that license.

Those software rights do not automatically grant a separate right to:

- use Kairoseth or Kairoseth Travel as the primary name of an independent product/service;
- use official Kairoseth logos or wordmarks as if the service were operated by Kairoseth;
- claim sponsorship, certification, partnership or endorsement that has not been granted;
- use confusing branding/domain names that make a third-party deployment appear official.

Nothing in this policy changes the MIT copyright/license notice requirements.

## Uses that are generally acceptable without separate permission

Truthful, non-misleading descriptive use is generally acceptable, including:

- stating that software is **based on Open Travel Platform**;
- stating that an adapter, plugin or integration is **compatible with Open Travel Platform**;
- linking to the upstream repository and naming the project for attribution;
- identifying the upstream project in technical documentation, dependency metadata or migration notes;
- showing accurate screenshots of the upstream project in documentation, reviews or training material;
- using text such as **Built with Open Travel Platform** when it is clear that the resulting product/service is independently operated.

Such use must not imply official status, endorsement or commercial affiliation.

## Forks and modified distributions

A fork may retain upstream copyright/license notices and technical references required to explain its origin.

For a materially modified or independently hosted product/service:

- use a distinct primary product/service name;
- make independent operation clear to users;
- do not use **Kairoseth Travel** as the service name without authorization;
- do not add **Official**, **Kairoseth Official**, **Official Open Travel Platform Service** or similar wording that implies endorsement;
- do not present Kairoseth logos/visual identity as the fork's own identity without authorization.

A statement such as the following is acceptable when accurate:

> ExampleCo Travel is independently operated and is based on the Open Travel Platform open-source project. It is not an official Kairoseth Travel service.

## Hosted services and domains

Third parties may operate services using the MIT-licensed code.

Domain, application and company naming must not create a misleading impression of official status. For example, a third-party service should not deliberately choose a name/domain whose primary purpose is to appear to be `travel.kairoseth.com` or an official Kairoseth property.

Descriptive use in a page such as “Powered by Open Travel Platform” is different from using **Open Travel Platform** or **Kairoseth Travel** as the misleading primary commercial identity of an unrelated service.

## Kairoseth Travel designation

**Kairoseth Travel** identifies the official commercial/reference implementation maintained within the Kairoseth ecosystem.

The public core must remain able to operate without private Kairoseth adapters or infrastructure. Likewise, a third-party Open Travel Platform deployment does not become Kairoseth Travel merely by using the same open-source core.

The terms **official**, **official reference deployment** and equivalent wording are reserved for project/rights-holder controlled or expressly authorized deployments.

## Logos and visual assets

Unless an individual asset is accompanied by a separate license granting broader rights, project/Kairoseth logos, wordmarks and distinctive brand artwork are not licensed merely because the software source is MIT-licensed.

Do not copy or alter official logos for a third-party product in a way that implies sponsorship or official status without permission.

Ordinary screenshots, press/review references and factual documentation may display branding to identify the referenced product, provided the use is truthful and non-misleading.

## Plugins, adapters and integrations

Third-party extensions may use descriptive naming such as:

```text
Example CRM adapter for Open Travel Platform
Example Payments integration compatible with Open Travel Platform
```

Avoid names such as:

```text
Official Open Travel Platform Example CRM
Kairoseth Travel Official Payments
```

unless the project/rights holder has explicitly authorized that designation.

Provider-specific adapters may remain outside the public MIT core and may have their own vendor trademark requirements.

## No implied endorsement

Use of the software, contribution to the repository, compatibility with public contracts or appearance in community documentation does not by itself create:

- a partnership;
- an agency relationship;
- certification;
- endorsement;
- official-support status.

Any such relationship must be separately and explicitly granted.

## Attribution guidance

When practical, an independent product based substantially on this project should retain the MIT notices required by `LICENSE` and may include a factual attribution such as:

```text
Based on Open Travel Platform (MIT-licensed open-source software).
```

Attribution should not be styled in a way that makes Open Travel Platform or Kairoseth appear to be the operator of the third-party service.

## Permission requests

For use of Kairoseth/Kairoseth Travel branding beyond the descriptive uses above, obtain written permission from the relevant project/brand rights holder before publication or commercial launch.

A permission may define scope, duration, assets and quality/representation requirements and does not change the underlying MIT software license.

## Policy changes

Changes to this policy must not silently relicense repository code. Software licensing changes and branding/trademark policy changes are separate decisions and must be documented explicitly.

The project release and contribution process should review branding impact whenever public names, official-status wording, logos or reference-deployment claims change.

## Permanent validation

Phase 10.7 protects the separation between MIT code rights and project/commercial branding through:

```bash
npm run check:branding-policy
npm run verify
```

The gate verifies that this policy, README/ROADMAP/CONTRIBUTING, release/contribution templates and the official reference-deployment identity remain synchronized.

## Phase completion rule

Phase 10.7 follows the permanent project gate: implementation, validation, synchronized EN/ES documentation, diff review, green CI, merge to `main`, and verification of `main` before the final Phase 10 release audit begins.
