# Fase 9D-5.4 — Baseline de recursos runtime y capacidad

La fase **9D-5.4** cierra el baseline de preparación de rendimiento/carga en CI observando el propio proceso de la aplicación mientras el mismo runtime Next.js standalone empaquetado para self-host soporta carga sostenida acotada y un pico de concurrencia superior.

## Qué valida

El workflow bloqueante en Linux inicia un replica set local y desechable de MongoDB 8, carga datos controlados, compila la aplicación, ejecuta `npm run package:standalone` y después deja que el test gestione el ciclo de vida de `.next/standalone/server.js`.

La carga medida sigue siendo **solo lectura**. Mezcla peticiones GET locales representativas sobre:

- `/api/health/live`;
- `/`;
- `/trips/barcelona-city-break/book`;
- `/account/sign-in`;
- `/operator/sign-in`.

El test primero calienta estas rutas, registra un baseline del proceso y después ejecuta:

- **carga sostenida:** 240 peticiones con concurrencia 12;
- **pico acotado:** 320 peticiones con concurrencia 32.

Cada petición debe devolver HTTP 200. El proceso standalone debe seguir vivo durante todo el pico y `/api/health/live` debe continuar respondiendo correctamente después de la carga.

## Señales del runtime

Durante la carga se muestrea Linux `/proc`. El baseline registra:

- memoria residente (**RSS / VmRSS**);
- máximo histórico de RSS del proceso (**VmHWM**);
- **descriptores de archivo** abiertos;
- número de threads del proceso.

El gate de CI aplica límites deliberadamente conservadores a RSS absoluto, crecimiento de RSS, crecimiento de descriptores, recuperación acotada de descriptores tras la carga y crecimiento de threads. El objetivo es detectar fugas evidentes, crecimiento descontrolado de recursos y falta de recuperación después de una ráfaga acotada.

El test también emite latencias p50/p95/p99 y throughput para las fases sostenida y de pico.

## Los presupuestos de CI no son SLO de producción

Los límites de runtime **no son SLO de producción**, garantías de dimensionamiento ni compromisos de capacidad para clientes. Los runners de GitHub son distintos de un entorno productivo real en CPU, memoria, red, filesystem, modelo de procesos, CDN/cache y topología MongoDB.

Un CI verde significa que la aplicación standalone empaquetada permanece acotada y recuperable bajo este perfil sintético repetible. No demuestra el máximo tráfico seguro que soportará producción.

## Umbrales de capacidad en producción

Cada despliegue debe fijar sus umbrales a partir de telemetría y tráfico reales, no copiando números de CI. Como mínimo hay que observar:

- latencia p50/p95/p99 por familia de rutas;
- tasas 4xx/5xx y fallos de transporte;
- RSS, heap, CPU y retraso del event loop de la aplicación;
- presión sobre descriptores de archivo y sockets;
- peticiones activas y conexiones;
- uso del pool de MongoDB, consultas lentas y señales de saturación de Atlas;
- profundidad y retraso de la cola de workers de integración;
- latencia de proveedores de pago separada de la latencia local de la aplicación.

Los triggers operativos deben basarse en tendencias y ventanas sostenidas. Por ejemplo:

1. investigar cuando la latencia p95 se separa materialmente del baseline móvil del despliegue durante varios intervalos consecutivos;
2. escalar o reducir carga antes de que RSS/heap se acerque al límite de memoria del hosting o una presión repetida de GC degrade la latencia;
3. investigar crecimiento de descriptores/sockets que no regrese hacia el baseline cuando disminuye el tráfico;
4. investigar saturación del pool de base de datos o evidencia de consultas lentas antes de añadir infraestructura o índices;
5. repetir una prueba de carga similar a producción tras cambios relevantes en tamaño de catálogo, forma del tráfico, tier de hosting, tier de base de datos o runtime del servidor.

## Límite de base de datos y proveedores

Esta fase no añade índices. La fase 9C-8 sigue siendo la autoridad para evidencia de query plans, y la fase 9D-5.3 sigue siendo la autoridad para throughput de mutaciones acotado y corrección post-carga de reservas/inventario/outbox.

La validación credencializada TEST/LIVE de Stripe/Redsys continúa siendo un requisito separado y dependiente de proveedores. La latencia externa de PSP no debe mezclarse con el baseline local de recursos de la aplicación.

## Conjunto de evidencia de la fase 9D-5

Con 9D-5.4, el baseline de preparación de rendimiento/carga queda formado por:

- **9D-5.1:** latencia y throughput HTTP público/solo lectura;
- **9D-5.2:** carga autenticada de cliente y Operator con sesiones persistentes reales;
- **9D-5.3:** throughput acotado de reservas/cancelaciones con verificación post-carga;
- **9D-5.4:** observación de RSS/descriptores/threads sobre runtime standalone, supervivencia a picos acotados y guía de capacidad para producción.

Estas cuatro capas ofrecen un baseline repetible de regresión manteniendo el dimensionamiento final específico de cada despliegue.
