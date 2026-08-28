# Política pública de compatibilidad y versionado de extensiones

<p align="center"><a href="./EXTENSION-COMPATIBILITY.md">English</a> · <strong>Español</strong></p>

Estado: **Fase 10.3.2 — COMPLETADA**  
Alcance: política de compatibilidad, deprecación y breaking changes para las superficies públicas inventariadas en Fase 10.3.1  
Inventario de referencia: [`EXTENSION-POINT-INVENTORY.es.md`](EXTENSION-POINT-INVENTORY.es.md)

## Propósito

Open Travel Platform ya expone varios tipos de contrato de extensión:

- interfaces TypeScript de repository/adapter usadas in-process;
- contratos REST versionados usados por adapters externos;
- envelopes versionados de eventos de integración;
- semántica de firma de webhooks;
- contrato versionado de evento/transporte de fallos;
- un contrato HTTP legacy read-only de catálogo sin header explícito de versión.

Estas superficies no necesitan una versión global artificial. Sí necesitan una política única para decidir cuándo un cambio es compatible, cuándo exige deprecación y cuándo es obligatoria una nueva versión de contrato.

## Principios rectores

1. **La autoridad forma parte del contrato.** Dar a un adapter nueva autoridad cross-domain es breaking aunque no cambie la forma JSON o TypeScript.
2. **Los cambios de vendor deben absorberse dentro de adapters.** Una nueva versión de API del proveedor no es automáticamente un cambio de contrato core.
3. **Los identificadores v1 existentes se preservan.** Renombrar headers/rutas actuales solo por consistencia sería en sí mismo breaking.
4. **No hay downgrade silencioso en mutaciones.** Una mutación v2 nunca debe reintentarse automáticamente como v1 tras un mismatch de versión.
5. **Versión de schema de evento y versión de firma son dimensiones distintas.** `event.version` no versiona la sintaxis HMAC y `X-OTP-Signature: v1=...` no versiona el payload del evento.
6. **La deprecación precede la eliminación cuando sea viable.** Seguridad puede exigir acelerar, pero una retirada ordinaria necesita migración documentada.
7. **El código es autoritativo para identificadores ya publicados.** La documentación puede nombrar familias; las constantes/rutas/headers existentes definen el wire contract real.

## Familias actuales e identificadores

| Familia | Identidad pública actual | Mecanismo de versión | Responsable de compatibilidad |
|---|---|---|---|
| Interfaces repository/adapter in-process | archivos bajo `repositories/` | SemVer de release de Open Travel Platform; sin versión numérica por interfaz | release del core |
| Fuente HTTP de catálogo | implementación HTTP de `TravelRepository` | endpoints legacy sin versión (`/destinations`, `/trips` y detalles) | release core + compatibilidad legacy HTTP |
| REST booking | `rest-booking-v1` | `/v1` + `X-OTP-Contract-Version: 1` | contrato REST booking |
| REST fulfilment proveedor | `supplier-fulfilment-rest-v1` | endpoints v1 + `X-OTP-Contract-Version: 1` | contrato REST supplier |
| REST CRM sync | `rest-crm-v1` | `/v1/crm/...` + `X-OTP-Contract-Version: 1` | contrato REST CRM |
| REST ERP/contabilidad | `erp-accounting-rest-v1` | `/v1/accounting/...` + `X-OTP-Accounting-Contract-Version: 1` | contrato REST accounting |
| Failure transport | `rest-failure-v1` | `X-OTP-Failure-Contract-Version: 1` + `FailureTransportEvent.schemaVersion = 1` | contrato failure transport/event |
| Eventos genéricos de integración | integration-event v1 | `IntegrationEventEnvelope.version = 1` | schema de evento |
| Firma webhook genérica | esquema OTP HMAC-SHA256 v1 | `X-OTP-Signature: v1=<hex>` | esquema de firma |

### Un header compartido no implica un schema compartido

Booking, Supplier y CRM usan actualmente `X-OTP-Contract-Version: 1`. Ese nombre común es una convención de transporte, **no** significa que compartan schema o ciclo de release. La familia de endpoints y el contrato del adapter determinan el alcance de ese `1`.

ERP/contabilidad y FailureTransport ya usan headers especializados. Fase 10.3.2 conserva esos nombres; renombrarlos dentro de v1 crearía incompatibilidad innecesaria.

## 1. Compatibilidad de interfaces TypeScript in-process

