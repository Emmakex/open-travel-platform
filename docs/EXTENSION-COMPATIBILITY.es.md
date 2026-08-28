# Política pública de compatibilidad y versionado de extensiones

<p align="center"><a href="./EXTENSION-COMPATIBILITY.md">English</a> · <strong>Español</strong></p>

Estado: **Fase 10.3.2 — COMPLETADA**  
Aplicación permanente: `npm run check:extension-contracts`

## Propósito

Open Travel Platform expone varios tipos de contrato:

- interfaces TypeScript de repositories/adapters;
- contratos REST versionados;
- envelopes de eventos versionados;
- semántica de firma de webhooks;
- schema/transporte de fallos;
- contrato HTTP read-only de catálogo legacy sin header de versión.

No se fuerza una versión global artificial. Todas las superficies comparten una política consistente de compatibilidad.

## Principios

1. **La autoridad forma parte del contrato.** Dar nueva autoridad cross-domain es breaking aunque la forma no cambie.
2. **Los cambios del proveedor se absorben dentro del adapter** cuando el contrato OTP normalizado pueda mantenerse.
3. **Los identificadores wire v1 permanecen estables.** Renombrar ruta/header v1 es breaking.
4. **No existe downgrade silencioso en mutaciones.** Una mutación v2 no reintenta como v1 tras un mismatch.
5. **Versión de schema de evento y versión de firma son independientes.**
6. **La deprecación precede la retirada ordinaria.** Una retirada breaking necesita ruta de migración salvo urgencia de seguridad.
7. **Los identificadores existentes en código son autoritativos.**

## Familias contractuales actuales

| Familia | Identidad actual | Mecanismo de versión |
|---|---|---|
| Interfaces in-process | `repositories/*.ts` | SemVer del core |
| Booking REST | `/v1/...` | `X-OTP-Contract-Version: 1` |
| Supplier REST | `/v1/...` | `X-OTP-Contract-Version: 1` |
| CRM REST | `/v1/...` | `X-OTP-Contract-Version: 1` |
| ERP/contabilidad REST | `/v1/...` | `X-OTP-Accounting-Contract-Version: 1` |
| Failure transport | evento normalizado | `X-OTP-Failure-Contract-Version: 1` + `schemaVersion: 1` |
| Eventos de integración | `IntegrationEventEnvelope` | `version: 1` |
| Firma webhook | entrega HTTPS firmada | `X-OTP-Signature: v1=...` |
| Catálogo HTTP | rutas read-only | semántica legacy-v1 sin header explícito |

## Compatibilidad de interfaces in-process

Normalmente compatible:

- campos opcionales nuevos con ausencia/default seguro;
- nueva implementación detrás de composición actual;
- helpers nuevos que no invaliden implementaciones existentes.

Normalmente breaking:

- eliminar/renombrar método obligatorio;
- añadir método obligatorio a todas las implementaciones;
- cambiar semántica obligatoria;
- cambiar autoridad/ownership;
- cambiar idempotencia o significado de estados.

La forma de un SDK vendor no justifica romper la interfaz pública; debe mapearse dentro del adapter.

## Compatibilidad REST/HTTP

Dentro de v1 suelen ser compatibles campos opcionales nuevos y endpoints adicionales sin alterar comportamiento existente.

Son breaking:

- añadir/eliminar/renombrar campos obligatorios;
- cambiar ruta/método;
- cambiar auth/header de versión;
- cambiar semántica de estados;
- cambiar idempotencia;
- ampliar autoridad;
- ampliar allowlists de datos protegidos.

Un breaking wire requiere nueva superficie explícita, por ejemplo `/v2`, no modificar `/v1` in-place.

## Catálogo legacy

El catálogo HTTP read-only actual mantiene **semántica legacy-v1**: evolución opcional/aditiva permitida, significado estable y versión nueva para cambios breaking.

## Eventos

`IntegrationEventEnvelope.version` versiona schema/semántica. Un nuevo tipo/campo opcional puede ser compatible; eliminar/renombrar requeridos o cambiar replay/idempotencia/significado exige nueva versión y migración explícita.

## Firma webhook

`X-OTP-Signature: v1=...` versiona únicamente el formato criptográfico. Un cambio de algoritmo/canonicalización introduce nueva versión de firma de forma deliberada.

## Failure transport

Tiene dos dimensiones independientes: header wire `X-OTP-Failure-Contract-Version: 1` y `FailureTransportEvent.schemaVersion: 1`.

## Matriz

| Cambio | Clasificación por defecto |
|---|---|
| Añadir campo opcional seguro | compatible |
| Añadir campo/método obligatorio | breaking |
| Eliminar/renombrar campo/método | breaking |
| Nueva implementación tras interfaz actual | compatible |
| Nuevo endpoint/evento sin alterar existente | compatible |
| Nuevo estado observable | breaking por defecto; revisar |
| Cambiar auth/header de versión | breaking |
| Cambiar idempotencia | breaking |
| Cambiar autoridad | breaking/contrato nuevo |
| Ampliar allowlist protegida | breaking/revisión seguridad |
| Upgrade interno vendor manteniendo contrato OTP | compatible para OTP |

## Deprecación y migración

El lifecycle global se define en [`DEPRECATIONS.es.md`](DEPRECATIONS.es.md) y las rutas de upgrade en [`UPGRADES.es.md`](UPGRADES.es.md). Una retirada ordinaria de una extensión pública ocurre únicamente en/después del límite MAJOR anunciado; PATCH/MINOR no usan migraciones para saltarse ese lifecycle.

Un breaking change documenta:

- contrato anterior/nuevo;
- ventana y earliest ordinary removal;
- pasos de migración/configuración;
- implicaciones de idempotencia/replay;
- restricciones de rollback;
- release mínima compatible.

Mutaciones de pagos/contabilidad/proveedor además analizan duplicados/conciliación.

## Regla v1 → v2

1. mantener v1 estable durante la ventana soportada;
2. introducir v2 explícito;
3. seleccionar/migrar v2 deliberadamente;
4. retirar v1 solo según [`DEPRECATIONS.es.md`](DEPRECATIONS.es.md) y lifecycle de release.

Nunca reintentar automáticamente una mutación v2 fallida como v1.

## Aplicación permanente

Fase 10.3.4 protege identidades contractuales con:

```bash
npm run check:extension-contracts
```

Fase 10.5 protege además upgrade/deprecación con:

```bash
npm run check:upgrade-deprecations
```

## Documentación relacionada

- [`EXTENSION-POINT-INVENTORY.es.md`](EXTENSION-POINT-INVENTORY.es.md)
- [`REFERENCE-ADAPTERS.es.md`](REFERENCE-ADAPTERS.es.md)
- [`EXTENSION-VALIDATION.es.md`](EXTENSION-VALIDATION.es.md)
- [`EXTENSION-CONTRACTS.es.md`](EXTENSION-CONTRACTS.es.md)
- [`UPGRADES.es.md`](UPGRADES.es.md)
- [`DEPRECATIONS.es.md`](DEPRECATIONS.es.md)
- [`ADAPTER-GUIDE.md`](ADAPTER-GUIDE.md)
