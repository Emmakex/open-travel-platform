# Preparación de rendimiento y carga

La Fase **9D-5** establece evidencia repetible de rendimiento/carga para Open Travel Platform y el despliegue de referencia Kairoseth Travel sin acoplar el core a un proveedor de hosting ni añadir índices de base de datos especulativos.

## 9D-5.1 — Baseline HTTP en CI

El primer bloque es un baseline bloqueante de **solo lectura** ejecutado en CI contra un build de producción y un replica set MongoDB local y desechable.

El baseline cubre superficies representativas:

- liveness del proceso: `/api/health/live`;
- catálogo público: `/`;
- ruta de lectura/render del booking: `/trips/barcelona-city-break/book`;
- entrada de autenticación de cliente: `/account/sign-in`;
- entrada de autenticación de Operator: `/operator/sign-in`.

No envía reservas, pagos, cambios de perfil de cliente ni acciones Operator bajo carga concurrente en CI. La corrección de mutaciones/concurrencia con estado ya está cubierta por las suites dedicadas de transacciones e idempotencia MongoDB y no debe mezclarse con este baseline de latencia HTTP.

## Métricas

Cada escenario realiza un warm-up corto y después un número acotado de requests concurrentes. El test emite JSON estructurado con:

- latencia mínima y media;
- latencia **p50**, **p95** y **p99**;
- latencia máxima;
- requests por segundo;
- número de requests, concurrencia configurada y número de fallos.

Cualquier respuesta HTTP inesperada o fallo de transporte hace fallar el baseline. Cada escenario también aplica un presupuesto p95 de CI deliberadamente conservador.

## Los presupuestos de CI no son SLO de producción

Los runners alojados de GitHub son variables y no representan la infraestructura productiva, distancia de red, comportamiento CDN, dimensionamiento de Atlas ni distribución real del tráfico. Los umbrales p95 actuales son presupuestos de regresión para detectar degradaciones grandes en un entorno repetible; **no son SLO de producción, compromisos de capacidad ni garantías de latencia para clientes**.

El seguimiento de producción deberá definir objetivos específicos del entorno a partir de tráfico e infraestructura observados. Señales iniciales recomendadas:

- latencia p50/p95/p99 de respuesta del servidor por familia de rutas críticas;
- tasa de requests/errores y saturación en periodos punta;
- presión del pool de conexiones MongoDB y evidencia de queries lentas;
- saturación de CPU/memoria/event loop del runtime;
- retraso de colas/workers de integraciones;
- latencia de pagos/proveedores separada de la latencia local de la aplicación.

## Supuestos de capacidad

El baseline de CI asume intencionadamente:

- un proceso de aplicación en un runner Linux de GitHub;
- un miembro local de replica set MongoDB 8;
- catálogo y salida controlados mediante seed;
- ninguna llamada externa a Stripe, Redsys, CRM, ERP o proveedores;
- concurrencia acotada (actualmente 6–8 workers por escenario);
- ninguna capa CDN/cache adicional más allá de lo que proporcione el propio build productivo de Next.js.

Estos supuestos permiten comparar regresiones de forma repetible. No describen la topología productiva final.

## Límite de base de datos

La Fase 9C ya valida el inventario de índices MongoDB soportado y planes representativos de consulta usando evidencia real de `explain("executionStats")`. La Fase 9D-5 debe apoyarse en ese baseline. Un escenario HTTP lento no justifica por sí solo añadir un índice. Cualquier cambio de base de datos requiere evidencia de query plan y debe conservar los gates existentes de rendimiento de índices.

## Bloques siguientes

Después de este baseline de solo lectura, 9D-5 deberá añadir:

1. carga persistente autenticada de rutas de lectura de cuenta cliente y Operator usando sesiones/datos controlados;
2. pruebas acotadas de throughput de mutaciones en bases aisladas donde se pueda revalidar la corrección transaccional después de la carga;
3. observación de memoria/CPU/event loop y pool de conexiones cuando el runtime de despliegue exponga telemetría fiable;
4. umbrales de seguimiento productivo basados en tráfico y características reales de hosting de Kairoseth Travel.

La validación E2E TEST/LIVE de Stripe/Redsys con credenciales sigue siendo un requisito separado dependiente de proveedores y no se simula con este harness de carga.
