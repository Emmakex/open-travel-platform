# Open Travel Platform

<p align="center"><a href="./README.md">English</a> · <strong>Español</strong></p>

> Base open-source reutilizable para agencias de viajes, turoperadores y productos de reservas.

Open Travel Platform es una plataforma clean-room en Next.js + TypeScript construida alrededor de límites explícitos de dominio, repositorios y adaptadores. Puede funcionar con datos demo incluidos para evaluación local o utilizar capacidades persistentes sobre MongoDB para catálogo, identidad, reservas, servicios, operaciones y pagos.

La implementación comercial/de referencia oficial es **Kairoseth Travel**, desplegada en **[travel.kairoseth.com](https://travel.kairoseth.com)**.

![Versión](https://img.shields.io/badge/version-1.0.0-0d1b2d)
![Next.js](https://img.shields.io/badge/Next.js-16.3.1-000000)
![React](https://img.shields.io/badge/React-19.2.8-149eca)
![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178c6)
![Node](https://img.shields.io/badge/Node-24_LTS-5fa04e)
![MongoDB](https://img.shields.io/badge/MongoDB-compatible-47A248)
![Licencia](https://img.shields.io/badge/license-MIT-45d6b5)
[![Referencia en vivo](https://img.shields.io/badge/live-travel.kairoseth.com-45d6b5)](https://travel.kairoseth.com)

## Modelo del proyecto

Este repositorio es el **core open-source bajo licencia MIT**. Kairoseth Travel es la implementación oficial alojada/comercial construida sobre ese core.

La separación es intencional:

- Open Travel Platform permanece reutilizable, neutral respecto a proveedores y útil para otras agencias/desarrolladores;
- Kairoseth Travel puede añadir hosting, soporte, servicios comerciales, integraciones privadas y capacidades específicas de cada despliegue;
- los datos de clientes, credenciales productivas e integraciones propietarias de clientes se mantienen fuera del repositorio público.

## Despliegue de referencia

**[travel.kairoseth.com](https://travel.kairoseth.com)** se utiliza para validar la plataforma de extremo a extremo.

El despliegue actual incluye catálogo y multimedia persistentes, autenticación de clientes y personal, operaciones de reserva, viajeros, servicios turísticos independientes, inventario, correo transaccional, contabilidad de pagos, condiciones de pago, datos post-compra de viajeros y configuración de pasarelas administrada desde Admin.

Los adaptadores Stripe y Redsys, junto con el checkout online unificado, ya están implementados en el código, pero la validación end-to-end con credenciales se pospone deliberadamente hasta disponer de cuentas adecuadas. Ninguna pasarela se activa automáticamente.

## Capacidades actuales

### Catálogo público y venta

- experiencia pública bilingüe EN/ES;
- destinos y viajes con contenido localizado;
- salidas públicas de viajes y disponibilidad real;
- catálogos públicos e independientes de **Actividades**, **Transporte** y **Seguros** sin necesidad de login;
- fichas de servicio con disponibilidad y precios;
- login/registro de cliente únicamente cuando es necesario para cuenta o reserva.

### Backoffice de catálogo

- gestión protegida desde Operator/Admin;
- destinos y viajes;
- portadas, galerías, biblioteca multimedia GridFS y puntos focales;
- itinerarios estructurados multidioma;
- salidas de viajes, capacidades e inventario;
- productos independientes de actividad, transporte y seguro;
- modelos de precio por persona, por reserva, por unidad y según edad;
- calendarios de disponibilidad e inventario para actividades y transporte;
- ciclo borrador/publicado;
- activación por producto de requisitos post-compra de viajeros.

### Viajeros y pricing

- viajero principal y fichas individuales;
- fecha de nacimiento y nacionalidad;
- edad calculada según la fecha de salida/servicio;
- bandas de edad configurables (por ejemplo bebé/niño/joven/adulto);
- precios por viajero validados en servidor;
- overrides de precio por salida;
- adulto responsable obligatorio para menores;
- consumo de inventario configurable por banda de edad (por ejemplo, un bebé puede ser gratuito y no consumir plaza);
- snapshots de precio guardados en la reserva para que los cambios futuros del catálogo no alteren reservas históricas;
- datos opcionales post-compra de identidad/documentación/residencia solicitados solo cuando el snapshot del producto los exige;
- cifrado AES-256-GCM para datos avanzados de viajeros;
- plazos de edición, conservación y borrado TTL en MongoDB;
- visibilidad de completitud en Operator sin exponer valores descifrados de documentación en las vistas generales.

### Reservas y servicios

- reservas persistentes de viajes con control de capacidad;
- reservas persistentes e independientes para actividades, transporte y seguros;
- una reserva de servicio puede vincularse opcionalmente a un viaje Kairoseth o permanecer independiente para viajes comprados fuera;
- reserva/liberación de inventario protegida transaccionalmente cuando aplica;
- historial de viajes y servicios en la cuenta del cliente;
- la cuenta prioriza el próximo viaje futuro real del cliente y solo usa recomendaciones del catálogo como fallback;
- la cuenta del cliente destaca tareas pendientes de datos post-compra para el próximo viaje;
- colas de Operator separadas para viajes y servicios;
- flujos confirmar/cancelar y auditoría operativa.

### Identidad y seguridad

- registro y sesiones persistentes de clientes;
- autenticación separada de operator/admin con RBAC;
- separación de sesiones cliente/personal;
- bloqueo tras fallos repetidos de acceso;
- cambio y recuperación de contraseña;
- correo SMTP de recuperación;
- auditoría de eventos de autenticación;
- indicador visible de sesión/rol activo en frontend;
- configuración de pasarelas restringida a admin;
- datos sensibles post-compra separados del registro principal de reserva y cifrados con una clave exclusiva del servidor.

### Correo transaccional

- transporte SMTP server-side;
- email de reserva recibida;
- emails de confirmación/cancelación;
- desglose de viajeros y precios;
- recuperación de contraseña por email.

### Pagos y finanzas

- ledger de pagos/reembolsos independiente de proveedor;
- estados de reserva y pago independientes;
- resúmenes unpaid / pending / partially paid / paid / partially refunded / refunded;
- movimientos manuales de transferencia, efectivo y terminal externo;
- reembolsos manuales y protecciones de conciliación;
- reservas de servicios integradas en el mismo ledger;
- arquitectura de checkout unificado para viajes y servicios;
- adaptador Stripe Checkout con verificación de webhook firmado e idempotencia;
- adaptador Redsys con redirección y validación de notificación firmada servidor-servidor;
- las URLs de retorno del navegador nunca se consideran confirmación de pago;
- perfiles TEST/LIVE administrados desde Admin;
- secretos Stripe/Redsys cifrados en reposo con AES-256-GCM;
- las credenciales guardadas nunca vuelven al navegador;
- condiciones de pago completas, depósitos y cuotas guardadas como snapshot en cada reserva;
- cálculo server-side de saldo pendiente y próxima cuota;
- diseño preparado para añadir PSP adicionales sin reescribir la lógica de reservas.

## Datos post-compra de viajeros: cómo funciona

Por defecto **no se solicitan datos adicionales de viajeros**. La función se activa por un Operator **en cada viaje o servicio**, no globalmente.

### Operator

Para un viaje:

```text
Operator → Catálogo → Viajes → Editar viaje
→ Datos de viajeros después de la compra
```

Para una actividad, transporte o seguro se utiliza el editor correspondiente dentro de `Operator → Catálogo → Servicios`.

El operador:

1. deja **Sin datos adicionales** cuando no hay ninguna necesidad real, o selecciona el perfil correcto solo cuando un proveedor, una ruta o una obligación legal lo exige;
2. revisa el plazo de edición del cliente y el periodo de conservación;
3. guarda el producto;
4. tiene en cuenta que la configuración afecta únicamente a **nuevas reservas**, porque los requisitos quedan guardados como snapshot dentro de cada reserva.

Operator utiliza un estado simple:

```text
NO REQUERIDO → PENDIENTE → COMPLETO
```

Cuando está activo, Operator muestra `viajeros completos / total de viajeros` y el estado individual de cada viajero sin mostrar en la vista general los valores descifrados del documento o residencia.

### Cliente

Los datos avanzados **no se solicitan durante el checkout**. Después de comprar:

1. **Mi cuenta** destaca la tarea en el próximo viaje cuando todavía hay información pendiente.
2. El detalle de la reserva de viaje o servicio muestra **Acción pendiente · datos de viajeros**.
3. El cliente pulsa **Completar datos de viajeros**.
4. `/account/traveller-data/<trip|service>/<reservation-id>` muestra únicamente los campos requeridos por el snapshot de esa reserva.
5. El progreso se muestra por viajero.
6. Cuando todos están completos, el estado cambia a **Datos de viajeros completos** y el CTA pasa a **Revisar datos de viajeros** mientras el plazo de edición siga abierto.

Las reservas antiguas no heredan cambios posteriores del catálogo. Para probar un perfil recién activado hay que guardar el producto y crear una **reserva nueva**.

El flujo estándar no solicita deliberadamente copias/fotos de pasaporte o DNI y tampoco incluye preguntas médicas o de salud. Consulta [`docs/TRAVELLER-DATA.md`](docs/TRAVELLER-DATA.md) para ver perfiles, seguridad, conservación, consideraciones RGPD y checklist de producción.

## Arquitectura

```text
                         Catálogo público
                               |
                        TravelRepository
                               |
                    destinos + viajes
                               |
                    salidas / inventario
                               |
                        BookingRepository
                               |
                       reservas de viaje

      servicios públicos -----------------------------+
          |                                            |
 actividades / transporte / seguros                   |
          |                                            |
 disponibilidad de servicios                          |
          |                                            |
 reservas de servicios                                |
          |                                            |
          +-------------------+------------------------+
                              |
                       PaymentRepository
                              |
                       ledger neutral
                              |
                    checkout unificado
                       /              \
                  Stripe              Redsys
                       \              /
                  callbacks firmados

 área cliente -------------------- staff/operator/admin
      |                                  |
 IdentityRepository              Operaciones / RBAC
```

Los payloads específicos de proveedores permanecen dentro de adaptadores. Catálogo, reservas, identidad, servicios, operaciones y contabilidad de pagos conservan límites sustituibles.

## Reserva y pago son estados independientes

Una reserva es un registro comercial. Un movimiento de pago es un registro financiero. Uno no cambia silenciosamente el estado del otro.

Ejemplos:

- una reserva puede estar `confirmed` y seguir `unpaid`;
- una reserva puede estar `pending` y ya estar `paid`;
- una reserva cancelada puede seguir pagada hasta procesar explícitamente un reembolso.

El ledger deriva actualmente:

```text
unpaid
pending
partially_paid
paid
partially_refunded
refunded
```

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

Un clon nuevo puede usar los modos demo/solo lectura seguros documentados en `.env.example`. MongoDB persistente, SMTP y pagos son integraciones opcionales.

## Rutas principales

```text
/                                      landing page
/destinations                          catálogo de destinos
/destinations/[slug]                   detalle de destino
/trips                                 catálogo de viajes
/trips/[slug]                          detalle de viaje
/trips/[slug]/book                     reserva de viaje
/services                              hub de servicios
/activities                            actividades públicas
/activities/[slug]                     detalle de actividad
/transport                             servicios de transporte
/transport/[slug]                      detalle de transporte
/insurance                             seguros públicos
/insurance/[slug]                      detalle de seguro
/services/book/[type]/[slug]           reserva independiente de servicio

/account/sign-in                       acceso cliente
/account                               cuenta protegida
/account/reservations                  reservas de viaje
/account/reservations/[id]             reserva + finanzas
/account/services                      reservas de servicios
/account/services/[id]                 detalle de servicio reservado
/account/traveller-data/[targetType]/[id] datos post-compra de viajeros
/account/checkout/[targetType]/[id]    checkout unificado
/account/security                      seguridad cliente

/operator/sign-in                      acceso de personal
/operator                              dashboard de operaciones
/operator/reservations                 cola de reservas de viaje
/operator/service-reservations         cola de reservas de servicios
/operator/customers                    gestión de clientes
/operator/catalogue                    gestión de catálogo
/operator/media                        biblioteca multimedia
/operator/payments                     dashboard financiero
/operator/payments/providers           pasarelas, solo admin
/operator/security                     seguridad del personal
/operator/staff                        gestión de personal para admin
```

## Resumen de configuración

La plantilla completa está en [`.env.example`](.env.example).

Principales capacidades server-side:

```text
# URL pública
KTRAVEL_PUBLIC_URL=https://travel.kairoseth.com

# Persistencia
MONGODB_URI=
MONGODB_DB_NAME=ktravel

# Identidad / booking / operaciones
IDENTITY_MODE=demo
STAFF_AUTH_MODE=demo
BOOKING_MODE=demo
OPERATIONS_MODE=demo

# SMTP
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM_EMAIL=
SMTP_FROM_NAME=Kairoseth Travel
KTRAVEL_OPERATIONS_EMAILS=

# Cifra secretos de pasarelas guardados desde Admin
PAYMENT_SECRETS_KEY=

# Cifra datos post-compra de identidad/documentación de viajeros
TRAVELLER_DATA_KEY=
```

`PAYMENT_SECRETS_KEY` y `TRAVELLER_DATA_KEY` deben ser claves estables y de alta entropía de 32 bytes, generadas de forma independiente (por ejemplo con `openssl rand -base64 32`). No deben rotarse sin un plan de migración porque protegen registros cifrados persistidos.

Las credenciales Stripe/Redsys se administran desde la UI de Admin y no necesitan existir como variables de entorno.

Las variables `NEXT_PUBLIC_*` son visibles en navegador y nunca deben contener secretos.

## Datos persistentes

Los despliegues MongoDB utilizan colecciones separadas por capacidades: reservas, salidas, catálogo/disponibilidad/reservas de servicios, transacciones de pago, auditoría operativa, autenticación, configuración de proveedores de pago y datos post-compra de viajeros cifrados.

Los nombres internos de colecciones y credenciales de infraestructura no se muestran en la UI de Operator.

## Documentación de integración y producción

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — capacidades y fronteras de confianza.
- [`docs/API-CONTRACT.md`](docs/API-CONTRACT.md) — contrato REST genérico.
- [`docs/IDENTITY.md`](docs/IDENTITY.md) — modos de identidad.
- [`docs/BOOKING.md`](docs/BOOKING.md) — integridad de reservas.
- [`docs/OPERATIONS.md`](docs/OPERATIONS.md) — autorización y workflows de staff.
- [`docs/CATALOGUE-BACKOFFICE.md`](docs/CATALOGUE-BACKOFFICE.md) — gestión de catálogo.
- [`docs/DEPARTURES.md`](docs/DEPARTURES.md) — inventario de salidas.
- [`docs/MEDIA.md`](docs/MEDIA.md) — multimedia y subidas.
- [`docs/TRANSACTIONAL-EMAILS.md`](docs/TRANSACTIONAL-EMAILS.md) — SMTP y notificaciones.
- [`docs/PAYMENTS.md`](docs/PAYMENTS.md) — ledger y contrato PSP.
- [`docs/TRAVELLER-DATA.md`](docs/TRAVELLER-DATA.md) — requisitos post-compra, UX, seguridad y conservación de datos de viajeros.
- [`docs/ADAPTER-GUIDE.md`](docs/ADAPTER-GUIDE.md) — incorporación de integraciones.
- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) — despliegue.
- [`docs/PRODUCTION-CHECKLIST.md`](docs/PRODUCTION-CHECKLIST.md) — revisión preproducción.

## Quality gates

```bash
npm run check:safety
npm run check:release
npm run typecheck
npm run build
npm run verify
```

CI resuelve el lock de dependencias, realiza instalación limpia, valida consistencia del release, ejecuta type-check, compila producción, lanza smoke tests HTTP y auditoría de dependencias.

## Estado del proyecto

| Área | Estado |
|---|---|
| Foundation, arquitectura y CI | Completado |
| Catálogo público bilingüe | Completado |
| Backoffice MongoDB y multimedia | Completado |
| Identidad persistente cliente/personal y seguridad | Completado |
| Reservas de viaje e inventario | Completado |
| Viajeros, menores y pricing por edad | Completado |
| Catálogo independiente de actividades / transporte / seguros | Completado |
| Disponibilidad y reservas independientes de servicios | Completado |
| Workflows operator/admin y auditoría | Completado |
| Correo transaccional | Completado |
| Ledger de pagos independiente de proveedor | Completado |
| Configuración Admin TEST/LIVE de Stripe y Redsys | Completado |
| Checkout/adapters Stripe y Redsys | Implementado; pendiente validación E2E con credenciales |
| Depósitos / cuotas / condiciones de pago (Fase 5G) | Completado |
| Datos seguros post-compra de viajeros (Fase 6A) | Completado |
| UX cliente/Operator y documentación de datos de viajeros (Fase 6A.1) | En progreso en esta rama |
| Modificaciones de reserva (Fase 6B) | **Siguiente** |

El trabajo futuro está en **[ROADMAP.md](ROADMAP.md)** · **[ROADMAP.es.md](ROADMAP.es.md)**.

## Próxima prioridad de desarrollo

El siguiente bloque principal es **Fase 6B — modificaciones de reserva**.

El objetivo es permitir cambios normales después de reservar sin destruir el registro original:

- añadir, eliminar o modificar viajeros bajo reglas controladas;
- cambiar de salida cuando exista disponibilidad;
- añadir/quitar actividades, transporte y seguros vinculados;
- recalcular en servidor los totales afectados;
- conservar snapshots antes/después y un timeline de modificaciones;
- mover inventario de forma segura entre asignaciones antiguas y nuevas;
- cobrar una diferencia cuando el nuevo total aumente;
- mostrar un saldo potencialmente reembolsable cuando el nuevo total disminuya, para procesarlo de forma controlada;
- notificar al cliente los cambios relevantes;
- soportar deadlines configurables de cambios/cancelaciones.

La Fase 6B debe conservar el ledger de pagos y la historia original de la reserva, sin reescribir movimientos financieros pasados.

## Principios del proyecto

- implementación clean-room;
- interfaces neutrales respecto a proveedores;
- operaciones de cliente y personal autorizadas en servidor;
- pricing, inventario, ownership y transiciones validados server-side;
- snapshots de viajeros, requisitos y finanzas preservan reservas históricas;
- estado de reserva separado del estado de pago;
- los datos avanzados de viajeros se solicitan solo después de la compra y cuando son necesarios;
- los valores sensibles de viajeros permanecen cifrados y no se muestran en las vistas generales de Operator;
- secretos únicamente server-side y cifrados cuando se persisten;
- sin dependencia obligatoria de hosting, CMS, auth, CRM, pagos o proveedor turístico;
- core open-source bajo licencia MIT.

## Licencia y reutilización

Este repositorio se publica bajo la **licencia MIT**.

MIT permite usar, copiar, modificar, fusionar, publicar, distribuir, sublicenciar y vender software basado en este código, incluso en productos comerciales o derivados de código cerrado, siempre que se conserve el aviso de copyright y permiso exigido por la licencia.

Los usuarios derivados no están obligados a publicar sus modificaciones. El software se proporciona sin garantía, tal como indica [`LICENSE`](LICENSE).

Este modelo permisivo es intencional para la base open-source. Los servicios comerciales de Kairoseth, integraciones privadas, entornos alojados, credenciales, datos de clientes y otros activos pueden mantenerse separados del repositorio público.

MIT © 2026 Eduardo Yauri. Consulta [`LICENSE`](LICENSE).
