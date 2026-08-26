# Open Travel Platform

<p align="center"><a href="./README.md">English</a> · <strong>Español</strong></p>

> Base open-source reutilizable para agencias, turoperadores y productos de reserva de viajes.

Open Travel Platform es una plataforma clean-room construida con **Next.js + TypeScript + MongoDB** y organizada alrededor de límites explícitos de dominio, repositorios y adapters. Puede ejecutarse con datos demo para evaluación local o con catálogo, identidad, reservas, alojamiento, servicios, operaciones y pagos persistentes.

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

- Open Travel Platform sigue siendo reutilizable, neutral respecto a proveedores y útil para otras agencias/desarrolladores;
- Kairoseth Travel puede añadir hosting gestionado, soporte, servicios comerciales, integraciones privadas y capacidades específicas del despliegue;
- datos de clientes, credenciales productivas e integraciones propietarias permanecen fuera del repositorio público.

## Posición actual

La plataforma está muy por encima del MVP original de catálogo/reserva. La implementación actual incluye:

- catálogo público y backoffice Operator bilingües;
- persistencia MongoDB;
- autenticación persistente de clientes/personal con RBAC y capacidades granulares;
- salidas de viaje e inventario transaccional;
- viajeros, menores y pricing por edad;
- actividades, transporte y protección de viaje independientes;
- disponibilidad y reservas independientes de servicios;
- ledger de pagos neutral, depósitos, cuotas y condiciones de pago;
- adapters Stripe/Redsys detrás de una capa de checkout unificada;
- datos post-compra de viajeros cifrados;
- modificaciones de reserva con auditoría y reasignación segura de inventario;
- alojamiento reutilizable, inventario de habitaciones, pricing estacional/ocupación y alojamiento transaccional dentro del viaje;
- suplementos opcionales de paquete y modificaciones post-reserva de suplementos;
- workflow avanzado de Operator con responsable, notas internas, prioridades, tags, tareas/seguimientos, fulfilment de proveedores y colas avanzadas;
- permisos granulares para reservas, catálogo, finanzas, datos protegidos de viajeros, proveedores y tareas;
- PDFs de confirmación para cliente y Operator;
- manifiestos de viajeros y rooming lists PDF por salida.

La validación end-to-end con credenciales Stripe/Redsys sigue pendiente hasta disponer de cuentas adecuadas. Los adapters y el checkout están implementados, pero la capacidad de pago productiva no se considera validada hasta probar TEST/LIVE con proveedores reales.

**Fase actual de entrega: Fase 7B — Documentos, exportaciones y reporting. 7B-1 PDFs de confirmación y 7B-2 listas de viajeros/rooming lists están completadas. La siguiente prioridad es 7B-3 vouchers y expediente imprimible de reserva.**

## Capacidades actuales

### Catálogo público y comercio

- experiencia pública EN/ES;
- destinos y viajes localizados;
- salidas públicas y disponibilidad en vivo;
- catálogo público de alojamientos y detalle;
- galerías generales y por habitación;
- catálogos independientes de **Actividades**, **Transporte** y **Protección de viaje**;
- detalle de servicios con disponibilidad y pricing;
- booking de viaje con viajeros, alojamiento y extras opcionales;
- autenticación del cliente solo cuando la cuenta/reserva la requiere.

### Backoffice de catálogo e inventario

- gestión protegida Operator/Admin;
- destinos, viajes, alojamientos, habitaciones y servicios independientes;
- biblioteca GridFS, portadas, galerías y puntos focales;
- itinerarios estructurados multidioma;
- salidas, capacidades e inventario del viaje;
- inventario de alojamiento, ocupación, regímenes y tarifas;
- reglas estacionales y por ocupación;
- vínculo viaje ↔ alojamiento;
- suplementos opcionales de paquete;
- calendarios de disponibilidad/inventario de servicios;
- ciclo draft/published;
- requisitos post-compra del viajero configurables por producto.

### Reservas, viajeros y composición de paquete

