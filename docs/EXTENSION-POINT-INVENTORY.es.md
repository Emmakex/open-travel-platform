# Inventario de puntos públicos de extensión y mapa de autoridad

<p align="center"><a href="./EXTENSION-POINT-INVENTORY.md">English</a> · <strong>Español</strong></p>

Estado: **Fase 10.3.1 — COMPLETADA**  
Alcance: inventario respaldado por código de las fronteras públicas de extensión del core MIT  
Revisión de referencia: baseline de la rama de Fase 10.3, 28 de agosto de 2026

## Propósito

Este documento registra los puntos de extensión que existen realmente en el código y la autoridad que cada uno puede ejercer. Es el artefacto de cierre respaldado por implementación de la Fase 10.3.1.

El inventario distingue deliberadamente un **contrato público de extensión** de un detalle interno de implementación. Un módulo no se convierte en API pública de plugins únicamente porque pueda sustituirse en un fork.

## Método de inventario

Para la Fase 10.3.1, un punto de extensión in-process de primer nivel es una interfaz explícita bajo `repositories/` seleccionada mediante una frontera de composición de la aplicación. Las superficies de entrega de red, como los webhooks genéricos firmados, se registran por separado porque son contratos públicos de integración aunque no estén representados por una interfaz `repositories/*`.

La auditoría encontró **9 interfaces de repository/adapter de primer nivel**:

```text
repositories/booking-repository.ts
repositories/crm-sync-adapter.ts
repositories/erp-accounting-adapter.ts
repositories/failure-transport.ts
repositories/identity-repository.ts
repositories/operations-repository.ts
repositories/payment-repository.ts
repositories/supplier-fulfilment-adapter.ts
repositories/travel-repository.ts
```

## Vocabulario de autoridad

- **autoridad acotada de source/repository** — la implementación seleccionada es autoritativa solo para la capacidad representada por esa interfaz;
- **estado local autoritativo** — el store/máquina de estados propiedad de la aplicación sigue siendo la fuente de verdad aunque un proveedor externo aporte eventos o acknowledgements;
- **subordinado al workflow** — el estado externo solo puede sincronizarse tras auditoría/validación local y no puede saltarse el modelo local de transiciones;
- **solo downstream** — el sistema externo recibe datos normalizados pero no tiene autoridad inversa de mutación sobre el dominio core de origen;
- **solo monitorización** — la entrega es observacional y nunca debe convertirse en dependencia de la autoridad de negocio ni de readiness.

## Inventario de extensiones verificado

