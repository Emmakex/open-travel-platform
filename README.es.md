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
- PDFs de confirmación, manifiestos de viajeros y rooming lists;
- vouchers de alojamiento/servicios seguros para cliente y expediente imprimible interno;
- aprobación explícita/auditada de referencias proveedor antes de mostrarlas en vouchers de cliente;
- exportaciones CSV/XLSX de reservas, servicios y clientes según permisos;
- conciliación de pagos, saldos pendientes e ingresos por producto/servicio;
- exportación fail-closed y auditada de datos protegidos del viajero para uso operativo legítimo;
- auditoría de exportaciones sin persistir los valores de las celdas exportadas;
- finanzas y reporting multimoneda sin sumar monedas diferentes entre sí;
- eventos salientes neutrales para reservas con outbox transaccional MongoDB;
- webhooks HTTPS firmados gestionados por Admin, secretos cifrados, reintentos limitados, historial de entregas y retención dead-letter;
- protecciones SSRF/DNS rebinding para destinos webhook configurables.

La validación E2E con credenciales Stripe/Redsys sigue pendiente hasta disponer de cuentas adecuadas. Los adapters están implementados, pero la capacidad productiva no se considera validada hasta probar TEST/LIVE.

**La Fase 8A — Integraciones salientes neutrales respecto a proveedor está completada. El siguiente bloque de entrega es la Fase 8B — ejecución programada, replay y observabilidad de integraciones.**

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
- secretos de firma de integraciones salientes cifrados con una clave maestra AES-256-GCM dedicada;
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
- totales del dashboard financiero separados por moneda y nunca sumados entre monedas diferentes.

### Documentos

- generación PDF server-side con `pdf-lib`;
- confirmaciones PDF para cliente/Operator;
- manifiestos EN/ES y rooming lists por salida;
- vouchers de alojamiento para reservas confirmadas elegibles;
- vouchers de servicio para actividades, transporte y protección confirmados;
- expediente consolidado interno para Operator;
- versión/estado del documento y timestamp UTC;
- datos financieros en documentos internos solo con permiso Finanzas;
- sección de proveedores solo con permiso Proveedores;
- referencia proveedor en voucher cliente solo tras aprobar explícitamente la referencia exacta actual;
- cambiar el localizador invalida automáticamente la aprobación anterior;
- aprobaciones de referencia guardadas separadamente y auditadas;
- notas internas, costes proveedor y valores post-compra protegidos excluidos de renderers de cliente;
- endpoints PDF privados `no-store` + `nosniff` y nombres seguros.

### Informes y exportaciones

- workspace protegido `/operator/reports`;
- exportaciones CSV/XLSX de reservas de viaje, reservas de servicios y clientes;
- filtros server-side por fecha de creación y límites de tamaño para descargas desde navegador;
- exportaciones de conciliación, saldos pendientes/cuotas vencidas e ingresos por producto/servicio solo con permiso Finanzas;
- misma definición tipada de columnas para los renderers CSV y XLSX;
- mitigación de inyección de fórmulas en datos controlados por usuarios;
- XLSX OOXML ligero con cabecera congelada y autofiltro;
- respuestas privadas `no-store` + `nosniff`;
- auditoría con actor, tipo, formato, filtros, columnas, número de filas y timestamp, sin guardar valores exportados;
- exportación de datos protegidos exige simultáneamente permisos Datos de viajeros + Reservas, una reserva activa y un motivo operativo explícito;
- exportación protegida exclusivamente por POST y fail-closed: la auditoría persistente debe guardarse antes de devolver los bytes sensibles;
- métricas financieras e ingresos agrupados siempre por moneda.

### Integraciones salientes