- reservas persistentes de viaje y servicios independientes;
- pricing e inventario autoritativos en servidor;
- viajero principal y fichas individuales;
- bandas de edad, reglas de tutor y consumo de inventario configurables;
- snapshots históricos de viajeros/pricing;
- alojamiento reutilizable guardado transaccionalmente como snapshot dentro de la reserva;
- suplementos opcionales guardados con el precio contratado;
- workflows de confirmar/cancelar y auditoría;
- correcciones de viajeros y cambios de salida como modificaciones explícitas;
- modificaciones post-reserva de suplementos;
- delta financiero sin reescribir movimientos históricos;
- plazos configurables de cambio/cancelación.

### Workflow avanzado de Operator

- asignación de responsable/operador;
- notas internas fuera de cualquier superficie de cliente;
- prioridad baja / normal / alta / urgente y tags normalizados;
- timeline operativo;
- tareas y seguimientos con responsable, vencimiento, estado y comentarios;
- fulfilment por componente de viaje/servicio/alojamiento;
- estados de confirmación, plazos, referencias y costes internos opcionales de proveedor;
- búsqueda, filtros, colas rápidas, orden y paginación avanzados;
- capacidades granulares server-side;
- cambios de permisos auditados.

### Identidad y seguridad

- registro y sesión persistentes de cliente;
- autenticación separada Operator/Admin;
- separación de sesiones cliente/personal;
- bloqueo tras intentos repetidos;
- cambio y recuperación de contraseña;
- emails SMTP de recuperación;
- auditoría de autenticación;
- secretos de pasarela cifrados con AES-256-GCM;
- datos avanzados del viajero almacenados aparte y cifrados con AES-256-GCM;
- configuración privilegiada y datos sensibles protegidos por capacidades server-side.

### Pagos y finanzas

- ledger de pagos/reembolsos neutral respecto al proveedor;
- estado de reserva independiente del estado de pago;
- unpaid / pending / partially paid / paid / partially refunded / refunded;
- transferencia, efectivo y terminal externo;
- reembolsos controlados y protecciones de conciliación;
- Stripe Checkout con webhook firmado e idempotencia;
- Redsys redirect con notificación de servidor firmada;
- los retornos del navegador nunca confirman pagos;
- perfiles TEST/LIVE gestionados por Admin;
- snapshots de pago completo, depósito y cuotas;
- cálculo de saldo pendiente y próximo pago.

### Documentos

- generación PDF reutilizable server-side con `pdf-lib`;
- PDF de confirmación de reserva propia para cliente;
- PDF protegido de confirmación para Operator;
- render EN/ES;
- información financiera solo cuando la capacidad del personal lo permite;
- manifiestos de viajeros por salida;
- rooming lists derivadas del snapshot de alojamiento;
- endpoints PDF privados `no-store` y nombres de archivo seguros;
- datos documentales protegidos del viajero, notas internas y costes de proveedor excluidos de renderers orientados al cliente.

## Arquitectura

```text
Catálogo público
      |
TravelRepository
      |
destinos + viajes + alojamiento + servicios
      |
      +---------------- salidas / inventario viaje
      |                         |
      |                  BookingRepository
      |                         |
      |                   reservas viaje
      |                         |
      |                 booking alojamiento
      |                         |
      |                inventario habitación
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

Los payloads específicos de proveedores permanecen dentro de adapters. Catálogo, booking, alojamiento, identidad, reservas de servicios, operaciones, documentos y pagos se mantienen como límites reemplazables.

## Reserva y pago son estados independientes

Una reserva es un registro comercial. Un pago es un movimiento financiero. Uno no reescribe silenciosamente al otro.

Ejemplos:

- una reserva puede estar `confirmed` y seguir `unpaid`;
- una reserva puede estar `pending` y ya estar `paid`;
- una cancelación puede seguir pagada hasta registrar un reembolso explícito;
- una modificación puede aumentar el total y generar saldo pendiente;
- una modificación puede reducir el total por debajo de lo pagado y generar revisión de reembolso.

Consulta [`docs/PAYMENTS.md`](docs/PAYMENTS.md).

## Inicio rápido

Requiere **Node.js 24 LTS**.

```bash
git clone https://github.com/Emmakex/open-travel-platform.git
cd open-travel-platform
npm install
cp .env.example .env.local
npm run dev
```

Abre `http://localhost:3000`.

