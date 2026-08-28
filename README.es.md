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

- datos de clientes, credenciales productivas e integraciones propietarias permanecen fuera del repositorio público;
- adapters privados Kairoseth/cliente pueden depender de contratos públicos OTP, nunca al revés;
- sistemas downstream no reciben autoridad implícita de booking, inventario, pricing o pagos.

## Posición actual

**Fase 8 — Integraciones externas: COMPLETADA.**  
**Fase 9 — Baseline de hardening productivo: COMPLETADA.**  
**Fase 10 — Productización open-source: EN CURSO.**

Estado de la Fase 10 después de este merge:

- **10.1 Bootstrap demo reproducible — COMPLETADA**
- **10.2 Despliegue self-host standalone — COMPLETADA**
- **10.3 Contratos de extensión y adapters de referencia — ACTIVA**
  - **10.3.1 Inventario y mapa de autoridad — COMPLETADA**
  - **10.3.2 Compatibilidad/versionado — COMPLETADA**
  - **10.3.3 Adapters de referencia para contribuidores — COMPLETADA**
  - **10.3.4 Validación permanente de contratos — ACTIVA**

La Fase 10.3 ya dispone de inventario respaldado por código, política formal de compatibilidad/versionado y referencias para contribuidores basadas en adapters reales y probados. Consulta:

- [`docs/EXTENSION-POINT-INVENTORY.es.md`](docs/EXTENSION-POINT-INVENTORY.es.md)
- [`docs/EXTENSION-COMPATIBILITY.es.md`](docs/EXTENSION-COMPATIBILITY.es.md)
- [`docs/REFERENCE-ADAPTERS.es.md`](docs/REFERENCE-ADAPTERS.es.md)
- [`docs/EXTENSION-CONTRACTS.es.md`](docs/EXTENSION-CONTRACTS.es.md)

La validación E2E TEST/LIVE con credenciales Stripe/Redsys sigue siendo una dependencia externa separada hasta disponer de cuentas proveedor adecuadas.

## Capacidades principales

### Catálogo y comercio

- catálogo/Operator bilingüe EN/ES;
- destinos, viajes, itinerarios, salidas e inventario;
- alojamiento/habitaciones y pricing estacional/ocupación;
- Actividades, Transporte y Protección de viaje;
- reservas transaccionales con pricing/inventario server-authoritative;
- viajeros, menores, bandas de edad, tutores y snapshots históricos;
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
- conciliación/reporting de ingresos;
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

- outbox transaccional MongoDB;
- webhooks HTTPS firmados con retry/dead-letter;
- worker durable;
- `BookingRepository` REST;
- fulfilment REST;
- CRM y ERP downstream;
- failure transport provider-neutral;
- protección SSRF/DNS rebinding y transportes acotados.

## Arquitectura

```text
Catálogo público / área cliente
        |
TravelRepository + IdentityRepository
        |
BookingRepository (demo / MongoDB / REST v1)
        |
reservas + inventario transaccional
        |
PaymentRepository -> ledger local provider-neutral -> PSP/manual
        |
outbox transaccional de integraciones
        |
        +--> webhooks firmados
        +--> CRM REST (downstream-only)
        +--> ERP/contabilidad REST (downstream-only)

Operator/Admin
        |
OperationsRepository + auditoría/tareas/documentos/reporting
        |
SupplierFulfilmentAdapter -> audit-before-apply -> workflow local

Fallos operativos
        |
logs estructurados -> FailureTransport opcional
```

Los payloads específicos de proveedor permanecen dentro de adapters y la autoridad del core sigue explícita.

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

Para producción real usa secretos solo runtime y el perfil `live`. Consulta [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) y [`docs/PRODUCTION-CHECKLIST.md`](docs/PRODUCTION-CHECKLIST.md).

## Modelo de extensiones

### Interfaces públicas verificadas

