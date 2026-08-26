# Adapter de fulfilment de proveedores

La Fase 8C-2 añade una frontera opcional y neutral respecto a proveedores para enviar operaciones de fulfilment a un sistema externo, manteniendo como autoritativos el estado local, la auditoría y las protecciones orientadas al cliente de Open Travel Platform.

El adapter es deliberadamente más limitado que el modelo local de fulfilment. Puede intercambiar identificadores operativos del componente, nombre/referencia del proveedor, deadline y estado normalizado. **No** controla precios de cliente, contabilidad de pagos, costes del proveedor, inventario, viajeros ni datos post-compra protegidos.

## Modo de despliegue

La sincronización externa es opt-in:

```text
SUPPLIER_FULFILMENT_ADAPTER_MODE=disabled
```

Modos soportados:

- `disabled` — valor por defecto; el seguimiento manual de proveedores sigue funcionando normalmente;
- `rest` — activa el adapter REST de referencia versión 1.

El adapter REST requiere operaciones MongoDB con escritura porque las respuestas externas se aplican mediante el almacenamiento local de fulfilment ya auditado.

```text
OPERATIONS_MODE=mongodb
SUPPLIER_FULFILMENT_ADAPTER_MODE=rest
REST_SUPPLIER_FULFILMENT_BASE_URL=https://supplier.example.com/otp/
REST_SUPPLIER_FULFILMENT_BEARER_TOKEN=<secreto-server-only>
REST_SUPPLIER_FULFILMENT_TIMEOUT_MS=10000
REST_SUPPLIER_FULFILMENT_MAX_RESPONSE_BYTES=262144
```

En producción el destino debe usar HTTPS. HTTP solo se acepta para localhost durante desarrollo. La URL base configurada no puede incluir credenciales, parámetros query ni fragmentos. El token Bearer nunca debe usar una variable `NEXT_PUBLIC_*`.

## Contrato REST

El adapter de referencia llama a:

```text
POST /v1/fulfilment/request
POST /v1/fulfilment/status
POST /v1/fulfilment/cancel
```

Cada petición incluye:

```text
X-OTP-Contract-Version: 1
X-OTP-Request-Id: <request-id-único>
X-OTP-Operation: request | status | cancel
Authorization: Bearer <token>        # cuando está configurado
Idempotency-Key: <clave-estable>     # solo request/cancel
Content-Type: application/json
```

El payload está limitado intencionadamente:

```json
{
  "operation": "request",
  "fulfilment": {
    "id": "ful-...",
    "targetType": "trip-reservation",
    "targetId": "res-...",
    "componentType": "accommodation",
    "componentKey": "accommodation:...",
    "componentLabel": "Hotel · Habitación · fechas",
    "supplierName": "Hotel de ejemplo",
    "reference": "referencia-existente-opcional",
    "deadline": "2026-09-10"
  }
}
```

El adapter genérico excluye expresamente:

- precio del cliente, total de reserva o condiciones de pago;
- datos del ledger de pagos/reembolsos;
- coste del proveedor y moneda del coste;
- cantidades de inventario o instrucciones de mutación de inventario;
- nombres de viajeros, fechas de nacimiento, nacionalidades o documentos;
- datos post-compra protegidos del viajero;
- notas internas del proveedor;
- estado de aprobación de referencias para vouchers.

## Respuesta

Una respuesta correcta debe devolver la misma cabecera de versión:

```text
X-OTP-Contract-Version: 1
```

y un cuerpo JSON como:

```json
{
  "fulfilment": {
    "status": "confirmed",
    "reference": "HOTEL-ABC-123",
    "message": "Mensaje operativo opcional"
  }
}
```

Estados aceptados:

- `requested`
- `confirmed`
- `rejected`
- `cancelled`

`not-requested` es un estado local previo a la solicitud y no puede devolverlo un proveedor externo.

El parser no deja pasar objetos arbitrarios del proveedor: estructuras, estados o textos fuera de contrato fallan la validación antes de poder llegar al estado local de fulfilment.

