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

El proyecto ya ha superado claramente el MVP de catálogo/reserva. La implementación actual incluye:

- catálogo público y backoffice Operator bilingües;
- persistencia MongoDB;
- autenticación de clientes/personal con RBAC;
- salidas de viaje e inventario transaccional;
- viajeros, menores y pricing por edad;
- actividades, transporte y protección de viaje independientes;
- disponibilidad y reservas independientes de servicios;
- ledger financiero, depósitos, cuotas y condiciones de pago;
- adapters Stripe/Redsys detrás de un checkout neutral respecto al proveedor;
- datos post-compra de viajeros cifrados;
- modificaciones de reserva con auditoría y reasignación segura de inventario;
- alojamiento reutilizable con habitaciones, ocupación, pricing, galerías e inventario;
- alojamiento vinculado a viajes y reservado transaccionalmente junto con el viaje;
- pricing estacional y por ocupación;
- suplementos opcionales de paquete calculados y guardados como snapshot dentro de la reserva.

La validación end-to-end con credenciales Stripe/Redsys sigue pospuesta hasta disponer de cuentas adecuadas. Los adapters y el checkout están implementados, pero la capacidad de pago productiva no debe considerarse validada hasta probar TEST/LIVE con los proveedores reales.

## Capacidades actuales

### Catálogo público y comercio

- experiencia pública EN/ES;
- destinos y viajes localizados;
- salidas públicas y disponibilidad en vivo;
- catálogo público de alojamientos;
- galerías generales del alojamiento y galerías por habitación;
- catálogos públicos independientes de **Actividades**, **Transporte** y **Protección de viaje**;
- detalle de servicios con disponibilidad y pricing;
- booking de viaje con viajeros, alojamiento y extras opcionales del paquete;
- autenticación del cliente solo cuando es necesaria para cuenta/reserva.

### Backoffice de catálogo

- gestión protegida para Operator/Admin;
- destinos y viajes;
- alojamientos y tipos de habitación;
- portadas, galerías, biblioteca multimedia GridFS y puntos focales;
- galerías del establecimiento y por habitación;
- itinerarios estructurados multidioma;
- salidas, capacidad e inventario del viaje;
- periodos de inventario de habitaciones;
- reglas de ocupación;
- tarifas base y régimen alimenticio;
- pricing estacional y por ocupación;
- vínculo viaje ↔ alojamiento;
- suplementos opcionales de paquete;
- actividad, transporte y protección de viaje independientes;
- pricing de servicios por persona, reserva, unidad o edad;
- calendarios de disponibilidad/inventario para actividad y transporte;
- ciclo draft/published;
- activación por producto de requisitos post-compra del viajero.

### Viajeros y pricing

- viajero principal y fichas individuales;
- fecha de nacimiento y nacionalidad;
- edad calculada contra la fecha relevante de salida/servicio/check-in;
- bandas de edad configurables;
- pricing autoritativo en servidor;
- overrides por salida;
- relación con adulto responsable para menores;
- consumo de inventario configurable por banda;
- snapshots históricos de precios;
- datos avanzados post-compra opcionales y cifrados;
- plazos de retención y borrado TTL en MongoDB.

### Alojamiento y composición de paquete

El alojamiento es un dominio reutilizable; no se incrusta dentro de un único viaje.

- un alojamiento puede utilizarse en múltiples viajes;
- un viaje puede contener varias estancias;
- habitaciones tipo individual/doble/twin/triple/familiar/suite/otra;
- régimen y tarifa base por noche;
- límites de adultos/niños y ocupación total;
- inventario por periodos;
- galería del establecimiento y galerías independientes por habitación;
- ajustes estacionales fijos o porcentuales;
- reglas de ocupación, incluyendo suplemento individual y ajustes por niño compartiendo;
- previsión de precio de paquete por salida;
- distribución automática de viajeros en habitaciones durante la reserva;
- selección del mínimo número válido de habitaciones;
- consumo/liberación transaccional del inventario hotelero junto con el inventario del viaje;
- alojamiento incluido guardado como snapshot sin cobrarse dos veces;
- alojamiento opcional añadido al total;
- cambios de salida recalculan y reasignan el alojamiento de forma segura;
- snapshots de alojamiento estables aunque después cambie el catálogo.

### Suplementos opcionales de paquete

