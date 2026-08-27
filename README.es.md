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
- adapter CRM exclusivamente downstream que reutiliza el mismo worker durable y mantiene los eventos de cliente/perfil fuera de las suscripciones webhook genéricas;
- adapter ERP/contabilidad exclusivamente downstream que exporta solo movimientos finalizados de pago/reembolso mediante el mismo worker durable sin dar al ERP autoridad sobre reservas ni historial financiero local;
- CSP/headers de seguridad globales, throttling persistente de autenticación, comprobaciones explícitas de Origin para Route Handlers autenticados por cookie y endpoints de health/readiness;
- perfiles explícitos de readiness `demo|live` que fallan de forma segura si un despliegue live conserva capacidades demo o no dispone de infraestructura requerida;
- validación determinista con MongoDB real de concurrencia/idempotencia/modificaciones y tests HTTP locales reales de contratos de adapters;
- logs operativos JSON estructurados y neutrales con correlación validada mediante `X-Request-Id` y redacción central de datos sensibles;
- transporte centralizado opcional de fallos con allowlist externa estricta, fingerprints SHA-256 estables para agrupación y entrega best-effort de un solo intento.

La validación E2E con credenciales Stripe/Redsys sigue pendiente hasta disponer de cuentas adecuadas. Los adapters están implementados, pero la capacidad productiva no se considera validada hasta probar TEST/LIVE.

**La Fase 8 — Integraciones externas está COMPLETADA. La Fase 9 — Endurecimiento productivo está EN PROGRESO: la Fase 9A y el baseline core de la Fase 9B están COMPLETADOS; la Fase 9C está EN PROGRESO con 9C-1 observabilidad estructurada y 9C-2 visibilidad centralizada de fallos COMPLETADAS. La Fase 9C-3 — monitorización externa de uptime/readiness y routing de alertas accionables es la SIGUIENTE.**

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

### Identidad, seguridad y observabilidad operativa

- registro/sesiones persistentes de cliente;
- autenticación separada Operator/Admin;
- separación de sesiones cliente/personal;
- tokens de sesión opacos almacenados únicamente como hash SHA-256, con expiración TTL y revocación server-side;
- cookies de sesión `HttpOnly`, `Secure` en producción, `SameSite=Lax` para cliente y `SameSite=Strict` para personal;
- bloqueo por intentos repetidos;
- throttling persistente MongoDB para login cliente/staff, registro y solicitudes de reset de contraseña;
- buckets de rate limit con identificadores SHA-256, sin guardar email ni IP en claro;
- throttling adicional por cliente solo cuando se habilita explícitamente la confianza en headers IP del proxy;
- cambio/recuperación de contraseña por SMTP con respuestas que no revelan si la cuenta existe;
- auditoría de autenticación;
- Content Security Policy y headers HTTP defensivos globales;
- HSTS y upgrade de requests inseguras en producción;
- comprobación de Origin confiable para mutaciones en Route Handlers autenticados por cookie, manteniendo firma de proveedor para webhooks externos;
- endpoints operativos `/api/health/live` y `/api/health/ready`;
- contrato de readiness `KTRAVEL_DEPLOYMENT_PROFILE=demo|live`;
- secretos PSP cifrados AES-256-GCM;
- datos avanzados del viajero almacenados aparte y cifrados AES-256-GCM;
- secretos de firma de integraciones salientes cifrados con clave AES-256-GCM dedicada;
- configuración privilegiada protegida por capacidades server-side;
- logs operativos JSON versionados en stdout/stderr con correlación segura de requests;
- excepciones genéricas limitadas a tipo/código seguros, nunca `message` ni `stack`;
- `FailureTransport` neutral opcional para eventos operativos `warning`, `error` y `critical`;
- payloads externos de fallo con allowlist explícita que excluye credenciales, datos cliente/viajero, referencias de proveedor, payloads raw y valores monetarios;
- caídas del collector nunca cambian la autoridad de reservas/pagos/integraciones/readiness y nunca disparan retries automáticos.

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
- totales financieros agrupados por moneda, nunca sumados entre monedas diferentes;
- movimientos finalizados `succeeded` pueden sincronizarse downstream con ERP/contabilidad sin cambiar la autoridad financiera local.

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
- outbox transaccional confirmado junto con la mutación de origen;
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
- valores protegidos, secretos de firma y credenciales del worker excluidos de diagnósticos;
- CRM y ERP/contabilidad reutilizan la misma infraestructura como destinos virtuales aislados, sin crear colas separadas.

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