Un clon nuevo puede utilizar los modos demo/read-only seguros documentados en `.env.example`. MongoDB, SMTP y pagos persistentes son integraciones opcionales.

## Rutas principales

```text
/                                      inicio
/destinations                          destinos
/destinations/[slug]                   detalle destino
/trips                                 viajes
/trips/[slug]                          detalle viaje
/trips/[slug]/book                     reserva viaje
/accommodations                        alojamientos
/accommodations/[slug]                 detalle alojamiento
/services                              hub servicios
/activities                            actividades
/transport                             transporte
/insurance                             protección de viaje
/services/book/[type]/[slug]           reserva servicio independiente

/account/sign-in                       login cliente
/account                               Mi cuenta
/account/reservations                  reservas de viaje
/account/reservations/[id]             detalle reserva
/account/services                      reservas de servicios
/account/services/[id]                 detalle servicio
/account/traveller-data/[targetType]/[id] datos post-compra del viajero
/account/checkout/[targetType]/[id]    checkout online
/account/security                      seguridad cliente

/operator/sign-in                      login personal
/operator                              dashboard operaciones
/operator/reservations                 cola reservas viaje
/operator/service-reservations         cola servicios
/operator/customers                    clientes
/operator/catalogue                    catálogo
/operator/catalogue/accommodations     alojamientos
/operator/media                        biblioteca multimedia
/operator/documents                    workspace documentos de reserva/salida
/operator/tasks                        tareas y seguimientos
/operator/fulfilment                   cola de proveedores
/operator/payments                     finanzas
/operator/payments/providers           PSP solo Admin
/operator/security                     seguridad personal
/operator/staff                        personal y capacidades
```

## Configuración

La plantilla completa está en [`.env.example`](.env.example).

```text
KTRAVEL_PUBLIC_URL=https://travel.kairoseth.com

MONGODB_URI=
MONGODB_DB_NAME=ktravel

IDENTITY_MODE=demo
STAFF_AUTH_MODE=demo
BOOKING_MODE=demo
OPERATIONS_MODE=demo

SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM_EMAIL=
SMTP_FROM_NAME=Kairoseth Travel
KTRAVEL_OPERATIONS_EMAILS=

PAYMENT_SECRETS_KEY=
TRAVELLER_DATA_KEY=
```

`PAYMENT_SECRETS_KEY` y `TRAVELLER_DATA_KEY` deben ser claves estables de alta entropía de 32 bytes. No deben rotarse sin plan de migración.

Las credenciales Stripe/Redsys se gestionan desde Admin. Las variables `NEXT_PUBLIC_*` son visibles en navegador y nunca deben contener secretos.

## Documentación

