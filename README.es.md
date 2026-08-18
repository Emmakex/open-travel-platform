# Open Travel Platform

<p align="center"><a href="./README.md">English</a> · <strong>Español</strong></p>

> Base open-source reutilizable para agencias de viajes, turoperadores y productos de reservas.

Open Travel Platform es un starter clean-room en Next.js con un flujo de viaje ficticio completo y fronteras de adaptadores explícitas para catálogo, identidad, reservas y operaciones de personal. Un clon nuevo funciona sin infraestructura externa; las integraciones productivas pueden sustituir cada capacidad demo de forma independiente.

![Versión](https://img.shields.io/badge/version-1.0.0-0d1b2d)
![Next.js](https://img.shields.io/badge/Next.js-16.3.1-000000)
![React](https://img.shields.io/badge/React-19.2.8-149eca)
![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178c6)
![Node](https://img.shields.io/badge/Node-24_LTS-5fa04e)
![Licencia](https://img.shields.io/badge/license-MIT-45d6b5)

## Qué incluye 1.0

- **Catálogo** — destinos, viajes, detalle, búsqueda y filtros mediante `TravelRepository`.
- **Identidad** — identidades customer/operator/admin mediante `IdentityRepository`.
- **Reservas** — disponibilidad y reservas del cliente mediante `BookingRepository`.
- **Operaciones** — colas de personal, transiciones de estado validadas y eventos de auditoría mediante `OperationsRepository`.
- **Fronteras de seguridad** — comprobaciones de rol en servidor, ownership y validación confiable de precio/disponibilidad.
- **Calidad de release** — safety checks del código fuente, TypeScript, build de producción, smoke tests HTTP y auditoría de dependencias en CI.

Los adaptadores incluidos contienen únicamente datos demo ficticios. Son ejemplos deliberadamente reemplazables, **no** sistemas productivos de autenticación, inventario, pagos, booking o backoffice.

## Arquitectura

```text
Catálogo público             Área cliente               Operaciones staff
      |                          |                           |
      v                          v                           v
TravelRepository         IdentityRepository          RBAC en servidor
      |                          |                           |
 Demo / REST              Demo / auth futuro                v
                                                       OperationsRepository
                                                            |
                                                 demo / CRM / ERP / backoffice

Escritura de reserva del cliente
      |
validación en servidor
      |
BookingRepository
      |
demo / motor de reservas / proveedor
```

Los payloads específicos de proveedores permanecen dentro de adaptadores en lugar de filtrarse hacia páginas y componentes.

## Demo end-to-end

1. Explora destinos y viajes.
2. Inicia la sesión ficticia de cliente.
3. Elige disponibilidad y crea una reserva demo.
4. Revísala en la cuenta del cliente.
5. Cambia a la superficie ficticia de operator/admin.
6. Confirma o cancela la reserva.
7. Inspecciona el evento de auditoría generado.

Los roles, totales y transiciones de estado enviados desde el navegador nunca se convierten en decisiones autoritativas.

## Inicio rápido

Requiere **Node.js 24 LTS**. El proyecto declara el toolchain npm y versiones directas exactas en `package.json`.

```bash
git clone https://github.com/Emmakex/open-travel-platform.git
cd open-travel-platform
npm install
cp .env.example .env.local
npm run dev
```

Abre `http://localhost:3000`.

## Rutas principales

```text
/                                landing page
/destinations                    catálogo de destinos
/destinations/[slug]             detalle de destino
/trips                           viajes con búsqueda/filtros
/trips/[slug]                    detalle del viaje
/trips/[slug]/book               disponibilidad + reserva
/account/sign-in                 entrada demo de cliente
/account                         cuenta de cliente protegida
/account/reservations            historial de reservas
/account/reservations/[id]       detalle de reserva del cliente
/operator/sign-in                entrada demo operator/admin
/operator                        dashboard de operaciones
/operator/reservations           cola de reservas para staff
/operator/reservations/[id]      workflow de estado + auditoría
```

## Configuración

```text
NEXT_PUBLIC_SITE_NAME=Open Travel Platform
NEXT_PUBLIC_SITE_TAGLINE=Build travel products without vendor lock-in.
NEXT_PUBLIC_DATA_MODE=demo
NEXT_PUBLIC_TRAVEL_API_URL=

IDENTITY_MODE=demo
DEMO_IDENTITY_ENABLED=false

BOOKING_MODE=demo
DEMO_BOOKING_ENABLED=false

OPERATIONS_MODE=demo
DEMO_OPERATIONS_ENABLED=false
```

Las variables `NEXT_PUBLIC_*` son visibles en el navegador y nunca deben contener secretos. En producción, identidad, booking y operaciones quedan **desactivados** por defecto si sus variables de modo se omiten. Las escrituras demo ficticias requieren opt-in explícito y nunca deben utilizarse con datos reales de clientes o negocio.

## Documentación de integración y producción

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — capacidades y fronteras de confianza.
- [`docs/API-CONTRACT.md`](docs/API-CONTRACT.md) — contrato REST genérico del catálogo.
- [`docs/IDENTITY.md`](docs/IDENTITY.md) — sustitución de la identidad demo.
- [`docs/BOOKING.md`](docs/BOOKING.md) — integridad de reservas y reglas de adapters.
- [`docs/OPERATIONS.md`](docs/OPERATIONS.md) — autorización y workflows de staff.
- [`docs/ADAPTER-GUIDE.md`](docs/ADAPTER-GUIDE.md) — incorporación de integraciones reales.
- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) — modelo de despliegue.
- [`docs/PRODUCTION-CHECKLIST.md`](docs/PRODUCTION-CHECKLIST.md) — revisión obligatoria antes de producción.

## Quality gates

```bash
npm run check:safety
npm run check:release
npm run typecheck
npm run build
npm run verify
```

CI resuelve un lock de dependencias nuevo, realiza una instalación limpia con `npm ci`, valida el release, compila la aplicación, inicia el servidor de producción, ejecuta smoke tests sobre rutas representativas y lanza `npm audit`.

## Principios del proyecto

- Implementación clean-room y fixtures demo ficticios.
- Interfaces de capacidades independientes de proveedor.
- Operaciones de cliente/staff autorizadas en servidor.
- Precios, disponibilidad, ownership y transiciones de estado validados en servidor.
- Defaults seguros para producción.
- Sin dependencia obligatoria de hosting, CMS, auth, CRM, pagos o proveedor turístico.
- Licencia MIT.

## Historial de versiones

| Versión | Enfoque | Estado |
|---|---|---|
| `0.1.0` | Foundation y CI | Completado |
| `0.2.0` | Catálogo y descubrimiento | Completado |
| `0.3.0` | Identidad y cuentas de cliente | Completado |
| `0.4.0` | Reservas y disponibilidad | Completado |
| `0.5.0` | Workflows operator/admin | Completado |
| `1.0.0` | Starter estable y hardening de release | Actual |

El trabajo futuro se mantiene en [`ROADMAP.md`](ROADMAP.md). Para contribuir o consultar soporte/seguridad, revisa [`CONTRIBUTING.md`](CONTRIBUTING.md), [`SUPPORT.md`](SUPPORT.md) y [`SECURITY.md`](SECURITY.md).

## Licencia

MIT © 2026 Eduardo Yauri. Consulta [`LICENSE`](LICENSE).