#### Sincronización ERP / contabilidad

- `ERP_ACCOUNTING_MODE=rest` activa un `ErpAccountingAdapter` neutral y exclusivamente downstream;
- endpoint REST v1 `/v1/accounting/movements/upsert`;
- solo movimientos locales autoritativos de pago/reembolso con estado `succeeded` son elegibles;
- tanto un movimiento creado como `succeeded` como una transición `pending → succeeded` confirman el movimiento y su trigger ERP en la misma transacción MongoDB;
- IDs de evento deterministas (`intevt-payment-{transactionId}-succeeded`) e idempotency keys derivadas del evento evitan duplicados downstream en retries/replay;
- eventos ERP no están disponibles en webhooks genéricos ni son consumidos por CRM;
- importe, moneda, provider, método/referencia y timestamp salen del movimiento inmutable del ledger local;
- IDs externos se almacenan aparte en `travel_erp_accounting_links`;
- `travel_erp_accounting_audit` guarda acknowledgements sin importe, moneda, referencia del provider, PII ni cuerpos HTTP crudos;
- diagnóstico Admin en `/operator/integrations/erp`;
- acknowledgements ERP no pueden mutar reservas, inventario ni historial de pagos/reembolsos;
- el contrato genérico representa movimientos preparados para contabilidad, no facturas legales específicas de una jurisdicción; identidad fiscal, numeración y mapping tributario requieren modelado autoritativo separado y adapters de mercado/vendor.

Los payloads específicos de proveedor deben normalizarse dentro de adapters y no filtrarse a dominios centrales.

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
PaymentRepository → ledger neutral → Stripe / Redsys / manual
        |                               |
        |                       movimientos succeeded
        |                               |
eventos cliente/reserva                 |
        |                               |
        +--------- outbox transaccional de integraciones --------+
                              |
                        worker durable
                  /             |              \
            webhooks firmados  CRM REST      ERP/contabilidad REST

Fallos operativos
        |
logs JSON estructurados → FailureTransport REST opcional → stack de monitorización del despliegue

Operator/Admin
    |
Operations / RBAC / auditoría / documentos / informes / tareas
    |
SupplierFulfilmentAdapter → disabled / REST v1
```

Los payloads específicos permanecen dentro de adapters. Catálogo, reservas, alojamiento, identidad, servicios, operaciones, documentos, reporting, pagos, fulfilment, CRM, ERP/contabilidad y transporte de fallos mantienen fronteras explícitas y reemplazables.

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
/operator/integrations/erp             estado/auditoría ERP/contabilidad solo Admin
/operator/integrations/events/[eventId] diagnóstico Admin de eventos
/operator/integrations/deliveries/[deliveryId] diagnóstico/replay Admin
/operator/staff                        personal/permisos

/api/health/live                       liveness del proceso
/api/health/ready                      readiness de configuración/infraestructura
/api/internal/integrations/process     worker programado server-only (POST)
```

## Configuración

La plantilla completa vive en [`.env.example`](.env.example). Los secretos nunca deben usar `NEXT_PUBLIC_*`.

```text
KTRAVEL_PUBLIC_URL=https://travel.kairoseth.com
KTRAVEL_DEPLOYMENT_PROFILE=demo
KTRAVEL_ALLOWED_BROWSER_ORIGINS=
KTRAVEL_TRUST_PROXY_IP_HEADERS=false
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
ERP_ACCOUNTING_MODE=disabled
REST_ERP_ACCOUNTING_BASE_URL=
REST_ERP_ACCOUNTING_BEARER_TOKEN=
REST_ERP_ACCOUNTING_TIMEOUT_MS=10000
REST_ERP_ACCOUNTING_MAX_RESPONSE_BYTES=262144
FAILURE_TRANSPORT_MODE=disabled
REST_FAILURE_TRANSPORT_URL=
REST_FAILURE_TRANSPORT_BEARER_TOKEN=
REST_FAILURE_TRANSPORT_TIMEOUT_MS=3000
REST_FAILURE_TRANSPORT_MAX_RESPONSE_BYTES=65536
PAYMENT_SECRETS_KEY=
TRAVELLER_DATA_KEY=
INTEGRATION_SECRETS_KEY=
KTRAVEL_INTEGRATION_WORKER_TOKEN=
INTEGRATION_WORKER_BATCH_SIZE=10
INTEGRATION_WORKER_MIN_INTERVAL_SECONDS=60
INTEGRATION_COMPLETED_RETENTION_DAYS=180
```

