# Validación de idempotencia de pagos

La Fase 9B valida la finalización de pagos y los reintentos de webhooks contra un replica set MongoDB real.

## Invariante de referencia del proveedor

`travel_payment_transactions` trata `(provider, providerReference)` como clave de idempotencia cuando existe `providerReference`.

La base de datos impone ahora ese contrato mediante el índice único parcial:

```text
travel_payment_provider_reference_unique
```

El repositorio mantiene una consulta previa para devolver un resultado determinista y comprensible, pero la corrección ya no depende de esa lectura. Si dos peticiones compiten después de observar que todavía no existe una fila, el índice único arbitra la escritura.

- misma referencia + misma reserva/tipo/importe/moneda devuelve el movimiento ya confirmado;
- reutilizar la misma referencia para otro movimiento financiero falla con `PAYMENT_REFERENCE_CONFLICT`;
- un movimiento `succeeded` genera un único evento determinista `payment.transaction.succeeded` y una única entrega ERP cuando la sincronización ERP está configurada.

### Migración de bases existentes

El índice anterior no-unique se llamaba `travel_payment_provider_reference`. La inicialización elimina ese índice legado y crea el reemplazo unique.

Si una base existente contiene duplicados `(provider, providerReference)`, la creación del nuevo índice único falla de forma intencionada. Esos duplicados históricos deben revisarse y conciliarse antes de continuar, en lugar de mantener referencias financieras ambiguas.

## Invariante de replay de webhooks

`travel_payment_webhook_events` mantiene el índice único `(provider, eventId)`. `claimPaymentWebhookEvent()` registra el claim antes de finalizar el pago.

Por tanto, repetir exactamente el mismo evento del proveedor devuelve una respuesta de duplicado sin ejecutar otra vez la finalización.

Eventos distintos y válidos del proveedor todavía pueden referirse al mismo checkout. Por ello el ledger y checkout también deben tolerar dos finalizaciones concurrentes de la misma transacción pending. El test de replica set verifica que:

- el ledger termina una sola vez en `succeeded`;
- el checkout termina en `paid`;
- la referencia del proveedor se conserva una sola vez;
- el evento financiero succeeded se emite una vez;
- la entrega ERP se encola una vez;
- un replay posterior cuando el checkout ya está pagado no crea otro evento.

## Referencia Redsys

El checkout Redsys se localiza mediante `Ds_Order`. El ledger pasa a almacenar también `Ds_Order` como `providerReference` al finalizar la notificación.

El código de autorización sigue formando parte del ID del evento webhook para distinguir reintentos, pero no se trata como la clave globalmente única del pago del comercio.

## Test real en CI

`npm run test:mongodb-payment-idempotency` solo se ejecuta contra una base local desechable y rechaza hosts MongoDB remotos o nombres de base fuera del prefijo `ktravel_ci_`.

GitHub Actions lo ejecuta después del test de concurrencia de reservas sobre el mismo replica set temporal MongoDB 8.0, con ledger MongoDB activo y un destino ERP REST no entregable configurado únicamente para comprobar la creación del outbox.