| Capacidad | Interfaz pública | Composición / configuración | Implementaciones incluidas | Contrato externo/de red | Clasificación de autoridad |
|---|---|---|---|---|---|
| Catálogo | `TravelRepository` | `getTravelRepository()` / `TRAVEL_DATA_MODE=demo|api|mongodb` | `DemoTravelRepository`, `HttpTravelRepository`, `MongoTravelRepository` | Contrato HTTP read-only en `docs/API-CONTRACT.md` cuando se usa `api` | Solo autoridad acotada como fuente de catálogo |
| Identidad | `IdentityRepository` | `getIdentityRepository()` / `IDENTITY_MODE`, `STAFF_AUTH_MODE` | demo, MongoDB, composición disabled | Hoy no se incluye un contrato genérico externo de identidad | Solo fuente confiable server-side de identidad/perfil |
| Reservas | `BookingRepository` | `getBookingRepository()` / `BOOKING_MODE=demo|mongodb|rest|disabled` | `DemoBookingRepository`, `MongoBookingRepository`, `RestBookingRepository`, disabled | Contrato REST v1 en `lib/rest-booking-contract.ts` y `docs/REST-BOOKING-ADAPTER.md` | Autoridad acotada de booking; siguen siendo obligatorios ownership/alcance/inventario/pricing |
| Operaciones | `OperationsRepository` | `getOperationsRepository()` / `OPERATIONS_MODE=demo|mongodb|disabled` | `DemoOperationsRepository`, `MongoOperationsRepository`, disabled | Hoy no se incluye contrato externo genérico de operaciones | Autoridad local/server-side del workflow staff |
| Pagos / ledger | `PaymentRepository` | `getPaymentRepository()` / `PAYMENT_LEDGER_MODE=mongodb|disabled` | `MongoPaymentRepository`, disabled | **No existe un contrato REST externo de `PaymentRepository`**; Stripe/Redsys son integraciones PSP separadas | Ledger local autoritativo de pagos/reembolsos |
| Fulfilment de proveedores | `SupplierFulfilmentAdapter` | `getSupplierFulfilmentAdapter()` / `SUPPLIER_FULFILMENT_ADAPTER_MODE=disabled|rest` | `RestSupplierFulfilmentAdapter`, disabled | Contrato REST v1 en `lib/rest-supplier-fulfilment-contract.ts` y documentación del adapter | Sincronización externa subordinada al workflow |
| Sincronización CRM | `CrmSyncAdapter` | `getCrmSyncAdapter()` / `CRM_SYNC_MODE=disabled|rest` | `RestCrmSyncAdapter`, disabled | Contrato REST v1 en `lib/rest-crm-contract.ts` y documentación CRM | Solo downstream |
| Sincronización ERP/contabilidad | `ErpAccountingAdapter` | `getErpAccountingAdapter()` / `ERP_ACCOUNTING_MODE=disabled|rest` | `RestErpAccountingAdapter`, disabled | Contrato REST v1 en `lib/rest-erp-accounting-contract.ts` y documentación ERP | Downstream desde movimientos locales `succeeded` autoritativos |
| Visibilidad de fallos | `FailureTransport` | `getFailureTransport()` / `FAILURE_TRANSPORT_MODE=disabled|rest` | `RestFailureTransport`, disabled/null | Schema versionado `FailureTransportEvent` más `docs/FAILURE-TRANSPORT.md` | Solo monitorización, best effort, no autoritativa |

### Superficie pública adicional: webhooks genéricos firmados

Los webhooks salientes genéricos son una superficie pública de integración aunque no sean una interfaz `repositories/*`. Se alimentan del outbox transaccional de integraciones y del pipeline HTTPS firmado incluido.

Autoridad: **solo entrega downstream de eventos**. Un suscriptor webhook no obtiene autoridad de mutación sobre reservas, inventario, pagos, viajeros, proveedores ni estado staff por recibir un evento.

Consulta `docs/OUTBOUND-INTEGRATIONS.md` y `docs/INTEGRATION-OPERATIONS.md`.

## Mapa de autoridad

```text
Fuente de catálogo
      |
      v
TravelRepository --------------------------> dominio de catálogo / UI

Fuente de identidad confiable
      |
      v
IdentityRepository ------------------------> auth server / perfil cliente

Flujo de reserva cliente
      |
      v
BookingRepository -------------------------> estado reserva + inventario
      |
      +-------------------------------------> PaymentRepository
                                                   |
                                                   v
                                             ledger local de pagos
                                                   ^
                                                   |
                              callbacks firmados Stripe/Redsys
                              retornos navegador -----X
                              (no autoritativos)

Estado local de operaciones/reserva
      |
      v
SupplierFulfilmentAdapter -----------------> sistema proveedor
      ^                                         |
      |                                         v
      +---- auditoría + normalización + validación workflow local

Outbox transaccional de integraciones
      |
      +----> adapter CRM --------------------> solo downstream
      |
      +----> adapter ERP/contabilidad ------> solo downstream
      |
      +----> webhooks genéricos firmados ---> solo downstream

Evento de fallo operativo
      |
      v
FailureTransport --------------------------> collector de monitorización
                                              solo monitorización
```

## Notas de frontera por capacidad

### Catálogo