`KTRAVEL_DEPLOYMENT_PROFILE=live` convierte readiness en un contrato productivo más estricto: capacidades demo, configuración HTTPS canónica inválida, MongoDB requerido no disponible o falta de autenticación del worker outbound hacen que `/api/health/ready` responda 503. `KTRAVEL_ALLOWED_BROWSER_ORIGINS` solo acepta orígenes exactos adicionales. Mantén `KTRAVEL_TRUST_PROXY_IP_HEADERS=false` salvo que el edge elimine headers de forwarding falsificables y escriba la IP real del cliente de forma confiable.

`REST_BOOKING_BEARER_TOKEN`, `REST_SUPPLIER_FULFILMENT_BEARER_TOKEN`, `REST_CRM_BEARER_TOKEN`, `REST_ERP_ACCOUNTING_BEARER_TOKEN` y `REST_FAILURE_TRANSPORT_BEARER_TOKEN` son server-only y nunca deben usar `NEXT_PUBLIC_*`. Los endpoints REST de reservas, proveedores, CRM, ERP/contabilidad y collector de fallos en producción deben usar HTTPS. Las tres claves maestras deben ser estables, de alta entropía y 32 bytes. `KTRAVEL_INTEGRATION_WORKER_TOKEN` es una credencial Bearer server-only independiente. No se deben rotar claves de cifrado sin un plan de migración/re-cifrado.

## Documentación