El repositorio no se publica actualmente como SDK npm público separado (`package.json` es `private`). Por ello, las interfaces de primer nivel bajo `repositories/` siguen la **versión de release del core Open Travel Platform** en lugar de portar constantes numéricas independientes.

### Cambios compatibles

Normalmente compatibles en release minor/patch si se conserva el comportamiento:

- añadir un campo opcional de entrada;
- añadir un campo opcional de salida/dominio que consumidores existentes puedan ignorar;
- ampliar documentación o detalle de error sin cambiar semántica estable;
- añadir una nueva implementación detrás de una interfaz existente y configuración opt-in explícita;
- añadir una nueva interfaz/capacidad pública sin cambiar interfaces existentes;
- refactor interno sin cambiar interfaz ni modelo de autoridad.

### Cambios breaking

Exigen transición major del core o contrato paralelo nuevo:

- eliminar o renombrar un método público;
- añadir un método **obligatorio** nuevo a una interfaz implementada por terceros;
- cambiar orden/tipos requeridos de parámetros;
- convertir una entrada opcional en obligatoria;
- eliminar un campo retornado del que puedan depender consumidores;
- estrechar valores aceptados;
- cambiar significado de estado/status;
- cambiar expectativas de idempotencia o concurrencia;
- mover autoridad de una frontera de dominio a otra;
- convertir un adapter downstream-only/subordinado a workflow en API de mutación inversa.

### Evolución de unions/enums

Añadir un status/miembro de union puede romper consumidores exhaustivos o mappings runtime aunque parezca aditivo por structural typing. Los nuevos estados observables son **contract-significant**. Solo se añaden dentro de la misma versión si el contrato permite explícitamente valores futuros/desconocidos; de lo contrario requieren transición breaking o shim de compatibilidad.

## 2. Compatibilidad REST/HTTP

### Handshake de versión

Para adapters con header explícito, el cliente envía la versión exacta soportada y la respuesta exitosa debe devolver la versión esperada cuando la implementación actual valida el response header.

Un mismatch de versión es error contractual. El adapter debe fallar cerrado y no adivinar semántica de payload.

### Cambios REST compatibles dentro de v1

Normalmente compatibles:

- añadir campos opcionales de request que el servidor pueda ignorar;
- añadir campos opcionales de response que el parser existente ignore;
- añadir endpoints nuevos sin cambiar los existentes;
- añadir códigos de error estables sin cambiar semántica de éxito/error existente;
- reforzar seguridad/transporte sin cambiar semántica exitosa;
- actualizar detalles del provider adapter manteniendo el contrato normalizado del core.

### Cambios REST breaking

Exigen nueva versión/ruta/header o capa deliberada de migración:

- eliminar/renombrar campos requeridos de request/response;
- hacer obligatorio un campo opcional;
- cambiar ruta o método HTTP usado por el contrato actual;
- cambiar autenticación o header de versión obligatorio;
- cambiar valores de status o significado;
- cambiar idempotencia o significado de `Idempotency-Key`;
- cambiar supuestos de ownership/alcance;
- cambiar semántica de importe/moneda/referencia en contratos financieros;
- ampliar datos salientes fuera de la allowlist de privacidad/seguridad;
- convertir una operación downstream en autoridad de mutación inversa.

### Sin downgrade automático para mutaciones

Un `POST`/mutación v2 fallido no debe reintentarse automáticamente contra v1. La primera petición puede haber llegado al proveedor aunque falle la respuesta o el handshake. El fallback automático puede duplicar escrituras o cambiar su semántica.

Migraciones read-only pueden permitir fallback seleccionado explícitamente por el caller si está documentado y probado, nunca de forma oculta.

## 3. Contrato legacy HTTP de catálogo

`HttpTravelRepository` llama hoy rutas read-only sin versión:

```text
GET /destinations
GET /destinations/:slug
GET /trips
GET /trips/:slug
```

El contrato es anterior a la formalización de Fase 10.3 y no envía header de versión.

Fase 10.3.2 congela el comportamiento actual como **semántica legacy catalogue v1**:

- siguen permitidos campos opcionales aditivos;
- se mantienen rutas/métodos y semántica de campos core;
- no se rompen clientes existentes in-place;
- un futuro API de catálogo breaking deberá introducir contrato explícitamente versionado nuevo (ruta/modo/adapter nuevo) en lugar de modificar silenciosamente estas rutas;
- no se debe añadir autenticación secreta al contrato actual visible mediante `NEXT_PUBLIC_TRAVEL_API_URL`. Una fuente privilegiada requiere frontera server-side.