`TravelRepository` es la frontera de fuente del catálogo. La implementación HTTP puede consumir otro CMS/API, pero los objetos del proveedor deben normalizarse a los tipos compartidos del dominio travel antes de cruzar la frontera. Una fuente de catálogo nunca obtiene autoridad de reservas, identidad ni pagos.

### Identidad

`IdentityRepository` es una frontera confiable server-side de identidad/perfil. Roles o capacidades seleccionados en navegador nunca son autoritativos. Sustituir la fuente de identidad no otorga al proveedor de identidad autoridad de mutación sobre reservas, pagos o workflows staff.

### Reservas

`BookingRepository` puede usar demo, MongoDB o el adapter REST v1 genérico. La implementación seleccionada puede poseer la persistencia de booking, pero debe respetar el contrato core: alcance por identidad, trip/departure solicitados, reglas server-authoritative de pricing/inventario, transiciones válidas y expectativas de concurrencia/idempotencia cuando apliquen.

Un proveedor externo de booking no se convierte automáticamente en autoridad del ledger de pagos, CRM, ERP, workflow de proveedores, Traveller Data protegido ni operaciones staff.

### Operaciones

`OperationsRepository` está separado deliberadamente del booking de cliente. Expone lecturas staff, resúmenes, historial de auditoría y cambios de estado permitidos. La autorización staff y las reglas de transición siguen siendo responsabilidades server-side.

CRM/ERP no deben tratarse como un `OperationsRepository` implícito.

### Pagos y proveedores PSP

`PaymentRepository` es una frontera pública real y faltaba en el inventario preliminar de Fase 10.3. La Fase 10.3.1 corrige esa discrepancia.

La implementación incluida actualmente está respaldada por MongoDB, con fallback disabled. **Hoy no existe un reemplazo REST genérico para `PaymentRepository`.**

Stripe y Redsys son integraciones de proveedor/checkout, no implementaciones de `PaymentRepository`. Los callbacks firmados del proveedor pueden aportar un resultado autoritativo del PSP que se concilia en el ledger local. Los retornos del navegador nunca adquieren autoridad de confirmación de pago.

### Fulfilment de proveedores

`SupplierFulfilmentAdapter` puede solicitar, consultar estado y cancelar contra un proveedor remoto. La respuesta permanece subordinada a operaciones locales: debe normalizarse/auditarse y volver a entrar en la validación local de fulfilment. No puede reescribir totales de cliente, historial de pagos/reembolsos, reglas de inventario, coste proveedor, registros de viajeros ni Traveller Data protegido.

### CRM

`CrmSyncAdapter` admite upserts downstream de contacto y reserva. No posee una ruta inversa para mutar booking/pricing/inventario/proveedor/pagos. Añadirla exigiría un nuevo contrato público de capacidad revisado por separado.

### ERP/contabilidad

`ErpAccountingAdapter` recibe movimientos locales autoritativos `succeeded` de pago/reembolso. Un acknowledgement downstream puede guardar metadata de mapping/auditoría, pero no puede reescribir reservas, inventario ni ledger local.

### Transporte de fallos

`FailureTransport` es observacional. Un fallo del collector no puede cambiar la autoridad de reservas, pagos, integration worker ni readiness. El payload externo sigue la allowlist y redacción estrictas del contrato de failure transport.

## Elementos que explícitamente no son puntos públicos de extensión hoy

Los siguientes son módulos de implementación o helpers específicos, no APIs públicas de extensión de primer nivel en la Fase 10.3.1:

- `lib/email.ts` y configuración SMTP — servicio/implementación sustituible, pero no existe un contrato público `repositories/*`;
- `lib/payment-stripe.ts` y `lib/payment-redsys.ts` — implementaciones PSP incluidas, no sustitutos de `PaymentRepository`;
- módulos helper/store MongoDB bajo `lib/` — detalles de persistencia salvo cuando se accede mediante una frontera repository documentada;
- módulos arbitrarios `lib/*`, `app/*` o componentes — el código interno no es automáticamente una superficie soportada de plugins;
- adapters privados específicos de Kairoseth/cliente — pueden consumir contratos públicos, pero el core MIT no debe depender de ellos.

