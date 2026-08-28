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
- adapter CRM exclusivamente downstream que reutiliza el mismo worker durable y mantiene los eventos de cliente/perfil fuera de suscripciones webhook genéricas;
- adapter ERP/contabilidad exclusivamente downstream que exporta solo movimientos finalizados de pago/reembolso mediante el mismo worker durable sin dar al ERP autoridad sobre reservas ni historial financiero local;
- CSP/headers globales, throttling persistente de autenticación, validación explícita de Origin y health/readiness;
- perfiles `demo|live` que fallan cerrados ante capacidades demo o infraestructura requerida no disponible en producción;
- validación real MongoDB de concurrencia/idempotencia/modificaciones y contratos HTTP locales de adapters;
- logs JSON estructurados con correlación `X-Request-Id` y redacción central de datos sensibles;
- transporte opcional de fallos con allowlist estricta y fingerprints SHA-256;
- contrato de monitorización externa, routing de alertas accionables, auditoría privilegiada fail-closed y rotación escalonada de claves de cifrado;
- drills reales de backup/restore MongoDB y validación de índices/planes de consulta;
- workflows autenticados de derechos de privacidad, ejecución controlada de acceso/portabilidad/limitación/supresión y registro explícito de políticas de retención;
- baseline técnico de accesibilidad orientado a WCAG 2.2 AA en navegación global, autenticación cliente, Traveller Data/privacidad, booking/pagos y workflows Operator, respaldado por journeys bloqueantes de navegador.
- baselines repetibles de rendimiento/carga para lecturas públicas y autenticadas, contención acotada de mutaciones, comportamiento runtime de RSS/descriptores/threads y liveness/recuperación post-pico.
- bootstrap demo reproducible desde clon limpio con lockfile npm versionado y sin infraestructura externa obligatoria;
- empaquetado self-host provider-neutral sobre el runtime standalone real de Next.js, con guía EN/ES y smoke bloqueante HTTP/assets.

La validación E2E con credenciales Stripe/Redsys sigue pendiente hasta disponer de cuentas adecuadas. Los adapters están implementados, pero la capacidad productiva no se considera validada hasta probar TEST/LIVE.

**La Fase 8 — Integraciones externas y el baseline de ingeniería de la Fase 9 — Endurecimiento productivo están COMPLETADOS. La Fase 10 — Productización open-source está EN CURSO: 10.1 bootstrap demo reproducible desde clon limpio y 10.2 despliegue self-host standalone provider-neutral están COMPLETADOS; 10.3 contratos de extensión/adapters de referencia es la SIGUIENTE.**

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
- cambios de permisos auditados;
- regiones vivas accesibles para éxito/error, nombres contextuales en formularios repetidos y relaciones dirigidas con controles inválidos en workflows críticos de reservas/tareas/proveedores.

### Identidad, seguridad y observabilidad operativa

- registro/sesiones persistentes de cliente;
- autenticación separada Operator/Admin;
- separación de sesiones cliente/personal;
- tokens de sesión opacos almacenados únicamente como hash SHA-256, con expiración TTL y revocación server-side;
- cookies `HttpOnly`, `Secure` en producción, `SameSite=Lax` para cliente y `SameSite=Strict` para personal;
- bloqueo por intentos repetidos y throttling persistente MongoDB;
- buckets de rate limit con identificadores SHA-256, sin email ni IP en claro;
- cambio/recuperación de contraseña por SMTP con respuestas no enumerables;
- auditoría de autenticación;
- Content Security Policy y headers HTTP defensivos;
- HSTS y upgrade de requests inseguras en producción;
- comprobación de Origin confiable para mutaciones cookie-authenticated manteniendo firmas de proveedor en webhooks;
- `/api/health/live`, `/api/health/ready` y superficies versionadas para monitorización externa independiente;
- contrato `KTRAVEL_DEPLOYMENT_PROFILE=demo|live`;
- credenciales de pago y secretos de integración protegidos con keyring AES-256-GCM versionado y rotación escalonada;
- Traveller Data separado y cifrado con rotación/re-cifrado transaccional acotado;
- mutaciones privilegiadas unidas transaccionalmente a su evento persistente de auditoría;
- procedimiento neutral de backup/restore y disaster recovery MongoDB con drill real en base aislada;
- baseline aditivo de índices MongoDB validado mediante `explain("executionStats")` real;
- logs operativos JSON versionados con correlación segura;
- excepciones genéricas limitadas a tipo/código seguros;
- `FailureTransport` neutral opcional con allowlist explícita;
- fallos del collector nunca cambian la autoridad de reservas/pagos/integraciones/readiness.

