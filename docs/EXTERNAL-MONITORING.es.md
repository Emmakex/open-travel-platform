# Monitorización externa y routing de alertas accionables

La Fase 9C-3 separa dos canales distintos de detección para que una caída total de la aplicación o de la red no pueda ocultarse a sí misma.

## Superficies de monitorización

Usa un servicio de uptime externo e independiente del runtime de Open Travel Platform.

### `GET /api/health/live`

Objetivo: detectar caída del proceso, ingress, DNS/TLS o indisponibilidad completa de la aplicación.

- permanece libre de dependencias;
- devuelve HTTP `200` mientras el proceso puede atender requests;
- expone únicamente el contrato estable de health;
- envía `X-OTP-Health-Contract-Version: 1`;
- envía un `X-Request-Id` validado/generado;
- desactiva caché e indexación.

Baseline recomendado: consulta cada 60 segundos con timeout de 5 segundos. Alerta tras dos fallos consecutivos y resuelve tras dos éxitos consecutivos. Un fallo de liveness debe ir a **availability** y normalmente debe paginar al responsable porque la aplicación puede estar completamente inaccesible.

### `GET /api/health/monitor`

Objetivo: ofrecer una señal externa de readiness segura sin exponer detalles internos de configuración, base de datos o worker.

- devuelve HTTP `200` con `status: "ok"` cuando el despliegue está listo;
- devuelve HTTP `503` con `status: "degraded"` cuando no se cumple el contrato de production-readiness existente;
- devuelve HTTP `503` con `status: "unavailable"` si falla la propia evaluación de readiness;
- omite deliberadamente el perfil de despliegue y los checks individuales;
- usa los mismos headers versionados que liveness.

Baseline recomendado: consulta cada 60 segundos. Trata dos respuestas `503` consecutivas como alerta accionable de disponibilidad; escala a urgente/page si la degradación persiste aproximadamente cinco minutos o se confirma impacto al cliente.

`/api/health/ready` sigue siendo el endpoint de diagnóstico operativo detallado. Los monitores públicos externos deben preferir `/api/health/monitor` porque expone solo el contrato mínimo y estable necesario para decidir uptime/readiness.

## Por qué el polling externo debe ser independiente

El `FailureTransport` opcional añadido en la Fase 9C-2 informa de fallos desde dentro de la aplicación en ejecución. No puede informar de un crash total del proceso, fallo DNS, fallo TLS, problema de routing, caída de Hostinger o pérdida de conectividad. Por eso producción debe usar ambos canales:

1. **polling externo independiente** de `/api/health/live` y `/api/health/monitor`;
2. **entrega interna de fallos estructurados** mediante `FailureTransport` cuando esté configurado.

Ninguno de los dos canales tiene autoridad sobre reservas, pagos, inventario o estado de integraciones.

## Routing de alertas accionables

Todo fallo normalizado enviado por `FailureTransport` recibe metadata de routing central. Los callers no pueden sobrescribir estos valores.

| Route | Fuente típica | Runbook | Uso predeterminado |
|---|---|---|---|
| `availability` | fallos de health/readiness | `availability-health` | disponibilidad de aplicación/dependencias |
| `payments` | fallos Stripe/Redsys/webhooks de pago | `payment-processing` | incidencias de procesamiento de pagos |
| `integrations` | fallos del worker durable de integraciones | `integration-delivery` | incidencias de webhooks/CRM/ERP/proveedores |
| `platform` | fallos operativos sin categoría específica | `platform-operations` | incidencias generales de plataforma |

El escalado se deriva únicamente de la severidad normalizada:

- `warning` → `notify`
- `error` → `urgent`
- `critical` → `page`

El collector o proveedor de monitorización puede mapear estos valores neutrales a email, SMS, teléfono, Slack, PagerDuty, Opsgenie u otro canal operativo. Las credenciales y configuración específicas del proveedor permanecen fuera del core open-source.

## Higiene de alertas

- Agrupa fallos internos equivalentes por el `fingerprint` SHA-256 existente.
- No crees una alerta nueva por cada polling de health; deja que el monitor externo aplique reglas de fallos consecutivos y recuperación.
- Firmas inválidas de proveedor, duplicados de webhook y rate limiting normal son señales operativas locales, no eventos para pager.
- Mantén datos de cliente/viajero, referencias de proveedor, payloads raw, credenciales y valores monetarios fuera de payloads genéricos de monitorización.
- Los correlation IDs son solo diagnóstico y nunca credenciales de autorización.

## Expectativas mínimas de runbook productivo

### `availability-health`

1. Confirmar estado externo de liveness y readiness.
2. Revisar despliegues/restarts recientes.
3. Comprobar salud de Hostinger/runtime y alcance público DNS/TLS.
4. Si liveness funciona pero readiness falla, inspeccionar `/api/health/ready` desde un contexto operativo autorizado y comprobar MongoDB/worker requeridos.
5. Hacer rollback del último despliegue cuando la degradación esté claramente correlacionada.

### `payment-processing`

1. Confirmar de forma independiente el estado del proveedor.
2. Revisar eventos de fallo normalizados y correlation IDs.
3. Verificar alcance/configuración de webhooks y firmas sin confiar en retornos del navegador.
4. Preservar el ledger local autoritativo y usar procedimientos idempotentes de replay/reconciliación.

### `integration-delivery`

1. Revisar salud del worker y estado de lease/rate limit.
2. Revisar dead-letter y diagnósticos recientes de entregas.
3. Confirmar disponibilidad independiente del endpoint downstream.
4. Reencolar únicamente mediante el flujo auditado de replay.

### `platform-operations`

1. Identificar componente emisor y fingerprint.
2. Correlacionar con cambios de despliegue/runtime.
3. Escalar al runbook de dominio correspondiente cuando se determine una causa más específica.

## Aceptación de despliegue

Antes de considerar un despliegue listo para producción, verifica desde fuera del host de la aplicación que:

- `/api/health/live` devuelve `200` y contrato versión `1`;
- `/api/health/monitor` devuelve `200` en un despliegue live saludable;
- romper intencionadamente una dependencia requerida de readiness produce `503` sin filtrar checks internos;
- las notificaciones del monitor externo llegan a la ruta de disponibilidad definida;
- un fallo interno controlado llega al `FailureTransport` configurado con `alertRoute`, `runbook` y `escalation` centrales;
- la recuperación cierra o resuelve la incidencia externa según la política del proveedor elegido.
