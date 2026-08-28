# Preparación de rendimiento y carga

La Fase **9D-5** establece evidencia repetible de rendimiento/carga para Open Travel Platform y el despliegue de referencia Kairoseth Travel sin acoplar el core MIT a un proveedor de hosting ni añadir índices de base de datos especulativos.

Los baselines de CI son señales de regresión. Separan deliberadamente el comportamiento local de la aplicación de la capacidad productiva específica de cada despliegue y de la latencia de proveedores externos.

## 9D-5.1 — Baseline HTTP público/solo lectura

Un baseline bloqueante contra el build productivo ejecuta GET representativos sobre un replica set MongoDB local y desechable:

- `/api/health/live`;
- `/`;
- `/trips/barcelona-city-break/book`;
- `/account/sign-in`;
- `/operator/sign-in`.

Cada escenario realiza warm-up y emite latencia mínima/media, p50/p95/p99/máxima, requests por segundo, concurrencia y número de fallos. Cualquier estado inesperado o fallo de transporte bloquea el gate.

La primera evidencia aceptada completó **150 peticiones con 0 fallos**. En ese runner los p95 observados estuvieron aproximadamente entre 35 y 59 ms en las rutas medidas, con liveness alrededor de 52 ms. Son datos históricos del runner, no expectativas fijas de producción.

## 9D-5.2 — Lecturas críticas autenticadas

El baseline autenticado prepara un cliente, una sesión Admin y una reserva real MongoDB antes de medir. Usa las mismas APIs persistentes de sesión y los mismos nombres de cookie que la aplicación; no existe bypass de autenticación para tests.

La carga medida sigue siendo GET/solo lectura y cubre:

- `/account`;
- `/account/reservations`;
- detalle de reserva de cliente;
- `/operator`;
- `/operator/reservations`;
- detalle de reserva Operator;
- workflow de reserva Operator.

La primera evidencia aceptada completó **156 peticiones autenticadas con 0 fallos y sin redirects de autenticación**. Los p95 observados estuvieron entre aproximadamente 45,58 ms y 111,26 ms en ese runner.

## 9D-5.3 — Throughput acotado de mutaciones y corrección post-carga

El rendimiento de mutaciones se aísla de los baselines HTTP/read. Un replica set MongoDB 8 local y desechable recibe **32 intentos concurrentes de reserva contra exactamente 16 plazas disponibles**.

El resultado aceptado debe ser matemáticamente exacto:

- 16 reservas confirmadas en la transacción;
- 16 rechazos esperados `DEPARTURE_UNAVAILABLE`;
- ningún oversell;
- IDs de reserva confirmados únicos;
- exactamente un evento de creación en el outbox transaccional por commit;
- cancelación concurrente de todas las reservas confirmadas;
- inventario final de la salida exactamente en cero;
- exactamente un evento de cancelación por reserva confirmada.

La primera ejecución aceptada registró p95 de creación **554,78 ms**, p95 de cancelación **323,5 ms**, resultado de capacidad 16/16 esperado y `postLoadCorrectness: passed`.

La Fase 9B sigue siendo la autoridad funcional más amplia para rollback, protección contra oversell y cancelación duplicada. 9D-5.3 añade evidencia repetible de tiempos bajo un nivel mayor pero acotado de contención.

## 9D-5.4 — Recursos del runtime, pico acotado y recuperación

El bloque de cierre gestiona un proceso productivo `next start` en Linux, muestrea `/proc` y ejecuta dos fases de carga mixta solo lectura:

- carga sostenida: **240 peticiones / concurrencia 12**;
- pico acotado: **320 peticiones / concurrencia 32**.

Observa:

- memoria residente (**RSS / VmRSS**);
- máximo histórico de RSS del proceso (**VmHWM**);
- descriptores de archivo abiertos;
- número de threads del proceso;
- latencia p50/p95/p99 y throughput.

