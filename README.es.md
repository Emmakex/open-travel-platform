# Open Travel Platform

<p align="center"><a href="./README.md">English</a> · <strong>Español</strong></p>

> Base open-source reutilizable para agencias, turoperadores y productos de reserva de viajes.

Open Travel Platform es una plataforma clean-room con **Next.js + TypeScript + MongoDB**, organizada alrededor de fronteras explícitas de dominio, repositories y adapters. Soporta onboarding demo sin infraestructura, capacidades persistentes y despliegue self-host provider-neutral.

La implementación comercial/de referencia oficial es **Kairoseth Travel**, desplegada en **[travel.kairoseth.com](https://travel.kairoseth.com)**.

![Version](https://img.shields.io/badge/version-1.0.0-0d1b2d)
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
- sistemas downstream no reciben autoridad implícita sobre booking, inventario, pricing o pagos.

La licencia MIT del software y el branding/identidad del proyecto y despliegue de referencia son cuestiones separadas. Los forks y servicios alojados independientes conservan los derechos MIT sobre el código, pero deben usar su propia identidad principal y evitar insinuar endorsement oficial de Kairoseth/Open Travel Platform. Consulta [`TRADEMARKS.es.md`](TRADEMARKS.es.md).

## Posición actual

**Fase 8 — Integraciones externas: COMPLETADA.**  
**Fase 9 — Baseline de hardening productivo: COMPLETADA.**  
**Fase 10 — Productización open-source: EN CURSO.**

Slices completados:

- **10.1 Bootstrap demo/fresh-clone reproducible — COMPLETADA**
- **10.2 Despliegue standalone provider-neutral — COMPLETADA**
- **10.3 Contratos de extensión/adapters de referencia — COMPLETADA**
- **10.4 Convenciones de release y migraciones — COMPLETADA**
- **10.5 Política de lifecycle de upgrades y deprecaciones — COMPLETADA**
- **10.6 Plantillas de contribución y release — COMPLETADA**
- **10.7 Política de trademark/branding e identidad — COMPLETADA**

La Fase 10.5 establece rutas de upgrade soportadas y el lifecycle público `ACTIVE → DEPRECATED → REMOVED`, incluida retirada ordinaria solo en MAJOR y excepción explícita de seguridad. Documentos autoritativos: [`docs/RELEASES.es.md`](docs/RELEASES.es.md), [`docs/MIGRATIONS.es.md`](docs/MIGRATIONS.es.md), [`docs/UPGRADES.es.md`](docs/UPGRADES.es.md) y [`docs/DEPRECATIONS.es.md`](docs/DEPRECATIONS.es.md).

La Fase 10.6 añade una plantilla PR canónica, issue forms enriquecidos, una plantilla reutilizable de release notes y validación permanente mediante `npm run check:contribution-templates`. Consulta [`docs/CONTRIBUTION-TEMPLATES.es.md`](docs/CONTRIBUTION-TEMPLATES.es.md).

La Fase 10.7 establece la frontera de branding:

- la licencia MIT permanece intacta y gobierna los derechos del código;
- Open Travel Platform identifica el core upstream público;
- Kairoseth Travel identifica la implementación oficial alojada/comercial de referencia en `travel.kairoseth.com`;
- despliegues públicos/comerciales independientes deben usar su propia identidad principal y pueden indicar de forma veraz “Basado en Open Travel Platform” o “Powered by Open Travel Platform”;
- no se implica estatus registrado/oficial/certificado/partner/endorsed sin base autoritativa;
- `KTRAVEL_*` son identificadores técnicos legacy, no una concesión de branding;
- el gate permanente es `npm run check:branding-policy`.

Consulta [`TRADEMARKS.es.md`](TRADEMARKS.es.md) y [`TRADEMARKS.md`](TRADEMARKS.md).

La validación TEST/LIVE con credenciales Stripe/Redsys sigue siendo una dependencia externa separada.

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

Los despliegues públicos/comerciales independientes deben configurar `NEXT_PUBLIC_SITE_NAME` y la presentación con su propia identidad principal; el default demo/upstream sigue siendo Open Travel Platform. Consulta [`TRADEMARKS.es.md`](TRADEMARKS.es.md).

## Self-host standalone

```bash
npm ci
npm run setup:demo
npm run build
npm run package:standalone
node .next/standalone/server.js
```

Para producción consulta [`docs/DEPLOYMENT.es.md`](docs/DEPLOYMENT.es.md) y [`docs/PRODUCTION-CHECKLIST.md`](docs/PRODUCTION-CHECKLIST.md).

## Contrato de release, upgrade e identidad

Releases estables:

```text
package.json  -> X.Y.Z
Git tag       -> vX.Y.Z
CHANGELOG     -> ## [X.Y.Z] - YYYY-MM-DD
```

Un upgrade productivo identifica versiones/SHAs exactos origen/destino, revisa migraciones/deprecaciones, valida un entorno representativo y declara recuperación antes de cambios persistentes.

Lifecycle público:

```text
ACTIVE → DEPRECATED → REMOVED
```

La retirada ordinaria ocurre solo en/después del límite MAJOR anunciado. PATCH/MINOR no eliminan ni reinterpretan silenciosamente superficies públicas soportadas.

Validación:

```bash
npm ci
npm run check:release
npm run check:release-migrations
npm run check:upgrade-deprecations
npm run check:contribution-templates
npm run check:branding-policy
npm run verify
```

## Documentación

### Proyecto y entrega

- [`ROADMAP.es.md`](ROADMAP.es.md)
- [`ROADMAP.md`](ROADMAP.md)
- [`CHANGELOG.md`](CHANGELOG.md)
- [`CONTRIBUTING.md`](CONTRIBUTING.md)
- [`SUPPORT.md`](SUPPORT.md)
- [`TRADEMARKS.es.md`](TRADEMARKS.es.md)
- [`TRADEMARKS.md`](TRADEMARKS.md)
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
npm run verify
```

Workflows dedicados protegen contratos de extensión, releases/migraciones, lifecycle de upgrades/deprecaciones, plantillas de contribución/release y branding/identidad del proyecto en PR y `main`.

## Regla de cierre de fases

Una fase/slice no está completada hasta terminar implementación/pruebas, sincronizar documentación EN/ES, revisar diff, tener CI obligatorio verde, mergear a `main` y verificar `main` antes de iniciar el siguiente bloque.

La Fase 10.7 sigue la misma regla; la auditoría/release final de Fase 10 permanece separada hasta cerrar este slice.

## Licencia y branding

Código: MIT. Consulta [`LICENSE`](LICENSE). Identidad del proyecto/referencia: [`TRADEMARKS.es.md`](TRADEMARKS.es.md).
