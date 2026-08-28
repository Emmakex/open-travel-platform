# Fase 9D-5.2 — Carga autenticada de lecturas críticas

Este bloque amplía el baseline HTTP de la Fase 9D-5 hacia superficies protegidas de cliente y Operator manteniendo el mismo límite de seguridad: **la carga medida es solo lectura**.

## Sesiones persistentes reales

El test no introduce ningún bypass de autenticación exclusivo para pruebas. La preparación usa la ruta soportada de identidad MongoDB:

- registra un cliente persistente;
- crea el token normal de sesión cliente y lo envía mediante la cookie real `ktravel_session`;
- crea/usa el Admin bootstrap configurado y un token normal de sesión staff mediante `ktravel_staff_session`;
- crea una reserva mediante el repositorio MongoDB soportado para que las rutas de detalle de cliente y Operator lean el mismo registro real.

El registro, creación de sesiones y la única reserva fixture ocurren **antes de empezar la medición**. No se contabilizan como requests de carga.

## Rutas medidas

Sesión cliente:

- `/account`
- `/account/reservations`
- `/account/reservations/{reservationId}`

Sesión staff:

- `/operator`
- `/operator/reservations`
- `/operator/reservations/{reservationId}`
- `/operator/reservations/{reservationId}/workflow`

Cada request medido es solo GET. Los redirects al login cuentan como fallo; así el baseline verifica que la lectura protegida se ejecutó realmente con una sesión persistente válida y no mide por error una página pública de fallback.

## Métricas y presupuestos

Cada escenario registra latencia mínima/media/p50/p95/p99/máxima, requests por segundo, número de requests, concurrencia y fallos. CI aplica presupuestos p95 conservadores porque los runners alojados de GitHub son variables. Estos presupuestos **no son SLO de producción ni garantías finales de capacidad**.

El primer objetivo es la repetibilidad: detectar degradaciones grandes en render server-side autenticado, resolución de sesiones MongoDB, lectura de reservas y agregación Operator antes de que un cambio llegue a `main`.

## Límite de capacidad

El fixture utiliza un cliente, un Admin, una reserva y concurrencia acotada. No representa el volumen de datos de producción, distancia de red, CDN, dimensionamiento de Atlas, latencia de proveedores ni picos reales de tráfico. Los umbrales productivos deberán calibrarse aparte con tráfico y telemetría de hosting de Kairoseth Travel.

## Qué no prueba este bloque

Este bloque no somete a carga mutaciones POST, creación de reservas, inicio de pagos, acciones de proveedores, ejecución de privacidad ni transiciones de tareas/estados. El throughput de mutaciones pertenece a un bloque aislado posterior donde pueda comprobarse de nuevo la corrección transaccional y de inventario después de la carga.
