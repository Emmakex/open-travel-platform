# Contratos de extensión y adapters de referencia

<p align="center"><a href="./EXTENSION-CONTRACTS.md">English</a> · <strong>Español</strong></p>

Estado: **Fase 10.3 — ACTIVA**  
Slice actual: **10.3.2 — política de compatibilidad y versionado**  
Alcance: fronteras públicas de extensión del core MIT  
Despliegue de referencia: **Kairoseth Travel** en `travel.kairoseth.com`

## Propósito

La Fase 10.3 convierte las fronteras de adapters ya existentes en Open Travel Platform en un contrato público explícito para contribuidores, despliegues self-host y futuras integraciones del ecosistema.

El objetivo no es exponer cada módulo interno como API de plugins. El objetivo es hacer predecibles, versionables y seguras de extender las fronteras provider-neutral existentes sin permitir que un sistema externo se convierta silenciosamente en autoridad sobre dominios centrales que no le corresponden.

El inventario respaldado por código de la Fase 10.3.1 ya está completado. Consulta [`EXTENSION-POINT-INVENTORY.es.md`](EXTENSION-POINT-INVENTORY.es.md) para ver la lista verificada de interfaces, rutas de composición, implementaciones incluidas, contratos de red y mapa de autoridad.

## Regla principal: la autoridad debe permanecer explícita

Un adapter puede traducir, transportar o sincronizar datos únicamente dentro de la capacidad que implementa. No obtiene autoridad sobre otro dominio porque un proveedor remoto devuelva un valor.

Ejemplos:

- un adapter de catálogo puede aportar datos de catálogo, pero no obtiene autoridad de booking o pagos;
- un adapter de reservas puede persistir o aportar datos de booking, pero sigue obligado a cumplir el contrato y las reglas server-authoritative de ownership/alcance/inventario/pricing;
- `PaymentRepository` sigue siendo la frontera provider-neutral del ledger financiero local; Stripe/Redsys son integraciones PSP, no sustitutos de ese repository;
- un adapter de proveedor puede solicitar, cancelar y sincronizar fulfilment, pero no puede reescribir totales de cliente, historial de pagos ni registros de viajeros;
- CRM es exclusivamente downstream y no puede mutar autoridad local de reservas, pricing, inventario, fulfilment ni ledger;
- ERP/contabilidad es exclusivamente downstream y no puede mutar reservas locales, inventario ni historial autoritativo de pagos/reembolsos;
- los retornos de navegador de proveedores de pago nunca son confirmación autoritativa;
- los payloads específicos de proveedor permanecen dentro de adapters y deben normalizarse antes de entrar en tipos compartidos de dominio.

## Clases de extensión

### 1. Extensiones de source / repository

Ejemplos verificados:

- `TravelRepository`
- `IdentityRepository`
- `BookingRepository`
- `OperationsRepository`
- `PaymentRepository`

Estas interfaces sustituyen una fuente o capacidad de persistencia acotada. La implementación puede ser demo, MongoDB, REST/API cuando exista soporte, disabled u otro proveedor futuro. El código de páginas/componentes/dominio debe consumir el contrato estable orientado al dominio, no payloads del vendor.

No todos los repositories tienen hoy una implementación externa de red. En particular, `PaymentRepository` actualmente se compone como MongoDB/disabled en el core incluido; Stripe y Redsys operan mediante la frontera separada de proveedor de pago/checkout.

### 2. Extensiones de sincronización downstream

Ejemplos verificados:

- `CrmSyncAdapter`
- `ErpAccountingAdapter`

Reciben eventos/datos normalizados desde el core. Están deliberadamente subordinadas a la autoridad local y no deben introducir rutas de mutación inversa salvo que se diseñe y revise un contrato de capacidad explícito separado.

### 3. Extensiones de sincronización de workflow

Ejemplo verificado:

- `SupplierFulfilmentAdapter`

El estado externo se audita/valida y vuelve a entrar por el workflow/máquina de estados local existente. La respuesta externa nunca evita las reglas locales de transición.

### 4. Extensiones de entrega / observabilidad

Ejemplos verificados:

- webhooks salientes firmados;
- `FailureTransport`.

Transportan información normalizada fuera de la aplicación. Son no autoritativas y deben usar allowlists explícitas, comportamiento de red acotado y credenciales server-only cuando corresponda.

## Inventario público verificado

