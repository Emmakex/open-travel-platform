# Validación de concurrencia MongoDB

La Fase 9B añade una prueba real de integración contra un replica set MongoDB para validar la integridad de reservas. Está separada de los smoke tests en modo demo y de los invariantes que solo inspeccionan código.

## Qué se prueba

`npm run test:mongodb-concurrency` ejecuta `MongoBookingRepository` contra un replica set MongoDB local y desechable y verifica:

- rollback de la transacción cuando se reserva inventario de salida pero falla posteriormente el inventario de alojamiento;
- las reservas concurrentes nunca pueden superar la capacidad de una salida;
- solo persisten reservas confirmadas por la transacción;
- el outbox transaccional contiene exactamente un evento de creación por cada reserva confirmada;
- una cancelación duplicada y concurrente libera inventario una sola vez y genera un único evento de cambio de estado;
- cancelar todas las reservas confirmadas devuelve el inventario de salida a cero.

## Seguridad del test destructivo

La prueba elimina su base de datos antes y después de ejecutarse. Por ello se niega a arrancar salvo que se cumplan ambas condiciones:

1. `MONGODB_DB_NAME` empieza por `ktravel_ci_`;
2. `MONGODB_URI` apunta a `localhost` o `127.0.0.1` mediante `mongodb://`.

Así se evita que el harness pueda apuntar accidentalmente a MongoDB Atlas o a otra base de datos remota.

## Topología en CI

GitHub Actions levanta un contenedor dedicado `mongo:8.0.29` con `--replSet rs0`, inicializa un replica set de un solo nodo, espera a que exista un primary escribible y ejecuta la prueba del repositorio.

Un proceso MongoDB standalone no es suficiente porque el repositorio de reservas depende de transacciones reales multidocumento.

El comando habitual `npm run verify` incluye el gate estático `check:mongodb-concurrency`, pero no necesita MongoDB. La prueba real se ejecuta en un job CI separado para que desarrollo local y builds demo sigan sin necesitar credenciales.

## Ejecución local

Levanta un replica set local desechable y configura, por ejemplo:

```text
MONGODB_URI=mongodb://127.0.0.1:27017/?replicaSet=rs0
MONGODB_DB_NAME=ktravel_ci_local
```

Después ejecuta:

```bash
npm run test:mongodb-concurrency
```

No se debe relajar el guard de seguridad para permitir bases productivas o compartidas solo para facilitar la ejecución del test.