## Mapa de contratos de red

| Superficie | Mecanismo de versión actual | Fuente de código/documentación |
|---|---|---|
| REST booking | `/v1` + `X-OTP-Contract-Version: 1` | `lib/rest-booking-contract.ts`, `docs/REST-BOOKING-ADAPTER.md` |
| REST fulfilment proveedor | operaciones REST v1 versionadas | `lib/rest-supplier-fulfilment-contract.ts`, docs del adapter proveedor |
| REST CRM sync | REST v1 | `lib/rest-crm-contract.ts`, docs CRM |
| REST ERP/contabilidad | REST v1 | `lib/rest-erp-accounting-contract.ts`, docs ERP |
| Failure transport | `FailureTransportEvent.schemaVersion = 1` más contrato de transporte | `repositories/failure-transport.ts`, `docs/FAILURE-TRANSPORT.md` |
| Webhooks genéricos | contrato versionado de eventos de integración | `docs/OUTBOUND-INTEGRATIONS.md` |
| Catálogo HTTP | contrato read-only actual de catálogo | `docs/API-CONTRACT.md` |

La Fase 10.3.2 definirá las reglas de compatibilidad/deprecación entre estos mecanismos distintos sin forzar una versión global única innecesaria.

## Hallazgos de cierre de Fase 10.3.1

- se verificaron **9** interfaces de extensión de primer nivel bajo `repositories/`;
- se identificó `PaymentRepository` como ausente en la documentación preliminar y ahora forma parte del inventario oficial;
- se mapearon selector de composición e implementaciones incluidas para cada interfaz;
- se mapearon los contratos HTTP/evento existentes con sus fronteras in-process;
- CRM y ERP siguen siendo solo downstream;
- fulfilment de proveedores sigue subordinado a la validación local del workflow;
- los webhooks genéricos siguen siendo solo entrega downstream;
- SMTP/email deliberadamente **no** se promovió a contrato público de extensión;
- Stripe/Redsys se clasificaron correctamente como integraciones PSP y no como sustitutos de `PaymentRepository`;
- en este slice no se afirma que exista un nuevo gate automatizado `check:extension-contracts`; sigue reservado para la Fase 10.3.4.

## Siguiente slice

La **Fase 10.3.2 — política de compatibilidad y versionado** debe utilizar este inventario como lista autoritativa de superficies de extensión. Definirá evolución compatible, deprecación y breaking changes para interfaces tipadas, contratos HTTP y schemas de eventos.

## Documentación relacionada

- [`EXTENSION-CONTRACTS.es.md`](EXTENSION-CONTRACTS.es.md)
- [`EXTENSION-CONTRACTS.md`](EXTENSION-CONTRACTS.md)
- [`ADAPTER-GUIDE.md`](ADAPTER-GUIDE.md)
- [`ARCHITECTURE.md`](ARCHITECTURE.md)
- [`API-CONTRACT.md`](API-CONTRACT.md)
- [`REST-BOOKING-ADAPTER.es.md`](REST-BOOKING-ADAPTER.es.md)
- [`SUPPLIER-FULFILMENT-ADAPTER.es.md`](SUPPLIER-FULFILMENT-ADAPTER.es.md)
- [`CRM-SYNC-ADAPTER.es.md`](CRM-SYNC-ADAPTER.es.md)
- [`ERP-ACCOUNTING-ADAPTER.es.md`](ERP-ACCOUNTING-ADAPTER.es.md)
- [`OUTBOUND-INTEGRATIONS.es.md`](OUTBOUND-INTEGRATIONS.es.md)
- [`FAILURE-TRANSPORT.es.md`](FAILURE-TRANSPORT.es.md)
