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
**Fase 10.3 — Contratos de extensión y adapters de referencia: COMPLETADA.**

Estado de Fase 10.3:

- **10.3.1 Inventario y mapa de autoridad — COMPLETADA**
- **10.3.2 Compatibilidad/versionado — COMPLETADA**
- **10.3.3 Adapters de referencia — COMPLETADA**
- **10.3.4 Validación permanente de contratos — COMPLETADA**

El modelo de extensiones completado en Fase 10.3 queda protegido por un gate arquitectónico permanente:

```bash
npm run check:extension-contracts
```

Forma parte de `npm run verify` y dispone de un workflow bloqueante dedicado que además ejecuta la suite contractual HTTP real.

Documentación de Fase 10.3:

- [`docs/EXTENSION-POINT-INVENTORY.es.md`](docs/EXTENSION-POINT-INVENTORY.es.md)
- [`docs/EXTENSION-COMPATIBILITY.es.md`](docs/EXTENSION-COMPATIBILITY.es.md)
- [`docs/REFERENCE-ADAPTERS.es.md`](docs/REFERENCE-ADAPTERS.es.md)
- [`docs/EXTENSION-VALIDATION.es.md`](docs/EXTENSION-VALIDATION.es.md)
- [`docs/EXTENSION-CONTRACTS.es.md`](docs/EXTENSION-CONTRACTS.es.md)

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

### Integraciones

- outbox MongoDB transaccional;
- webhooks HTTPS firmados con retry/dead-letter;
- worker durable;
- `BookingRepository` REST;
- fulfilment REST;
- CRM y ERP downstream;
- failure transport provider-neutral;
- protección SSRF/DNS rebinding y transporte acotado.

## Arquitectura de extensiones

```text
TravelRepository + IdentityRepository
        |
BookingRepository (demo / MongoDB / REST v1)
        |
reservas + inventario transaccional
        |
PaymentRepository -> ledger local provider-neutral -> PSP/manual
        |
outbox transaccional
        |
        +--> webhooks firmados
        +--> CRM REST (downstream-only)
        +--> ERP/contabilidad REST (downstream-only)

OperationsRepository
        |
SupplierFulfilmentAdapter -> audit-before-apply -> workflow local

Fallos operativos -> FailureTransport opcional
```

Los payloads provider permanecen dentro de adapters y la autoridad del core sigue explícita.

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

## Modelo público de extensiones

Interfaces de primer nivel verificadas:

- `TravelRepository`
- `IdentityRepository`
- `BookingRepository`
- `OperationsRepository`
- `PaymentRepository`
- `SupplierFulfilmentAdapter`
- `CrmSyncAdapter`
- `ErpAccountingAdapter`
- `FailureTransport`

Referencias oficiales:

- `RestBookingRepository` — autoridad acotada de repository;
- `RestSupplierFulfilmentAdapter` + `performSupplierAdapterOperation()` — subordinado a workflow y audit-before-apply;
- `RestCrmSyncAdapter` — downstream-only;
- `RestFailureTransport` — patrón opcional de monitorización.

## Validación permanente

`check:extension-contracts` protege:

- inventario público exacto;
- pureza provider-neutral de interfaces;
- autoridad downstream-only de CRM/ERP;
- audit-before-apply y límites de Supplier;
- neutralidad provider de `PaymentRepository`;
- identificadores v1 documentados de headers/schemas/firma;
- protecciones de transporte de adapters de referencia;
- consistencia de documentación EN/ES.

Ejecuta localmente:

```bash
npm run check:extension-contracts
npm run verify
```

CI dedicado: `.github/workflows/extension-contracts.yml`.

Consulta [`docs/EXTENSION-VALIDATION.es.md`](docs/EXTENSION-VALIDATION.es.md).

## Documentación

### Proyecto

- [`ROADMAP.es.md`](ROADMAP.es.md)
- [`ROADMAP.md`](ROADMAP.md)
- [`CHANGELOG.md`](CHANGELOG.md)
- [`CONTRIBUTING.md`](CONTRIBUTING.md)

### Extensiones

- [`docs/EXTENSION-POINT-INVENTORY.es.md`](docs/EXTENSION-POINT-INVENTORY.es.md)
- [`docs/EXTENSION-COMPATIBILITY.es.md`](docs/EXTENSION-COMPATIBILITY.es.md)
- [`docs/REFERENCE-ADAPTERS.es.md`](docs/REFERENCE-ADAPTERS.es.md)
- [`docs/EXTENSION-VALIDATION.es.md`](docs/EXTENSION-VALIDATION.es.md)
- [`docs/EXTENSION-CONTRACTS.es.md`](docs/EXTENSION-CONTRACTS.es.md)
- [`docs/ADAPTER-GUIDE.md`](docs/ADAPTER-GUIDE.md)

## Regla de cierre de fases

Una fase/slice no está completada hasta que implementación y pruebas terminen, documentación EN/ES/README/ROADMAP/CHANGELOG esté sincronizada, el alcance del PR sea revisado, CI obligatorio esté verde, el PR esté mergeado a `main` y `main` sea verificado antes de iniciar la siguiente fase.

La Fase 10.3 cumple esta regla. Cualquier trabajo posterior de Fase 10 debe respetar el mismo gate antes de volver a avanzar.

## Licencia

MIT. Consulta [`LICENSE`](LICENSE).