- `TravelRepository`
- `IdentityRepository`
- `BookingRepository`
- `OperationsRepository`
- `PaymentRepository`
- `SupplierFulfilmentAdapter`
- `CrmSyncAdapter`
- `ErpAccountingAdapter`
- `FailureTransport`

Los webhooks firmados genéricos son una superficie downstream separada.

### Referencias oficiales — 10.3.3 COMPLETADA

- `RestBookingRepository` — autoridad acotada de repository;
- `RestSupplierFulfilmentAdapter` + `performSupplierAdapterOperation()` — subordinado a workflow y audit-before-apply;
- `RestCrmSyncAdapter` — downstream-only;
- `RestFailureTransport` — patrón opcional de monitorización.

Las implementaciones existentes ya están cubiertas por la suite contractual HTTP local cuando aplica. La guía incluye patrón de copia, ejemplo v1→v2 y frontera de adapters propietarios.

Consulta [`docs/REFERENCE-ADAPTERS.es.md`](docs/REFERENCE-ADAPTERS.es.md).

## Documentación

### Proyecto

- [`ROADMAP.es.md`](ROADMAP.es.md)
- [`ROADMAP.md`](ROADMAP.md)
- [`CHANGELOG.md`](CHANGELOG.md)
- [`CONTRIBUTING.md`](CONTRIBUTING.md)

### Fase 10.3

- [`docs/EXTENSION-POINT-INVENTORY.es.md`](docs/EXTENSION-POINT-INVENTORY.es.md)
- [`docs/EXTENSION-COMPATIBILITY.es.md`](docs/EXTENSION-COMPATIBILITY.es.md)
- [`docs/REFERENCE-ADAPTERS.es.md`](docs/REFERENCE-ADAPTERS.es.md)
- [`docs/EXTENSION-CONTRACTS.es.md`](docs/EXTENSION-CONTRACTS.es.md)
- [`docs/ADAPTER-GUIDE.md`](docs/ADAPTER-GUIDE.md)

### Contratos de integración

- [`docs/REST-BOOKING-ADAPTER.es.md`](docs/REST-BOOKING-ADAPTER.es.md)
- [`docs/SUPPLIER-FULFILMENT-ADAPTER.es.md`](docs/SUPPLIER-FULFILMENT-ADAPTER.es.md)
- [`docs/CRM-SYNC-ADAPTER.es.md`](docs/CRM-SYNC-ADAPTER.es.md)
- [`docs/ERP-ACCOUNTING-ADAPTER.es.md`](docs/ERP-ACCOUNTING-ADAPTER.es.md)
- [`docs/OUTBOUND-INTEGRATIONS.es.md`](docs/OUTBOUND-INTEGRATIONS.es.md)
- [`docs/FAILURE-TRANSPORT.es.md`](docs/FAILURE-TRANSPORT.es.md)

## Quality gates

Ejecuta:

```bash
npm run verify
```

CI también prueba replica sets MongoDB reales, contratos HTTP locales, privacidad, accesibilidad, recovery y baselines de rendimiento/recursos.

## Regla de cierre de fases

Una fase/slice no está completada hasta que:

1. implementación/alcance estén terminados;
2. validaciones estén completas;
3. documentación EN/ES, README, ROADMAP y CHANGELOG estén sincronizados;
4. el diff del PR coincida con el alcance;
5. CI obligatorio esté verde;
6. el PR esté mergeado a `main`;
7. `main` se verifique antes de iniciar la siguiente fase.

## Prioridad activa — Fase 10.3.4

Después del merge de cierre de 10.3.3, el único slice activo será **10.3.4 — validación permanente de contratos de extensión**.

Debe añadir un gate estático/runtime permanente que proteja presencia de interfaces/referencias, consistencia de versiones/documentación, aislamiento de payloads provider, límites de autoridad downstream, audit-before-apply de proveedor y seguridad de adapters de referencia, registrándolo en `npm run verify`/CI.

La rama de cierre 10.3.3 no incluye implementación de 10.3.4.

## Licencia

MIT. Consulta [`LICENSE`](LICENSE).