La Fase 10.3.1 verificó **9 interfaces de primer nivel bajo `repositories/`** más la superficie de entrega de webhooks genéricos firmados.

| Capacidad | Frontera principal | Implementaciones incluidas actuales | Modelo de autoridad |
|---|---|---|---|
| Catálogo | `TravelRepository` | demo / API HTTP / MongoDB | autoridad acotada como fuente de catálogo |
| Identidad | `IdentityRepository` | demo / MongoDB / disabled | fuente confiable server-side de identidad/perfil |
| Reservas | `BookingRepository` | demo / MongoDB / REST v1 / disabled | autoridad acotada de booking; invariantes server-side obligatorios |
| Operaciones | `OperationsRepository` | demo / MongoDB / disabled | autoridad local/server-side de workflow staff |
| Pagos / ledger | `PaymentRepository` | MongoDB / disabled | ledger local autoritativo de pagos/reembolsos |
| Fulfilment proveedor | `SupplierFulfilmentAdapter` | disabled / REST v1 | sincronización externa subordinada al workflow local |
| CRM | `CrmSyncAdapter` | disabled / REST v1 | solo downstream |
| ERP/contabilidad | `ErpAccountingAdapter` | disabled / REST v1 | downstream desde movimientos locales `succeeded` autoritativos |
| Visibilidad de fallos | `FailureTransport` | disabled / REST | solo monitorización, best effort, no autoritativa |
| Webhooks genéricos | outbox de integración + entrega HTTPS firmada | pipeline de entrega incluido | solo entrega downstream de eventos |

El inventario detallado, las variables de composición y el mapa de contratos de red están en [`EXTENSION-POINT-INVENTORY.es.md`](EXTENSION-POINT-INVENTORY.es.md).

## Superficies que no son contratos públicos de extensión

La Fase 10.3.1 también deja explícito qué **no** es un contrato público soportado hoy:

- `lib/email.ts` / SMTP es un servicio interno, no un contrato `repositories/*`;
- los módulos Stripe/Redsys son integraciones PSP, no implementaciones de `PaymentRepository`;
- helpers MongoDB y módulos arbitrarios `lib/*`, `app/*` o componentes no se convierten automáticamente en APIs de plugins;
- adapters propietarios de Kairoseth/cliente pueden consumir contratos públicos, pero el core MIT no debe depender de ellos.

## Política de compatibilidad/versionado — Fase 10.3.2 activa

Los contratos públicos de extensión deben distinguir evolución compatible de breaking changes.

### Cambios backward-compatible

Normalmente compatibles:

- añadir campos opcionales con defaults seguros;
- añadir capacidades opcionales que adapters existentes no estén obligados a implementar;
- añadir códigos de error sin cambiar semántica de éxitos existentes;
- añadir nuevos endpoints/operaciones sin modificar los existentes;
- reforzar documentación sin cambiar valores aceptados en runtime.

### Breaking changes

Normalmente breaking:

- eliminar o renombrar campos obligatorios;
- cambiar el significado de un estado existente;
- cambiar supuestos de ownership o autoridad;
- cambiar semántica de idempotencia;
- cambiar autenticación o headers de versión obligatorios;
- convertir una operación read-only/downstream-only en autoridad de mutación;
- ampliar datos salientes más allá de la allowlist documentada.

Los breaking changes públicos requieren una ruta deliberada de versión/migración. Los cambios específicos de una API proveedor deberían absorberse dentro del adapter siempre que sea posible, evitando romper el contrato del core.

La Fase 10.3.2 convertirá estos principios en una matriz explícita para interfaces tipadas in-process, contratos HTTP, schemas de eventos, deprecación y migraciones.

## Identificadores de versión

Los contratos de red existentes ya emplean varios mecanismos deliberados:

- REST booking genérico: `/v1` más `X-OTP-Contract-Version: 1`;
- adapters de referencia Supplier/CRM/ERP: contratos REST v1 versionados;
- `FailureTransportEvent`: `schemaVersion: 1`;
- eventos de integraciones salientes: schemas versionados;
- catálogo HTTP: contrato API read-only actual.

La Fase 10.3.2 definirá cuándo cada mecanismo exige transición de versión mayor o ruta de deprecación. No debe introducirse una única versión global de extensiones salvo que mejore materialmente la compatibilidad de las fronteras existentes.

## Requisitos de adapters de referencia — objetivo de 10.3.3

