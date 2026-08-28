# Fase 9D-5.3 — Throughput acotado de mutaciones

Este bloque añade evidencia de rendimiento de mutaciones sin convertir CI compartido en una prueba de estrés sin control. Se ejecuta únicamente contra un **replica set MongoDB local, aislado y desechable**.

## Escenario

Una salida dedicada ofrece 16 plazas. El harness lanza 32 intentos concurrentes de reserva mediante el `MongoBookingRepository` soportado.

El comportamiento correcto está acotado de forma intencionada:

- exactamente 16 reservas hacen commit;
- exactamente 16 intentos se rechazan con `DEPARTURE_UNAVAILABLE`;
- `reservedSpaces` queda exactamente en 16 después de la carrera de saturación;
- existen exactamente 16 documentos de reserva;
- el outbox transaccional contiene exactamente un evento `trip.reservation.created` por cada reserva confirmada en base de datos;
- los IDs de reserva permanecen únicos.

Después, el test cancela concurrentemente las 16 reservas creadas y exige:

- cada cancelación hace commit una sola vez;
- el inventario vuelve exactamente a cero;
- las 16 reservas quedan en estado `cancelled`;
- el outbox contiene exactamente un evento de cambio de estado por cada reserva creada.

## Métricas

El harness informa latencia p50/p95/p99 y throughput de reloj real para creación y cancelación de reservas. Los rechazos esperados por capacidad se miden por separado y no cuentan como fallos de aplicación.

Los presupuestos p95 conservadores de CI sirven para detectar regresiones grandes. **No son SLO de producción ni garantías finales de capacidad**, porque los runners de GitHub, MongoDB local y el fixture sintético no representan la topología ni distribución real del tráfico productivo.

## Por qué las mutaciones se miden a nivel de repositorio

El objetivo de este bloque es el núcleo transaccional: asignación de inventario, persistencia de reserva y outbox bajo contención. La carga HTTP/browser añadiría autenticación, render y variabilidad de red ya cubiertos por 9D-5.1/9D-5.2, dificultando además el diagnóstico transaccional post-carga.

Una futura prueba específica del despliegue puede ejercitar la ruta HTTP completa de mutaciones, pero deberá mantener las mismas comprobaciones de inventario/outbox y nunca apuntar a entornos live de clientes/proveedores sin un plan aislado explícito.

## Relación con los gates existentes

La suite MongoDB de concurrencia de la Fase 9B sigue siendo la autoridad funcional para rollback, prevención de sobreventa y cancelación duplicada. 9D-5.3 añade evidencia de latencia/throughput con un nivel mayor pero acotado de contención; no sustituye el gate de corrección anterior.
