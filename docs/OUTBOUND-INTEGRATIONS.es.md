# Integraciones salientes

<p align="center"><a href="./OUTBOUND-INTEGRATIONS.md">English</a> · <strong>Español</strong></p>

La Fase 8A establece la frontera neutral de integraciones salientes de Open Travel Platform. El primer adapter de referencia es un webhook HTTPS firmado con outbox durable en MongoDB.

El objetivo es resolver una sola vez contratos de eventos, atomicidad, reintentos, idempotencia, auditoría, secretos y seguridad de red antes de añadir adapters específicos para CRM, ERP, proveedores u otros sistemas.

## Contrato inicial de eventos

Los primeros eventos son:

- `trip.reservation.created`
- `trip.reservation.status.changed`
- `service.reservation.created`
- `service.reservation.status.changed`

Cada evento utiliza un sobre versionado:

```json
{
  "id": "intevt-...",
  "type": "trip.reservation.created",
  "version": 1,
  "occurredAt": "2026-08-26T00:00:00.000Z",
  "aggregateType": "trip-reservation",
  "aggregateId": "res-...",
  "payload": {}
}
```

El payload contiene únicamente los campos operativos requeridos por el contrato de integración. No se copian documentos internos de MongoDB ni valores protegidos post-compra del viajero.

## Outbox transaccional

La persistencia de la reserva y la creación del evento comparten la misma transacción/sesión MongoDB.

Esto garantiza que:

- una reserva no pueda confirmarse en base de datos perdiendo su evento de integración;
- no pueda existir un evento confirmado para un cambio de reserva que terminó en rollback;
- los endpoints activos y suscritos en el momento de la transacción reciban una entrega durable por evento;
- un índice único `(eventId, endpointId)` haga idempotente la creación de entregas.

Colecciones:

- `travel_integration_events`
- `travel_integration_deliveries`
- `travel_integration_delivery_attempts`
- `travel_integration_endpoints`
- `travel_integration_endpoint_audit`

## Ciclo de entrega

Una entrega recorre estos estados:

```text
pending → delivering → succeeded
                    ↘ retrying → delivering
                              ↘ dead-letter
```

El worker:

- reclama trabajo vencido mediante lease para evitar envíos intencionadamente concurrentes de la misma entrega;
- recupera leases `delivering` expirados tras una caída del worker;
- registra cada intento;
- reintenta con backoff limitado;
- se detiene tras 8 intentos y conserva la entrega como `dead-letter`;
- procesa lotes limitados (`25` por defecto, máximo `100`).

La UI Admin actual expone una acción manual **Procesar hasta 25 entregas vencidas**. No se presenta como un worker continuo. En producción, un scheduler/worker autorizado debe invocar el mismo procesador periódicamente.

## Contrato de firma

Cada petición usa HTTP `POST`, `Content-Type: application/json` y añade:

```text
X-OTP-Event-Id
X-OTP-Event-Type
X-OTP-Timestamp
X-OTP-Signature: v1=<HMAC-SHA256 hexadecimal>
```

La entrada de la firma es:

```text
<timestamp>.<eventId>.<raw JSON body>
```

Pseudocódigo de validación:

```text
expected = HMAC_SHA256(secret, timestamp + "." + eventId + "." + rawBody)
aceptar solo si timing-safe(expected, received_v1_signature)
```

El receptor debería además rechazar timestamps antiguos y deduplicar por `X-OTP-Event-Id`.

## Gestión de endpoints y secretos

Solo usuarios Admin pueden acceder a `/operator/integrations` o modificar su configuración.

Cada endpoint contiene:

- nombre;
- URL HTTPS;
- estado activo/inactivo;
- tipos de eventos suscritos;
- secreto de firma.

Los secretos de firma:

- deben tener al menos 16 caracteres;
- se cifran antes de persistirse con AES-256-GCM;
- nunca se vuelven a mostrar en la UI Admin tras guardarlos;
- utilizan una clave maestra server-only dedicada: `INTEGRATION_SECRETS_KEY`.

Genera la clave maestra una sola vez, por ejemplo:

```bash
openssl rand -base64 32
```

Debe permanecer estable y únicamente en servidor. Rotarla o eliminarla sin una migración controlada de re-cifrado deja ilegibles los secretos almacenados.

## Protecciones SSRF y de red

Las URLs webhook se tratan como configuración de red privilegiada, no como enlaces normales de usuario.

El adapter de referencia:

- acepta solo HTTPS;
- rechaza credenciales y fragmentos en la URL;
- rechaza localhost y dominios `.local`;
- resuelve todas las respuestas DNS y rechaza el endpoint si cualquiera apunta a red privada/local/reservada;
- vuelve a validar DNS antes de cada entrega;
- conecta directamente al IP validado para impedir una segunda resolución durante la petición;
- conserva el hostname original para TLS SNI y cabecera HTTP `Host`;
- no sigue redirects;
- limita el timeout a 30 segundos;
- limita la respuesta a 64 KiB.

Estas medidas reducen el riesgo de SSRF y DNS rebinding. Un despliegue con requisitos más estrictos puede añadir allowlists/firewall de salida a nivel de red.

## Fallos y eliminación

Eliminar un endpoint no borra eventos, entregas ni intentos históricos. Las entregas ya encoladas reintentarán y acabarán en `dead-letter` al no existir ya un endpoint disponible.

Así se conserva evidencia operativa en lugar de descartar silenciosamente trabajo fallido.

## Añadir otro adapter

Los adapters específicos de proveedor deben consumir esta misma frontera de eventos, sin introducir payloads del proveedor dentro del código de reservas.

Flujo recomendado:

1. mapear el sobre versionado al contrato del proveedor;
2. mantener autenticación/configuración del proveedor dentro de su adapter;
3. preservar idempotencia usando IDs de evento o claves del proveedor;
4. reutilizar reintentos/auditoría durables cuando corresponda;
5. no añadir datos protegidos del viajero a un evento genérico solo porque un proveedor los solicite;
6. crear un contrato separado y explícitamente autorizado cuando compartir datos sensibles sea realmente necesario.

## Quality gate

Ejecuta:

```bash
npm run check:outbound-integrations
```

El gate verifica de forma permanente SSRF, firma HMAC, secretos cifrados, reintentos/dead-letter limitados, enqueue transaccional y gestión exclusiva de Admin.

También forma parte de:

```bash
npm run verify
```