Así se protege a adopters actuales sin fingir que la URL legacy siempre estuvo formalmente versionada.

## 4. Compatibilidad de eventos de integración

`IntegrationEventEnvelope.version` tiene actualmente valor literal `1`.

### Cambios event-v1 compatibles

Normalmente compatibles:

- añadir campo opcional de payload con significado seguro cuando falta;
- añadir metadata que consumidores antiguos puedan ignorar;
- añadir un **nuevo event type** cuando los endpoints webhook existentes reciben eventos por suscripción explícita y no quedan suscritos silenciosamente al tipo nuevo.

### Cambios breaking de evento

Exigen nueva versión de schema para el contrato afectado:

- eliminar/renombrar campo obligatorio;
- cambiar tipo o significado de campo;
- cambiar semántica de identidad del aggregate;
- cambiar significado monetario/moneda;
- reutilizar un event type existente para una transición de negocio distinta;
- introducir datos protegidos/internos antes omitidos en el evento genérico;
- cambiar identidad de replay/idempotencia de forma que pueda duplicar acciones downstream.

### Versión de evento != versión de firma

`event.version = 1` versiona envelope/payload.

`X-OTP-Signature: v1=<hex>` versiona construcción/verificación de firma.

Un futuro event-v2 puede seguir usando signature-v1 si algoritmo/input HMAC no cambia. También signature-v2 podría firmar event-v1. Se migran y prueban por separado.

## 5. Compatibilidad de FailureTransport

Failure visibility tiene dos dimensiones explícitas:

- header de wire: `X-OTP-Failure-Contract-Version: 1`;
- objeto normalizado: `FailureTransportEvent.schemaVersion = 1`.

Hoy están alineadas, pero no deben asumirse inseparables.

Son compatibles campos opcionales allowlisted que preserven redacción/safe-token rules. Ampliar exposición sensible, cambiar severidad, cambiar campos requeridos o convertir monitorización en autoridad de aplicación es breaking independientemente de la sintaxis de versión.

## 6. Cambiar autoridad siempre es breaking

El mapa de autoridad de 10.3.1 forma parte de compatibilidad.

Son breaking aunque no cambie ningún campo:

- CRM obtiene mutación inversa de reservas;
- acknowledgement ERP reescribe ledger local;
- respuesta proveedor evita state machine local;
- disponibilidad del failure collector se vuelve dependencia de readiness;
- retorno navegador se vuelve confirmación autoritativa de pago;
- catálogo/identidad reciben autoridad no relacionada de booking/pagos.

Un requisito nuevo de este tipo necesita contrato de capacidad separado y revisado explícitamente.

## 7. Compatibilidad de idempotencia y retries

Para mutaciones, la idempotencia es comportamiento público:

- una operación lógica mantiene identidad estable documentada entre transport retry y durable replay cuando aplique;
- cambiar construcción de idempotency key de forma que pueda duplicar filas/acciones downstream es breaking;
- categorías HTTP reintentables pueden ajustarse solo si se conserva seguridad frente a duplicados;
- el adapter puede cambiar implementación interna de retry sin bump si la semántica observable no cambia.

## 8. Ciclo de deprecación

Una retirada ordinaria de contrato público debe seguir:

1. **anunciar** interfaz/campo/endpoint/versión deprecada en docs y `CHANGELOG.md`;
2. **dar guía de reemplazo** con mapping y diferencias de autoridad;
3. **permitir coexistencia** cuando sea viable durante al menos una transición de release minor etiquetada o ventana explícita de migración;
4. **no añadir features nuevas** a la versión deprecada salvo seguridad/corrección;
5. **retirar solo en release/versión breaking**, excepto necesidades urgentes de seguridad;
6. **conservar notas de migración** tras retirada para self-hosters.

Como el repositorio es aplicación/core y no SDK publicado aparte, las ventanas se expresan mediante tags/release notes, no metadata npm de deprecación.

## 9. SemVer del core para contratos de extensión

Para releases posteriores a esta política:

- **PATCH** — bugfix, hardening o correcciones documentales sin cambiar forma/semántica/autoridad pública;
- **MINOR** — capacidades aditivas compatibles, campos opcionales, adapters nuevos opt-in, event types nuevos con suscripción segura;
- **MAJOR** — cambios breaking de interfaz/wire/schema o autoridad/idempotencia/autenticación/semántica de estados que no puedan preservarse mediante compatibilidad.

Un adapter privado específico puede versionarse independientemente mientras siga cumpliendo el contrato público soportado.

