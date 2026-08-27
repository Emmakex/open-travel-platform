# Transporte centralizado de fallos

Open Travel Platform mantiene el reporte de fallos operativos independiente de proveedor. El core genera un evento mínimo y normalizado y puede entregarlo opcionalmente a un collector HTTPS de confianza. Ese collector específico del despliegue puede reenviar los eventos a Sentry, Datadog, Grafana/Alertmanager, un NOC interno u otra plataforma de monitorización sin acoplar el core MIT a un único proveedor.

## Modo de despliegue

```env
FAILURE_TRANSPORT_MODE=disabled
```

`disabled` es el valor por defecto. Los logs JSON estructurados de `lib/observability.ts` siguen disponibles en stdout/stderr aunque la entrega externa de fallos esté desactivada.

Para activar el transporte REST de referencia:

```env
FAILURE_TRANSPORT_MODE=rest
REST_FAILURE_TRANSPORT_URL=https://monitoring.example.com/open-travel/failures
REST_FAILURE_TRANSPORT_BEARER_TOKEN=
REST_FAILURE_TRANSPORT_TIMEOUT_MS=1500
REST_FAILURE_TRANSPORT_MAX_RESPONSE_BYTES=65536
```

En producción el endpoint debe usar HTTPS. HTTP solo se admite contra localhost durante desarrollo. Las credenciales son exclusivamente server-side y nunca deben usar variables `NEXT_PUBLIC_*`.

## Contrato

El adapter REST envía exactamente un `POST` por cada fallo reportado. Deliberadamente no reintenta: la entrega de monitorización no es autoritativa y los retries automáticos durante una incidencia pueden amplificar una tormenta de alertas o retrasar un flujo de pago/integración que ya está fallando.

Headers:

- `Content-Type: application/json`
- `Accept: application/json`
- `X-OTP-Failure-Contract-Version: 1`
- `X-OTP-Request-Id` cuando existe un correlation ID validado
- `Authorization: Bearer ...` server-only opcional

El body contiene un único objeto `failure` normalizado:

```json
{
  "failure": {
    "schemaVersion": 1,
    "occurredAt": "2026-08-27T05:00:00.000Z",
    "event": "payment.webhook.failed",
    "component": "payment-webhook",
    "severity": "error",
    "correlationId": "req-example-0001",
    "fingerprint": "<sha256>",
    "fields": {
      "provider": "stripe",
      "reason": "provider-unavailable"
    },
    "errorType": "Error",
    "errorCode": "PAYMENT_PROVIDER_UNAVAILABLE"
  }
}
```

El fingerprint es determinista para evento/componente/tipo de error/código de error normalizados. Es una clave de agrupación, no una clave de idempotencia. Cada ocurrencia se entrega una sola vez para que el sistema externo pueda contar frecuencia y a la vez agrupar fallos equivalentes.

## Política de severidad

- `warning`: servicio degradado o no preparado, sin implicar necesariamente pérdida de datos o fallo transaccional;
- `error`: un flujo operativo falló y requiere investigación/reintento;
- `critical`: reservado para condiciones que requieren escalado operativo inmediato.

Firmas de proveedor inválidas, callbacks malformados, webhooks duplicados y rate limiting normal del worker permanecen como logs estructurados locales; no se elevan automáticamente al transporte externo de fallos.

## Frontera de privacidad

El transporte reutiliza exactamente el mismo sanitizador del logging operativo estructurado. Los eventos genéricos excluyen campos cuyos nombres indiquen credenciales/tokens/firmas/cookies, bodies/payloads raw, identificadores de cliente/contacto, email/teléfono/dirección, datos de viajero/pasaporte/DNI/documento/salud, datos de tarjeta, referencias de proveedor y valores monetarios de importe/moneda/precio/coste.

Nunca se serializan `message` ni `stack` de una excepción. Solo puede emitirse un tipo de excepción seguro y un código de error estable y seguro. Cualquier enriquecimiento específico de un proveedor de monitorización que necesite más datos debe vivir fuera del core genérico y definir su propia finalidad legítima y política de retención.

## Semántica de fallo

El reporte es best-effort. Una caída de monitorización nunca puede modificar la autoridad de reservas, pagos, integraciones o readiness. La llamada REST está limitada por timeout y tamaño máximo de respuesta, rechaza redirects, usa `cache: no-store` y nunca reintenta automáticamente.

Si el collector rechaza o no puede recibir un evento, la operación original conserva su respuesta y se emite localmente el evento estructurado `observability.failure-transport.failed`. El transporte nunca intenta reportar recursivamente su propio fallo.

El collector de fallos no es una dependencia de `/api/health/ready`; una caída de monitorización por sí sola no debe marcar la aplicación como no preparada.

## Superficies instrumentadas actualmente

La frontera genérica se usa para fallos operativos de alto valor en:

- procesamiento del webhook server-side de Stripe;
- procesamiento de notificaciones server-side de Redsys;
- worker programado de integraciones;
- fallos de production readiness o estados degradados de readiness.

Nuevas superficies pueden adoptar `reportOperationalFailure()` sin introducir SDKs de proveedores dentro del core.

## Validación

CI bloqueante incluye:

```bash
npm run check:failure-transport
npm run test:failure-transport
```

La prueba dinámica usa transporte HTTP local real de Node y valida autenticación, headers de contrato, fingerprint estable, exclusión de datos sensibles, entrega de un solo intento y comportamiento best-effort ante fallo.

Browser E2E permanece como señal informativa/no bloqueante por política explícita del proyecto; los checks de failure transport son gates deterministas y bloqueantes.
