# Adapters de referencia para contribuidores

<p align="center"><a href="./REFERENCE-ADAPTERS.md">English</a> · <strong>Español</strong></p>

Estado: **Fase 10.3.3 — COMPLETADA**  
Alcance: implementaciones de referencia provider-neutral ya incluidas en el core MIT

## Propósito

La Fase 10.3.3 designa adapters genéricos reales y con forma productiva que ya existen en Open Travel Platform como referencias oficiales para contribuidores. Así evitamos ejemplos paralelos que puedan desalinearse del runtime o de CI.

El conjunto demuestra tres modelos de autoridad:

1. `RestBookingRepository` — **autoridad acotada de repository**;
2. `RestSupplierFulfilmentAdapter` + `performSupplierAdapterOperation()` — **sincronización subordinada al workflow con audit-before-apply**;
3. `RestCrmSyncAdapter` — **sincronización exclusivamente downstream**.

`RestFailureTransport` funciona como cuarto patrón opcional de solo monitorización.

## Referencia A — booking con autoridad acotada

Archivos:

- `adapters/rest-booking-repository.ts`
- `repositories/booking-repository.ts`
- `lib/rest-booking-contract.ts`
- `lib/rest-booking-config.ts`
- `lib/booking-repository.ts`
- [`REST-BOOKING-ADAPTER.es.md`](REST-BOOKING-ADAPTER.es.md)

Demuestra:

- implementación explícita de interfaz;
- configuración server-only;
- contrato `/v1` versionado;
- header contractual obligatorio;
- timeout/tamaño de respuesta acotados y rechazo de redirects;
- parsing runtime de JSON/content-type/schema;
- errores estables normalizados;
- correlación de requests;
- idempotencia determinista en mutaciones;
- retry transitorio conservando identidad;
- comprobaciones de identidad, scope, viaje y salida.

La autoridad queda limitada a booking. El adapter no obtiene autoridad sobre ledger de pagos, workflow staff, CRM/ERP, proveedor o Traveller Data protegido.

## Referencia B — sincronización de proveedor subordinada al workflow

Archivos:

- `adapters/rest-supplier-fulfilment-adapter.ts`
- `repositories/supplier-fulfilment-adapter.ts`
- `lib/supplier-fulfilment-sync.ts`
- `lib/rest-supplier-fulfilment-contract.ts`
- `lib/supplier-fulfilment-adapter-config.ts`
- [`SUPPLIER-FULFILMENT-ADAPTER.es.md`](SUPPLIER-FULFILMENT-ADAPTER.es.md)

El transport adapter demuestra:

- allowlist saliente explícita mediante `safeRequestBody()`;
- autenticación server-only;
- headers de versión;
- correlación de request/operación;
- idempotencia determinista para request/cancel;
- transporte acotado;
- normalización runtime de respuestas.

El coordinador demuestra la frontera de autoridad:

1. validar la operación local;
2. llamar al adapter externo;
3. validar el resultado normalizado;
4. **persistir auditoría de la respuesta recibida antes de aplicarla localmente**;
5. aplicar mediante la transición local existente;
6. rechazar el estado externo si entra en conflicto con el workflow local;
7. registrar outcome applied/no-change/conflict/failed.

El proveedor no se convierte en la máquina de estados local ni puede reescribir totales, historial de pagos, inventario o Traveller Data protegido.

## Referencia C — CRM exclusivamente downstream

Archivos:

- `adapters/rest-crm-sync-adapter.ts`
- `repositories/crm-sync-adapter.ts`
- `lib/rest-crm-contract.ts`
- `lib/crm-sync-config.ts`
- `lib/crm-sync.ts`
- [`CRM-SYNC-ADAPTER.es.md`](CRM-SYNC-ADAPTER.es.md)

Demuestra:

- snapshots normalizados allowlisted;
- ausencia de forwarding de objetos MongoDB/provider raw;
- contrato `/v1` versionado;
- credenciales bearer server-only;
- correlación de request/operación;
- idempotencia derivada de eventos;
- timeout/tamaño acotados y rechazo de redirects;
- parsing runtime del acknowledgement;
- errores estables normalizados;
- retry transitorio con la misma idempotency key.

