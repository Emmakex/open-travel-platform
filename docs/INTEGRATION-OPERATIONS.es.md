# Operativa de integraciones: scheduler, replay y observabilidad

La Fase 8B convierte la base de integraciones salientes de la Fase 8A en un subsistema de entrega operable. No cambia el contrato de eventos neutral respecto a proveedor ni añade payloads específicos de proveedor a los dominios de reserva.

## Qué añade la Fase 8B

- un entry point de worker programado server-only;
- autenticación mediante Bearer token independiente de sesiones de navegador/Admin;
- lease global durable del worker e intervalo mínimo de ejecución;
- lotes programados limitados;
- métricas de salud Admin y diagnóstico detallado de eventos/entregas;
- replay/requeue auditado de dead-letter;
- retención limitada del historial completado correctamente;
- metadatos de auditoría de retención sin guardar secretos webhook ni valores protegidos de viajeros.

## Endpoint del scheduler

```text
POST /api/internal/integrations/process
Authorization: Bearer <KTRAVEL_INTEGRATION_WORKER_TOKEN>
```

No existe deliberadamente una ruta GET de ejecución. Las respuestas usan `no-store` y `nosniff`.

El token del worker debe ser un valor server-only de al menos 32 caracteres:

```text
KTRAVEL_INTEGRATION_WORKER_TOKEN=
```

No debe exponerse mediante `NEXT_PUBLIC_*`, HTML, JavaScript cliente, logs ni URLs del scheduler.

Ejemplo desde un scheduler de despliegue confiable:

```bash
curl --fail-with-body \
  -X POST \
  -H "Authorization: Bearer $KTRAVEL_INTEGRATION_WORKER_TOKEN" \
  https://travel.example.com/api/internal/integrations/process
```

El despliegue puede llamar este endpoint desde su cron/scheduler nativo. La plataforma no presupone ejecución en segundo plano si el despliegue no configura realmente un scheduler.

## Límites del worker

```text
INTEGRATION_WORKER_BATCH_SIZE=10
INTEGRATION_WORKER_MIN_INTERVAL_SECONDS=60
```

Límites aplicados server-side:

- lote: `1..25`;
- intervalo mínimo: `10..3600` segundos.

El scheduler y el procesador manual de Admin comparten un lock durable en MongoDB. Cada entrega mantiene además los leases de la Fase 8A, por lo que un proceso caído puede recuperarse sin reclamar dos veces trabajo activo.

Respuestas habituales del worker:

- `200` — ejecución autenticada completada;
- `401` — Bearer token ausente o inválido;
- `429` — otro proceso posee el lease del worker o aún no ha transcurrido el intervalo mínimo; se devuelve `Retry-After`;
- `503` — `KTRAVEL_INTEGRATION_WORKER_TOKEN` no está configurado;
- `500` — fallo de ejecución; la respuesta sigue siendo genérica y el detalle queda en logs del servidor/diagnósticos Admin.

## Observabilidad Admin

`/operator/integrations` sigue siendo exclusivo de Admin e incluye ahora:

- número de entregas pending;
- delivering usado internamente para salud;
- número de retrying;
- número de dead-letter;
- entrega actualmente vencida más antigua;
- tasas de éxito/fallo de intentos de las últimas 24 horas;
- estado de configuración de la autenticación del worker;
- lote programado, intervalo mínimo y ventana de retención configurados.

Las filas de entregas recientes abren una página de diagnóstico específica. Los detalles de evento están disponibles desde las vistas de entrega y evento.

Los diagnósticos no muestran deliberadamente:

- secretos de firma;
- el Bearer token del worker;
- material cifrado de secretos;
- valores post-compra protegidos de identidad/documentación de viajeros.

La página de evento solo muestra el sobre operativo neutral ya definido.

## Replay de dead-letter

Solo una entrega que esté actualmente en `dead-letter` puede reencolarse manualmente, y el servidor vuelve a exigir el rol Admin aunque la UI ya sea exclusiva de Admin.

Comportamiento del replay:

1. el estado de la entrega y el evento de auditoría del replay se escriben en una única transacción MongoDB;
2. la entrega vuelve a `pending`;
3. el contador de intentos del ciclo actual vuelve a cero;
4. se conserva el historial durable de intentos anterior;
5. se limpia del registro vivo el estado previo de dead-letter/error/HTTP;
6. empieza un nuevo ciclo de reintentos limitado mediante el worker normal.

La auditoría de replay guarda identificadores, actor, número previo de intentos y timestamp. No guarda secretos de firma ni payloads protegidos del viajero.

## Semántica de las tasas de salud

Los porcentajes recientes de éxito/fallo se calculan sobre **intentos de entrega** observados durante las últimas 24 horas:

- éxito = outcome `succeeded`;
- fallo = outcome `retrying` o `dead-letter`.

Si no hay intentos en la ventana, las tasas se muestran como no disponibles en lugar de un 0% engañoso.

## Retención

```text
INTEGRATION_COMPLETED_RETENTION_DAYS=180
```

Límite server-side: `30..3650` días.

Cada ejecución programada/Admin realiza una pasada limitada de retención sobre historial antiguo **completado correctamente**. Como máximo se consideran 1.000 entregas exitosas por pasada.

Para éxitos completados elegibles, la limpieza puede eliminar:

- registros de entregas exitosas;
- sus filas de intentos;
- sobres de evento antiguos solo cuando ninguna entrega restante siga referenciando el evento.

La política automática de historial completado **no** elimina:

- entregas dead-letter;
- trabajo pending/retrying/delivering;
- auditoría de replay manual;
- auditoría de configuración de endpoints.

Cada limpieza que elimina datos escribe metadatos agregados de auditoría: cutoff, días de retención y cantidades eliminadas. No persiste copias de payloads webhook ni secretos.

## Modelo de seguridad

La Fase 8B conserva todas las protecciones webhook de la Fase 8A:

- destinos solo HTTPS;
- validación DNS y rechazo de redes privadas/reservadas;
- revalidación DNS antes de cada envío;
- conexión al IP validado conservando TLS SNI/HTTP Host original;
- sin redirects;
- timeout y tamaño de respuesta limitados;
- firmas HMAC-SHA256;
- secretos de firma write-only y cifrados;
- outbox transaccional e idempotencia por pareja evento/endpoint.

El endpoint del scheduler añade una credencial server-only independiente. Nunca acepta una cookie Admin como sustituto del Bearer token del worker.

## Checklist de despliegue

1. Configurar MongoDB y `INTEGRATION_SECRETS_KEY` de la Fase 8A.
2. Generar un `KTRAVEL_INTEGRATION_WORKER_TOKEN` de alta entropía con al menos 32 caracteres.
3. Configurar lote/intervalo/retención o mantener los defaults seguros.
4. Configurar el scheduler del despliegue para hacer POST al endpoint interno usando la cabecera Authorization.
5. Confirmar una ejecución manual/programada desde `/operator/integrations`.
6. Verificar métricas de salud y páginas de detalle de entrega.
7. Probar un endpoint controlado que falle hasta visualizar retry/dead-letter.
8. Reencolar ese dead-letter desde Admin y confirmar el registro de auditoría del replay.

## Quality gate

```bash
npm run check:integration-operations
```

El invariante está incluido en `npm run verify` y GitHub CI.
