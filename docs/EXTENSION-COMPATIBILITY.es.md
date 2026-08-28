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
2. **Los cambios del proveedor deben absorberse dentro del adapter** cuando el contrato OTP normalizado pueda mantenerse.
3. **Los identificadores wire v1 actuales permanecen estables.** Renombrar una ruta/header v1 es breaking.
4. **No existe downgrade silencioso en mutaciones.** Una mutación v2 no puede reintentarse como v1 tras un mismatch.
5. **Versión de schema de evento y versión de firma son independientes.** `event.version` no versiona la sintaxis HMAC y `X-OTP-Signature: v1=...` no versiona el payload.
6. **La deprecación precede la eliminación ordinaria.** Una retirada breaking necesita ruta de migración salvo urgencia de seguridad.
7. **Los identificadores existentes en código son autoritativos.** La documentación debe seguir constantes/rutas reales.

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

Normalmente compatibles:

- nuevos campos opcionales con ausencia/default seguro;
- nueva implementación detrás de la composición actual sin modificar interfaz;
- nuevos helpers que no invaliden implementaciones existentes.

Normalmente breaking:

- eliminar/renombrar método obligatorio;
- añadir método obligatorio a todas las implementaciones;
- cambiar semántica de argumentos/resultados obligatorios;
- cambiar autoridad/ownership;
- cambiar idempotencia o significado de estados.

La forma de un SDK vendor no justifica romper la interfaz pública; debe mapearse dentro del adapter siempre que sea posible.

## Compatibilidad REST/HTTP

Dentro de v1 suelen ser compatibles los campos opcionales nuevos y endpoints adicionales que no cambien comportamiento existente.

Son breaking:

- añadir/eliminar/renombrar campos obligatorios;
- cambiar ruta o método;
- cambiar autenticación/header de versión;
- cambiar semántica de estados;
- cambiar idempotencia;
- ampliar autoridad;
- ampliar allowlists de datos protegidos.

Un cambio breaking wire requiere una superficie nueva explícita, por ejemplo `/v2`, no modificar `/v1` in-place.

Los headers especializados de ERP/contabilidad y FailureTransport siguen siendo válidos en v1 y no se renombran por consistencia estética.

## Catálogo legacy

El catálogo HTTP read-only actual no tiene header de versión explícito. Se trata como **semántica legacy-v1**:

- evolución opcional/aditiva permitida;
- rutas/resultados existentes mantienen significado;
- un cambio breaking requiere un contrato de catálogo versionado nuevo.

## Eventos

`IntegrationEventEnvelope.version` versiona schema/semántica de payload.

Un nuevo tipo de evento o campo opcional puede ser compatible si los consumidores actuales pueden ignorarlo. Eliminar/renombrar campos obligatorios, cambiar identidad de replay/idempotencia o significado de eventos/estados es breaking y exige nueva versión.

## Firma webhook

`X-OTP-Signature: v1=...` versiona únicamente el formato criptográfico de firma.

Un cambio de algoritmo/canonicalización necesita nueva versión de firma y transición deliberada; no obliga por sí mismo a cambiar el schema del evento.

## Failure transport

Hay dos dimensiones:

- header wire `X-OTP-Failure-Contract-Version: 1`;
- `FailureTransportEvent.schemaVersion: 1`.

Cambiar transporte collector y cambiar forma del evento son decisiones independientes.

## Matriz

| Cambio | Clasificación por defecto |
|---|---|
| Añadir campo opcional seguro | compatible |
| Añadir campo/método obligatorio | breaking |
| Eliminar/renombrar campo/método | breaking |
| Añadir implementación detrás de interfaz actual | compatible |
| Añadir endpoint/tipo de evento sin cambiar lo existente | compatible |
| Añadir estado observable nuevo | breaking por defecto; revisar |
| Cambiar auth/header de versión | breaking |
| Cambiar idempotencia | breaking |
| Cambiar autoridad | breaking/contrato nuevo revisado |
| Ampliar allowlist de datos protegidos | breaking/revisión de seguridad |
| Upgrade interno de API vendor manteniendo contrato OTP | compatible para OTP |

## Deprecación y migración

Un breaking change debe documentar:

- identidad contractual anterior y nueva;
- ventana de deprecación cuando sea práctica;
- pasos de migración/configuración;
- implicaciones de idempotencia/replay;
- restricciones de rollback;
- release mínima de OTP compatible.

Mutaciones de pagos/contabilidad/proveedor requieren además análisis explícito de duplicados/conciliación.

## Regla v1 → v2

Migración correcta:

1. mantener v1 estable durante la ventana soportada;
2. introducir contrato/parser v2 explícito;
3. seleccionar/migrar v2 deliberadamente;
4. retirar v1 conforme a la política de release/deprecación.

Nunca reintentar automáticamente una mutación v2 fallida como v1.

## Aplicación permanente

La Fase 10.3.4 codifica las identidades actuales mediante:

```bash
npm run check:extension-contracts
```

El gate falla si se modifican in-place los headers/schemas/firma v1 o si cambian superficies públicas sensibles a autoridad sin una actualización deliberada del gate.

Consulta [`EXTENSION-VALIDATION.es.md`](EXTENSION-VALIDATION.es.md).

## Documentación relacionada

- [`EXTENSION-POINT-INVENTORY.es.md`](EXTENSION-POINT-INVENTORY.es.md)
- [`REFERENCE-ADAPTERS.es.md`](REFERENCE-ADAPTERS.es.md)
- [`EXTENSION-VALIDATION.es.md`](EXTENSION-VALIDATION.es.md)
- [`EXTENSION-CONTRACTS.es.md`](EXTENSION-CONTRACTS.es.md)
- [`ADAPTER-GUIDE.md`](ADAPTER-GUIDE.md)
