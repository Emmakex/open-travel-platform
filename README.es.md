# Open Travel Platform

<p align="center"><a href="./README.md">English</a> · <strong>Español</strong></p>

> Base open-source reutilizable para agencias, turoperadores y productos de reserva de viajes.

Open Travel Platform es una plataforma clean-room construida con **Next.js + TypeScript + MongoDB** y organizada alrededor de límites explícitos de dominio, repositorios y adapters. Soporta un perfil demo seguro sin infraestructura externa, capacidades persistentes de producción y despliegue self-host neutral respecto a proveedores.

La implementación comercial/de referencia oficial es **Kairoseth Travel**, desplegada en **[travel.kairoseth.com](https://travel.kairoseth.com)**.

![Version](https://img.shields.io/badge/version-1.0.0-0d1b2d)
![Next.js](https://img.shields.io/badge/Next.js-16.3.2-000000)
![React](https://img.shields.io/badge/React-19.2.8-149eca)
![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178c6)
![Node](https://img.shields.io/badge/Node-24_LTS-5fa04e)
![MongoDB](https://img.shields.io/badge/MongoDB-supported-47A248)
![License](https://img.shields.io/badge/license-MIT-45d6b5)
[![Live reference](https://img.shields.io/badge/live-travel.kairoseth.com-45d6b5)](https://travel.kairoseth.com)

## Modelo del proyecto

Este repositorio es el **core open-source bajo licencia MIT**. Kairoseth Travel es la implementación alojada/comercial oficial construida encima.

La separación es intencional:

- Open Travel Platform sigue siendo reutilizable, provider-neutral y self-hostable;
- Kairoseth Travel puede añadir hosting gestionado, soporte, servicios comerciales e integraciones privadas;
- datos de clientes, credenciales productivas e integraciones propietarias permanecen fuera del repositorio público;
- los sistemas downstream nunca reciben autoridad implícita sobre reservas, inventario o pagos del core.

## Posición actual

El MVP original de catálogo/reservas ha evolucionado a una plataforma amplia de operaciones turísticas. El baseline de ingeniería de endurecimiento productivo está completado y la productización open-source está en marcha.

**Fase 8 — Integraciones externas: COMPLETADA.**  
**Fase 9 — Baseline de ingeniería de endurecimiento productivo: COMPLETADA.**  
**Fase 10 — Productización open-source: EN CURSO.**

Estado de la Fase 10:

- **10.1 Bootstrap demo reproducible desde clon limpio — COMPLETADO**
- **10.2 Despliegue self-host standalone provider-neutral — COMPLETADO**
- **10.3 Contratos de extensión y adapters de referencia — ACTIVA**

La Fase 10.3 activa formaliza puntos públicos de extensión, compatibilidad/versionado de contratos y adapters de referencia para contribuidores sin debilitar la autoridad local de dominio. Consulta [`docs/EXTENSION-CONTRACTS.es.md`](docs/EXTENSION-CONTRACTS.es.md).

El E2E TEST/LIVE de Stripe/Redsys con credenciales sigue siendo una validación de release dependiente de proveedores y debe completarse cuando existan cuentas adecuadas.

## Capacidades actuales

### Catálogo y comercio

- catálogo público y experiencia Operator bilingües EN/ES;
- destinos, viajes, itinerarios estructurados, salidas e inventario vivo;
- alojamientos, habitaciones, pricing estacional/ocupación y galerías;
- productos independientes de Actividades, Transporte y Protección de viaje;
- reservas transaccionales de viajes/servicios con pricing e inventario autoritativos en servidor;
- viajeros, menores, bandas de edad, tutores y snapshots históricos de pricing;
- suplementos opcionales y modificaciones post-reserva.

### Identidad y operaciones

- autenticación persistente de cliente y personal;
- sesiones cliente/personal separadas;
- RBAC y capacidades granulares Operator/Admin;
- responsable de reserva, notas, prioridad, tags y timeline operativo;
- tareas/seguimientos y workflows de fulfilment de proveedor;
- colas operativas, filtros, orden y paginación;
- cambios privilegiados unidos a auditoría persistente cuando corresponde.

### Pagos y finanzas

- ledger provider-neutral de pago/reembolso independiente del estado de reserva;
- transferencia, efectivo y terminal externo;
- adapters Stripe y Redsys detrás de checkout unificado;
- depósitos, cuotas, saldo pendiente y próximo pago;
- conciliación e ingresos agrupados de forma segura por moneda;
- sincronización downstream ERP/contabilidad solo de movimientos finalizados.

### Traveller Data, privacidad y accesibilidad

- Traveller Data post-compra cifrado con rotación escalonada de claves;
- solicitudes autenticadas de derechos de privacidad y revisión Admin;
- exports aprobados de acceso/portabilidad;
- limitación y supresión controladas con revisión de retención;
- registro explícito de políticas de retención y holds;
- baseline técnico de accesibilidad orientado a WCAG 2.2 AA en journeys críticos de cliente y Operator;
- workflows Chromium dedicados y bloqueantes.

### Documentos y reporting

- PDFs de confirmación de reserva;
- manifiestos de viajeros y rooming lists;
- vouchers seguros para cliente;
- expediente interno Operator;
- exportaciones CSV/XLSX según permisos;
- conciliación, saldos e ingresos;
- exportación auditada de datos protegidos para uso operativo legítimo.

### Integraciones y adapters

- outbox transaccional MongoDB;
- webhooks HTTPS firmados con secretos cifrados, retries y dead-letter;
- worker durable server-only con locking, replay y retención;
- adapter REST genérico de `BookingRepository`;
- adapter provider-neutral de fulfilment;
- adapter CRM exclusivamente downstream;
- adapter ERP/contabilidad exclusivamente downstream;
- logs operativos estructurados y transporte opcional provider-neutral de fallos;
- protecciones SSRF/DNS rebinding y transportes externos acotados.

### Endurecimiento productivo

- CSP global y headers HTTP defensivos;
- throttling persistente de autenticación y validación explícita de Origin;
- endpoints liveness/readiness y perfiles `demo|live`;
- validación real MongoDB de concurrencia, idempotencia y modificaciones;
- contratos de adapters probados sobre HTTP local real;
- drills de backup/restore y disaster recovery MongoDB;
- validación real de índices y planes de consulta;
- baselines repetibles de lecturas públicas/autenticadas, throughput de mutaciones y recursos runtime.

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
PaymentRepository -> ledger provider-neutral -> Stripe / Redsys / manual
        |                                      |
        |                              movimientos succeeded
        |                                      |
eventos cliente/reserva                       |
        |                                      |
        +------------ outbox transaccional de integraciones ------------+
                                |
                         worker durable
                    /             |              \
             webhooks firmados  CRM REST      ERP/contabilidad REST

Fallos operativos
        |
logs JSON estructurados -> FailureTransport opcional -> monitorización

Operator/Admin
    |
Operations / RBAC / auditoría / documentos / informes / tareas
    |
SupplierFulfilmentAdapter -> disabled / REST v1
```

Los payloads específicos de proveedores permanecen dentro de adapters. Las reglas del core siguen siendo autoritativas en servidor.

## Inicio rápido

Requiere **Node.js 24 LTS** y la versión npm declarada en `packageManager`.

```bash
git clone https://github.com/Emmakex/open-travel-platform.git
cd open-travel-platform
npm ci
npm run setup:demo
npm run dev
```

Abre `http://localhost:3000`.

El bootstrap demo no exige infraestructura: MongoDB, SMTP, PSP, CRM, ERP y credenciales de proveedor no son necesarios para evaluación. `setup:demo` es no destructivo y rechaza sobrescribir `.env.local` salvo que se fuerce explícitamente.

## Self-host standalone

El proyecto usa `output: standalone` de Next.js como runtime productivo provider-neutral.

```bash
npm ci
npm run setup:demo
npm run build
npm run package:standalone
node .next/standalone/server.js
```

Para producción real usa secretos solo en runtime y el perfil de readiness `live`. Revisa [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) y el checklist productivo antes de exponer el servicio públicamente.

## Configuración

La plantilla productiva completa vive en [`.env.example`](.env.example). La plantilla de evaluación sin infraestructura vive en [`.env.demo.example`](.env.demo.example).

Reglas importantes:

- `KTRAVEL_DEPLOYMENT_PROFILE=live` es un contrato fail-closed de readiness;
- los destinos REST productivos deben usar HTTPS;
- credenciales de proveedores, worker tokens y claves de cifrado son server-only;
- nunca coloques secretos en variables `NEXT_PUBLIC_*`;
- las claves productivas deben ser estables, de alta entropía y seguir el procedimiento documentado de rotación/recovery;
- adapters exclusivos de Kairoseth/cliente deben permanecer fuera del core MIT cuando corresponda.

## Documentación

### Proyecto y onboarding

- [`ROADMAP.es.md`](ROADMAP.es.md) — estado y prioridades.
- [`ROADMAP.md`](ROADMAP.md) — roadmap en inglés.
- [`CHANGELOG.md`](CHANGELOG.md) — cambios relevantes.
- [`CONTRIBUTING.md`](CONTRIBUTING.md) — reglas de contribución.
- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) — modelo de despliegue provider-neutral.
- [`docs/PRODUCTION-CHECKLIST.md`](docs/PRODUCTION-CHECKLIST.md) — revisión productiva.

### Fase 10.3 activa

- [`docs/EXTENSION-CONTRACTS.es.md`](docs/EXTENSION-CONTRACTS.es.md) — autoridad, compatibilidad/versionado y contrato de cierre de 10.3.
- [`docs/EXTENSION-CONTRACTS.md`](docs/EXTENSION-CONTRACTS.md) — versión inglesa.
- [`docs/ADAPTER-GUIDE.md`](docs/ADAPTER-GUIDE.md) — implementación de adapters.
- [`docs/API-CONTRACT.md`](docs/API-CONTRACT.md) — contrato HTTP público de catálogo.

### Dominios y operaciones

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- [`docs/BOOKING.md`](docs/BOOKING.md)
- [`docs/PAYMENTS.md`](docs/PAYMENTS.md)
- [`docs/TRAVELLER-DATA.md`](docs/TRAVELLER-DATA.md)
- [`docs/ACCOMMODATION.md`](docs/ACCOMMODATION.md)
- [`docs/OPERATIONS.md`](docs/OPERATIONS.md)
- [`docs/REPORTING-EXPORTS.es.md`](docs/REPORTING-EXPORTS.es.md)

### Contratos de integración

- [`docs/REST-BOOKING-ADAPTER.es.md`](docs/REST-BOOKING-ADAPTER.es.md)
- [`docs/SUPPLIER-FULFILMENT-ADAPTER.es.md`](docs/SUPPLIER-FULFILMENT-ADAPTER.es.md)
- [`docs/CRM-SYNC-ADAPTER.es.md`](docs/CRM-SYNC-ADAPTER.es.md)
- [`docs/ERP-ACCOUNTING-ADAPTER.es.md`](docs/ERP-ACCOUNTING-ADAPTER.es.md)
- [`docs/OUTBOUND-INTEGRATIONS.es.md`](docs/OUTBOUND-INTEGRATIONS.es.md)
- [`docs/INTEGRATION-OPERATIONS.es.md`](docs/INTEGRATION-OPERATIONS.es.md)

### Ingeniería productiva

- [`docs/PRODUCTION-SECURITY.es.md`](docs/PRODUCTION-SECURITY.es.md)
- [`docs/OBSERVABILITY.es.md`](docs/OBSERVABILITY.es.md)
- [`docs/FAILURE-TRANSPORT.es.md`](docs/FAILURE-TRANSPORT.es.md)
- [`docs/ACCESSIBILITY-OPERATOR.es.md`](docs/ACCESSIBILITY-OPERATOR.es.md)
- [`docs/PERFORMANCE-LOAD-READINESS.es.md`](docs/PERFORMANCE-LOAD-READINESS.es.md)
- [`docs/PERFORMANCE-MUTATION-THROUGHPUT.es.md`](docs/PERFORMANCE-MUTATION-THROUGHPUT.es.md)
- [`docs/PERFORMANCE-RUNTIME-RESOURCE.es.md`](docs/PERFORMANCE-RUNTIME-RESOURCE.es.md)

## Quality gates

La validación completa es:

```bash
npm run verify
```

Entre los gates permanentes se incluyen:

```text
check:fresh-clone
check:self-host
check:production-security
check:mongodb-concurrency
check:payment-idempotency
check:traveller-amendment-validation
check:adapter-contract-validation
check:observability
check:failure-transport
check:external-monitoring
check:privileged-audit
check:encryption-keyring
check:traveller-key-rotation
check:mongodb-recovery
check:mongodb-index-performance
check:privacy-rights
check:privacy-execution
check:privacy-retention-policy
check:accessibility-foundation
check:accessibility-auth
check:accessibility-traveller-privacy
check:accessibility-booking-payment
check:accessibility-operator
check:performance-load
check:performance-authenticated-read
check:performance-mutation-throughput
check:performance-runtime-resource
check:browser-e2e
typecheck
build
```

Jobs CI dedicados ejercitan además replica sets MongoDB reales, contratos HTTP locales, ejecución de privacidad, journeys de accesibilidad y baselines de rendimiento/recursos. El journey general registro -> reserva -> cliente -> Operator permanece informativo/no bloqueante por política explícita.

## Estado del proyecto

| Área | Estado |
|---|---|
| Foundation, arquitectura y CI | **Completado** |
| Catálogo, identidad, reservas e inventario | **Completado** |
| Pagos, finanzas y condiciones de pago | **Completado** |
| Alojamiento y composición de paquetes | **Completado** |
| Workflows Operator y permisos | **Completado** |
| Documentos, exportaciones y reporting | **Completado** |
| Fase 8 — Integraciones externas | **Completada** |
| Fase 9 — Baseline de ingeniería de endurecimiento productivo | **Completada** |
| Validación Stripe/Redsys TEST/LIVE con credenciales | **Pendiente de cuentas proveedor** |
| Fase 10.1 — Bootstrap demo desde clon limpio | **Completada** |
| Fase 10.2 — Despliegue self-host standalone | **Completada** |
| Fase 10.3 — Contratos de extensión/adapters de referencia | **Activa** |
| Fase 10 — Productización open-source | **En curso** |

## Prioridad activa — Fase 10.3

El bloque actual es **Fase 10.3 — Contratos de extensión y adapters de referencia**.

Objetivos de entrega:

1. inventariar y clasificar los puntos públicos de extensión ya existentes;
2. documentar qué lado sigue siendo autoritativo para reservas, inventario, pagos, identidad, fulfilment, CRM y ERP/contabilidad;
3. definir reglas de compatibilidad/versionado antes de ampliar el ecosistema de adapters;
4. añadir implementaciones y ejemplos de referencia para contribuidores;
5. añadir validación permanente que impida filtraciones de payloads o autoridad de proveedor entre fronteras;
6. mantener adapters exclusivos de Kairoseth/cliente fuera del core MIT cuando corresponda.

El alcance y criterios de cierre están en [`docs/EXTENSION-CONTRACTS.es.md`](docs/EXTENSION-CONTRACTS.es.md) y [`ROADMAP.es.md`](ROADMAP.es.md).

Después de 10.3, la Fase 10 continuará con convenciones de releases/migraciones, templates de contribución/release y política de marca/trademark.

## Licencia

MIT. Consulta [`LICENSE`](LICENSE).