- [`ROADMAP.es.md`](ROADMAP.es.md) — estado actual y siguientes prioridades.
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — límites de capacidades y confianza.
- [`docs/BOOKING.md`](docs/BOOKING.md) — integridad de reservas y adapters.
- [`docs/OPERATIONS.md`](docs/OPERATIONS.md) — autorización y workflows.
- [`docs/CATALOGUE-BACKOFFICE.md`](docs/CATALOGUE-BACKOFFICE.md) — catálogo persistente.
- [`docs/DEPARTURES.md`](docs/DEPARTURES.md) — inventario de salidas.
- [`docs/MEDIA.md`](docs/MEDIA.md) — biblioteca multimedia.
- [`docs/PAYMENTS.md`](docs/PAYMENTS.md) — ledger y contrato PSP.
- [`docs/TRAVELLER-DATA.md`](docs/TRAVELLER-DATA.md) — datos post-compra.
- [`docs/ACCOMMODATION.md`](docs/ACCOMMODATION.md) — alojamiento, ocupación, pricing e inventario.
- [`docs/TRIP-PACKAGE-ADDONS.es.md`](docs/TRIP-PACKAGE-ADDONS.es.md) — suplementos y modificaciones.
- [`docs/STAFF-PERMISSIONS.es.md`](docs/STAFF-PERMISSIONS.es.md) — capacidades granulares del personal.
- [`docs/BOOKING-DOCUMENTS.es.md`](docs/BOOKING-DOCUMENTS.es.md) — PDFs de confirmación.
- [`docs/DEPARTURE-DOCUMENTS.es.md`](docs/DEPARTURE-DOCUMENTS.es.md) — listas de viajeros y rooming lists.
- [`docs/ADAPTER-GUIDE.md`](docs/ADAPTER-GUIDE.md) — nuevas integraciones.
- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) — despliegue.
- [`docs/PRODUCTION-CHECKLIST.md`](docs/PRODUCTION-CHECKLIST.md) — revisión productiva.

## Quality gates

La validación completa se ejecuta con:

```bash
npm run verify
```

Actualmente incluye:

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
typecheck
build
```

CI hace instalación limpia, ejecuta invariantes, typecheck, build productivo, smoke validation y auditoría de dependencias.

## Estado del proyecto

| Área | Estado |
|---|---|
| Foundation, arquitectura y CI | Completado |
| Catálogo bilingüe + backoffice/media MongoDB | Completado |
| Identidad/seguridad persistente cliente/personal | Completado |
| Reservas e inventario transaccional viaje/servicios | Completado |
| Viajeros, menores y pricing por edad | Completado |
| Ledger neutral y condiciones de pago | Completado |
| Checkout Stripe/Redsys | Implementado; E2E con credenciales pendiente |
| Datos post-compra cifrados | Completado |
| Modificaciones de reserva y delta financiero | Completado |
| Alojamiento y composición de paquetes | Completado |
| Operaciones diarias avanzadas de Operator | Completado |
| Permisos granulares del personal | Completado |
| PDFs de confirmación de reserva | Completado |
| Manifiestos de viajeros y rooming lists PDF | Completado |
| Vouchers y expediente imprimible de reserva | **Siguiente — Fase 7B-3** |

El trabajo futuro está en **[ROADMAP.md](ROADMAP.md)** · **[ROADMAP.es.md](ROADMAP.es.md)**.

## Siguiente prioridad de desarrollo

El siguiente bloque es **Fase 7B-3 — Vouchers y expediente imprimible de reserva**:

- vouchers de alojamiento;
- vouchers de servicios independientes;
- referencias de proveedor orientadas al cliente solo cuando estén configuradas explícitamente para divulgación;
- expediente consolidado imprimible para Operator;
- fecha/hora de generación y versión/estado explícitos;
- invariantes permanentes de privacidad y PDF en CI.

Después de 7B-3, la Fase 7B-4 cubre exportaciones CSV/XLSX, conciliación de pagos, saldos pendientes y reporting operativo/comercial.

## Principios del proyecto

- implementación clean-room;
- interfaces neutrales respecto a proveedores;
- operaciones cliente/personal autorizadas server-side;
- pricing, inventario, ownership y transiciones validados en servidor;
- snapshots históricos preservan valores contratados de viajeros, alojamiento, paquete y finanzas;
- estado de reserva separado del estado de pago;
- datos avanzados de viajeros solo post-compra cuando son necesarios;
- servicios con inventario independientes de suplementos ligeros;
- documentos orientados al cliente excluyen notas internas, datos protegidos del viajero y costes de proveedor;
- UX pública bilingüe, responsive y sin terminología interna;
- integraciones propietarias Kairoseth/cliente fuera del core MIT cuando corresponda.

## Licencia

MIT. Consulta [`LICENSE`](LICENSE).
