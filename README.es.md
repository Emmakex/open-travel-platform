# Open Travel Platform

<p align="center"><a href="./README.md">English</a> · <strong>Español</strong></p>

> Base open-source reutilizable para agencias, turoperadores y productos de reserva de viajes.

Open Travel Platform es una plataforma clean-room construida con **Next.js + TypeScript + MongoDB** y organizada alrededor de límites explícitos de dominio, repositorios y adapters.

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
- PDFs de confirmación de reserva;
- manifiestos de viajeros y rooming lists;
- vouchers de alojamiento/servicios seguros para cliente;
- expediente imprimible interno de Operator;
- aprobación explícita y auditada de referencias proveedor antes de mostrarlas en vouchers de cliente.

La validación E2E con credenciales Stripe/Redsys sigue pendiente hasta disponer de cuentas adecuadas. Los adapters están implementados, pero la capacidad productiva no se considera validada hasta probar TEST/LIVE.

**Fase actual: Fase 7B — Documentos, exportaciones y reporting. 7B-1 confirmaciones, 7B-2 listas de viajeros/rooming lists y 7B-3 vouchers/expediente están completadas. La siguiente prioridad es 7B-4 exportaciones CSV/XLSX y reporting/conciliación.**

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
- cálculo de saldo pendiente y próximo pago.

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
                            documentos / fulfilment / tareas
```

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
/operator/tasks                        tareas
/operator/fulfilment                   proveedores
/operator/payments                     finanzas
/operator/payments/providers           PSP solo Admin
/operator/staff                        personal/permisos
```

## Configuración

La plantilla completa vive en [`.env.example`](.env.example). Los secretos nunca deben usar `NEXT_PUBLIC_*`.

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
| CSV/XLSX y conciliación/reporting | **Siguiente — Fase 7B-4** |

## Siguiente prioridad

**Fase 7B-4 — Exportaciones CSV/XLSX y reporting/conciliación**:

- exportaciones de reservas y servicios;
- exportaciones de clientes;
- conciliación de pagos y saldos pendientes;
- exportación segura/auditada de datos de viajeros para uso operativo legítimo;
- ingresos por producto/servicio;
- bases de dashboards operativos/comerciales.

La validación TEST/LIVE de Stripe/Redsys se insertará cuando existan cuentas proveedor adecuadas y no bloquea 7B-4.

## Principios

- implementación clean-room;
- neutralidad respecto a proveedores;
- autorización server-side;
- pricing/inventario/transiciones validados en servidor;
- snapshots históricos de valores contratados;
- estado de reserva separado del pago;
- datos avanzados solo post-compra cuando aplican;
- documentos de cliente sin notas internas, datos protegidos ni costes proveedor;
- UX pública bilingüe y responsive;
- integraciones propietarias fuera del core MIT cuando corresponda.

## Licencia

MIT. Consulta [`LICENSE`](LICENSE).