### Privacidad y accesibilidad

- solicitudes autenticadas de acceso, rectificación, supresión, limitación, oposición y portabilidad;
- revisión solo Admin con plazos/prórrogas acotados y revisión explícita de retención;
- exports JSON aprobados de acceso/portabilidad con alcance de portabilidad más limitado y tratamiento fail-closed de datos protegidos;
- limitación y supresión controladas que preservan estructura necesaria de reserva/inventario/finanzas mientras anonimizan o seudonimizan identidad elegible;
- registry de retención para cada área del inventario de datos personales con estrategias `ttl`, case-review, business-record-review o security-review;
- holds prevalecen sobre expiración y el evaluador genérico nunca emite una orden automática de borrado legal;
- skip navigation bilingüe, foco visible, reduced motion/forced colors y checks de reflow estrecho;
- autenticación cliente, Traveller Data/privacidad, booking/pagos y workflows Operator con semántica estable `alert`/`status`;
- journeys Chromium dedicados y bloqueantes respaldados por MongoDB para slices críticos de accesibilidad;
- el trabajo de accesibilidad es un baseline de ingeniería, no una certificación: cada despliegue requiere revisión manual con teclado, lector de pantalla, contraste, zoom/reflow y contenido real.

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
- totales financieros agrupados por moneda;
- movimientos finalizados `succeeded` sincronizables downstream con ERP/contabilidad sin cambiar autoridad local.

### Documentos

- generación PDF server-side con `pdf-lib`;
- confirmaciones PDF cliente/Operator;
- manifiestos EN/ES y rooming lists;
- vouchers de alojamiento/servicio seguros para cliente;
- expediente consolidado interno;
- versión/estado del documento y timestamp UTC;
- finanzas internas solo con permiso Finanzas;
- sección proveedor solo con permiso Proveedores;
- referencias proveedor en vouchers únicamente tras aprobar la referencia exacta actual;
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
- auditoría sin guardar valores exportados;
- exportación protegida ligada a capacidades, reserva activa y motivo operativo;
- exportación protegida POST-only y fail-closed ante fallo de auditoría;
- métricas financieras agrupadas por moneda.

### Integraciones salientes

- workspace `/operator/integrations` exclusivo de Admin;
- eventos versionados neutrales de reservas;
- outbox transaccional confirmado junto con la mutación de origen;
- entregas idempotentes por evento/endpoint;
- adapter webhook HTTPS firmado HMAC-SHA256;
- secretos write-only cifrados;
- destinos HTTPS con rechazo de redes privadas/locales/reservadas y revalidación DNS;
- conexión a IP validada manteniendo SNI/Host original;
- redirects desactivados, timeout y respuesta limitados;
- leasing, recuperación, retries/backoff, historial y dead-letter;
- worker `POST /api/internal/integrations/process` server-only con Bearer;
- lock global durable para scheduler/ejecución manual;
- límites de lote/frecuencia y `Retry-After`;
- métricas y diagnóstico Admin;
- replay dead-letter auditado y retención limitada de éxitos antiguos;
- datos protegidos/secretos excluidos de diagnósticos;
- CRM y ERP/contabilidad reutilizan la misma infraestructura como destinos virtuales aislados.

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
- operaciones REST v1 `request`, `status` y `cancel`;
- respuestas auditadas antes de aplicación local;
- transiciones inválidas se registran y nunca se fuerzan;
- payload externo excluye totales cliente, ledger, costes, inventario y datos protegidos;
- referencias siguen internas hasta aprobación separada de voucher.

#### Sincronización CRM

- `CRM_SYNC_MODE=rest` activa un `CrmSyncAdapter` neutral y exclusivamente downstream;
- endpoints REST v1 de contactos y reservas;
- registro/perfil encolan eventos CRM transaccionalmente;
- eventos `customer.*` no están disponibles para webhooks genéricos;
- CRM reutiliza outbox/worker/retries/dead-letter/replay/métricas;
- allowlists excluyen pagos, proveedores, inventario mutable, arrays de viajeros y datos post-compra protegidos;
- IDs externos y auditoría sin PII se almacenan por separado;
- CRM no puede mutar reservas, pricing, inventario, fulfilment ni ledger local.

#### Sincronización ERP / contabilidad

