# Adapters de referencia para contribuidores

<p align="center"><a href="./REFERENCE-ADAPTERS.md">English</a> · <strong>Español</strong></p>

Estado: **Fase 10.3.3 — candidata a COMPLETADA pendiente de CI verde + merge**  
Alcance: implementaciones de referencia provider-neutral ya incluidas en el core MIT  
Prerrequisitos: [`EXTENSION-POINT-INVENTORY.es.md`](EXTENSION-POINT-INVENTORY.es.md) y [`EXTENSION-COMPATIBILITY.es.md`](EXTENSION-COMPATIBILITY.es.md)

## Propósito

Open Travel Platform ya contiene adapters genéricos con forma productiva. La Fase 10.3.3 designa un conjunto pequeño de esas implementaciones reales como referencias para contribuidores, en lugar de crear adapters de juguete paralelos que puedan desalinearse del runtime.

Las referencias demuestran tres modelos de autoridad diferentes:

1. `RestBookingRepository` — **autoridad acotada de repository**;
2. `RestSupplierFulfilmentAdapter` + `performSupplierAdapterOperation()` — **sincronización subordinada al workflow con audit-before-apply**;
3. `RestCrmSyncAdapter` — **sincronización exclusivamente downstream**.

Son patrones, no integraciones con vendors. Un adapter comercial/Kairoseth/cliente puede depender de los contratos públicos, pero el core MIT nunca debe depender de la implementación propietaria.

---

## Referencia A — autoridad acotada de repository

Implementación principal:

- `adapters/rest-booking-repository.ts`
- interfaz: `repositories/booking-repository.ts`
- parser/versión: `lib/rest-booking-contract.ts`
- configuración runtime: `lib/rest-booking-config.ts`
- composición: `lib/booking-repository.ts`
- guía contractual: [`REST-BOOKING-ADAPTER.es.md`](REST-BOOKING-ADAPTER.es.md)

### Qué demuestra esta referencia

`RestBookingRepository` muestra cómo reemplazar una capacidad acotada de fuente/persistencia sin filtrar payloads del proveedor ni obtener silenciosamente autoridad sobre otros dominios.

Demuestra:

- implementación explícita de interfaz;
- configuración server-only;
- contrato HTTP `/v1` versionado;
- header contractual de respuesta obligatorio;
- timeout y tamaño de respuesta acotados;
- rechazo de redirects;
- validación JSON/content-type;
- errores de aplicación estables y normalizados;
- tratamiento explícito de 404 cuando la interfaz permite `null`;
- IDs de correlación;
- claves de idempotencia deterministas en mutaciones;
- retry solo ante resultados transitorios de transporte/servidor;
- parsing runtime antes de convertir datos externos en dominio;
- comprobaciones de identidad/alcance tras el parsing;
- validación de viaje/salida al crear reservas.

### Regla de autoridad

Implementar `BookingRepository` concede autoridad únicamente dentro del contrato de reservas. **No** concede autoridad sobre:

- ledger local de pagos/reembolsos;
- permisos/workflows de staff;
- Traveller Data protegido;
- escrituras inversas CRM/ERP;
- fulfilment fuera de su contrato explícito.

Campos no relacionados devueltos por el proveedor deben ignorarse, no convertirse en nueva autoridad de dominio.

### Secuencia mínima para contribuidores

Al crear otro backend de reservas:

1. implementar `BookingRepository` en lugar de importar tipos del proveedor en páginas/componentes;
2. normalizar payloads dentro del adapter;
3. conservar comprobaciones de identidad/alcance;
4. conservar idempotencia en create/cancel;
5. absorber internamente cambios de versión del proveedor cuando el contrato OTP estable pueda mantenerse;
6. crear nueva versión pública solo cuando deba romperse el contrato OTP-facing;
7. añadir pruebas específicas del proveedor sin debilitar las pruebas genéricas v1.

---

## Referencia B — estado externo subordinado al workflow

Implementación principal:

- `adapters/rest-supplier-fulfilment-adapter.ts`
- interfaz: `repositories/supplier-fulfilment-adapter.ts`
- coordinador: `lib/supplier-fulfilment-sync.ts`
- parser/versión: `lib/rest-supplier-fulfilment-contract.ts`
- configuración runtime: `lib/supplier-fulfilment-adapter-config.ts`
- guía contractual: [`SUPPLIER-FULFILMENT-ADAPTER.es.md`](SUPPLIER-FULFILMENT-ADAPTER.es.md)

