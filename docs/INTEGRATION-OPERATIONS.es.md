# Operaciones del worker de integraciones

<p align="center"><a href="./INTEGRATION-OPERATIONS.md">English</a> · <strong>Español</strong></p>

La Fase 8B convierte el outbox durable de la Fase 8A en un subsistema operativo de integraciones que puede ejecutarse sin depender de una sesión Admin en navegador.

## Endpoint del scheduler

Los schedulers/workers de producción llaman a:

```text
POST /api/internal/integrations/process?limit=25
Authorization: Bearer <INTEGRATION_WORKER_SECRET>
```

Reglas:

- únicamente `POST`;
- `INTEGRATION_WORKER_SECRET` es server-only y debe tener al menos 32 caracteres de alta entropía;
- la autenticación se compara mediante digest y comparación timing-safe;
- el token solo se acepta en la cabecera `Authorization`, nunca en parámetros de URL;
- `limit` debe ser un entero entre 1 y 100;
- las respuestas son `no-store` y `nosniff`;
- si falta el secreto del servidor, el endpoint falla cerrado con HTTP 503;
- autorización ausente o incorrecta devuelve HTTP 401.

La ruta utiliza el mismo procesador durable disponible en la acción diagnóstica de Admin. Los leases de MongoDB aportan control de concurrencia y recuperación frente a caídas cuando se solapan varias ejecuciones.

## Cadencia recomendada

Un despliegue puede invocar el endpoint cada 1–5 minutos según volumen y requisitos de latencia. La aplicación no crea por sí misma un scheduler externo; la plataforma de hosting es quien debe disparar la petición POST.

No coloques `INTEGRATION_WORKER_SECRET` en código cliente, JavaScript del navegador, variables `NEXT_PUBLIC_*`, URLs ni query strings.

## Salud de la cola

`/operator/integrations` muestra ahora:

- entregas vencidas ahora;
- totales pending/retrying/delivering/succeeded/dead-letter;
- entrega vencida más antigua;
- número de intentos de las últimas 24 horas;
- tasa de éxito de intentos en 24h;
- estado de configuración de la autenticación del worker;
- periodo configurado de retención del historial correcto.

La UI nunca descifra secretos de firma para mostrar diagnósticos de cola.

## Detalle de entrega

Los usuarios Admin pueden abrir una entrega concreta y consultar:

- estado durable;
- IDs de evento y endpoint;
- intentos del ciclo actual;
- último estado HTTP/error;
- fecha del próximo intento;
- sobre versionado del evento;
- historial retenido de intentos;
- historial de replay manual.

El contrato genérico de eventos sigue excluyendo valores post-compra protegidos del viajero.

## Replay de dead-letter

Solo las entregas que ya están en `dead-letter` pueden reencolarse manualmente.

Un requeue:

1. exige identidad Admin;
2. exige un motivo operativo de 10–500 caracteres;
3. ejecuta el cambio de estado y la auditoría en una misma transacción MongoDB;
4. cambia la entrega a `retrying` y la programa inmediatamente;
5. reinicia a cero el contador del ciclo actual para permitir un nuevo ciclo limitado de reintentos;
6. **no** elimina los intentos históricos anteriores;
7. registra actor, rol, motivo, número de intentos anteriores y timestamp en `travel_integration_replay_audit`.

Así, el replay es explícito y trazable, no una modificación oculta del historial de errores.

## Retención

El historial de entregas/eventos/intentos correctos se conserva durante un periodo configurable:

```text
INTEGRATION_HISTORY_RETENTION_DAYS=180
```

La aplicación limita el valor a 30–730 días. Cada ejecución autenticada del scheduler realiza un lote acotado de limpieza.

La retención automática:

- solo actúa sobre entregas `succeeded` anteriores al corte;
- elimina su historial de intentos;
- elimina un evento únicamente si ninguna entrega sigue referenciándolo;
- nunca elimina automáticamente entregas `dead-letter`;
- conserva las auditorías de replay manual como evidencia operativa.

Esto evita crecimiento ilimitado del historial sin borrar fallos pendientes de revisión humana.

## Ejemplo de scheduler

Ejemplo genérico con curl:

```bash
curl -fsS -X POST \
  -H "Authorization: Bearer $INTEGRATION_WORKER_SECRET" \
  "https://travel.example.com/api/internal/integrations/process?limit=25"
```

Utiliza el almacén de secretos de la plataforma de hosting al configurar tareas programadas. Nunca escribas el token directamente en archivos del repositorio.

## Modelo de fallos

Que el endpoint del scheduler devuelva HTTP 200 significa que el lote se ejecutó; los fallos individuales de entrega aparecen en los contadores y en el estado durable de la cola. Los reintentos siguen las reglas de backoff/dead-letter de la Fase 8A.

Un HTTP 500 del worker indica que el lote no pudo completarse a nivel de aplicación y el scheduler puede volver a intentarlo posteriormente. Los leases existentes expiran y pueden recuperarse en una ejecución posterior.

## Quality gate

Ejecuta:

```bash
npm run check:integration-worker
```

El invariante comprueba:

- autenticación server-only fail-closed;
- longitud mínima del secreto y comparación timing-safe;
- ejecución POST-only y lote acotado;
- ausencia de secretos del worker en query string;
- cabeceras privadas de respuesta;
- diagnóstico/replay exclusivo de Admin;
- requeue solo desde dead-letter, motivo obligatorio y auditoría transaccional;
- métricas de salud;
- retención limitada de historiales correctos preservando dead-letter.

El check forma parte de `npm run verify` y GitHub CI.
