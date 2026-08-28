# Convenciones de migración

<p align="center"><a href="./MIGRATIONS.md">English</a> · <strong>Español</strong></p>

Estado: **Fase 10.4 — COMPLETADA**

## Propósito

Una migración transforma configuración, estado persistente, estado criptográfico o un contrato público; no es solo sustituir código.

Debe ser explícita, revisable y recuperable. Open Travel Platform **no** ejecuta migraciones destructivas ocultas durante startup.

La secuencia de upgrade se define en [`UPGRADES.es.md`](UPGRADES.es.md) y los límites de lifecycle/retirada en [`DEPRECATIONS.es.md`](DEPRECATIONS.es.md).

## Clases

### A. Solo configuración

Preferir settings opcionales con default seguro o capacidades opt-in. Un setting obligatorio nuevo sin ventana compatible es breaking. Si se reemplaza un nombre existente, sigue el lifecycle de deprecación; nunca se reinterpreta silenciosamente.

### B. Cambio persistente aditivo

Campos opcionales MongoDB, colecciones o índices compatibles siguen **expand → migrate → contract**.

Lectores antiguos/nuevos deben mantener compatibilidad cuando sea viable. El paso destructivo/contract solo ocurre tras la ventana de compatibilidad/deprecación y requisitos de rollback.

### C. Transformación/backfill

Debe ser determinista, acotada, observable, retry-safe o resumible, limitada al scope previsto, auditable cuando corresponda y verificada antes de cleanup destructivo.

Nunca reinterpretar silenciosamente dinero, divisa, inventario, identidad, reservas o historial de pagos.

### D. Contrato wire/público

REST/eventos/firma siguen [`EXTENSION-COMPATIBILITY.es.md`](EXTENSION-COMPATIBILITY.es.md) y [`DEPRECATIONS.es.md`](DEPRECATIONS.es.md).

Breaking changes requieren versión paralela/nueva, ventana de migración y límite de retirada anunciado. Mutaciones v2 nunca hacen downgrade silencioso a v1.

### E. Cifrado/claves

Traveller Data protegido utiliza keyring/re-encryption documentados y conserva recuperación mientras ciphertext antiguo siga siendo necesario.

### F. Destructiva/irreversible

Eliminar campos/colecciones, hacer estado ilegible para código anterior, reducir datos irreversiblemente o retirar una versión wire exige recuperación explícita y probada. Una migración destructiva no puede usarse para saltarse la regla de retirada ordinaria solo en MAJOR.

## Sin migraciones destructivas en startup

Startup, evaluación de módulos y requests normales no ejecutan automáticamente migraciones destructivas persistentes. Varias instancias pueden arrancar a la vez, health checks no deben mutar schemas y el operador necesita controlar backup, timing y verificación.

Usa comandos/scripts deliberados.

## Convenciones de scripts

Documentar:

- identificador/nombre;
- assumptions y release origen mínima soportada;
- estado/release destino;
- scope/query;
- idempotencia o resumibilidad;
- dry-run/read-only cuando sea viable;
- impacto operativo;
- verificación;
- rollback/recuperación.

Nunca incluir credenciales productivas ni IDs específicos de clientes.

## Secuencia productiva

1. **Identificar versiones/SHAs exactos origen y destino** según [`UPGRADES.es.md`](UPGRADES.es.md).
2. **Clasificar compatibilidad, deprecaciones/retiradas y migración.**
3. **Tomar/verificar backup** para trabajo persistente de riesgo.
4. **Registrar release actual y estado DB.**
5. **Desplegar expand-compatible** cuando sea posible.
6. **Ejecutar migración deliberadamente.**
7. **Verificar resultados** con counts/invariantes/domain checks.
8. **Observar health e invariantes de negocio.**
9. **Ejecutar cleanup/contract solo después de la ventana lifecycle.**
10. **Registrar finalización** con versión/SHA y recuperación.

## MongoDB

Preferir cambios aditivos. Backfills grandes usan batches acotados, criterio/cursor estable, restart explícito, memoria acotada, monitorización e index validation.

## Pagos y finanzas

El ledger es historial autoritativo. Preserva identidad/idempotencia, importe/divisa, referencias proveedor, cronología/auditoría y distinción payment/refund.

Nunca recalcular importes históricos desde datos actuales mutables.

## Booking/inventario

Preservar invariantes transaccionales y capacidad. Si cambia el significado de estados, tratarlo como breaking y documentar compatibilidad, deprecación y rollback.

## Traveller Data protegido

Usar acceso mínimo necesario. Nunca escribir datos protegidos en logs, summaries o artefactos públicos; usar counts, IDs seguros y diagnósticos redactados.

## Verificación

Toda migración no trivial define postcondiciones: counts, ausencia de legacy pendiente, invariantes de índices/unicidad, totales preservados, ciphertext legible y consumidores old/new funcionando según la ventana declarada.

Exit code no basta para migraciones de alto impacto.

## Rollback/recuperación

Clasificar como:

- **solo aplicación**;
- **reverse migration**;
- **restore de backup**;
- **irreversible/forward-only**.

Las irreversibles requieren revisión y release notes explícitos.

## Documentación de release/lifecycle

Todo release con migración registra en CHANGELOG:

- migración sí/no;
- capacidad/estado afectado;
- assumptions de soporte origen/destino;
- ventana de compatibilidad/deprecación;
- procedimiento;
- verificación;
- rollback/recuperación.

Consulta [`RELEASES.es.md`](RELEASES.es.md), [`UPGRADES.es.md`](UPGRADES.es.md) y [`DEPRECATIONS.es.md`](DEPRECATIONS.es.md).

## Automatización

```bash
npm run check:release-migrations
npm run check:upgrade-deprecations
npm run verify
```

Los gates evitan perder silenciosamente los contratos de release, upgrade, deprecación y migración.