### Qué demuestra esta referencia

Este par muestra la diferencia entre **transportar un resultado externo** y **conceder a ese resultado autoridad sobre el workflow local**.

`RestSupplierFulfilmentAdapter` demuestra:

- allowlist saliente explícita mediante `safeRequestBody()`;
- autenticación server-only;
- headers de versión contractual;
- IDs de request y headers de operación;
- idempotencia determinista en request/cancel;
- transporte acotado;
- validación runtime de respuesta y errores estables.

`performSupplierAdapterOperation()` demuestra la frontera local de autoridad:

1. validar que la operación local está permitida;
2. llamar al adapter externo;
3. validar el resultado normalizado;
4. **persistir auditoría de la respuesta externa antes de aplicarla localmente**;
5. aplicar mediante `saveSupplierFulfilment()` y la máquina de estados local;
6. rechazar/conflictar si la transición local no permite el estado externo;
7. completar auditoría como applied/no-change/conflict/failed.

### Regla de autoridad

El sistema de proveedor no es la máquina de estados local. Puede informar status/reference normalizados, pero OTP decide si esos datos pueden aplicarse.

Un adapter de proveedor no debe reescribir:

- totales del cliente;
- movimientos autoritativos de pago/reembolso;
- inventario de viajes/servicios;
- costes de proveedor salvo contrato explícito separado;
- datos de viajeros o información post-compra protegida.

### Secuencia mínima para contribuidores

Para otra API de proveedor:

1. implementar `SupplierFulfilmentAdapter`;
2. mantener tipos request/response específicos privados al adapter;
3. devolver solo `SupplierAdapterResult` normalizado;
4. conservar idempotencia en mutaciones;
5. no escribir persistencia local directamente desde el transport adapter;
6. pasar el resultado por el coordinador/auditoría/transición existente.

---

## Referencia C — sincronización exclusivamente downstream

Implementación principal:

- `adapters/rest-crm-sync-adapter.ts`
- interfaz: `repositories/crm-sync-adapter.ts`
- parser/versión: `lib/rest-crm-contract.ts`
- configuración runtime: `lib/crm-sync-config.ts`
- composición/entrega: `lib/crm-sync.ts` + outbox de integraciones
- guía contractual: [`CRM-SYNC-ADAPTER.es.md`](CRM-SYNC-ADAPTER.es.md)

### Qué demuestra esta referencia

`RestCrmSyncAdapter` muestra cómo enviar snapshots locales normalizados sin convertir el CRM en autoridad de mutación inversa.

Demuestra:

- cuerpos allowlisted de contacto/reserva;
- ausencia de forwarding de objetos MongoDB/provider raw;
- endpoints `/v1` y headers de respuesta versionados;
- credenciales bearer server-only;
- correlación y headers de operación;
- idempotencia derivada de eventos suministrada por el caller;
- timeout/tamaño acotados y rechazo de redirects;
- validación runtime del acknowledgement;
- errores estables normalizados;
- retry transitorio conservando la misma identidad de mutación.

### Regla de autoridad

CRM es downstream-only. El acknowledgement (`externalId`, `outcome`) confirma la entrega/upsert pero no puede mutar:

- booking/pricing/inventario;
- historial del ledger;
- workflow de proveedor;
- Traveller Data protegido;
- autorización de staff.

Una mutación CRM→core necesita un contrato de capacidad separado y revisado; nunca debe añadirse de forma implícita a `CrmSyncAdapter`.

### Secuencia mínima para contribuidores

Para otro CRM:

1. mapear el snapshot OTP al payload vendor dentro del adapter;
2. conservar la misma idempotency key en retries;
3. devolver solo acknowledgement normalizado;
4. guardar metadatos específicos del vendor fuera de objetos centrales cuando sea necesario;
5. no añadir escrituras inversas a esta interfaz downstream.

---

## Cuarto patrón opcional — entrega solo de monitorización

`RestFailureTransport` es la referencia para una frontera best-effort, solo monitorización:

- `adapters/rest-failure-transport.ts`
- `repositories/failure-transport.ts`
- [`FAILURE-TRANSPORT.es.md`](FAILURE-TRANSPORT.es.md)

