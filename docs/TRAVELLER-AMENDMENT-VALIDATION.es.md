# Validación de pricing de viajeros y modificaciones

La Fase 9B valida el pricing de viajeros/menores y las modificaciones de reserva contra un replica set MongoDB real y desechable. Es un gate bloqueante de CI y no depende del E2E de navegador ni de mocks.

## Qué demuestra el test de integración

`tests/mongodb-traveller-amendments.ts` ejecuta directamente el código productivo de pricing y modificaciones:

- la edad se calcula respecto a la fecha de salida, no respecto a la fecha actual;
- se cubre exactamente el límite del cumpleaños: un viajero tiene 17 años el 2099-06-14 y 18 el 2099-06-15;
- un menor sin adulto responsable es rechazado;
- se preservan snapshots de precios por banda de edad y salida;
- se respetan las reglas configurables `consumesInventory`;
- cambiar de salida recalcula edad, precio y necesidad de inventario de forma atómica;
- un menor que pasa a adulto puede cambiar tanto el total de cliente como el consumo de plazas;
- la modificación registra actor, rol, motivo, before/after, `priceDelta`, moneda y movimiento de inventario;
- los movimientos históricos `succeeded` del ledger de pagos no se reescriben por repricing ni por correcciones de identidad;
- una corrección de identidad del viajero crea su propia auditoría sin repricing de la reserva;
- la falta de capacidad en la salida destino aborta la transacción;
- un cambio fallido deja intactos inventario origen/destino, reserva e historial de modificaciones.

## Topología CI

El test se ejecuta dentro del job bloqueante `mongodb-concurrency` de GitHub Actions con:

- `mongo:8.0.29`;
- replica set de un nodo para ejecutar transacciones MongoDB reales;
- `OPERATIONS_MODE=mongodb` en el step de modificaciones;
- nombre de base desechable que comienza por `ktravel_ci_`.

Para ejecutarlo localmente usa únicamente un replica set local desechable:

```bash
OPERATIONS_MODE=mongodb \
MONGODB_URI='mongodb://127.0.0.1:27017/?replicaSet=rs0' \
MONGODB_DB_NAME='ktravel_ci_traveller_local' \
npm run test:mongodb-traveller-amendments
```

El test rechaza hosts MongoDB remotos y nombres de base que no sean CI porque ejecuta `dropDatabase()`.

## Autoridad financiera

Una modificación puede cambiar el total actual de la reserva y registra explícitamente el delta, pero los movimientos históricos de pago/reembolso permanecen inmutables. La conciliación compara el total autoritativo actual de la reserva con el ledger append-only en vez de reescribir pagos ya asentados.

## Política del E2E de navegador

El journey Playwright continúa siendo informativo/no bloqueante por decisión del proyecto. La validación de viajeros/modificaciones es independiente y bloqueante porque comprueba directamente garantías deterministas del dominio y de las transacciones MongoDB.

## Gate permanente

`npm run check:traveller-amendment-validation` protege la topología del test y sus invariants esenciales para que no desaparezcan silenciosamente del CI.