## 10. Requisitos de documentación de migración

Todo cambio breaking debe documentar:

- identificador antiguo y nuevo;
- interfaces/endpoints/eventos afectados;
- diferencias de campos/status/errores/auth/idempotencia;
- diferencias de modelo de autoridad;
- cambios de configuración;
- posibilidad de coexistencia;
- implicaciones de datos/backfill/replay;
- restricciones de rollback;
- release mínima de Open Travel Platform que soporta el contrato nuevo.

Mutaciones de pagos/contabilidad/proveedores además requieren consideraciones explícitas de duplicados/conciliación.

## 11. Matriz de compatibilidad

| Cambio | Interfaz tipada | REST/HTTP | Evento | Clasificación |
|---|---:|---:|---:|---|
| Añadir campo opcional con ausencia segura | Compatible | Compatible | Compatible | aditivo |
| Añadir entrada obligatoria | Breaking | Breaking | Breaking si cambia requisito productor/consumidor | major/nueva versión |
| Eliminar/renombrar campo o método | Breaking | Breaking | Breaking | major/nueva versión |
| Nueva implementación tras modo opt-in existente | Compatible | n/a | n/a | minor |
| Nuevo endpoint/event type sin alterar suscripciones existentes | n/a | Compatible | Compatible | minor |
| Nuevo status observable | Normalmente breaking | Normalmente breaking | Normalmente breaking | revisión/nueva versión |
| Cambiar auth/header de versión | n/a | Breaking | n/a | nueva wire version |
| Cambiar semántica de idempotencia | Breaking de comportamiento | Breaking | Breaking si cambia replay identity | versión nueva/major |
| Cambiar modelo de autoridad | Breaking | Breaking | Breaking | contrato separado revisado |
| Ampliar allowlist de datos protegidos | Revisión seguridad/contrato | Breaking por defecto | Breaking por defecto | nueva versión + revisión |
| Upgrade API vendor absorbido dentro del adapter | Compatible | Compatible para core | Compatible para core | cambio interno adapter |

## 12. Decisiones de Fase 10.3.2

Fase 10.3.2 cierra con estas decisiones:

- no se introduce una versión global única de extensiones;
- compatibilidad in-process sigue el SemVer de release del core;
- rutas/headers REST v1 actuales se preservan exactamente;
- headers especializados ERP y FailureTransport no se renombran dentro de v1;
- catálogo HTTP sin versión queda congelado como semántica legacy-v1 y no puede romperse in-place;
- schema de evento y versión de firma webhook quedan explícitamente separados;
- autoridad, idempotencia, autenticación y fronteras de datos protegidos son semántica contractual;
- se prohíbe downgrade automático de protocolo en mutaciones;
- todo breaking change exige migración explícita y transición major/nueva versión.

## Siguiente slice

La **Fase 10.3.3 — adapters/ejemplos de referencia para contribuidores** debe demostrar estas reglas de forma concreta y provider-neutral sin añadir dependencia de vendor comercial.

Los ejemplos deben mostrar cómo:

- implementar un adapter acotado source/repository;
- implementar adapter downstream-only sin autoridad inversa;
- preservar headers/versionado e idempotencia estable;
- absorber upgrade de API proveedor dentro del adapter manteniendo estable el contrato core;
- gestionar migración deliberada v1 → v2 sin fallback oculto.

## Documentación relacionada

- [`EXTENSION-POINT-INVENTORY.es.md`](EXTENSION-POINT-INVENTORY.es.md)
- [`EXTENSION-CONTRACTS.es.md`](EXTENSION-CONTRACTS.es.md)
- [`ADAPTER-GUIDE.md`](ADAPTER-GUIDE.md)
- [`REST-BOOKING-ADAPTER.es.md`](REST-BOOKING-ADAPTER.es.md)
- [`SUPPLIER-FULFILMENT-ADAPTER.es.md`](SUPPLIER-FULFILMENT-ADAPTER.es.md)
- [`CRM-SYNC-ADAPTER.es.md`](CRM-SYNC-ADAPTER.es.md)
- [`ERP-ACCOUNTING-ADAPTER.es.md`](ERP-ACCOUNTING-ADAPTER.es.md)
- [`OUTBOUND-INTEGRATIONS.es.md`](OUTBOUND-INTEGRATIONS.es.md)
- [`FAILURE-TRANSPORT.es.md`](FAILURE-TRANSPORT.es.md)
- [`API-CONTRACT.md`](API-CONTRACT.md)
