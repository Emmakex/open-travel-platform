# Contratos de extensión y adapters de referencia

<p align="center"><a href="./EXTENSION-CONTRACTS.md">English</a> · <strong>Español</strong></p>

Estado: **Fase 10.3 — ACTIVA**  
Alcance: fronteras públicas de extensión del core MIT  
Despliegue de referencia: **Kairoseth Travel** en `travel.kairoseth.com`

## Propósito

La Fase 10.3 convierte las fronteras de adapters ya existentes en Open Travel Platform en un contrato público explícito para contribuidores, despliegues self-host y futuras integraciones del ecosistema.

El objetivo no es exponer cada módulo interno como API de plugins. El objetivo es hacer predecibles, versionables y seguras de extender las fronteras provider-neutral existentes sin permitir que un sistema externo se convierta silenciosamente en autoridad sobre dominios centrales que no le corresponden.

## Regla principal: la autoridad debe permanecer explícita

Un adapter puede traducir, transportar o sincronizar datos únicamente dentro de la capacidad que implementa. No obtiene autoridad sobre otro dominio porque un proveedor remoto devuelva un valor.

Ejemplos:

- un adapter de reservas puede persistir o aportar datos de booking, pero sigue obligado a cumplir el contrato de reservas y las reglas server-side de ownership/alcance;
- un adapter de proveedor puede solicitar, cancelar y sincronizar fulfilment, pero no puede reescribir totales de cliente, historial de pagos ni registros de viajeros;
- CRM es exclusivamente downstream y no puede mutar autoridad local de reservas, pricing, inventario, fulfilment ni ledger;
- ERP/contabilidad es exclusivamente downstream y no puede mutar reservas locales, inventario ni historial autoritativo de pagos/reembolsos;
- los retornos de navegador de un proveedor de pagos nunca son confirmación autoritativa;
- los payloads específicos de proveedor permanecen dentro de adapters y deben normalizarse antes de entrar en tipos compartidos de dominio.

## Clases de extensión

### 1. Extensiones de source / repository

Ejemplos:

- `TravelRepository`
- `IdentityRepository`
- `BookingRepository`
- `OperationsRepository`

Estas interfaces sustituyen una fuente o capacidad de persistencia acotada. La implementación puede ser demo, MongoDB, REST u otro proveedor futuro, pero las páginas/componentes deben consumir el contrato estable orientado a dominio, no payloads del vendor.

### 2. Extensiones de sincronización downstream

Ejemplos:

- `CrmSyncAdapter`
- `ErpAccountingAdapter`

Reciben eventos/datos normalizados desde el core. Están deliberadamente subordinadas a la autoridad local y no deben introducir rutas de mutación inversa salvo que se diseñe y revise un contrato de capacidad explícito separado.

### 3. Extensiones de sincronización de workflow

Ejemplo:

- `SupplierFulfilmentAdapter`

El estado externo se audita/valida y vuelve a entrar por el workflow/máquina de estados local existente. La respuesta externa nunca evita las reglas locales de transición.

### 4. Extensiones de entrega / observabilidad

Ejemplos:

- webhooks salientes firmados;
- `FailureTransport`.

Transportan información normalizada fuera de la aplicación. Son no autoritativas y deben usar allowlists explícitas, comportamiento de red acotado y credenciales server-only.

## Inventario actual de contratos públicos

| Capacidad | Frontera principal | Implementación de referencia actual | Modelo de autoridad |
|---|---|---|---|
| Catálogo | `TravelRepository` | demo / fuentes de datos de aplicación | fuente del dominio de catálogo |
| Identidad | `IdentityRepository` | demo / identidad persistente | fuente confiable server-side de identidad |
| Reservas | `BookingRepository` | demo / MongoDB / REST v1 | contrato de booking; ownership/alcance siguen validados server-side |
| Operaciones | `OperationsRepository` | persistencia operacional local | autoridad de workflow staff permanece local/server-side |
| Fulfilment proveedor | `SupplierFulfilmentAdapter` | disabled / REST v1 | sincronización externa subordinada al workflow local |
| CRM | `CrmSyncAdapter` | disabled / REST v1 | exclusivamente downstream |
| ERP/contabilidad | `ErpAccountingAdapter` | disabled / REST v1 | downstream desde movimientos `succeeded` autoritativos del ledger |
| Visibilidad de fallos | `FailureTransport` | disabled / REST | solo monitorización, best effort, no autoritativa |
| Webhooks genéricos | outbox de integraciones + entrega HTTPS firmada | entrega de referencia incluida | solo entrega downstream de eventos |

Este inventario se contrastará con el código durante 10.3.1. Si un nombre documentado difiere de la implementación real, el código es autoritativo hasta corregir la documentación dentro del mismo cambio de Fase 10.3.

## Política de compatibilidad/versionado — objetivo de 10.3.2

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

## Identificadores de versión

Los adapters REST de referencia existentes usan rutas/headers versionados explícitos cuando aplica, incluido `X-OTP-Contract-Version: 1` para el contrato REST genérico de reservas.

La Fase 10.3 consolidará qué contratos necesitan:

- rutas HTTP versionadas;
- headers de contract-version;
- únicamente compatibilidad tipada de interfaces in-process;
- versiones de schemas de eventos;
- marcadores de deprecación.

No debe introducirse un mecanismo global nuevo de versionado salvo que mejore materialmente la compatibilidad de las fronteras existentes.

## Requisitos de adapters de referencia — objetivo de 10.3.3

Un adapter de referencia para contribuidores debe demostrar el comportamiento mínimo correcto y no incrustar un vendor comercial específico.

Debe mostrar:

1. composición/configuración opt-in explícita;
2. credenciales server-only;
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
- README, ROADMAP, ADAPTER-GUIDE y este documento permanecen consistentes;
- el gate final de contratos de extensión queda registrado en `npm run verify`.

El nombre exacto del script/test se decidirá cuando llegue la implementación. La documentación no debe afirmar que un gate existe antes de que esté committeado y ejecutándose en CI.

## Secuencia de entrega de Fase 10.3

```text
10.3.1  Inventario público + mapa de autoridad              ACTIVA
   ↓
10.3.2  Política de compatibilidad/versionado               PLANIFICADA
   ↓
10.3.3  Adapters/ejemplos para contribuidores               PLANIFICADA
   ↓
10.3.4  Validación automatizada permanente                  PLANIFICADA
   ↓
10.3     Sincronización documental + CI verde               COMPLETADA
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

- [`../ROADMAP.es.md`](../ROADMAP.es.md)
- [`ADAPTER-GUIDE.md`](ADAPTER-GUIDE.md)
- [`API-CONTRACT.md`](API-CONTRACT.md)
- [`REST-BOOKING-ADAPTER.es.md`](REST-BOOKING-ADAPTER.es.md)
- [`SUPPLIER-FULFILMENT-ADAPTER.es.md`](SUPPLIER-FULFILMENT-ADAPTER.es.md)
- [`CRM-SYNC-ADAPTER.es.md`](CRM-SYNC-ADAPTER.es.md)
- [`ERP-ACCOUNTING-ADAPTER.es.md`](ERP-ACCOUNTING-ADAPTER.es.md)
- [`OUTBOUND-INTEGRATIONS.es.md`](OUTBOUND-INTEGRATIONS.es.md)
- [`ARCHITECTURE.md`](ARCHITECTURE.md)