Los viajes pueden incluir extras comerciales ligeros que **no necesitan inventario propio por fecha/cupo**.

Ejemplos: upgrade de equipaje, upgrade privado, cena especial u otros suplementos sin capacidad propia.

- títulos/descripciones EN/ES;
- cobro una vez por reserva o por viajero seleccionado;
- activación/desactivación para cliente;
- selección y cálculo autoritativos en servidor;
- opciones desactivadas, inexistentes o manipuladas son rechazadas;
- booking muestra extras separados del alojamiento;
- snapshot guarda título, modo de cobro, precio unitario, cantidad, viajeros y total;
- cambios posteriores de catálogo no alteran reservas antiguas;
- el cambio de salida conserva el suplemento contratado.

Las actividades con cupo, transporte con inventario y otros servicios fechados siguen siendo reservas independientes.

### Reservas y modificaciones

- reservas persistentes de viajes;
- reservas persistentes de servicios independientes;
- servicios vinculables a un viaje Kairoseth o completamente independientes;
- consumo/liberación de inventario transaccional donde aplica;
- historial de reservas/servicios del cliente;
- colas de viajes y servicios para Operator;
- confirmación/cancelación y auditoría;
- correcciones de viajeros registradas como modificaciones;
- cambio de salida reservando primero la nueva capacidad y liberando después la antigua;
- movimiento del inventario hotelero dentro de la misma transacción;
- delta financiero calculado sin reescribir movimientos históricos del ledger;
- exceso pagado genera revisión de reembolso, no devolución automática;
- plazos configurables de modificación/cancelación;
- notificaciones al cliente en cambios configurados;
- servicios vinculados conservan su propio ciclo y condiciones.

### Identidad y seguridad

- registro/sesión persistente del cliente;
- autenticación separada Operator/Admin con RBAC;
- sesiones cliente/personal separadas;
- bloqueo tras intentos repetidos;
- cambio y recuperación de contraseña;
- emails SMTP de recuperación;
- auditoría de autenticación;
- configuración de PSP restringida a Admin;
- secretos de pasarela cifrados con AES-256-GCM;
- datos avanzados de viajeros almacenados aparte y cifrados con AES-256-GCM.

### Email transaccional

- SMTP server-side;
- emails de reserva recibida;
- confirmación/cancelación;
- desglose de viajeros y precios;
- notificaciones configuradas de modificaciones;
- emails de reservas de servicios;
- recuperación de contraseña.

### Pagos y finanzas

