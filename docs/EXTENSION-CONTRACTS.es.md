# Contratos de extensión y adapters de referencia

<p align="center"><a href="./EXTENSION-CONTRACTS.md">English</a> · <strong>Español</strong></p>

Estado: **Fase 10.3 — ACTIVA**  
Slice actual después de este merge: **10.3.4 — validación permanente de contratos de extensión**  
Slices completados: **10.3.1, 10.3.2, 10.3.3**  
Despliegue de referencia: **Kairoseth Travel** en `travel.kairoseth.com`

## Propósito

La Fase 10.3 formaliza las fronteras provider-neutral ya presentes en Open Travel Platform para que contribuidores y despliegues self-host puedan extender el core MIT sin filtrar payloads de vendors ni cambiar silenciosamente la autoridad de dominio.

Los artefactos de la fase son:

- [`EXTENSION-POINT-INVENTORY.es.md`](EXTENSION-POINT-INVENTORY.es.md) — inventario público respaldado por código y mapa de autoridad;
- [`EXTENSION-COMPATIBILITY.es.md`](EXTENSION-COMPATIBILITY.es.md) — política de compatibilidad, versionado, deprecación y migración;
- [`REFERENCE-ADAPTERS.es.md`](REFERENCE-ADAPTERS.es.md) — implementaciones de referencia y patrones para contribuidores.

## Regla central de autoridad

Un adapter recibe autoridad únicamente sobre la capacidad que implementa explícitamente.

- catálogo no se convierte en autoridad de booking/pagos;
- booking sigue sujeto a ownership, alcance, inventario y pricing confiable;
- `PaymentRepository` sigue siendo la frontera provider-neutral del ledger local;
- Stripe/Redsys son integraciones PSP/checkout, no reemplazos de `PaymentRepository`;
- resultados de proveedor vuelven por auditoría y validación del workflow local;
- CRM y ERP/contabilidad siguen siendo downstream-only;
- failure transport y webhooks genéricos son superficies de entrega no autoritativas;
- retornos de navegador de pagos nunca confirman de forma autoritativa;
- payloads provider permanecen dentro de adapters y se normalizan antes de entrar al dominio.

## Inventario verificado — COMPLETADA (10.3.1)

La Fase 10.3.1 verificó **9 interfaces de primer nivel bajo `repositories/`** más la superficie de webhooks firmados.

| Capacidad | Frontera | Implementaciones incluidas | Autoridad |
|---|---|---|---|
| Catálogo | `TravelRepository` | demo / HTTP API / MongoDB | fuente acotada de catálogo |
| Identidad | `IdentityRepository` | demo / MongoDB / disabled | fuente confiable de identidad/perfil |
| Booking | `BookingRepository` | demo / MongoDB / REST v1 / disabled | autoridad acotada de reservas |
| Operaciones | `OperationsRepository` | demo / MongoDB / disabled | autoridad local de workflow staff |
| Ledger de pagos | `PaymentRepository` | MongoDB / disabled | ledger local autoritativo |
| Fulfilment | `SupplierFulfilmentAdapter` | disabled / REST v1 | sincronización subordinada al workflow |
| CRM | `CrmSyncAdapter` | disabled / REST v1 | solo downstream |
| ERP/contabilidad | `ErpAccountingAdapter` | disabled / REST v1 | solo downstream |
| Visibilidad de fallos | `FailureTransport` | disabled / REST | solo monitorización |
| Webhooks genéricos | outbox + HTTPS firmada | built-in | solo entrega downstream |

Entre las superficies explícitamente no públicas están SMTP/email interno, helpers MongoDB, módulos arbitrarios `lib/*`/`app/*` y módulos PSP usados como si fueran reemplazos de `PaymentRepository`.

## Compatibilidad/versionado — COMPLETADA (10.3.2)

La política autoritativa es [`EXTENSION-COMPATIBILITY.es.md`](EXTENSION-COMPATIBILITY.es.md).

Reglas principales:

- no existe una versión global artificial de extensiones;
- interfaces públicas in-process siguen el SemVer del core;
- rutas/headers REST v1 existentes permanecen estables;
- el catálogo read-only sin versión se trata como semántica legacy-v1 y no puede romperse in-place;
- `IntegrationEventEnvelope.version` y la firma webhook `v1=` son dimensiones separadas;
- autoridad, autenticación, idempotencia, estados y allowlists de datos protegidos forman parte del contrato;
- los adapters de mutación no pueden hacer downgrade silencioso;
- los breaking changes necesitan ruta explícita de versión/major y guía de migración;
- cambios de versión de APIs vendor se absorben dentro del adapter siempre que el contrato normalizado del core pueda mantenerse.

## Adapters de referencia para contribuidores — COMPLETADA (10.3.3)

La guía autoritativa es [`REFERENCE-ADAPTERS.es.md`](REFERENCE-ADAPTERS.es.md).

La Fase 10.3.3 utiliza **implementaciones genéricas reales y ya probadas** en vez de crear ejemplos paralelos que puedan desviarse del runtime.

### Referencia A — autoridad acotada de repository

`RestBookingRepository` demuestra:

- implementación explícita de `BookingRepository`;
- configuración server-only;
- transporte `/v1` versionado;
- validación runtime de schema/content-type/versión;
- timeout/tamaño acotados y rechazo de redirects;
- errores normalizados;
- correlación de requests;
- idempotencia determinista en mutaciones;
- retry transitorio conservando la identidad de mutación;
- comprobación de identidad/viaje/salida.