El servidor debe sobrevivir al pico, cada request medido debe devolver HTTP 200, el liveness posterior debe seguir funcionando, el crecimiento de recursos debe permanecer dentro de límites conservadores de CI y los descriptores deben recuperar cerca del baseline previo. Consulta `PERFORMANCE-RUNTIME-RESOURCE.es.md` para el contrato detallado.

La primera ejecución aceptada completó **560 peticiones con 0 fallos**. La carga sostenida registró p95 **109,10 ms** a aproximadamente **184,01 requests/segundo**; el pico de mayor concurrencia registró p95 **233,10 ms** a aproximadamente **227,17 requests/segundo**. El RSS del proceso pasó de **193,78 MB** en el baseline calentado a un máximo/valor post-carga medido de **395,74 MB** (**+201,96 MB**), los descriptores pasaron de **40 a 84** y los threads se mantuvieron **15 → 15**. La aplicación permaneció viva y el liveness post-carga pasó correctamente. Son observaciones aceptadas del runner de GitHub, no cifras de dimensionamiento productivo.

## Los presupuestos de CI no son SLO de producción

Los runners alojados de GitHub son variables y no representan la infraestructura productiva, distancia de red, comportamiento CDN, dimensionamiento de Atlas ni distribución real del tráfico. Los límites de CI son presupuestos de regresión para detectar deterioros grandes, fugas o crecimiento descontrolado en un entorno repetible. **No son SLO de producción, compromisos de capacidad ni garantías de latencia para clientes**.

Los objetivos de producción deben calibrarse con el despliegue real de Kairoseth Travel y con cualquier otro despliegue que use este core.

## Señales de capacidad en producción

Como mínimo, la monitorización productiva debe establecer baselines móviles y alertas para:

- latencia p50/p95/p99 por familia de rutas críticas;
- tasa de requests, 4xx/5xx y fallos de transporte;
- RSS, heap, CPU y retraso del event loop;
- presión de descriptores/sockets;
- peticiones activas y número de conexiones;
- presión del pool MongoDB, queries lentas y saturación de Atlas;
- profundidad/retraso de la cola de workers de integración;
- latencia externa de Stripe/Redsys/proveedores separada de la latencia local.

Hay que repetir pruebas similares a producción tras cambios relevantes de tamaño de catálogo, distribución del tráfico, tier de hosting, tier de base de datos, runtime Node/Next o topología de integraciones.

## Supuestos de capacidad

La evidencia bloqueante de CI asume intencionadamente:

- un proceso de aplicación en un runner Linux de GitHub;
- un miembro local de replica set MongoDB 8;
- catálogo y salida controlados mediante seed;
- ninguna llamada de red externa a Stripe, Redsys, CRM, ERP o proveedores;
- concurrencia sintética acotada;
- ninguna capa CDN/cache adicional más allá del build productivo de Next.js.

Estos supuestos permiten comparar regresiones. No describen la topología productiva final ni el máximo tráfico seguro.

## Límite de base de datos

La Fase 9C-8 ya valida los índices MongoDB soportados y planes representativos mediante evidencia real de `explain("executionStats")`. Un escenario HTTP o de recursos lento no justifica por sí solo añadir un índice. Los cambios de base de datos requieren evidencia de query plan y deben conservar los gates de rendimiento existentes.

## Límite de proveedores

La validación E2E TEST/LIVE de Stripe/Redsys con credenciales continúa siendo un requisito separado de hardening dependiente de proveedores. Los harnesses de rendimiento no simulan el comportamiento externo de PSP y su latencia no debe interpretarse como capacidad local de la aplicación.

## Conjunto de evidencia de la Fase 9D-5

El baseline de ingeniería completado queda formado por:

1. **9D-5.1** latencia/throughput HTTP público y solo lectura;
2. **9D-5.2** carga autenticada de cliente y Operator con sesiones persistentes reales;
3. **9D-5.3** throughput acotado de reservas/cancelaciones con corrección transaccional post-carga;
4. **9D-5.4** observación de RSS/descriptores/threads, supervivencia/recuperación ante pico acotado y guía de capacidad productiva.

Estas capas aportan evidencia repetible de regresión manteniendo el dimensionamiento real específico de cada despliegue.
