# Adapter ERP / contabilidad

La Fase 8C-4 añade a Open Travel Platform una frontera de sincronización contable neutral respecto a proveedor y exclusivamente downstream.

El primer contrato genérico exporta deliberadamente **movimientos del ledger preparados para contabilidad**, no facturas legales específicas de una jurisdicción. El core actual no mantiene un modelo fiscal/de facturación completo (por ejemplo NIF fiscal autoritativo, domicilio fiscal, reglas de registro tributario o numeración legal de facturas), por lo que el adapter no debe inventar esos valores.

## Frontera de autoridad

El ledger local de pagos sigue siendo autoritativo.

Un ERP/sistema contable puede:

- recibir un movimiento normalizado de pago o reembolso con estado `succeeded`;
- deduplicarlo/hacer upsert mediante la clave de idempotencia suministrada;
- devolver su propio identificador externo estable;
- mapear el movimiento normalizado a un plan contable, lógica fiscal o workflow documental específico del proveedor.

Un ERP/sistema contable **no** puede:

- cambiar el estado de una reserva;
- alterar inventario;
- crear/modificar/eliminar el historial local de pagos o reembolsos;
- reinterpretar un movimiento `pending` o `failed` como hecho contable confirmado;
- cambiar el importe o moneda exactos de origen;
- devolver estado contable específico de proveedor que se aplique automáticamente al dominio de reservas.

La única respuesta persistida por la frontera genérica es metadata de acknowledgement (`externalId`, outcome y estado HTTP).

## Movimiento elegible

El evento de integración es:

```text
payment.transaction.succeeded
```

Solo un `PaymentTransaction` cuyo estado local sea `succeeded` puede entregarse al adapter contable.

Se cubren ambos flujos:

1. un movimiento creado directamente como `succeeded` (por ejemplo un pago manual validado);
2. un movimiento pendiente de proveedor que posteriormente pasa a `succeeded`.

La mutación de pago/reembolso y el evento de integración se confirman en la **misma transacción MongoDB**. Si una de las dos partes falla, ninguna se confirma.

Los IDs de evento son deterministas por movimiento:

```text
intevt-payment-{paymentTransactionId}-succeeded
```

El outbox durable mantiene además unicidad por pareja evento/destino.

## Contrato genérico de movimiento

El snapshot neutral contiene únicamente:

```ts
type ErpAccountingMovementSnapshot = {
  localId: string;
  targetType: "trip" | "service";
  targetId: string;
  movementType: "payment" | "refund";
  amount: number;
  currency: string;
  provider: string;
  method?: string;
  providerReference?: string;
  occurredAt: string;
};
```

`amount` y `currency` proceden directamente del movimiento inmutable del ledger autoritativo. Este adapter nunca convierte moneda ni suma monedas distintas.

El contrato genérico excluye:

- nombres, emails y teléfonos de clientes;
- datos protegidos del viajero o arrays de viajeros;
- PAN/CVV de tarjeta o credenciales de pago;
- cuerpos crudos de webhooks/requests de PSP;
- costes/referencias de proveedores y notas operativas;
- instrucciones de mutación de inventario;
- notas internas de personal;
- NIF o direcciones fiscales que el core no mantenga de forma autoritativa.

## Adapter REST v1 de referencia

Se activa con:

```text
ERP_ACCOUNTING_MODE=rest
REST_ERP_ACCOUNTING_BASE_URL=https://accounting.example.com/
REST_ERP_ACCOUNTING_BEARER_TOKEN=...
REST_ERP_ACCOUNTING_TIMEOUT_MS=10000
REST_ERP_ACCOUNTING_MAX_RESPONSE_BYTES=262144
```

En producción los endpoints deben usar HTTPS. HTTP solo se admite para localhost durante desarrollo.

Request:

```text
POST /v1/accounting/movements/upsert
X-OTP-Accounting-Contract-Version: 1
X-OTP-Request-Id: ...
X-OTP-Operation: upsert
Idempotency-Key: otp-erp:{eventId}:movement
Authorization: Bearer ...
```

Ejemplo de body:

```json
{
  "entity": "accounting-movement",
  "operation": "upsert",
  "movement": {
    "localId": "pay-example",
    "targetType": "trip",
    "targetId": "res-example",
    "movementType": "payment",
    "amount": 250,
    "currency": "EUR",
    "provider": "manual",
    "method": "bank-transfer",
    "providerReference": "BANK-2026-001",
    "occurredAt": "2026-08-26T12:00:00.000Z"
  }
}
```

Una respuesta correcta debe devolver la misma cabecera de versión y:

```json
{
  "externalId": "erp-movement-123",
  "outcome": "upserted"
}
```

`outcome` puede ser `upserted` o `unchanged`.

El cliente rechaza redirects, desactiva caché, limita timeout/tamaño de respuesta y solo reintenta de forma acotada estados transitorios (`429`, `502`, `503`, `504`) dentro de cada intento durable.

## Entrega durable y replay

ERP/contabilidad no crea otra cola. Reutiliza el outbox y worker de las Fases 8A/8B:

- lease por entrega;
- retry/backoff;
- historial de intentos;
- retención dead-letter;
- replay desde Admin;
- lock del worker scheduler/manual;
- métricas de salud y diagnóstico existentes.

El destino virtual es interno a la plataforma y no puede configurarse como suscripción webhook firmada genérica. Por ello los eventos financieros ERP no amplían la superficie de datos de los webhooks genéricos.

Si la sincronización ERP está desactivada, los eventos exclusivos de ERP no se conservan como eventos huérfanos del outbox.

## Referencias externas y auditoría

Colecciones:

```text
travel_erp_accounting_links
travel_erp_accounting_audit
```

La colección de links vincula el ID inmutable del movimiento local con el ID externo del ERP/contabilidad.

La metadata de auditoría almacena identificadores, adapter, operación/outcome, estado HTTP y timestamp. **No** almacena:

- importe/moneda;
- referencias del proveedor de pagos;
- PII del cliente;
- cuerpos HTTP crudos;
- credenciales Bearer.

Admin puede revisar la integración en:

```text
/operator/integrations/erp
```

Los valores financieros completos permanecen en el ledger de pagos y en reporting de Finanzas, evitando duplicarlos en metadata de integración.

## Los documentos fiscales son una capacidad separada

Una capacidad de factura/rectificativa legal requiere requisitos jurisdiccionales explícitos y datos de facturación autoritativos. En España/UE puede implicar, según operación y cliente, identidad fiscal de emisor/receptor, domicilio fiscal, desglose tributario, serie/numeración, fechas de expedición/operación y reglas de rectificación.

Esos campos deben modelarse y validarse antes de que un futuro adapter pueda afirmar que genera facturas reglamentarias. La Fase 8C-4 no los infiere desde datos de contacto o reserva.

## Añadir un adapter específico de proveedor

Un adapter específico debe permanecer detrás de `ErpAccountingAdapter` y resolver downstream aspectos como:

- mapeo al plan de cuentas;
- mapeo diario/debe/haber;
- códigos fiscales cuando existan datos fiscales autoritativos;
- unidad de negocio/centro de coste;
- autenticación y payloads propios del ERP.

Esos campos no deben filtrarse al ledger neutral ni al dominio de reservas.
