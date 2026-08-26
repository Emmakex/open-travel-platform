# Adapter REST genérico de reservas

La Fase 8C-1 añade un adapter neutral de `BookingRepository` para despliegues donde las reservas de viaje viven en un API externo en lugar del repositorio MongoDB integrado.

Las páginas y el dominio de reservas no cambian. Configura:

```text
BOOKING_MODE=rest
REST_BOOKING_BASE_URL=https://booking.example.com/open-travel/
REST_BOOKING_BEARER_TOKEN=<token server-only>
REST_BOOKING_TIMEOUT_MS=10000
REST_BOOKING_MAX_RESPONSE_BYTES=2000000
```

El adapter es deliberadamente un **contrato**, no un passthrough de payloads de proveedor. El API externo debe normalizar sus modelos específicos al dominio de Open Travel Platform antes de responder.

## Frontera de confianza

`REST_BOOKING_BASE_URL` y `REST_BOOKING_BEARER_TOKEN` son configuración confiable del despliegue, no datos de navegador/usuario.

- en producción la URL debe usar HTTPS;
- HTTP solo se permite en desarrollo para `localhost`, `127.0.0.1` o `::1`;
- se rechazan credenciales, fragmentos y query strings en la URL base;
- no se siguen redirects;
- el token nunca debe exponerse mediante `NEXT_PUBLIC_*`.

Se permiten APIs privadas/internas cuando las configura el administrador del despliegue. Esta frontera es distinta de los webhooks configurables por usuario, donde sí se bloquean redes privadas por SSRF.

## Versión del contrato

Cada request incluye:

```text
X-OTP-Contract-Version: 1
X-OTP-Request-Id: otp-<uuid>
Accept: application/json
```

El API debe responder:

```text
Content-Type: application/json
X-OTP-Contract-Version: 1
```

Una versión ausente o distinta se rechaza antes de que el payload entre al dominio.

## Autenticación

Cuando existe token configurado:

```text
Authorization: Bearer <REST_BOOKING_BEARER_TOKEN>
```

Producción exige al menos 16 caracteres; se recomienda una credencial de alta entropía mucho más larga y gestionada por el secret manager del despliegue.

## Endpoints `/v1`

Con una base como `https://booking.example.com/open-travel/`, el adapter consume:

```text
GET  v1/availability?tripId=<tripId>
GET  v1/customers/<identityId>/reservations
GET  v1/customers/<identityId>/reservations/<reservationId>
POST v1/reservations
POST v1/customers/<identityId>/reservations/<reservationId>/cancel
```

### Disponibilidad

Respuesta:

```json
{
  "availability": [
    {
      "id": "dep-123",
      "tripId": "trip-123",
      "departureDate": "2026-10-01",
      "returnDate": "2026-10-08",
      "remainingSpaces": 10,
      "unitPrice": 950
    }
  ]
}
```

Todos los resultados deben pertenecer al `tripId` solicitado.

### Lista/detalle de reservas

Respuesta de lista:

```json
{ "reservations": [{ "...": "Reservation" }] }
```

Respuesta de detalle:

```json
{ "reservation": { "...": "Reservation" } }
```

Todo resultado debe conservar el `identityId` solicitado. Un `404` de detalle se convierte en `null`.

### Crear reserva

```http
POST v1/reservations
Idempotency-Key: otp-<uuid>
```

Body:

```json
{ "reservation": { "...": "CreateReservationInput" } }
```

Respuesta:

```json
{ "reservation": { "...": "Reservation creada" } }
```

La respuesta debe coincidir con cliente, viaje y salida solicitados.

### Cancelar reserva

```http
POST v1/customers/<identityId>/reservations/<reservationId>/cancel
Idempotency-Key: otp-<uuid>
```

Body: `{}`. Un `404` se convierte en `null`.

## Idempotencia y reintentos

Las mutaciones reciben `Idempotency-Key` y reutilizan **la misma clave** si el adapter repite esa invocación tras un fallo transitorio. El API externo debe respetar esta clave en POST.

Hay como máximo dos intentos. `429`, `502`, `503`, `504`, fallos de red y timeouts pueden provocar un único reintento. Rechazos funcionales no se reintentan automáticamente.

## Validación runtime

El JSON externo se valida antes de atravesar `BookingRepository`:

- forma de envelopes/objetos;
- IDs y strings obligatorios;
- números finitos y enteros válidos;
- enum de estado;
- código de moneda de tres letras;
- límites de arrays;
- forma básica de colecciones anidadas;
- ownership del cliente;
- coherencia viaje/salida al crear;
- coherencia del viaje solicitado en disponibilidad.

Un payload malformado o fuera de scope falla de forma cerrada con errores estables `REST_BOOKING_*`.

## Límites

```text
REST_BOOKING_TIMEOUT_MS=10000
REST_BOOKING_MAX_RESPONSE_BYTES=2000000
```

Clamps server-side:

- timeout `1000..30000` ms;
- respuesta `16384..5000000` bytes.

El body se lee de forma limitada incluso si `Content-Length` no existe o es incorrecto. Se usa `cache: no-store` y no se siguen redirects.

## Fronteras de pagos/operaciones

`BOOKING_MODE=rest` sustituye **solo la persistencia de reservas de cliente**. No cambia automáticamente ledger, operaciones de personal, datos protegidos, catálogo ni integraciones salientes.

Para mantener el ledger local, por ejemplo:

```text
PAYMENT_LEDGER_MODE=mongodb
```

Esta composición independiente es intencional y evita convertir un proveedor externo en un modo global acoplado.

## Quality gate

```bash
npm run check:rest-booking-adapter
```

El invariante queda incluido en `npm run verify` y GitHub CI.