- `ERP_ACCOUNTING_MODE=rest` activa un `ErpAccountingAdapter` neutral y exclusivamente downstream;
- solo movimientos locales `succeeded` son elegibles;
- movimiento y trigger ERP se confirman transaccionalmente;
- IDs/idempotency keys deterministas evitan duplicados downstream;
- eventos ERP quedan fuera de webhooks genéricos y CRM;
- IDs externos/auditoría se almacenan separadamente;
- acknowledgements ERP no pueden mutar reservas, inventario ni historial financiero;
- el contrato genérico representa movimientos preparados para contabilidad, no facturas legales específicas de jurisdicción.

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
logs JSON estructurados → FailureTransport REST opcional → stack de monitorización

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
/operator/staff                        personal/permisos

/api/health/live                       liveness
/api/health/ready                      readiness
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
SUPPLIER_FULFILMENT_ADAPTER_MODE=disabled
REST_SUPPLIER_FULFILMENT_BASE_URL=
REST_SUPPLIER_FULFILMENT_BEARER_TOKEN=
CRM_SYNC_MODE=disabled
REST_CRM_BASE_URL=
REST_CRM_BEARER_TOKEN=
ERP_ACCOUNTING_MODE=disabled
REST_ERP_ACCOUNTING_BASE_URL=
REST_ERP_ACCOUNTING_BEARER_TOKEN=
FAILURE_TRANSPORT_MODE=disabled
REST_FAILURE_TRANSPORT_URL=
REST_FAILURE_TRANSPORT_BEARER_TOKEN=
PAYMENT_SECRETS_KEY=
TRAVELLER_DATA_KEY=
INTEGRATION_SECRETS_KEY=
KTRAVEL_INTEGRATION_WORKER_TOKEN=
```

`KTRAVEL_DEPLOYMENT_PROFILE=live` convierte readiness en un contrato productivo estricto. Los Bearer tokens y claves de cifrado son server-only; los destinos REST productivos deben usar HTTPS. Las claves deben ser estables, de alta entropía y seguir el procedimiento documentado de keyring/rotación/re-cifrado. `NEXT_PUBLIC_*` nunca debe contener secretos.

## Documentación

- [`ROADMAP.es.md`](ROADMAP.es.md) — estado y prioridades.
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — fronteras de capacidad/evento/confianza.
- [`docs/BOOKING.md`](docs/BOOKING.md)
- [`docs/REST-BOOKING-ADAPTER.es.md`](docs/REST-BOOKING-ADAPTER.es.md)
- [`docs/SUPPLIER-FULFILMENT-ADAPTER.es.md`](docs/SUPPLIER-FULFILMENT-ADAPTER.es.md)
- [`docs/CRM-SYNC-ADAPTER.es.md`](docs/CRM-SYNC-ADAPTER.es.md)
- [`docs/ERP-ACCOUNTING-ADAPTER.es.md`](docs/ERP-ACCOUNTING-ADAPTER.es.md)
- [`docs/OPERATIONS.md`](docs/OPERATIONS.md)
- [`docs/PAYMENTS.md`](docs/PAYMENTS.md)
- [`docs/TRAVELLER-DATA.md`](docs/TRAVELLER-DATA.md)
- [`docs/REPORTING-EXPORTS.es.md`](docs/REPORTING-EXPORTS.es.md)
- [`docs/OUTBOUND-INTEGRATIONS.es.md`](docs/OUTBOUND-INTEGRATIONS.es.md)
- [`docs/INTEGRATION-OPERATIONS.es.md`](docs/INTEGRATION-OPERATIONS.es.md)
- [`docs/PRODUCTION-SECURITY.es.md`](docs/PRODUCTION-SECURITY.es.md) / [`docs/PRODUCTION-SECURITY.md`](docs/PRODUCTION-SECURITY.md)
- [`docs/OBSERVABILITY.es.md`](docs/OBSERVABILITY.es.md) / [`docs/OBSERVABILITY.md`](docs/OBSERVABILITY.md)
- [`docs/FAILURE-TRANSPORT.es.md`](docs/FAILURE-TRANSPORT.es.md) / [`docs/FAILURE-TRANSPORT.md`](docs/FAILURE-TRANSPORT.md)
- [`docs/ACCESSIBILITY-OPERATOR.es.md`](docs/ACCESSIBILITY-OPERATOR.es.md) / [`docs/ACCESSIBILITY-OPERATOR.md`](docs/ACCESSIBILITY-OPERATOR.md) — cierre de accesibilidad Operator, semántica de feedback/formularios y frontera de revisión manual.
- [`docs/PERFORMANCE-LOAD-READINESS.es.md`](docs/PERFORMANCE-LOAD-READINESS.es.md) / [`docs/PERFORMANCE-LOAD-READINESS.md`](docs/PERFORMANCE-LOAD-READINESS.md) — consolidado 9D-5 de latencia, throughput, supuestos de capacidad y seguimiento productivo.
- [`docs/PERFORMANCE-MUTATION-THROUGHPUT.es.md`](docs/PERFORMANCE-MUTATION-THROUGHPUT.es.md) / [`docs/PERFORMANCE-MUTATION-THROUGHPUT.md`](docs/PERFORMANCE-MUTATION-THROUGHPUT.md) — contención acotada de reservas/cancelaciones y corrección post-carga.
- [`docs/PERFORMANCE-RUNTIME-RESOURCE.es.md`](docs/PERFORMANCE-RUNTIME-RESOURCE.es.md) / [`docs/PERFORMANCE-RUNTIME-RESOURCE.md`](docs/PERFORMANCE-RUNTIME-RESOURCE.md) — baseline runtime RSS/descriptores/threads, recuperación ante pico y guía de capacidad.
- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md)
- [`docs/PRODUCTION-CHECKLIST.md`](docs/PRODUCTION-CHECKLIST.md)

## Quality gates

```bash
npm run verify
```

Además de los gates permanentes de dominios, seguridad e integraciones, el baseline actual incluye:

```text
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

