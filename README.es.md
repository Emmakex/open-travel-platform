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

## Posición actual

**Fase 8 — Integraciones externas: COMPLETADA.**  
**Fase 9 — Baseline de hardening productivo: COMPLETADA.**  
**Fase 10 — Productización open-source: EN CURSO.**

Slices completados de Fase 10:

- **10.1 Bootstrap demo/fresh-clone reproducible — COMPLETADA**
- **10.2 Despliegue standalone provider-neutral — COMPLETADA**
- **10.3 Contratos de extensión y adapters de referencia — COMPLETADA**
- **10.4 Convenciones de releases y migraciones — COMPLETADA**

La Fase 10.4 establece:

- Semantic Versioning para releases públicos estables;
- tags Git inmutables `vX.Y.Z`;
- identidad de release alineada entre `package.json`, badge README y CHANGELOG;
- releases cortados únicamente desde `main` verificado;
- clasificación explícita de migraciones y requisitos de rollback/recuperación;
- patrón **expand → migrate → contract** para evolución compatible de datos persistentes;
- prohibición de migraciones destructivas ocultas durante startup;
- gate permanente `npm run check:release-migrations`.

Documentación autoritativa de Fase 10.4:

- [`docs/RELEASES.md`](docs/RELEASES.md)
- [`docs/RELEASES.es.md`](docs/RELEASES.es.md)
- [`docs/MIGRATIONS.md`](docs/MIGRATIONS.md)
- [`docs/MIGRATIONS.es.md`](docs/MIGRATIONS.es.md)

La validación TEST/LIVE con credenciales Stripe/Redsys sigue siendo una dependencia externa separada hasta disponer de cuentas proveedor adecuadas.

## Capacidades principales

### Catálogo y comercio

- catálogo y experiencia Operator EN/ES;
- destinos, viajes, itinerarios, salidas e inventario;
- alojamiento/habitaciones y pricing estacional/ocupación;
- Actividades, Transporte y Protección de viaje;
- reservas transaccionales con pricing/inventario server-authoritative;
- viajeros/menores/tutores y snapshots históricos;
- suplementos y modificaciones post-reserva.

### Identidad y operaciones

- autenticación persistente cliente/staff;
- sesiones separadas;
- RBAC y capacidades Operator/Admin;
- ownership, notas, prioridad, tags y timeline;
- tareas/seguimientos y fulfilment;
- colas/filtros avanzados;
- auditoría privilegiada cuando corresponde.

### Pagos y finanzas

- ledger provider-neutral de pagos/reembolsos;
- transferencia, efectivo y terminal externo;
- integraciones checkout Stripe/Redsys;
- depósitos/cuotas/saldo pendiente;
- conciliación/reporting;
- ERP/contabilidad downstream-only.

### Traveller Data y hardening

- Traveller Data cifrado y rotación de claves;
- workflows de privacidad y retención;
- baseline de accesibilidad orientado a WCAG 2.2 AA;
- CSP/headers, Origin y throttling;
- liveness/readiness y perfiles `demo|live`;
- concurrencia/idempotencia MongoDB, backup/restore e índices;
- baselines de rendimiento/recursos.

### Integraciones y extensiones

- outbox MongoDB transaccional;
- webhooks HTTPS firmados con retry/dead-letter;
- `BookingRepository` REST, fulfilment, CRM/ERP downstream y failure transport;
- nueve interfaces públicas verificadas;
- payloads provider contenidos dentro de adapters;
- gate permanente `check:extension-contracts`.

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

Para producción consulta [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) y [`docs/PRODUCTION-CHECKLIST.md`](docs/PRODUCTION-CHECKLIST.md).

## Contrato de release y migración

Releases estables:

```text
package.json  -> X.Y.Z
Git tag       -> vX.Y.Z
CHANGELOG     -> ## [X.Y.Z] - YYYY-MM-DD
```

Antes de un release:

```bash
npm ci
npm run check:release
npm run check:release-migrations
npm run verify
```

Cambios de configuración, datos persistentes o contratos wire deben clasificarse y documentarse con verificación y rollback/recuperación. El startup de la aplicación no puede ejecutar migraciones destructivas ocultas.

Consulta [`docs/RELEASES.es.md`](docs/RELEASES.es.md) y [`docs/MIGRATIONS.es.md`](docs/MIGRATIONS.es.md).

## Documentación

### Proyecto y entrega

- [`ROADMAP.es.md`](ROADMAP.es.md)
- [`ROADMAP.md`](ROADMAP.md)
- [`CHANGELOG.md`](CHANGELOG.md)
- [`CONTRIBUTING.md`](CONTRIBUTING.md)
- [`docs/RELEASES.es.md`](docs/RELEASES.es.md)
- [`docs/MIGRATIONS.es.md`](docs/MIGRATIONS.es.md)
- [`docs/DEPLOYMENT.es.md`](docs/DEPLOYMENT.es.md)

### Extensiones

- [`docs/EXTENSION-POINT-INVENTORY.es.md`](docs/EXTENSION-POINT-INVENTORY.es.md)
- [`docs/EXTENSION-COMPATIBILITY.es.md`](docs/EXTENSION-COMPATIBILITY.es.md)
- [`docs/REFERENCE-ADAPTERS.es.md`](docs/REFERENCE-ADAPTERS.es.md)
- [`docs/EXTENSION-VALIDATION.es.md`](docs/EXTENSION-VALIDATION.es.md)
- [`docs/EXTENSION-CONTRACTS.es.md`](docs/EXTENSION-CONTRACTS.es.md)
- [`docs/ADAPTER-GUIDE.md`](docs/ADAPTER-GUIDE.md)

## Validación permanente

Gates de proyecto relevantes:

```bash
npm run check:extension-contracts
npm run check:release-migrations
npm run verify
```

Workflows dedicados protegen contratos de extensión y convenciones de release/migración tanto en PR como en `main`.

## Regla de cierre de fases

Una fase/slice no está completada hasta que implementación y pruebas terminen, documentación EN/ES/README/ROADMAP/CHANGELOG esté sincronizada, el alcance del PR sea revisado, CI obligatorio esté verde, el PR esté mergeado a `main` y `main` sea verificado antes de iniciar la siguiente fase.

La Fase 10.4 sigue esta regla; cualquier bloque posterior permanece separado hasta iniciarse explícitamente.

## Licencia

MIT. Consulta [`LICENSE`](LICENSE).