## El estado local sigue siendo autoritativo

Una respuesta externa nunca se escribe directamente en MongoDB.

El flujo es:

1. un miembro autorizado con capacidad `suppliers` inicia la operación externa;
2. el adapter realiza la petición remota;
3. la respuesta normalizada se persiste en `travel_supplier_fulfilment_adapter_audit` con outcome `received`;
4. solo si esa auditoría se guarda, la respuesta pasa a `saveSupplierFulfilment()`;
5. se ejecutan las reglas locales normales de transición;
6. la auditoría se enriquece como `applied`, `no-change`, `conflict` o `failed`.

Si no puede persistirse la auditoría inicial de la respuesta, la respuesta externa **no** se aplica localmente. El enriquecimiento posterior del outcome es best-effort para evitar que un cambio local ya aplicado correctamente aparezca falsamente como fallido por un problema posterior de actualización de auditoría.

Si un estado externo entra en conflicto con la máquina de estados local actual, se registra el conflicto y no se fuerza la transición.

## Idempotencia y reintentos

Las operaciones `request` y `cancel` reciben un `Idempotency-Key` determinista derivado de la revisión del registro local, estado y referencia. Los reintentos de transporte reutilizan la misma clave y request ID para esa invocación.

El adapter de referencia reintenta como máximo una vez ante condiciones transitorias como `429`, `502`, `503`, `504`, fallos de red o timeout. Las APIs de proveedores deben persistir y deduplicar las claves de idempotencia en operaciones mutantes.

La sincronización de estado se considera una lectura desde el punto de vista de la plataforma y no envía clave de idempotencia.

## Fronteras de transporte

El adapter de referencia:

- usa `fetch` solo en servidor;
- desactiva caché;
- rechaza redirects;
- tiene timeout limitado por servidor;
- limita el tamaño de respuesta leída sin confiar únicamente en `Content-Length`;
- exige la cabecera exacta de versión de contrato;
- traduce errores HTTP del proveedor a códigos estables de aplicación;
- nunca expone cuerpos de error crudos del proveedor al navegador.

Para APIs privadas con requisitos de red adicionales, implementa `SupplierFulfilmentAdapter` detrás de la misma interfaz en lugar de debilitar el adapter genérico.

## La divulgación de referencias sigue separada

Una referencia devuelta por la API se guarda como referencia interna del proveedor. **No** se muestra automáticamente en vouchers de cliente.

El flujo existente de aprobación explícita de referencia sigue siendo autoritativo. Si la referencia cambia, la aprobación anterior deja de aplicar al nuevo valor.

## Los costes del proveedor siguen siendo locales

El contrato externo no puede devolver coste del proveedor. Al aplicar estado/referencia, la plataforma conserva explícitamente `supplierCost` y `supplierCurrency` existentes.

Por tanto, la integración no puede reescribir silenciosamente:

- totales de reserva del cliente;
- ledger de pagos/reembolsos;
- coste interno del proveedor;
- inventario de viajes, servicios o habitaciones.

## Auditoría

Colección:

```text
travel_supplier_fulfilment_adapter_audit
```

Los registros contienen metadata operacional como:

- identificadores de fulfilment/target/componente;
- adapter y operación;
- request ID;
- outcome;
- estado/referencia/mensaje normalizados devueltos;
- código de error estable;
- actor de staff;
- timestamps.

No almacenan token Bearer, cuerpos HTTP completos, costes de proveedor, valores de pago ni datos protegidos del viajero.

## Extender la frontera

Los adapters específicos implementan:

```text
repositories/supplier-fulfilment-adapter.ts
```

Mantén autenticación, mapping de payloads y traducción de estados específicos dentro del adapter. El resultado hacia la plataforma debe permanecer normalizado al contrato neutral.

Un adapter de proveedor no debe saltarse `saveSupplierFulfilment()` ni escribir campos específicos de proveedor en documentos centrales de reserva.