- workspace `/operator/integrations` exclusivo de Admin;
- eventos versionados y neutrales para creación/cambio de estado de reservas de viaje y servicio;
- outbox transaccional confirmado junto con la modificación de la reserva;
- entregas idempotentes por pareja evento/endpoint;
- adapter webhook HTTPS firmado con HMAC-SHA256;
- secretos write-only cifrados mediante `INTEGRATION_SECRETS_KEY`;
- destinos exclusivamente HTTPS, rechazo de redes privadas/locales/reservadas y revalidación DNS antes de entregar;
- conexión al IP validado conservando el hostname original para TLS SNI y HTTP Host;
- redirects desactivados, timeout y tamaño de respuesta limitados;
- leasing de entregas, recuperación tras caída, reintentos/backoff, historial de intentos y dead-letter;
- valores post-compra protegidos del viajero excluidos del contrato genérico;
- procesador manual y limitado desde Admin, preparado para un scheduler del despliegue en Fase 8B.

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
                                           |
                       documentos / informes / fulfilment / tareas
                                           |
                              outbox transaccional
                                           |
                         adapters de integración saliente
```

Los payloads específicos de proveedor permanecen dentro de adapters. Catálogo, reservas, alojamiento, identidad, servicios, operaciones, documentos, reporting, pagos e integraciones externas conservan fronteras reemplazables.

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
/operator/reports                      informes y exportaciones CSV/XLSX
/operator/tasks                        tareas
/operator/fulfilment                   proveedores
/operator/payments                     finanzas
/operator/payments/providers           PSP solo Admin
/operator/integrations                 integraciones salientes solo Admin
/operator/staff                        personal/permisos
```

## Configuración

La plantilla completa vive en [`.env.example`](.env.example). Los secretos nunca deben usar `NEXT_PUBLIC_*`.

Claves maestras server-only relevantes:

```text
PAYMENT_SECRETS_KEY=
TRAVELLER_DATA_KEY=
INTEGRATION_SECRETS_KEY=
```

Deben ser claves estables de alta entropía y 32 bytes. No deben rotarse sin un plan de migración/re-cifrado.

## Documentación

- [`ROADMAP.es.md`](ROADMAP.es.md) — estado y prioridades.
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- [`docs/BOOKING.md`](docs/BOOKING.md)
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
typecheck
build
```

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
| PDFs de confirmación | Completado |
| Manifiestos y rooming lists | Completado |
| Vouchers y expediente imprimible | Completado |
| CSV/XLSX y conciliación/reporting | Completado |
| Fase 7B — Documentos, exportaciones y reporting | **Completada** |
| Fase 8A — Integraciones salientes neutrales | **Completada** |

## Siguiente prioridad

El siguiente bloque es la **Fase 8B — ejecución programada, replay y observabilidad de integraciones**.

La frontera común de eventos/outbox/webhook ya existe. Ahora toca operar esta capa sin depender de una acción manual de Admin:

- entry point scheduler/worker con autenticación server-only;
- límites de lote/frecuencia;
- replay/requeue auditado de dead-letter;
- detalle Admin de eventos y entregas;
- métricas de salud de la cola y visibilidad de fallos;
- reglas de retención del historial completado.

Después, la Fase 8C podrá añadir adapters de proveedores/reservas, CRM, ERP/contabilidad, CMS y REST genérico sobre la misma frontera neutral.

La validación TEST/LIVE de Stripe/Redsys se insertará cuando existan cuentas proveedor adecuadas y no necesita bloquear la Fase 8.

## Principios

- implementación clean-room;
- neutralidad respecto a proveedores;
- autorización server-side;
- pricing/inventario/transiciones validados en servidor;
- snapshots históricos de valores contratados;
- estado de reserva separado del pago;
- datos avanzados solo post-compra cuando aplican;
- documentos de cliente sin notas internas, datos protegidos ni costes proveedor;
- exportaciones sensibles limitadas por permisos, finalidad operativa y auditoría persistente antes de entregarse;
- eventos salientes genéricos sin datos protegidos del viajero ni payloads específicos de proveedor;
- UX pública bilingüe y responsive;
- integraciones propietarias fuera del core MIT cuando corresponda.

## Licencia

MIT. Consulta [`LICENSE`](LICENSE).