- ledger de pagos/reembolsos neutral respecto al proveedor;
- estado de reserva separado del estado de pago;
- unpaid / pending / partially paid / paid / partially refunded / refunded;
- transferencia, efectivo y terminal externo;
- reembolsos controlados y protecciones de conciliación;
- mismo ledger para viajes y servicios;
- checkout unificado;
- Stripe Checkout con webhook firmado e idempotencia;
- Redsys redirect con validación de notificación firmada;
- las URLs de retorno del navegador nunca confirman el pago;
- perfiles TEST/LIVE gestionados por Admin;
- snapshots de pago completo, depósito y cuotas;
- saldos pendientes y próximos pagos calculados server-side;
- modificaciones pueden crear saldo adicional o importe a revisar para devolución sin tocar movimientos antiguos.

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
```

Los payloads específicos de proveedores se mantienen dentro de adapters. Catálogo, reservas, alojamiento, identidad, servicios, operaciones y pagos permanecen como límites reemplazables.

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
/activities/[slug]                     detalle actividad
/transport                             transporte
/transport/[slug]                      detalle transporte
/insurance                             protección de viaje
/insurance/[slug]                      detalle protección
/services/book/[type]/[slug]           reserva servicio independiente

/account/sign-in                       login cliente
/account                               Mi cuenta
/account/reservations                  reservas de viaje
/account/reservations/[id]             reserva + viajeros + alojamiento + extras + finanzas
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
/operator/payments                     finanzas
/operator/payments/providers           PSP solo Admin
/operator/security                     seguridad personal
/operator/staff                        gestión de personal
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

`PAYMENT_SECRETS_KEY` y `TRAVELLER_DATA_KEY` deben ser claves estables de alta entropía de 32 bytes. No deben rotarse sin un plan de migración porque protegen registros persistidos.

Las credenciales Stripe/Redsys se gestionan desde Admin y no necesitan variables de entorno propias.

Las variables `NEXT_PUBLIC_*` son visibles en navegador y nunca deben contener secretos.

## Datos persistentes

Los despliegues MongoDB mantienen límites separados para catálogo, salidas, reservas de viaje, alojamiento/inventario, servicios/disponibilidad/reservas, pagos, auditoría, identidad/autenticación, configuración de proveedores y datos cifrados de viajeros.

Las credenciales de infraestructura y detalles sensibles no se exponen en la UI pública/Operator.

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
- [`docs/PACKAGE-SUPPLEMENTS.md`](docs/PACKAGE-SUPPLEMENTS.md) — extras opcionales y snapshots.
- [`docs/ADAPTER-GUIDE.md`](docs/ADAPTER-GUIDE.md) — nuevas integraciones.
- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) — despliegue.
- [`docs/PRODUCTION-CHECKLIST.md`](docs/PRODUCTION-CHECKLIST.md) — revisión productiva.

## Quality gates

```bash
npm run check:safety
npm run check:ux
npm run check:release
npm run check:amendments
npm run check:accommodation
npm run check:supplements
npm run typecheck
npm run build
npm run verify
```

CI resuelve el lock de dependencias, hace instalación limpia, ejecuta safety/UX/release, valida invariantes de modificaciones, alojamiento y suplementos, ejecuta TypeScript, build productivo, smoke tests HTTP y auditoría de dependencias.

## Estado del proyecto

| Área | Estado |
|---|---|
| Foundation, arquitectura y CI | Completado |
| Catálogo público bilingüe | Completado |
| Backoffice MongoDB y multimedia | Completado |
| Identidad/seguridad cliente/personal | Completado |
| Reservas de viaje e inventario | Completado |
| Viajeros, menores y pricing por edad | Completado |
| Actividades / transporte / protección independientes | Completado |
| Disponibilidad y reservas de servicios | Completado |
| Base Operator/Admin y auditoría | Completado |
| Email transaccional | Completado |
| Ledger financiero neutral | Completado |
| Configuración TEST/LIVE Stripe/Redsys | Completado |
| Checkout Stripe/Redsys | Implementado; E2E con credenciales pendiente |
| Depósitos / cuotas / condiciones de pago | Completado |
| Datos post-compra cifrados | Completado |
| Modificaciones de reserva, delta financiero y plazos | Completado |
| Alojamientos, habitaciones, galerías e inventario | Completado |
| Pricing estacional / ocupación | Completado |
| Alojamiento transaccional dentro de reservas de viaje | Completado |
| Suplementos opcionales del paquete | Completado |
| Operaciones diarias avanzadas de Operator | **Siguiente** |

El trabajo futuro está en **[ROADMAP.md](ROADMAP.md)** · **[ROADMAP.es.md](ROADMAP.es.md)**.

## Siguiente prioridad de desarrollo

El siguiente gran bloque es **Fase 7A — Operaciones avanzadas**.

El objetivo es transformar Operator de un backoffice sólido de reservas a un workspace completo para el trabajo diario de una agencia:

- asignar responsable/operador a cada reserva;
- notas internas nunca visibles para cliente;
- tareas y seguimientos con vencimiento;
- prioridad y etiquetas;
- timeline operativo más rico;
- seguimiento de estado/provisión con proveedores;
- historial de contacto con cliente;
- búsqueda, filtros y paginación más potentes;
- acciones masivas seguras;
- permisos más granulares que el actual operator/admin.

Una pequeña extensión de modificaciones —añadir/quitar suplementos de paquete después de crear la reserva usando el motor de delta financiero ya existente— encaja al inicio de 7A porque es principalmente un workflow operativo construido encima de las bases ya completadas.

## Principios del proyecto

- implementación clean-room;
- interfaces neutrales respecto a proveedores;
- operaciones cliente/personal autorizadas server-side;
- pricing, inventario, ownership y transiciones validados en servidor;
- snapshots históricos para viajeros, alojamiento, paquete y finanzas;
- estado de reserva separado del estado de pago;
- datos avanzados de viajeros solo post-compra cuando son necesarios;
- servicios con inventario independientes de suplementos ligeros de paquete;
- UX pública bilingüe, responsive y sin terminología interna de desarrollo;
- integraciones propietarias Kairoseth/cliente fuera del core MIT cuando corresponda.

## Licencia

MIT. Consulta [`LICENSE`](LICENSE).