Un adapter de referencia para contribuidores debe demostrar el comportamiento mínimo correcto y no incrustar un vendor comercial específico.

Debe mostrar:

1. composición/configuración opt-in explícita;
2. credenciales server-only para transportes privilegiados;
3. HTTPS obligatorio para transportes externos productivos;
4. rechazo de redirects cuando puedan cruzar fronteras de confianza;
5. timeout y tamaño de respuesta acotados;
6. validación runtime antes de convertir datos provider en datos de dominio;
7. normalización a errores estables de aplicación;
8. idempotencia determinista en mutaciones cuando aplique;
9. audit-before-apply cuando una respuesta externa afecte un workflow local;
10. allowlists explícitas de datos salientes;
11. ausencia de filtración de Traveller Data protegido, secretos o payloads raw;
12. ausencia de escalado de autoridad cross-domain.

## Frontera de adapters propietarios

El core MIT debe contener contratos genéricos y ejemplos provider-neutral. Integraciones específicas de Kairoseth, clientes o comercialmente sensibles pueden permanecer en repositorios/paquetes privados cuando corresponda.

Un adapter propietario puede depender del contrato público. El core público no debe depender de ese adapter propietario.

## Objetivo de validación — 10.3.4

La Fase 10.3 añadirá validación automatizada permanente para proteger estas fronteras.

Cobertura esperada:

- inventario/rutas de referencia de extensiones permanecen presentes;
- declaraciones públicas de versión permanecen sincronizadas con documentación;
- tipos de payload provider no se filtran a interfaces centrales de dominio;
- CRM/ERP downstream no pueden exponer autoridad inversa de reservas/pagos;
- respuestas de proveedores siguen reentrando por validación local de workflow;
- ejemplos de adapters usan credenciales server-only y transportes acotados;
- README, ROADMAP, ADAPTER-GUIDE y los documentos de Fase 10.3 permanecen consistentes;
- el gate final de contratos de extensión queda registrado en `npm run verify`.

El nombre exacto del script/test se decidirá cuando llegue la implementación. La documentación no debe afirmar que un gate existe antes de que esté committeado y ejecutándose en CI.

## Secuencia de entrega de Fase 10.3

```text
10.3.1  Inventario público + mapa de autoridad              COMPLETADA
   ↓
10.3.2  Política de compatibilidad/versionado               ACTIVA
   ↓
10.3.3  Adapters/ejemplos para contribuidores               PLANIFICADA
   ↓
10.3.4  Validación automatizada permanente                  PLANIFICADA
   ↓
10.3     Sincronización documental + CI verde               gate de cierre
```

## Criterios de cierre

La Fase 10.3 solo está completada cuando:

- el inventario público coincide con la implementación;
- las fronteras de autoridad están documentadas en inglés y español;
- las reglas de compatibilidad/versionado son explícitas;
- existen ejemplos de referencia para contribuidores;
- una validación automatizada protege las fronteras;
- la documentación relevante está sincronizada;
- adapters propietarios Kairoseth/cliente siguen desacoplados del core MIT;
- CI está verde con la nueva validación habilitada.

## Documentación relacionada

- [`EXTENSION-POINT-INVENTORY.es.md`](EXTENSION-POINT-INVENTORY.es.md)
- [`EXTENSION-POINT-INVENTORY.md`](EXTENSION-POINT-INVENTORY.md)
- [`../ROADMAP.es.md`](../ROADMAP.es.md)
- [`ADAPTER-GUIDE.md`](ADAPTER-GUIDE.md)
- [`API-CONTRACT.md`](API-CONTRACT.md)
- [`REST-BOOKING-ADAPTER.es.md`](REST-BOOKING-ADAPTER.es.md)
- [`SUPPLIER-FULFILMENT-ADAPTER.es.md`](SUPPLIER-FULFILMENT-ADAPTER.es.md)
- [`CRM-SYNC-ADAPTER.es.md`](CRM-SYNC-ADAPTER.es.md)
- [`ERP-ACCOUNTING-ADAPTER.es.md`](ERP-ACCOUNTING-ADAPTER.es.md)
- [`OUTBOUND-INTEGRATIONS.es.md`](OUTBOUND-INTEGRATIONS.es.md)
- [`FAILURE-TRANSPORT.es.md`](FAILURE-TRANSPORT.es.md)
- [`ARCHITECTURE.md`](ARCHITECTURE.md)
