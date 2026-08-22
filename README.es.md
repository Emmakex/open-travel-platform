# Open Travel Platform

<p align="center"><a href="./README.md">English</a> · <strong>Español</strong></p>

> Base open-source reutilizable para agencias de viajes, turoperadores y productos de reservas.

Open Travel Platform es un proyecto clean-room en Next.js + TypeScript construido alrededor de dominios y repositorios explícitamente separados. Puede ejecutarse con datos ficticios incluidos para evaluación local o utilizar capacidades persistentes sobre MongoDB para catálogo, identidad, reservas, operaciones y ledger de pagos.

El despliegue público de referencia utiliza la marca **Kairoseth Travel** y está disponible en **[travel.kairoseth.com](https://travel.kairoseth.com)**.

![Versión](https://img.shields.io/badge/version-1.0.0-0d1b2d)
![Next.js](https://img.shields.io/badge/Next.js-16.3.1-000000)
![React](https://img.shields.io/badge/React-19.2.8-149eca)
![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178c6)
![Node](https://img.shields.io/badge/Node-24_LTS-5fa04e)
![MongoDB](https://img.shields.io/badge/MongoDB-compatible-47A248)
![Licencia](https://img.shields.io/badge/license-MIT-45d6b5)
[![Referencia en vivo](https://img.shields.io/badge/live-travel.kairoseth.com-45d6b5)](https://travel.kairoseth.com)

## Despliegue de referencia en vivo

**[travel.kairoseth.com](https://travel.kairoseth.com)** es la implementación de referencia utilizada para validar la plataforma de extremo a extremo.

El despliegue actual demuestra catálogo y multimedia persistentes, autenticación de clientes y personal, inventario de salidas, operaciones de reservas, correo transaccional y el ledger de pagos independiente de proveedor. El contenido y los movimientos de pago utilizados durante desarrollo/pruebas deben seguir tratándose como datos no productivos salvo que el propietario del despliegue habilite explícitamente una integración de producción.

La pasarela de pago real con tarjeta **todavía no forma parte del core open-source actual**. La Fase 5A proporciona el ledger financiero y el workflow de operador necesarios para conectar Stripe, Redsys u otro PSP sin acoplar las reservas a un proveedor concreto.

## Capacidades actuales

- **Interfaz bilingüe** — inglés y español en catálogo público, cuenta de cliente y superficies de operador.
- **Catálogo** — destinos, viajes, contenido localizado, búsqueda/filtros y estado de publicación mediante `TravelRepository`.
- **Backoffice de catálogo** — creación y edición de destinos y viajes desde el área protegida de operador.
- **Biblioteca multimedia** — subidas persistentes, reutilización de imágenes, portadas, metadatos y control de punto focal.
- **Salidas e inventario** — ventanas de salida persistentes, capacidad, plazas reservadas y validación de disponibilidad.
- **Identidad de clientes** — registro/login persistente y sesiones protegidas en modo MongoDB.
- **Identidad de personal** — autenticación operator/admin, sesiones protegidas, flujos de contraseña y controles de rol.
- **Reservas** — reservas persistentes con precio, inventario y ownership validados en servidor.
- **Operaciones** — cola protegida de reservas, confirmación/cancelación y auditoría de cambios.
- **Clientes** — listado tipo CRM, detalle de perfil y resumen del valor de sus reservas para operador.
- **Correo transaccional** — notificaciones SMTP al recibir una reserva y al cambiar su estado.
- **Fundación de pagos (Fase 5A)** — ledger de pagos/reembolsos independiente de proveedor, resúmenes financieros, registro manual de pagos/reembolsos, dashboard financiero de operador e historial visible para el cliente.
- **Calidad de release** — safety checks del código fuente, TypeScript, build de producción, smoke tests HTTP y auditoría de dependencias en CI.

## Arquitectura

```text
                         Catálogo público
                               |
                        TravelRepository
                               |
                  demo / API REST / MongoDB
                               |
                    destinos + viajes
                               |
                    salidas / inventario
                               |
                        BookingRepository
                               |
                          reservas
                          /      \
                         /        \
                área cliente   operaciones staff
                    |                 |
            IdentityRepository OperationsRepository
                    |                 |
          demo / auth MongoDB    auditoría + workflows
                         \        /
                          \      /
                          reserva
                             |
                      PaymentRepository
                             |
                   ledger independiente
                             |
          manual / Stripe / Redsys / PSP futuro
```

Los payloads específicos de proveedores permanecen dentro de adaptadores. Catálogo, booking, identidad, operaciones y contabilidad de pagos siguen separados para poder sustituir integraciones de forma independiente.

## Los estados de reserva y pago son independientes

Una reserva es el registro comercial del viaje. Un movimiento de pago es un registro financiero. El proyecto evita que uno de esos estados determine automáticamente el otro.

Ejemplos:

- una reserva puede estar `confirmed` y seguir `unpaid`;
- una reserva puede estar `pending` y ya estar `paid`;
- una reserva cancelada puede seguir pagada hasta que se registre o complete explícitamente un reembolso mediante el PSP.

El ledger de pagos deriva actualmente estos estados:

```text
unpaid
pending
partially_paid
paid
partially_refunded
refunded
```

Consulta [`docs/PAYMENTS.md`](docs/PAYMENTS.md) para el modelo completo.

## Core open-source vs Kairoseth Travel

Este repositorio está pensado deliberadamente como una **base open-source reutilizable**. Kairoseth Travel es el despliegue público de referencia y escaparate de producto construido sobre esa base.

Esta separación permite que el proyecto evolucione en dos direcciones al mismo tiempo:

- el **repositorio open-source** puede seguir siendo útil para desarrolladores, agencias y empresas turísticas;
- Kairoseth puede construir alrededor del mismo core servicios comerciales de hosting, soporte, conectores privados, integraciones específicas para clientes, contenido y servicios operativos.

Las credenciales privadas, los datos de clientes y los servicios propietarios específicos de un despliegue no deben formar parte del repositorio público.

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

Un clon nuevo puede utilizar los modos demo/solo lectura seguros documentados en `.env.example`. MongoDB, SMTP y los modos persistentes de escritura son integraciones opcionales.

## Rutas principales

```text
/                                landing page
/destinations                    catálogo de destinos
/destinations/[slug]             detalle de destino
/trips                           viajes con búsqueda/filtros
/trips/[slug]                    detalle del viaje
/trips/[slug]/book               disponibilidad + reserva

/account/sign-in                 acceso de cliente
/account                         cuenta protegida del cliente
/account/reservations            historial de reservas
/account/reservations/[id]       detalle de reserva + pagos

/operator/sign-in                acceso de personal
/operator                        dashboard de operaciones
/operator/reservations           cola de reservas
/operator/reservations/[id]      reserva + auditoría + pagos
/operator/customers              gestión de clientes
/operator/catalogue              gestión de catálogo
/operator/media                  biblioteca multimedia
/operator/payments               dashboard financiero/pagos
/operator/security               seguridad del personal
/operator/staff                  gestión de personal para admin
```

## Resumen de configuración

La plantilla completa se encuentra en [`.env.example`](.env.example). Los principales switches de capacidades son:

```text
# Público / catálogo
NEXT_PUBLIC_SITE_NAME=Open Travel Platform
NEXT_PUBLIC_SITE_TAGLINE=Build travel products without vendor lock-in.
KTRAVEL_PUBLIC_URL=https://travel.kairoseth.com
NEXT_PUBLIC_DATA_MODE=demo
TRAVEL_DATA_MODE=demo
NEXT_PUBLIC_TRAVEL_API_URL=

# Persistencia
MONGODB_URI=
MONGODB_DB_NAME=ktravel

# Identidad
IDENTITY_MODE=demo
STAFF_AUTH_MODE=demo
DEMO_IDENTITY_ENABLED=false

# Booking / operaciones
BOOKING_MODE=demo
OPERATIONS_MODE=demo
DEMO_BOOKING_ENABLED=false
DEMO_OPERATIONS_ENABLED=false

# SMTP
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM_EMAIL=
SMTP_FROM_NAME=Kairoseth Travel
KTRAVEL_OPERATIONS_EMAILS=

# Override opcional del ledger de pagos
# PAYMENT_LEDGER_MODE=mongodb
```

Las variables `NEXT_PUBLIC_*` son visibles desde el navegador y nunca deben contener secretos. Las credenciales de base de datos, autenticación, SMTP y proveedores de pago deben permanecer únicamente en servidor.

Cuando `PAYMENT_LEDGER_MODE` se omite, la capa actual de pagos utiliza automáticamente MongoDB cuando `BOOKING_MODE=mongodb`.

## Colecciones MongoDB

Los adapters persistentes utilizan actualmente colecciones como:

```text
travel_reservations
travel_departures
travel_payment_transactions
travel_operations_audit
travel_staff_users
travel_staff_sessions
```

Los adapters de catálogo, multimedia e identidad de clientes utilizan sus propias colecciones persistentes según la implementación y la documentación correspondiente.

## Documentación de integración y producción

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — capacidades y fronteras de confianza.
- [`docs/API-CONTRACT.md`](docs/API-CONTRACT.md) — contrato REST genérico del catálogo.
- [`docs/IDENTITY.md`](docs/IDENTITY.md) — modos de identidad y reglas de sustitución.
- [`docs/BOOKING.md`](docs/BOOKING.md) — integridad de reservas y reglas de adapters.
- [`docs/OPERATIONS.md`](docs/OPERATIONS.md) — autorización y workflows de staff.
- [`docs/CATALOGUE-BACKOFFICE.md`](docs/CATALOGUE-BACKOFFICE.md) — gestión persistente del catálogo.
- [`docs/DEPARTURES.md`](docs/DEPARTURES.md) — modelo de inventario de salidas.
- [`docs/MEDIA.md`](docs/MEDIA.md) — biblioteca multimedia y subidas.
- [`docs/TRANSACTIONAL-EMAILS.md`](docs/TRANSACTIONAL-EMAILS.md) — notificaciones SMTP.
- [`docs/PAYMENTS.md`](docs/PAYMENTS.md) — ledger financiero y contrato para futuros PSP.
- [`docs/ADAPTER-GUIDE.md`](docs/ADAPTER-GUIDE.md) — incorporación de integraciones reales.
- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) — modelo de despliegue.
- [`docs/PRODUCTION-CHECKLIST.md`](docs/PRODUCTION-CHECKLIST.md) — revisión antes de producción.

## Quality gates

```bash
npm run check:safety
npm run check:release
npm run typecheck
npm run build
npm run verify
```

CI resuelve el lock de dependencias, realiza una instalación limpia, valida la consistencia del release, ejecuta type-checking, compila la aplicación de producción, realiza smoke tests HTTP representativos y lanza una auditoría de dependencias.

## Principios del proyecto

- Implementación clean-room.
- Interfaces de capacidades independientes de proveedor.
- Operaciones de clientes y personal autorizadas en servidor.
- Precios, inventario, ownership y transiciones de estado validados en servidor.
- Adapters persistentes sin imponer un único proveedor para todas las capacidades.
- Estado de reserva separado del estado de pago.
- Defaults seguros para producción y secretos únicamente en servidor.
- Sin dependencia obligatoria de hosting, CMS, auth, CRM, pagos o proveedor turístico.
- Core open-source bajo licencia MIT.

## Estado del proyecto

| Área | Estado |
|---|---|
| Foundation, arquitectura y CI | Completado |
| Catálogo y descubrimiento | Completado |
| Backoffice de catálogo MongoDB | Completado |
| Biblioteca multimedia | Completado |
| Identidad persistente de clientes/personal | Completado |
| Reservas e inventario de salidas | Completado |
| Workflows operator/admin y auditoría | Completado |
| Correo transaccional | Completado |
| Fase 5A — ledger de pagos independiente de proveedor | Completado |
| Integración PSP/tarjeta real | Siguiente |

El trabajo futuro se mantiene en [`ROADMAP.md`](ROADMAP.md). Para contribuir o consultar soporte/seguridad, revisa [`CONTRIBUTING.md`](CONTRIBUTING.md), [`SUPPORT.md`](SUPPORT.md) y [`SECURITY.md`](SECURITY.md).

## Licencia y reutilización

Este repositorio se publica bajo la **licencia MIT**.

En términos prácticos, MIT permite a personas y empresas usar, copiar, modificar, fusionar, publicar, distribuir, sublicenciar y vender software basado en este código, incluso como productos comerciales y derivados de código cerrado, siempre que se conserve el aviso de copyright y el texto de permiso exigido por la licencia.

Los usuarios derivados no están obligados a publicar sus modificaciones. El software se proporciona sin garantía, tal como se indica en [`LICENSE`](LICENSE).

Este modelo permisivo es intencional para la base open-source. Los servicios comerciales de Kairoseth, integraciones privadas, entornos alojados, credenciales, datos de clientes y otros activos pueden mantenerse separados de este repositorio.

MIT © 2026 Eduardo Yauri. Consulta [`LICENSE`](LICENSE).