### Referencia B — sincronización subordinada al workflow

`RestSupplierFulfilmentAdapter` junto con `performSupplierAdapterOperation()` demuestra:

- allowlist saliente explícita;
- credenciales server-only;
- contrato versionado y transporte acotado;
- idempotencia determinista;
- normalización de respuesta;
- **audit-before-apply**;
- aplicación mediante la máquina de estados local;
- rechazo de conflictos cuando el estado externo no es válido localmente.

### Referencia C — sincronización solo downstream

`RestCrmSyncAdapter` demuestra:

- snapshots normalizados allowlisted;
- ausencia de forwarding de payloads MongoDB/provider raw;
- contrato `/v1` versionado;
- idempotencia derivada de eventos;
- transporte acotado y validación runtime;
- acknowledgements/errores normalizados;
- ausencia de autoridad inversa sobre booking/pagos/inventario.

`RestFailureTransport` queda documentado como cuarto patrón opcional de solo monitorización.

La guía también incorpora:

- patrón reutilizable de estructura de archivos;
- ejemplo de migración v1 → v2;
- separación de adapters privados/propietarios;
- checklist para contribuidores;
- expectativas de pruebas contractuales de red.

### Protección de pruebas existente

Los adapters de red de referencia ya están ejercitados por `tests/rest-adapter-contracts.ts`, incluyendo cuando aplica:

- respuestas normalizadas válidas;
- versiones contractuales incorrectas;
- content-type/schema inválidos;
- rechazo de scope;
- límites de tamaño;
- retries transitorios;
- reutilización de la misma idempotency key;
- no reintentar operaciones rechazadas por el cliente.

Por eso 10.3.3 designa las implementaciones existentes como referencias en lugar de introducir una segunda pila de ejemplos no probados.

## Frontera de adapters propietarios

El core MIT público mantiene contratos genéricos y referencias provider-neutral. Implementaciones específicas de Kairoseth/cliente/vendor pueden permanecer privadas.

Un adapter privado puede importar interfaces/tipos públicos OTP. El core MIT no debe importar el adapter privado ni exigir credenciales privadas para build, test, demo o self-host.

## Validación permanente — siguiente slice ACTIVA (10.3.4)

La Fase 10.3.4 debe añadir un gate automatizado permanente que proteja lo formalizado en 10.3.1–10.3.3.

Cobertura esperada:

- interfaces/rutas de referencia verificadas siguen presentes;
- declaraciones de versión permanecen sincronizadas;
- payloads provider no se filtran a interfaces compartidas;
- CRM/ERP siguen siendo downstream-only;
- respuestas supplier continúan entrando por auditoría/transición local;
- adapters de referencia conservan credenciales server-only, transporte acotado y parsing runtime;
- README/ROADMAP/ADAPTER-GUIDE/documentos de 10.3 permanecen alineados;
- el gate final queda registrado en `npm run verify` y CI.

La documentación no debe afirmar que el gate existe antes de que esté implementado y ejecutándose.

## Secuencia de Fase 10.3

```text
10.3.1  Inventario de extensiones + mapa de autoridad       COMPLETADA
10.3.2  Política de compatibilidad/versionado              COMPLETADA
10.3.3  Adapters de referencia para contribuidores         COMPLETADA
10.3.4  Validación permanente de contratos                 ACTIVA después del merge
   ↓
10.3     Documentación final + CI verde + merge            gate de cierre
```

## Criterios de cierre de Fase 10.3

La Fase 10.3 solo puede marcarse COMPLETADA cuando:

1. el inventario coincide con la implementación;
2. las fronteras de autoridad están documentadas EN/ES;
3. compatibilidad/versionado/deprecación son explícitos;
4. existen referencias provider-neutral para contribuidores;
5. una validación automatizada permanente protege las fronteras;
6. documentación de proyecto/adapters/contratos está sincronizada;
7. adapters Kairoseth/cliente siguen desacoplados;
8. CI está verde con el gate permanente habilitado;
9. el PR de cierre está mergeado a `main`.

## Documentación relacionada

- [`EXTENSION-POINT-INVENTORY.es.md`](EXTENSION-POINT-INVENTORY.es.md)
- [`EXTENSION-COMPATIBILITY.es.md`](EXTENSION-COMPATIBILITY.es.md)
- [`REFERENCE-ADAPTERS.es.md`](REFERENCE-ADAPTERS.es.md)
- [`ADAPTER-GUIDE.md`](ADAPTER-GUIDE.md)
- [`REST-BOOKING-ADAPTER.es.md`](REST-BOOKING-ADAPTER.es.md)
- [`SUPPLIER-FULFILMENT-ADAPTER.es.md`](SUPPLIER-FULFILMENT-ADAPTER.es.md)
- [`CRM-SYNC-ADAPTER.es.md`](CRM-SYNC-ADAPTER.es.md)
- [`ERP-ACCOUNTING-ADAPTER.es.md`](ERP-ACCOUNTING-ADAPTER.es.md)
- [`OUTBOUND-INTEGRATIONS.es.md`](OUTBOUND-INTEGRATIONS.es.md)
- [`FAILURE-TRANSPORT.es.md`](FAILURE-TRANSPORT.es.md)
- [`../ROADMAP.es.md`](../ROADMAP.es.md)