- [`ROADMAP.es.md`](ROADMAP.es.md) — estado y prioridades.
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — fronteras de capacidad/evento/confianza.
- [`docs/BOOKING.md`](docs/BOOKING.md)
- [`docs/REST-BOOKING-ADAPTER.es.md`](docs/REST-BOOKING-ADAPTER.es.md) — contrato REST genérico de `BookingRepository`.
- [`docs/SUPPLIER-FULFILMENT-ADAPTER.es.md`](docs/SUPPLIER-FULFILMENT-ADAPTER.es.md) — request/status/cancel y auditoría antes de aplicar.
- [`docs/CRM-SYNC-ADAPTER.es.md`](docs/CRM-SYNC-ADAPTER.es.md) — CRM downstream, allowlists, arquitectura de una sola cola, idempotencia y auditoría.
- [`docs/ERP-ACCOUNTING-ADAPTER.es.md`](docs/ERP-ACCOUNTING-ADAPTER.es.md) — movimiento contable downstream, outbox transaccional de pagos, autoridad y separación de facturación fiscal.
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
- [`docs/PRODUCTION-SECURITY.es.md`](docs/PRODUCTION-SECURITY.es.md) / [`docs/PRODUCTION-SECURITY.md`](docs/PRODUCTION-SECURITY.md) — baseline 9A de HTTP, Origin/CSRF, rate limiting, sesiones y readiness.
- [`docs/OBSERVABILITY.es.md`](docs/OBSERVABILITY.es.md) / [`docs/OBSERVABILITY.md`](docs/OBSERVABILITY.md) — logging estructurado, correlación de requests y frontera de redacción.
- [`docs/FAILURE-TRANSPORT.es.md`](docs/FAILURE-TRANSPORT.es.md) / [`docs/FAILURE-TRANSPORT.md`](docs/FAILURE-TRANSPORT.md) — entrega centralizada neutral de fallos, severidad, allowlists y semántica best-effort.
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
check:erp-accounting-adapter
check:production-security
check:mongodb-concurrency
check:payment-idempotency
check:traveller-amendment-validation
check:adapter-contract-validation
check:observability
check:failure-transport
check:browser-e2e
typecheck
build
```

CI realiza instalación limpia, invariantes, typecheck, build productivo, smoke HTTP de headers/health/rechazo cross-origin y auditoría de dependencias. La validación bloqueante ejecuta además `test:rest-adapter-contracts`, `test:observability` y `test:failure-transport`; un job con replica set MongoDB 8 real prueba concurrencia/rollback de reservas, idempotencia de pagos/webhooks y modificaciones de viajeros. Chromium Browser E2E permanece en un job independiente informativo/no bloqueante.

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
| Fase 8C-4 — ERP/contabilidad | **Completada** |
| Fase 8C — Adapters de negocio | **Completada** |
| Fase 8 — Integraciones externas | **Completada** |
| Fase 9A — Baseline de seguridad / operabilidad productiva | **Completada** |
| Fase 9B — Baseline crítico de persistencia/concurrencia/contratos | **Completada** |
| Fase 9C-1 — Observabilidad operativa estructurada | **Completada** |
| Fase 9C-2 — Transporte centralizado de visibilidad de fallos | **Completada** |
| Fase 9C-3 — Monitorización externa uptime/readiness + routing de alertas | **Siguiente** |
| Fase 9C — Observabilidad, recuperación y auditoría privilegiada | **En progreso** |
| Fase 9 — Endurecimiento productivo | **En progreso** |

## Siguiente prioridad

El siguiente bloque es la **Fase 9C-3 — Monitorización externa de uptime/readiness y routing de alertas accionables**.

La Fase 9C-1 estableció logs operativos estructurados seguros y correlación de requests. La Fase 9C-2 añadió un transporte neutral y best-effort de fallos que puede alimentar el stack de monitorización de cada despliegue sin convertir ese stack en autoridad de reservas/pagos. La siguiente prioridad es definir el contrato de monitorización externa alrededor de `/api/health/live`, `/api/health/ready` y los eventos de fallo normalizados.

Dirección inicial de 9C-3:

- definir comportamiento exacto de probes externos de liveness/readiness y ventanas recomendadas de polling/timeout;
- definir reglas accionables de severidad/escalado para degradación de readiness y fingerprints de fallo normalizados;
- documentar routing/runbooks neutrales para que cada despliegue pueda usar Grafana/Alertmanager, Sentry, Datadog u otra plataforma sin acoplarla al core MIT;
- mantener infraestructura de monitorización fuera de la autoridad de la aplicación y sin datos protegidos de cliente/viajero;
- añadir invariantes deterministas de configuración/runbook cuando protejan materialmente el contrato productivo.

Las siguientes partes de 9C cubrirán revisión de auditoría privilegiada, recuperación/rotación de claves, drills MongoDB de backup/restore y disaster recovery, rollback y revisión de índices/rendimiento. La Fase 9D cubrirá después GDPR/privacidad/regulación, accesibilidad y rendimiento. El E2E TEST/LIVE Stripe/Redsys con credenciales sigue pendiente y debe incorporarse en cuanto existan cuentas proveedor adecuadas.

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
- eventos CRM de cliente y eventos financieros ERP no disponibles para webhooks genéricos;
- ejecución programada autenticada server-side, limitada y observable;
- APIs externos de reservas deben cumplir contrato runtime, ownership e idempotencia;
- APIs de proveedores no pueden saltarse transiciones locales ni auto-publicar referencias;
- CRM es downstream y no puede mutar reservas, pricing, inventario, proveedores ni ledger autoritativo;
- ERP/contabilidad es downstream y no puede reescribir historial de pagos/reembolsos; la facturación legal no se infiere de datos fiscales incompletos;
- CSP/headers, Origin checks, rate limiting y readiness permanecen como baseline permanente de seguridad productiva;
- observabilidad/failure transport no pueden filtrar PII, secretos, payloads raw, referencias provider ni valores monetarios en el canal genérico;
- la monitorización externa nunca se convierte en dependencia autoritativa ni en requisito de readiness por sí misma;
- UX pública bilingüe y responsive;
- integraciones propietarias fuera del core MIT cuando corresponda.

## Licencia

MIT. Consulta [`LICENSE`](LICENSE).