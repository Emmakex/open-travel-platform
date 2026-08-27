# Revisión de índices y rendimiento MongoDB

La Fase 9C-8 cierra la revisión de índices de endurecimiento de producción para las rutas críticas respaldadas por MongoDB en Open Travel Platform.

El objetivo no es maximizar el número de índices. Cada índice adicional aumenta escrituras, almacenamiento y mantenimiento. Por eso esta revisión añade únicamente índices ligados a consultas reales de la aplicación y los valida con `explain("executionStats")` sobre un dataset desechable de MongoDB 8.

## Índices críticos añadidos

### Reservas

- `travel_reservation_created` → `{ createdAt: -1 }`
  - soporta la cola de reservas del Operador, ordenada por las más recientes;
  - evita un escaneo/ordenación completa de la colección a medida que crece el volumen.
- `travel_reservation_status` → `{ status: 1 }`
  - soporta los predicados de resumen por estado;
  - complementa, no sustituye, los índices compuestos por viaje/salida/cliente.

### Datos protegidos de viajeros

- `traveller_data_customer_active` → `{ identityId, targetType, reservationId, retentionUntil }`
  - coincide con la consulta post-compra del cliente incluyendo el límite de retención.
- `traveller_data_reservation_active` → `{ targetType, reservationId, retentionUntil }`
  - coincide con la consulta de completitud del Operador sin exigir identidad de cliente.

El índice TTL existente sobre `retentionUntil` sigue siendo autoritativo para la expiración. Los nuevos índices compuestos optimizan lecturas; no modifican la semántica de retención.

### Worker e historial de integraciones

- `integration_delivery_due_queue` → `{ status, nextAttemptAt, createdAt }`
  - coincide con la selección de entregas pendientes/reintentando ya vencidas.
- `integration_delivery_lease_queue` → `{ status, leaseUntil, createdAt }`
  - coincide con la recuperación de leases expirados en estado `delivering`.
- `integration_delivery_created` → `{ createdAt: -1 }`
  - soporta el historial reciente de entregas.

El índice genérico de cola anterior se mantiene compatible y no se elimina de forma destructiva en este bloque. Una revisión posterior basada en métricas reales podrá retirar índices reemplazados únicamente cuando Atlas demuestre que no se utilizan.

## Índices existentes revisados sin cambios

Las transacciones de pago ya tienen índices dedicados para reserva/historial, idempotencia por referencia de proveedor y estado/tipo. La auditoría privilegiada/de operaciones ya tiene índices cronológicos y por reserva. Las tareas de Operaciones ya disponen de índices por objetivo, asignado y cola. Añadir más sin evidencia medida sería sobreindexar.

## Gate automático de planes de consulta

El workflow dedicado de MongoDB crea miles de registros representativos y ejecuta los mismos filtros/ordenaciones utilizados por la aplicación. Exige:

- que el índice nombrado esperado aparezca en el plan ganador/de ejecución;
- ausencia de `COLLSCAN` en las rutas críticas validadas;
- `totalDocsExamined` acotado para consultas selectivas o limitadas;
- que el predicado combinado de reclamación de integraciones siga respaldado por índices.

El gate usa MongoDB 8 real y `explain("executionStats")`; no depende únicamente de declaraciones estáticas de índices.

## Seguimiento en Atlas de producción

CI sintético demuestra compatibilidad entre consultas e índices, no la cardinalidad ni el comportamiento de hardware de producción. Tras el despliegue conviene revisar periódicamente Atlas Query Profiler / Performance Advisor y la telemetría de consultas lentas para:

- latencia y cambios en p95/p99;
- claves examinadas frente a documentos devueltos;
- `COLLSCAN` inesperados;
- tamaño de índices y amplificación de escritura;
- índices sin uso durante una ventana representativa.

No copies directamente los umbrales de CI a los SLO de producción. El ajuste de producción debe basarse en volumen y cardinalidad reales.

## Ciclo de vida seguro de índices

1. Añadir índices nuevos antes de depender de ellos en producción.
2. Verificar readiness y planes de consulta representativos.
3. Observar su uso en Atlas durante una ventana representativa.
4. Eliminar un índice antiguo/reemplazado solo con evidencia de que ninguna otra consulta lo necesita.
5. Mantener, cuando sea posible, el rollback de código independiente de la retirada de índices; los cambios aditivos facilitan el rollback de la aplicación.

Esta fase utiliza intencionadamente cambios de índice aditivos para que un rollback del despliegue no requiera un rollback inmediato de base de datos.
