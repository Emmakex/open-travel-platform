# Open Travel Platform

<p align="center"><a href="./README.md">English</a> · <strong>Español</strong></p>

> Base open-source reutilizable para agencias, turoperadores y productos de reserva de viajes.

Open Travel Platform es una plataforma clean-room construida con **Next.js + TypeScript + MongoDB** y organizada alrededor de límites explícitos de dominio, repositorios y adapters. Puede ejecutarse con datos demo para evaluación local o con capacidades persistentes de catálogo, identidad, reservas, alojamiento, servicios, operaciones, pagos e integraciones.

La implementación comercial/de referencia oficial es **Kairoseth Travel**, desplegada en **[travel.kairoseth.com](https://travel.kairoseth.com)**.

![Version](https://img.shields.io/badge/version-1.0.0-0d1b2d)
![Next.js](https://img.shields.io/badge/Next.js-16.3.1-000000)
![React](https://img.shields.io/badge/React-19.2.8-149eca)
![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178c6)
![Node](https://img.shields.io/badge/Node-24_LTS-5fa04e)
![MongoDB](https://img.shields.io/badge/MongoDB-supported-47A248)
![License](https://img.shields.io/badge/license-MIT-45d6b5)
[![Live reference](https://img.shields.io/badge/live-travel.kairoseth.com-45d6b5)](https://travel.kairoseth.com)

## Modelo del proyecto

Este repositorio es el **core open-source bajo licencia MIT**. Kairoseth Travel es la implementación alojada/comercial oficial construida encima.

La separación es intencional:

- Open Travel Platform sigue siendo reutilizable y neutral respecto a proveedores;
- Kairoseth Travel puede añadir hosting gestionado, soporte, servicios comerciales e integraciones privadas;
- datos de clientes, credenciales productivas e integraciones propietarias permanecen fuera del repositorio público.

## Posición actual

La plataforma está muy por encima del MVP original de catálogo/reservas. La implementación actual incluye:

- catálogo público y backoffice Operator bilingües;
- persistencia MongoDB;
- autenticación persistente cliente/personal con RBAC y capacidades granulares;
- salidas e inventario transaccional;
- viajeros, menores y pricing por edad;
- actividades, transporte y protección de viaje independientes;
- disponibilidad y reservas de servicios;
- ledger neutral de pagos, depósitos, cuotas y condiciones de pago;
- adapters Stripe/Redsys detrás de checkout unificado;
- datos post-compra del viajero cifrados;
- modificaciones de reserva con reasignación segura de inventario y delta financiero;
- alojamiento reutilizable, inventario de habitaciones y pricing estacional/ocupación;
- alojamiento transaccional dentro de la reserva de viaje;
- suplementos opcionales y modificaciones post-reserva;
- workflow Operator con responsable, notas internas, prioridades, tags, tareas y fulfilment;
- colas operativas avanzadas y permisos granulares;
- PDFs de confirmación, manifiestos y rooming lists;
- vouchers seguros para cliente y expediente interno imprimible;
- aprobación explícita/auditada de referencias proveedor antes de mostrarlas en vouchers;
- exportaciones CSV/XLSX según permisos;
- conciliación, saldos pendientes e ingresos por producto/servicio;
- exportación fail-closed y auditada de datos protegidos de viajeros;
- reporting financiero multimoneda sin sumar monedas distintas;
- eventos salientes neutrales con outbox MongoDB transaccional;
- webhooks HTTPS firmados gestionados por Admin, secretos cifrados, retries, historial y dead-letter;
- protecciones SSRF/DNS rebinding para destinos webhook;
- worker de integraciones server-only con locking durable, replay y retención;
- adapter REST genérico y versionado de `BookingRepository`;
- adapter opcional y neutral de fulfilment de proveedores con sincronización auditada request/status/cancel;
- adapter CRM exclusivamente downstream que reutiliza el mismo worker durable y mantiene los eventos de cliente/perfil fuera de las suscripciones webhook genéricas.

La validación E2E con credenciales Stripe/Redsys sigue pendiente hasta disponer de cuentas adecuadas. Los adapters están implementados, pero la capacidad productiva no se considera validada hasta probar TEST/LIVE.

**La Fase 8C — Adapters de negocio está EN CURSO. La Fase 8C-1 — adapter REST genérico de reservas, la Fase 8C-2 — frontera de fulfilment de proveedores y la Fase 8C-3 — sincronización CRM están completadas. La Fase 8C-4 — adapter ERP/contabilidad es la siguiente.**

## Capacidades actuales

### Catálogo público y comercio

- experiencia EN/ES;
- destinos y viajes localizados;
- salidas públicas y disponibilidad en vivo;
- catálogo de alojamientos, habitaciones y galerías;
- catálogos independientes de Actividades, Transporte y Protección de viaje;
- detalle de servicios con disponibilidad/pricing;
- booking de viaje con viajeros, alojamiento y extras opcionales;
- autenticación de cliente cuando cuenta/reserva la requiere.

### Backoffice de catálogo e inventario

- gestión protegida Operator/Admin;
- destinos, viajes, alojamientos, habitaciones y servicios;
- biblioteca GridFS, portadas, galerías y puntos focales;
- itinerarios multidioma;
- salidas, capacidades e inventario;
- inventario de habitaciones, ocupación, regímenes y tarifas;
- pricing estacional y por ocupación;
- vínculos viaje ↔ alojamiento;
- suplementos opcionales;
- calendarios de disponibilidad de servicios;
- ciclo draft/published;
- requisitos post-compra por producto.

### Reservas, viajeros y paquetes

- reservas persistentes de viaje/servicios;
- pricing e inventario autoritativos en servidor;
- viajero principal y fichas individuales;
- bandas de edad, tutor y consumo de inventario configurables;
- snapshots históricos;
- alojamiento guardado transaccionalmente en la reserva;
- suplementos guardados al precio contratado;
- workflows confirmar/cancelar y auditoría;
- correcciones de viajeros/cambios de salida como modificaciones explícitas;
- modificaciones post-reserva de suplementos;
- delta financiero sin reescribir movimientos históricos;
- plazos configurables de cambio/cancelación.

### Workflow avanzado de Operator

- asignación de responsable;
- notas internas fuera de superficies cliente;
- prioridades y tags;
- timeline operativo;
- tareas/seguimientos;
- fulfilment por componente de viaje/servicio/alojamiento;
- estados, deadlines, referencias y costes internos opcionales;
- búsqueda, filtros, colas, orden y paginación;
- capacidades granulares server-side;
- cambios de permisos auditados.

### Identidad y seguridad

- registro/sesiones persistentes de cliente;
- autenticación separada Operator/Admin;
- separación de sesiones;
- bloqueo por intentos repetidos;
- cambio/recuperación de contraseña por SMTP;
- auditoría de autenticación;
- secretos PSP cifrados AES-256-GCM;
- datos avanzados del viajero almacenados aparte y cifrados AES-256-GCM;
- secretos de firma de integraciones salientes cifrados con clave AES-256-GCM dedicada;
- configuración privilegiada protegida por capacidades server-side.

### Pagos y finanzas

- ledger neutral de pagos/reembolsos;
- estado de reserva independiente del pago;
- unpaid / pending / partially paid / paid / partially refunded / refunded;
- transferencia, efectivo y terminal externo;
- reembolsos controlados;
- webhooks Stripe firmados e idempotencia;
- notificaciones Redsys firmadas;
- retornos del navegador no autoritativos;
- perfiles TEST/LIVE gestionados por Admin;
- snapshots de pago completo, depósito y cuotas;
- cálculo de saldo pendiente y próximo pago;
- totales financieros agrupados por moneda, nunca sumados entre monedas diferentes.

### Documentos

- generación PDF server-side con `pdf-lib`;
- confirmaciones PDF cliente/Operator;
- manifiestos EN/ES y rooming lists;
- vouchers de alojamiento/servicio seguros para cliente;
- expediente consolidado interno;
- versión/estado del documento y timestamp UTC;
- finanzas en documentos internos solo con permiso Finanzas;
- sección de proveedor solo con permiso Proveedores;
- referencias proveedor en vouchers cliente únicamente tras aprobar la referencia exacta actual;
- cambiar el localizador invalida la aprobación anterior;
- aprobaciones guardadas separadamente y auditadas;
- notas internas, costes proveedor y valores post-compra protegidos excluidos de renderers cliente;
- endpoints privados `no-store` + `nosniff`.

### Informes y exportaciones

- workspace protegido `/operator/reports`;
- CSV/XLSX de reservas de viaje, servicios y clientes;
- filtros server-side y límites de descarga;
- conciliación, saldos/cuotas vencidas e ingresos solo con permiso Finanzas;
- definiciones tabulares comunes para CSV/XLSX;
- mitigación de inyección de fórmulas;
- XLSX OOXML con cabecera congelada/autofiltro;
- respuestas privadas `no-store` + `nosniff`;
- auditoría de actor/tipo/formato/filtros/columnas/filas/timestamp sin valores exportados;
- exportación protegida requiere Datos de viajeros + Reservas, reserva activa y motivo operativo;
- exportación protegida POST-only y fail-closed ante fallo de auditoría;
- métricas financieras siempre agrupadas por moneda.

### Integraciones salientes

- workspace `/operator/integrations` exclusivo de Admin;
- eventos versionados neutrales de reservas;
- outbox transaccional confirmado junto con la mutación de reserva;
- entregas idempotentes por evento/endpoint;
- adapter webhook HTTPS firmado HMAC-SHA256;
- secretos write-only cifrados con `INTEGRATION_SECRETS_KEY`;
- destinos HTTPS, rechazo de redes privadas/locales/reservadas y revalidación DNS;
- conexión a IP validada manteniendo SNI/Host original;
- redirects desactivados, timeout y tamaño de respuesta limitados;
- leasing, recuperación tras caída, retries/backoff, historial de intentos y dead-letter;
- `POST /api/internal/integrations/process` server-only con Bearer;
- lock global durable para scheduler/ejecución manual;
- límites de lote/frecuencia y `Retry-After`;
- métricas de salud y diagnóstico Admin de evento/entrega;
- replay dead-letter auditado conservando historial;
- retención limitada de éxitos antiguos;
- valores protegidos, secretos de firma y credenciales del worker excluidos de diagnósticos.

### Adapters de negocio

#### Reservas REST genéricas

- `BOOKING_MODE=rest` compone un API externo detrás de `BookingRepository`;
- contrato `/v1` versionado mediante `X-OTP-Contract-Version: 1`;
- Bearer server-only y HTTPS obligatorio en producción;
- rechazo de redirects, `no-store`, timeout y respuesta acotados;
- validación runtime antes de que JSON externo entre en el dominio;
- ownership de cliente y alcance viaje/salida revalidados tras mapping;
- create/cancel con idempotencia estable y retries transitorios limitados.

#### Fulfilment de proveedores

- `SUPPLIER_FULFILMENT_ADAPTER_MODE=rest` habilita un adapter externo sin sustituir el almacén local;
- operaciones REST v1 explícitas `request`, `status` y `cancel`;
- request solo normaliza a `requested`; cancel solo a `cancelled`; confirmación/rechazo llega mediante `status`;
- request/cancel usan idempotencia determinista y retries limitados;
- respuestas externas se auditan persistentemente antes de aplicarse y luego vuelven a `saveSupplierFulfilment()`;
- transiciones inválidas se registran como conflicto y nunca se fuerzan;
- payload externo excluye totales cliente, ledger, costes proveedor, instrucciones de inventario y datos protegidos;
- coste/moneda local de proveedor se preservan;
- referencias recibidas siguen internas hasta la aprobación separada para voucher cliente.

#### Sincronización CRM

- `CRM_SYNC_MODE=rest` activa un `CrmSyncAdapter` neutral y exclusivamente downstream;
- endpoints REST v1 `/v1/crm/contacts/upsert` y `/v1/crm/reservations/upsert`;
- registro/actualización de perfil encolan `customer.created` / `customer.profile.updated` en la misma transacción MongoDB que la escritura del cliente;
- eventos `customer.*` no están disponibles para suscripciones webhook genéricas;
- CRM reutiliza outbox, worker, retry/backoff, dead-letter, replay y métricas mediante el destino virtual `crm-rest:primary`;
- eventos de reserva hacen upsert del contacto antes del upsert de reserva;
- `Idempotency-Key` deriva del evento y permanece estable en retries/replay;
- snapshots de contacto/reserva usan allowlists explícitas;
- snapshots de reserva excluyen precios, moneda/condiciones de pago, proveedores, mutaciones de inventario, arrays de viajeros y datos post-compra protegidos;
- IDs externos se guardan aparte en `travel_crm_sync_links`;
- outcomes normalizados se auditan sin PII en `travel_crm_sync_audit`;
- diagnóstico Admin en `/operator/integrations/crm`;
- CRM no puede mutar reservas, pricing, inventario, fulfilment ni ledger local.

Los payloads específicos de proveedor deben normalizarse dentro de adapters y no filtrarse a dominios centrales.

## Arquitectura

```text
Catálogo público
      |
TravelRepository
      |
destinos + viajes + alojamiento + servicios
      |
      +---------------- salidas / inventario
      |                         |
      |                  BookingRepository
      |                  /      |       \
      |               demo    MongoDB   REST /v1
      |                         |
      |                   reservas viaje
      |                         |
      |                 alojamiento / habitaciones
      |
      +---------------- servicios independientes
                                |
                    disponibilidad / reservas
                                |
                         PaymentRepository
                                |
                         ledger neutral
                          /             \
                     Stripe             Redsys

área cliente ---------------------- staff/operator/admin
     |                                      |
IdentityRepository                 Operations / RBAC / auditoría
     |                                      |
eventos cliente/perfil      documentos / informes / fulfilment / tareas
     |                                      |
     +---------------- outbox transaccional de integraciones ----------------+
                                                                             |
                                        webhooks firmados / CRM REST / futuros adapters
                                                                             |
                                                    worker durable programado

SupplierFulfilmentAdapter
       /        \
 disabled      REST /v1
```

Los payloads específicos de proveedor permanecen dentro de adapters. Catálogo, reservas, alojamiento, identidad, servicios, operaciones, documentos, reporting, pagos, fulfilment e integraciones mantienen fronteras reemplazables.

## Inicio rápido

Requiere **Node.js 24 LTS**.

```bash
git clone https://github.com/Emmakex/open-travel-platform.git
cd open-travel-platform
npm install
cp .env.example .env.local
npm run dev
```

## Rutas principales

```text
/                                      inicio
/destinations                          destinos
/trips                                 viajes
/accommodations                        alojamientos
/services                              hub de servicios
/activities                            actividades
/transport                             transporte
/insurance                             protección de viaje

/account                               Mi cuenta
/account/reservations                  reservas de viaje
/account/services                      reservas de servicios
/account/traveller-data/[targetType]/[id] datos post-compra
/account/checkout/[targetType]/[id]    checkout

/operator                              dashboard
/operator/reservations                 reservas
/operator/service-reservations         servicios
/operator/customers                    clientes
/operator/catalogue                    catálogo
/operator/media                        multimedia
/operator/documents                    documentos
/operator/reports                      informes y CSV/XLSX
/operator/tasks                        tareas
/operator/fulfilment                   proveedores
/operator/payments                     finanzas
/operator/payments/providers           PSP solo Admin
/operator/integrations                 webhooks/cola solo Admin
/operator/integrations/crm             estado/auditoría CRM solo Admin
/operator/integrations/events/[eventId] diagnóstico Admin de eventos
/operator/integrations/deliveries/[deliveryId] diagnóstico/replay Admin
/operator/staff                        personal/permisos

/api/internal/integrations/process     worker programado server-only (POST)
```

## Configuración

La plantilla completa vive en [`.env.example`](.env.example). Los secretos nunca deben usar `NEXT_PUBLIC_*`.

```text
BOOKING_MODE=demo
REST_BOOKING_BASE_URL=
REST_BOOKING_BEARER_TOKEN=
REST_BOOKING_TIMEOUT_MS=10000
REST_BOOKING_MAX_RESPONSE_BYTES=2000000
SUPPLIER_FULFILMENT_ADAPTER_MODE=disabled
REST_SUPPLIER_FULFILMENT_BASE_URL=
REST_SUPPLIER_FULFILMENT_BEARER_TOKEN=
REST_SUPPLIER_FULFILMENT_TIMEOUT_MS=10000
REST_SUPPLIER_FULFILMENT_MAX_RESPONSE_BYTES=262144
CRM_SYNC_MODE=disabled
REST_CRM_BASE_URL=
REST_CRM_BEARER_TOKEN=
REST_CRM_TIMEOUT_MS=10000
REST_CRM_MAX_RESPONSE_BYTES=262144
PAYMENT_SECRETS_KEY=
TRAVELLER_DATA_KEY=
INTEGRATION_SECRETS_KEY=
KTRAVEL_INTEGRATION_WORKER_TOKEN=
INTEGRATION_WORKER_BATCH_SIZE=10
INTEGRATION_WORKER_MIN_INTERVAL_SECONDS=60
INTEGRATION_COMPLETED_RETENTION_DAYS=180
```

`REST_BOOKING_BEARER_TOKEN`, `REST_SUPPLIER_FULFILMENT_BEARER_TOKEN` y `REST_CRM_BEARER_TOKEN` son server-only y nunca deben usar `NEXT_PUBLIC_*`. Los endpoints REST de reservas, proveedores y CRM en producción deben usar HTTPS. Las tres claves maestras deben ser estables, de alta entropía y 32 bytes. `KTRAVEL_INTEGRATION_WORKER_TOKEN` es una credencial Bearer server-only independiente. No se deben rotar claves de cifrado sin un plan de migración/re-cifrado.

## Documentación

- [`ROADMAP.es.md`](ROADMAP.es.md) — estado y prioridades.
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- [`docs/BOOKING.md`](docs/BOOKING.md)
- [`docs/REST-BOOKING-ADAPTER.es.md`](docs/REST-BOOKING-ADAPTER.es.md) — contrato REST genérico de `BookingRepository`.
- [`docs/SUPPLIER-FULFILMENT-ADAPTER.es.md`](docs/SUPPLIER-FULFILMENT-ADAPTER.es.md) — request/status/cancel y auditoría antes de aplicar.
- [`docs/CRM-SYNC-ADAPTER.es.md`](docs/CRM-SYNC-ADAPTER.es.md) — CRM downstream, allowlists, arquitectura de una sola cola, idempotencia y auditoría.
- [`docs/OPERATIONS.md`](docs/OPERATIONS.md)
- [`docs/CATALOGUE-BACKOFFICE.md`](docs/CATALOGUE-BACKOFFICE.md)
- [`docs/DEPARTURES.md`](docs/DEPARTURES.md)
- [`docs/MEDIA.md`](docs/MEDIA.md)
- [`docs/PAYMENTS.md`](docs/PAYMENTS.md)
- [`docs/TRAVELLER-DATA.md`](docs/TRAVELLER-DATA.md)
- [`docs/ACCOMMODATION.md`](docs/ACCOMMODATION.md)
- [`docs/TRIP-PACKAGE-ADDONS.es.md`](docs/TRIP-PACKAGE-ADDONS.es.md)
- [`docs/STAFF-PERMISSIONS.es.md`](docs/STAFF-PERMISSIONS.es.md)
- [`docs/BOOKING-DOCUMENTS.es.md`](docs/BOOKING-DOCUMENTS.es.md)
- [`docs/DEPARTURE-DOCUMENTS.es.md`](docs/DEPARTURE-DOCUMENTS.es.md)
- [`docs/VOUCHERS-DOSSIERS.es.md`](docs/VOUCHERS-DOSSIERS.es.md)
- [`docs/REPORTING-EXPORTS.es.md`](docs/REPORTING-EXPORTS.es.md)
- [`docs/OUTBOUND-INTEGRATIONS.es.md`](docs/OUTBOUND-INTEGRATIONS.es.md)
- [`docs/INTEGRATION-OPERATIONS.es.md`](docs/INTEGRATION-OPERATIONS.es.md)
- [`docs/ADAPTER-GUIDE.md`](docs/ADAPTER-GUIDE.md)
- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md)
- [`docs/PRODUCTION-CHECKLIST.md`](docs/PRODUCTION-CHECKLIST.md)

## Quality gates

```bash
npm run verify
```

Incluye:

```text
check:safety
check:ux
check:release
check:amendments
check:accommodation
check:package-addons
check:package-addon-amendments
check:operations
check:tasks
check:fulfilment
check:operations-queue
check:staff-permissions
check:booking-documents
check:departure-documents
check:voucher-documents
check:reporting-exports
check:outbound-integrations
check:integration-operations
check:rest-booking-adapter
check:supplier-fulfilment-adapter
check:crm-sync-adapter
typecheck
build
```

CI realiza instalación limpia, invariantes, typecheck, build productivo, smoke HTTP y auditoría de dependencias.

## Estado del proyecto

| Área | Estado |
|---|---|
| Foundation, arquitectura y CI | Completado |
| Catálogo bilingüe + backoffice/media MongoDB | Completado |
| Identidad/seguridad cliente/personal | Completado |
| Reservas e inventario transaccional | Completado |
| Viajeros, menores y pricing | Completado |
| Ledger neutral y condiciones de pago | Completado |
| Checkout Stripe/Redsys | Implementado; E2E con credenciales pendiente |
| Datos post-compra cifrados | Completado |
| Modificaciones y delta financiero | Completado |
| Alojamiento y paquetes | Completado |
| Workflow avanzado Operator | Completado |
| Permisos granulares | Completado |
| PDFs, vouchers y expediente | Completado |
| CSV/XLSX y conciliación/reporting | Completado |
| Fase 7B — Documentos, exportaciones y reporting | **Completada** |
| Fase 8A — Integraciones salientes neutrales | **Completada** |
| Fase 8B — Scheduler, replay y observabilidad | **Completada** |
| Fase 8C-1 — Adapter REST genérico de reservas | **Completada** |
| Fase 8C-2 — Fulfilment de proveedores | **Completada** |
| Fase 8C-3 — Sincronización CRM | **Completada** |
| Fase 8C — Adapters de negocio | **En curso** |

## Siguiente prioridad

El siguiente bloque es la **Fase 8C-4 — adapter ERP/contabilidad**.

La fase CRM demuestra que varios adapters de negocio pueden compartir el worker durable sin ampliar la autoridad del sistema externo. El siguiente bloque debe sincronizar registros comerciales preparados para contabilidad manteniendo al ledger neutral de pagos como fuente financiera autoritativa.

Dirección prevista:

- interfaz neutral ERP/contabilidad;
- contrato explícito para clientes, facturas/recibos o movimientos listos para journal cuando corresponda;
- payload contable derivado de snapshots autoritativos de reservas/pagos, no de objetos crudos del proveedor;
- moneda exacta y referencias de origen inmutables;
- idempotencia determinista y mapping de IDs externos;
- auditoría/retry/dead-letter mediante el worker compartido cuando corresponda;
- sin datos protegidos del viajero, notas operativas de proveedor ni credenciales;
- los acknowledgements del ERP no pueden reescribir automáticamente historial de reservas/pagos;
- mapping específico de plan contable/impuestos contenido dentro de adapters.

Después, 8C podrá añadir fuentes CMS/catálogo, identidad enterprise/SSO y PSP adicionales cuando aporten valor comercial.

La validación TEST/LIVE Stripe/Redsys se insertará cuando existan cuentas adecuadas y no necesita bloquear la Fase 8.

## Principios

- implementación clean-room;
- fronteras de capacidades neutrales respecto a proveedor;
- autorización server-side;
- pricing/inventario/ownership/transiciones validados en servidor;
- snapshots históricos de valores contratados;
- estado de reserva separado del pago;
- datos avanzados solo post-compra cuando aplican;
- documentos cliente sin notas internas, datos protegidos ni costes proveedor;
- exportaciones sensibles limitadas por permisos/finalidad y auditadas antes de entregarse;
- webhooks genéricos sin datos protegidos ni payloads específicos;
- eventos CRM de cliente no disponibles para webhooks genéricos;
- ejecución programada autenticada server-side, limitada y observable;
- APIs externos de reservas deben cumplir contrato runtime, ownership e idempotencia;
- APIs de proveedores no pueden saltarse transiciones locales ni auto-publicar referencias;
- CRM es downstream y no puede mutar reservas, pricing, inventario, proveedores ni ledger autoritativo;
- UX pública bilingüe y responsive;
- integraciones propietarias fuera del core MIT cuando corresponda.

## Licencia

MIT. Consulta [`LICENSE`](LICENSE).