Demuestra entrega operacional normalizada/redactada con transporte acotado. La disponibilidad del collector nunca puede afectar la autoridad de booking/pagos/integraciones.

---

## Checklist común de referencia

Un nuevo adapter externo debe conservar todos los puntos aplicables:

- composición opt-in explícita;
- interfaz pública provider-neutral;
- credenciales server-only para integraciones privilegiadas;
- HTTPS en producción;
- rechazo de redirects en fronteras de confianza;
- timeout/tamaño de respuesta acotados;
- validación runtime antes de cruzar a tipos de dominio;
- errores estables normalizados;
- idempotencia determinista en mutaciones;
- allowlists de salida explícitas;
- ausencia de filtración de secretos/payloads raw/Traveller Data protegido;
- ausencia de escalado oculto de autoridad cross-domain;
- comportamiento de versión/contrato documentado;
- cambios de API del proveedor absorbidos dentro del adapter cuando sea posible.

## Patrón de copia para un adapter nuevo

Normalmente un contribuidor crea estas piezas:

```text
repositories/<capability>.ts            # interfaz OTP estable (solo si no existe)
adapters/<provider>-<capability>.ts     # traducción/transporte del proveedor
lib/<capability>-config.ts              # configuración server-only validada
lib/<provider>-contract.ts              # parser/versiones cuando el contrato de red es público
lib/<capability>-composition.ts         # selector opt-in explícito
```

Si la interfaz pública existente es suficiente, **no la cambies** solo para reflejar un SDK de proveedor.

## Ejemplo de migración v1 → v2

Supongamos que un futuro contrato de reservas necesita cambiar un campo obligatorio o la semántica de una mutación.

Migración correcta:

1. mantener `/v1/...` y `X-OTP-Contract-Version: 1` estables durante la ventana de deprecación;
2. introducir `/v2/...` con parser/contrato v2 explícitos;
3. añadir adapter/modo v2 seleccionado explícitamente;
4. migrar despliegues de forma deliberada;
5. eliminar v1 solo en una release que cumpla la política de deprecación/major.

Migración incorrecta:

- cambiar silenciosamente el significado de un campo v1;
- reintentar automáticamente una mutación v2 fallida contra v1;
- reutilizar el header v1 enviando payload v2 breaking;
- convertir un adapter downstream en autoridad durante la migración.

Consulta [`EXTENSION-COMPATIBILITY.es.md`](EXTENSION-COMPATIBILITY.es.md).

## Frontera de adapters propietarios

Un adapter privado Kairoseth/cliente puede tener una estructura como:

```text
private-package/
  adapters/vendor-booking.ts
  config/vendor-booking-config.ts
  tests/vendor-booking-contract.test.ts
```

Puede importar contratos/tipos públicos OTP. El repositorio MIT público no debe importar el paquete privado ni exigir sus credenciales para build, demo, test o self-host.

## Verificación antes de proponer un adapter

Ejecuta las pruebas relevantes y:

```bash
npm run verify
```

Para adapters de red añade/extiende pruebas HTTP locales reales que cubran:

- respuesta válida;
- JSON/schema/content-type inválidos;
- versión contractual incorrecta;
- fallo de autenticación;
- timeout/tamaño máximo;
- retry/idempotencia;
- rechazo de alcance/autoridad cuando aplique.

La Fase 10.3.4 añadirá un gate estático/runtime permanente para proteger el modelo de extensiones. Esta guía no afirma que ese gate exista todavía.

## Documentación relacionada

- [`EXTENSION-POINT-INVENTORY.es.md`](EXTENSION-POINT-INVENTORY.es.md)
- [`EXTENSION-COMPATIBILITY.es.md`](EXTENSION-COMPATIBILITY.es.md)
- [`EXTENSION-CONTRACTS.es.md`](EXTENSION-CONTRACTS.es.md)
- [`ADAPTER-GUIDE.md`](ADAPTER-GUIDE.md)
- [`REST-BOOKING-ADAPTER.es.md`](REST-BOOKING-ADAPTER.es.md)
- [`SUPPLIER-FULFILMENT-ADAPTER.es.md`](SUPPLIER-FULFILMENT-ADAPTER.es.md)
- [`CRM-SYNC-ADAPTER.es.md`](CRM-SYNC-ADAPTER.es.md)
- [`FAILURE-TRANSPORT.es.md`](FAILURE-TRANSPORT.es.md)
