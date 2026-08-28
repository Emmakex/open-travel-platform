# Convenciones de migración

<p align="center"><a href="./MIGRATIONS.md">English</a> · <strong>Español</strong></p>

Estado: **Fase 10.4 — COMPLETADA**

## Propósito

Una migración es cualquier cambio de release que obliga a un operador o despliegue a transformar configuración, estado persistente, estado criptográfico o un contrato público, en lugar de limitarse a sustituir código de aplicación.

Las migraciones deben ser explícitas, revisables y recuperables. Open Travel Platform **no** ejecuta migraciones destructivas ocultas durante el startup de la aplicación.

## Clases de migración

### A. Solo configuración

Ejemplos:

- añadir una variable de entorno opcional con default seguro;
- introducir un adapter opt-in.

Patrón preferido:

1. entregar soporte con estado seguro/deshabilitado por defecto;
2. documentar variable en `.env.example` y docs de despliegue;
3. activar por despliegue.

Una variable nueva obligatoria sin ventana compatible es un cambio breaking de despliegue.

### B. Cambio persistente aditivo

Ejemplos:

- campos opcionales MongoDB;
- colección nueva;
- índice compatible.

Estrategia preferida: **expand → migrate → contract**.

Durante expand, lectores antiguos y nuevos deben mantener compatibilidad cuando sea viable. Después se hace backfill y solo finalmente cleanup destructivo tras cerrar ventana de compatibilidad/rollback.

### C. Transformación/backfill de datos

Debe ser:

- determinista;
- acotada y observable;
- segura al reintentar o explícitamente resumible;
- limitada a los registros previstos;
- auditable cuando afecte datos protegidos/privilegiados;
- verificada antes de cleanup destructivo.

Nunca debe reinterpretar silenciosamente dinero, divisa, inventario, identidad, reservas o historial de pagos.

### D. Migración de contrato wire/público

Cambios REST/eventos/firma siguen [`EXTENSION-COMPATIBILITY.es.md`](EXTENSION-COMPATIBILITY.es.md).

Un breaking change exige nueva versión/paralela y ventana explícita. Mutaciones v2 nunca hacen downgrade silencioso a v1.

### E. Migración de cifrado/claves

Traveller Data protegido y cambios de claves usan los mecanismos de keyring/re-encryption ya documentados. La rotación debe conservar recuperación/rollback hasta que el ciphertext antiguo deje de ser necesario.

Consulta [`TRAVELLER-DATA.md`](TRAVELLER-DATA.md).

### F. Migración destructiva/irreversible

Ejemplos:

- eliminar campos/colecciones;
- cambiar semántica de forma incompatible con código anterior;
- reducción irreversible de datos;
- retirar versión wire antigua tras deprecación.

Requiere plan de recuperación antes del release. Si el rollback exige restaurar backup, debe quedar declarado y probado.

## Sin migraciones destructivas en startup

El startup de aplicación, evaluación de módulos o requests normales no deben ejecutar automáticamente migraciones destructivas persistentes.

Motivos:

- varias instancias pueden arrancar concurrentemente;
- health checks no deben mutar schema de forma inesperada;
- un fallo parcial vuelve ambiguo el rollback;
- el operador necesita control de backup, timing y verificación.

Los cambios operativos deben usar un comando/script deliberado.

## Convenciones de scripts

Un script nuevo debe documentar:

- identificador/nombre;
- assumptions origen;
- estado destino;
- scope/query;
- si es idempotente o resumible;
- dry-run/inspección read-only cuando sea viable;
- impacto operativo/tiempo esperado;
- método de verificación;
- rollback/recuperación.

Nunca incluir credenciales productivas ni IDs específicos de clientes en scripts públicos.

## Secuencia productiva

1. **Clasificar compatibilidad y tipo.**
2. **Tomar/verificar backup** antes de cambios destructivos o de alto riesgo.
3. **Registrar versión actual y estado de DB.**
4. **Desplegar código expand-compatible primero** cuando sea posible.
5. **Ejecutar migración deliberadamente** con autorización operativa adecuada.
6. **Verificar resultados** mediante counts/invariantes/domain checks, no solo exit code.
7. **Observar health e invariantes de negocio.**
8. **Ejecutar cleanup/contract destructivo** únicamente tras la ventana compatible.
9. **Registrar finalización** en operaciones del release/despliegue.

## MongoDB

Preferir cambios aditivos frente a reinterpretación destructiva in-place.

En backfills grandes:

- batches acotados;
- criterio/cursor estable;
- restart explícito;
- memoria acotada;
- monitorizar carga/locks/latencia;
- validar índices antes/después cuando aplique.

Backup/restore e index validation existentes siguen formando parte de la seguridad productiva.

## Pagos y datos financieros

El ledger de pagos/reembolsos es historial autoritativo.

La migración debe preservar:

- identidad/idempotencia del movimiento;
- importe y divisa;
- referencias provider cuando existan;
- cronología/auditoría;
- distinción payment/refund.

Nunca recalcular importes históricos desde datos actuales mutables de la reserva.

## Booking/inventario

Cambios sobre reservas/inventario deben preservar invariantes transaccionales y no crear/perder capacidad implícitamente.

Si cambia el significado de estados, tratarlo como breaking change de dominio y documentar compatibilidad/rollback.

## Traveller Data protegido

Requiere acceso mínimo necesario y nunca debe aparecer en logs, summaries o artefactos públicos.

Outputs de migración usan counts, IDs seguros/correlación y diagnósticos redactados.

## Verificación

Toda migración no trivial define postcondiciones, por ejemplo:

- counts esperados;
- ausencia de registros legacy pendientes;
- invariantes de unicidad/índices;
- totales de dominio preservados;
- datos cifrados legibles con el keyring esperado;
- comportamiento old/new consumers dentro de la ventana declarada.

Un exit code correcto no basta en migraciones de alto impacto.

## Rollback/recuperación

Antes de ejecutar, declarar si rollback es:

- **solo aplicación** — release anterior puede leer el nuevo estado;
- **reverse migration** — existe transformación inversa probada;
- **restore de backup** — hace falta restauración;
- **irreversible** — recuperación únicamente forward.

Las irreversibles requieren revisión explícita y release notes antes de producción.

## Documentación de release

Todo release con migración debe indicar en `CHANGELOG.md`:

- migración necesaria: sí/no;
- capacidad/estado afectado;
- ventana compatible;
- comando/procedimiento;
- verificación;
- rollback/recuperación.

Consulta [`RELEASES.es.md`](RELEASES.es.md).

## Automatización

El gate permanente de Fase 10.4 protege estas convenciones:

```bash
npm run check:release-migrations
npm run verify
```

El gate no demuestra automáticamente que toda migración futura sea segura; impide que el proyecto pierda silenciosamente las convenciones e integración obligatorias.

## Registro de cierre

La Fase 10.4 cumple la regla de cierre del proyecto. Ningún bloque posterior de Fase 10 se considera activo hasta que el CI obligatorio esté verde, el cambio de cierre se mergee a `main` y `main` sea verificado.