CI realiza instalación limpia, invariantes deterministas, typecheck y build productivo. Jobs bloqueantes dedicados ejercitan replica sets MongoDB 8 reales, contratos HTTP locales, rollback de auditoría privilegiada, rotación de claves, backup/restore, planes de consulta, ejecución de privacidad, journeys críticos de accesibilidad en Chromium y los cuatro slices de rendimiento/carga: lecturas públicas, lecturas autenticadas, mutaciones acotadas y recuperación del runtime tras pico. El Browser E2E general registro → reserva → cliente → Operator sigue siendo informativo/no bloqueante por política; los browser gates específicos de accesibilidad son bloqueantes.

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
| Fase 8 — Integraciones externas | **Completada** |
| Fase 9A — Seguridad / operabilidad productiva | **Completada** |
| Fase 9B — Persistencia/concurrencia/contratos críticos | **Completada** |
| Fase 9C — Observabilidad, recuperación y auditoría privilegiada | **Completada** |
| Fase 9D-1 — Derechos de privacidad y revisión de retención | **Completada** |
| Fase 9D-2 — Acceso/portabilidad, limitación y supresión controlada | **Completada** |
| Fase 9D-3 — Baseline regulatorio de retención | **Completada** |
| Fase 9D-4 — Preparación de accesibilidad | **Completada** |
| Fase 9D-5 — Preparación de rendimiento/carga | **Completada** |
| Fase 9 — Baseline de ingeniería de endurecimiento productivo | **Completado; validación con credenciales proveedor pendiente** |
| Fase 10 — Productización open-source | **Siguiente** |

## Siguiente prioridad

El siguiente bloque es la **Fase 10 — Productización open-source**.

El baseline de ingeniería de endurecimiento productivo está completado. El siguiente trabajo debe facilitar adoptar, extender y publicar un clon limpio sin mezclar infraestructura exclusiva de Kairoseth dentro del core MIT:

- validar seed/setup demo limpio desde un clon nuevo;
- publicar instalación/despliegue desde clon limpio y un ejemplo opcional Docker/self-host;
- formalizar adapters de referencia y contratos de extensión para capacidades externas;
- definir convenciones versionadas de release y migraciones;
- añadir templates de contribución y documentación pública de API/extensiones;
- documentar reglas de trademark/branding entre el core open-source y Kairoseth Travel;
- mantener fuera del core público los adapters propietarios Kairoseth/cliente cuando corresponda.

El E2E TEST/LIVE Stripe/Redsys con credenciales sigue pendiente y debe incorporarse en cuanto existan cuentas proveedor adecuadas.

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
- CRM y ERP permanecen downstream y sin autoridad sobre reservas/inventario/ledger;
- ejecución programada autenticada server-side, limitada y observable;
- APIs externas deben cumplir contratos runtime, ownership, transiciones e idempotencia;
- CSP/headers, Origin checks, rate limiting y readiness permanecen como baseline permanente;
- observabilidad/failure transport no pueden filtrar PII, secretos, payloads raw, referencias provider ni importes en el canal genérico;
- monitorización externa nunca se convierte en autoridad ni dependencia por sí misma;
- accesibilidad automatizada no sustituye validación manual de cada despliegue;
- UX pública bilingüe y responsive;
- integraciones propietarias fuera del core MIT cuando corresponda.

## Licencia

MIT. Consulta [`LICENSE`](LICENSE).