CRM sigue siendo downstream-only. Su acknowledgement no puede mutar booking, pricing, inventario, pagos, fulfilment, Traveller Data protegido ni autorización staff.

## Referencia opcional de monitorización

`RestFailureTransport` demuestra entrega operacional normalizada/redactada y best-effort con transporte acotado. La disponibilidad del collector nunca cambia la autoridad de la aplicación.

Consulta [`FAILURE-TRANSPORT.es.md`](FAILURE-TRANSPORT.es.md).

## Checklist común

Un adapter nuevo debe conservar lo aplicable:

- composición opt-in explícita;
- interfaz provider-neutral;
- credenciales server-only;
- HTTPS productivo;
- rechazo de redirects en fronteras de confianza;
- timeout/tamaño de respuesta acotados;
- validación runtime antes de entrar al dominio;
- errores estables normalizados;
- idempotencia determinista en mutaciones;
- allowlists salientes explícitas;
- ausencia de filtración de secretos/payloads raw/Traveller Data protegido;
- ausencia de escalado oculto de autoridad;
- comportamiento de versión documentado;
- cambios de API vendor absorbidos dentro del adapter cuando el contrato OTP pueda mantenerse estable.

## Estructura sugerida

```text
repositories/<capability>.ts            # solo si no existe interfaz OTP estable
adapters/<provider>-<capability>.ts     # traducción/transporte
lib/<capability>-config.ts              # config server-only validada
lib/<provider>-contract.ts              # parser/versiones cuando aplique
lib/<capability>-composition.ts         # selector opt-in explícito
```

Si la interfaz pública actual es suficiente, no debe modificarse solo para reflejar un SDK vendor.

## Ejemplo v1 → v2

Ante un cambio realmente breaking del contrato wire de booking:

1. mantener `/v1/...` y `X-OTP-Contract-Version: 1` estables durante la ventana de deprecación;
2. introducir `/v2/...` con parser/contrato separado;
3. seleccionar v2 explícitamente;
4. migrar despliegues de forma deliberada;
5. retirar v1 solo conforme a la política de deprecación/major.

Nunca:

- cambiar silenciosamente semántica v1;
- reintentar una mutación v2 fallida contra v1;
- enviar payload v2 breaking bajo header v1;
- aprovechar la migración para otorgar nueva autoridad cross-domain.

Consulta [`EXTENSION-COMPATIBILITY.es.md`](EXTENSION-COMPATIBILITY.es.md).

## Frontera de adapters propietarios

Adapters privados de Kairoseth/cliente/vendor pueden importar contratos/tipos públicos OTP. El core MIT no debe importar el paquete privado ni exigir sus credenciales para build, test, demo o self-host.

## Cobertura existente

Las referencias de red ya están ejercitadas por `tests/rest-adapter-contracts.ts`, incluyendo cuando aplica:

- respuestas válidas normalizadas;
- versiones contractuales incorrectas;
- content-type/schema inválidos;
- rechazo de scope;
- límites de tamaño;
- retry transitorio;
- reutilización de la misma idempotency key;
- no reintentar operaciones rechazadas por el cliente.

Antes de proponer un adapter ejecuta sus pruebas específicas y:

```bash
npm run verify
```

La Fase 10.3.4 añadirá el gate permanente del modelo de extensiones. Este documento no afirma que dicho gate exista todavía.

## Documentación relacionada

- [`EXTENSION-POINT-INVENTORY.es.md`](EXTENSION-POINT-INVENTORY.es.md)
- [`EXTENSION-COMPATIBILITY.es.md`](EXTENSION-COMPATIBILITY.es.md)
- [`EXTENSION-CONTRACTS.es.md`](EXTENSION-CONTRACTS.es.md)
- [`ADAPTER-GUIDE.md`](ADAPTER-GUIDE.md)
