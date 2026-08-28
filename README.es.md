# Open Travel Platform

<p align="center"><a href="./README.md">English</a> · <strong>Español</strong></p>

> Base open-source reutilizable para agencias, turoperadores y productos de reserva de viajes.

Open Travel Platform es una plataforma clean-room con **Next.js + TypeScript + MongoDB**, organizada alrededor de fronteras explícitas de dominio, repositories y adapters. Soporta onboarding demo sin infraestructura, capacidades persistentes y despliegue self-host provider-neutral.

La implementación comercial/de referencia oficial es **Kairoseth Travel**, desplegada en **[travel.kairoseth.com](https://travel.kairoseth.com)**.

![Version](https://img.shields.io/badge/version-1.1.0-0d1b2d)
![Next.js](https://img.shields.io/badge/Next.js-16.3.2-000000)
![React](https://img.shields.io/badge/React-19.2.8-149eca)
![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178c6)
![Node](https://img.shields.io/badge/Node-24_LTS-5fa04e)
![MongoDB](https://img.shields.io/badge/MongoDB-supported-47A248)
![License](https://img.shields.io/badge/license-MIT-45d6b5)

## Modelo del proyecto

Este repositorio es el **core MIT provider-neutral**. Kairoseth Travel es la implementación alojada/comercial de referencia.

- datos de clientes e integraciones propietarias permanecen fuera del repositorio público;
- adapters privados Kairoseth/cliente pueden depender de contratos públicos OTP, nunca al revés;
- sistemas downstream no reciben autoridad implícita sobre booking, inventario, pricing o pagos;
- la licencia MIT del software no concede por sí sola permiso para presentar un fork/servicio independiente como Kairoseth Travel oficial.

El uso de branding y marcas se documenta en [`TRADEMARKS.es.md`](TRADEMARKS.es.md).

## Posición actual

**Fase 8 — Integraciones externas: COMPLETADA.**  
**Fase 9 — Baseline de hardening productivo: COMPLETADA.**  
**Fase 10 — Productización open-source: COMPLETADA.**

Cierre de Fase 10:

- **10.1 Bootstrap demo/fresh-clone reproducible — COMPLETADA**
- **10.2 Despliegue standalone provider-neutral — COMPLETADA**
- **10.3 Contratos de extensión/adapters de referencia — COMPLETADA**
- **10.4 Convenciones de release y migraciones — COMPLETADA**
- **10.5 Lifecycle de upgrades y deprecaciones — COMPLETADA**
- **10.6 Plantillas de contribución y release — COMPLETADA**
- **10.7 Política de branding y marcas — COMPLETADA**
- **10.8 Auditoría final de documentación/release y publicación v1.1.0 — COMPLETADA**

El cierre está documentado en [`docs/PHASE-10-RELEASE-AUDIT.es.md`](docs/PHASE-10-RELEASE-AUDIT.es.md). Las notas de v1.1.0 están en [`docs/RELEASE-NOTES-1.1.0.es.md`](docs/RELEASE-NOTES-1.1.0.es.md).

El repositorio registraba previamente package version 1.0.0 pero no tenía Git tag/GitHub Release histórico. No se fabrica un tag retroactivo; **v1.1.0 es el primer release publicado bajo la convención completada de Fase 10**.

La validación Stripe/Redsys TEST/LIVE con credenciales permanece como validación dependiente del proveedor. No reabre la Fase 9 ni bloquea el release provider-neutral v1.1.0.

## Capacidades principales

- catálogo y experiencia Operator EN/ES;
- destinos, viajes, itinerarios, salidas, inventario y alojamiento;
- reservas transaccionales y modificaciones post-reserva;
- identidad persistente cliente/staff, RBAC y auditoría;
- ledger provider-neutral, Stripe/Redsys, depósitos y conciliación;
- Traveller Data cifrado, privacidad/retención y rotación de claves;
- CSP/headers, readiness, concurrencia MongoDB, backup/restore e índices;
- accesibilidad WCAG 2.2 AA-oriented y baselines de rendimiento;
- outbox/integraciones, webhooks firmados, CRM/ERP downstream y fulfilment;
- nueve interfaces públicas de extensión verificadas.

## Inicio rápido

Requiere **Node.js 24 LTS** y la versión npm declarada en `packageManager`.

```bash
git clone https://github.com/Emmakex/open-travel-platform.git
cd open-travel-platform
npm ci
npm run setup:demo
npm run dev
```

El perfil demo no exige MongoDB, SMTP, PSP, CRM, ERP ni credenciales de proveedor.

## Self-host standalone

```bash
npm ci
npm run setup:demo
npm run build
npm run package:standalone
node .next/standalone/server.js
```

Para producción consulta [`docs/DEPLOYMENT.es.md`](docs/DEPLOYMENT.es.md) y [`docs/PRODUCTION-CHECKLIST.md`](docs/PRODUCTION-CHECKLIST.md).

## Contrato de release, upgrade y branding

```text
package.json  -> X.Y.Z
Git tag       -> vX.Y.Z
CHANGELOG     -> ## [X.Y.Z] - YYYY-MM-DD
```

Un upgrade productivo identifica versiones/SHAs exactos, revisa migraciones/deprecaciones, valida un entorno representativo y declara recuperación antes de cambios persistentes.

Lifecycle público:

```text
ACTIVE → DEPRECATED → REMOVED
```

La retirada ordinaria ocurre solo en/después del límite MAJOR anunciado.

Validación:

```bash
npm ci
npm run check:release
npm run check:release-migrations
npm run check:upgrade-deprecations
npm run check:contribution-templates
npm run check:branding-policy
npm run check:phase-10-release
npm run verify
```

El workflow final crea el tag inmutable únicamente después de que la auditoría dedicada termine correctamente sobre `main` ya mergeado.

Consulta [`docs/RELEASES.es.md`](docs/RELEASES.es.md), [`docs/MIGRATIONS.es.md`](docs/MIGRATIONS.es.md), [`docs/UPGRADES.es.md`](docs/UPGRADES.es.md), [`docs/DEPRECATIONS.es.md`](docs/DEPRECATIONS.es.md), [`docs/CONTRIBUTION-TEMPLATES.es.md`](docs/CONTRIBUTION-TEMPLATES.es.md), [`TRADEMARKS.es.md`](TRADEMARKS.es.md) y [`docs/PHASE-10-RELEASE-AUDIT.es.md`](docs/PHASE-10-RELEASE-AUDIT.es.md).

## Documentación

### Proyecto y entrega

- [`ROADMAP.es.md`](ROADMAP.es.md)
- [`ROADMAP.md`](ROADMAP.md)
- [`CHANGELOG.md`](CHANGELOG.md)
- [`CONTRIBUTING.md`](CONTRIBUTING.md)
- [`SUPPORT.md`](SUPPORT.md)
- [`TRADEMARKS.es.md`](TRADEMARKS.es.md)
- [`TRADEMARKS.md`](TRADEMARKS.md)
- [`docs/PHASE-10-RELEASE-AUDIT.es.md`](docs/PHASE-10-RELEASE-AUDIT.es.md)
- [`docs/RELEASE-NOTES-1.1.0.es.md`](docs/RELEASE-NOTES-1.1.0.es.md)
- [`docs/RELEASES.es.md`](docs/RELEASES.es.md)
- [`docs/MIGRATIONS.es.md`](docs/MIGRATIONS.es.md)
- [`docs/UPGRADES.es.md`](docs/UPGRADES.es.md)
- [`docs/DEPRECATIONS.es.md`](docs/DEPRECATIONS.es.md)
- [`docs/CONTRIBUTION-TEMPLATES.es.md`](docs/CONTRIBUTION-TEMPLATES.es.md)
- [`docs/DEPLOYMENT.es.md`](docs/DEPLOYMENT.es.md)

### Extensiones

- [`docs/EXTENSION-POINT-INVENTORY.es.md`](docs/EXTENSION-POINT-INVENTORY.es.md)
- [`docs/EXTENSION-COMPATIBILITY.es.md`](docs/EXTENSION-COMPATIBILITY.es.md)
- [`docs/REFERENCE-ADAPTERS.es.md`](docs/REFERENCE-ADAPTERS.es.md)
- [`docs/EXTENSION-VALIDATION.es.md`](docs/EXTENSION-VALIDATION.es.md)
- [`docs/EXTENSION-CONTRACTS.es.md`](docs/EXTENSION-CONTRACTS.es.md)
- [`docs/ADAPTER-GUIDE.md`](docs/ADAPTER-GUIDE.md)

## Validación permanente

```bash
npm run check:extension-contracts
npm run check:release-migrations
npm run check:upgrade-deprecations
npm run check:contribution-templates
npm run check:branding-policy
npm run check:phase-10-release
npm run verify
```

Workflows dedicados protegen contratos de extensión, release/migraciones, lifecycle de upgrades/deprecaciones, plantillas, branding y la identidad final de release.

## Regla de cierre de fases

Una fase/slice no está completada hasta terminar implementación/pruebas, sincronizar documentación EN/ES, revisar diff, tener CI obligatorio verde, mergear a `main` y verificar `main` antes de iniciar trabajo posterior del roadmap.

La Fase 10 queda cerrada mediante el release auditado v1.1.0. Adapters opcionales y evolución comercial Kairoseth pasan a ser trabajo posterior salvo que se incorporen explícitamente a una nueva fase del core.

## Licencia y branding

Software: MIT. Consulta [`LICENSE`](LICENSE).

Los nombres del proyecto/comerciales y la identidad visual se regulan separadamente en [`TRADEMARKS.es.md`](TRADEMARKS.es.md). La política de branding no relicencia silenciosamente el software.
