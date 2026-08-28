# Política de upgrades

<p align="center"><a href="./UPGRADES.md">English</a> · <strong>Español</strong></p>

Estado: **Fase 10.5 — COMPLETADA**

## Propósito

Open Travel Platform trata un upgrade como un cambio operativo, no solo como sustitución de paquetes. Un operador debe poder identificar releases origen/destino exactos, entender el impacto de compatibilidad/migración, validar el target y recuperarse si el rollout falla.

Esta política complementa [`RELEASES.es.md`](RELEASES.es.md), [`MIGRATIONS.es.md`](MIGRATIONS.es.md) y [`DEPRECATIONS.es.md`](DEPRECATIONS.es.md).

## Baseline de upgrades soportados

Open Travel Platform no promete una rama LTS salvo que se anuncie explícitamente en la documentación de un release.

Por defecto:

- la última release estable del major actual es el target soportado principal;
- upgrades directos dentro del mismo major están soportados cuando se aplican todas las migraciones documentadas entre origen y destino;
- un upgrade de major está soportado desde la última release estable del major inmediatamente anterior cuando el nuevo major documenta su ruta;
- saltar un major **no está garantizado** salvo documentación explícita del target;
- backports a releases antiguas son best-effort y no deben asumirse salvo anuncio explícito de release/seguridad.

Un despliegue puede permanecer en una release anterior, pero sus expectativas de compatibilidad, seguridad y soporte dependen de los avisos publicados, no únicamente de su antigüedad.

## Identidad del upgrade

Antes de modificar un despliegue registra:

```text
versión/tag actual del core
SHA/artefacto Git exacto actual
revisión de configuración del despliegue
estado persistente / punto de backup
identificadores de keyring activos cuando aplique
versión/tag y SHA objetivo
```

Nunca describas un upgrade únicamente como “latest”. Usa versión/tag/SHA inmutables.

## Clasificación de compatibilidad

Antes del upgrade revisa el historial completo entre origen y destino y clasifica cada cambio relevante:

- **PATCH** — fix backward-compatible;
- **MINOR** — adición backward-compatible;
- **MAJOR** — puede contener breaking changes y exige revisión explícita de migración;
- **migración de configuración**;
- **migración de estado persistente**;
- **migración de contrato wire**;
- **migración criptográfica**;
- **deprecación/retirada**.

SemVer se define en [`RELEASES.es.md`](RELEASES.es.md) y las clases de migración en [`MIGRATIONS.es.md`](MIGRATIONS.es.md).

## Secuencia obligatoria

Para producción:

1. **Identificar origen y target exactamente.** Registrar versiones/tags/SHAs.
2. **Leer CHANGELOG y release notes** de todas las releases intermedias.
3. **Revisar deprecaciones/retiradas.** Confirmar que ninguna capacidad usada haya superado su límite soportado.
4. **Revisar migraciones** y definir expand/migrate/contract cuando corresponda.
5. **Verificar backup/recuperación** antes de cambios persistentes o irreversibles.
6. **Probar el target en staging** o entorno representativo con modos similares a producción.
7. **Ejecutar validación bloqueada**:

```bash
npm ci
npm run check:release
npm run check:release-migrations
npm run check:upgrade-deprecations
npm run verify
```

8. **Ejecutar migraciones deliberadamente** mediante comandos/procedimientos controlados. No depender del startup para migraciones destructivas.
9. **Desplegar el artefacto inmutable objetivo.**
10. **Verificar health e invariantes de negocio** en journeys habilitados de cliente, Operator, pagos e integraciones.
11. **Observar el rollout** para detectar fallos asíncronos.
12. **Registrar finalización** con versión/SHA y estado de migración exactos.

## Upgrades dentro del mismo major

PATCH y MINOR deben mantener compatibilidad pública backward-compatible según las políticas de release y contratos de extensión.

Un upgrade del mismo major puede exigir una migración operativa **aditiva**, por ejemplo un índice nuevo o backfill opcional. Debe conservar la ventana de compatibilidad declarada y no convertirse en un breaking change oculto.

Configuración obligatoria nueva debería ofrecer una ruta segura/default-disabled cuando sea viable. Reinterpretar incompatiblemente una configuración existente es breaking.

## Upgrades de major

Un nuevo MAJOR puede retirar superficies previamente deprecadas o introducir incompatibilidades deliberadas.

La guía de major upgrade debe identificar:

- release mínima soportada de origen;
- superficies retiradas/deprecadas;
- configuración/contratos de reemplazo;
- migraciones de datos/claves;
- orden y ventana de compatibilidad;
- verificación;
- restricciones de rollback/recuperación.

Si la aplicación anterior no puede leer el estado migrado, debe declararse antes de ejecutar la migración.

## Upgrades de configuración

Los nombres de configuración son contratos operativos públicos.

Al reemplazar una configuración:

1. introducir el reemplazo;
2. documentar precedencia mientras ambas sean aceptadas;
3. marcar la antigua como deprecated;
4. emitir warning server-side seguro cuando sea viable;
5. retirar únicamente según [`DEPRECATIONS.es.md`](DEPRECATIONS.es.md).

No reutilices silenciosamente una variable de entorno antigua con semántica incompatible. Nunca incluyas secretos en warnings.

## Upgrades de APIs e integraciones

Los contratos públicos siguen [`EXTENSION-COMPATIBILITY.es.md`](EXTENSION-COMPATIBILITY.es.md).

- v1 mantiene comportamiento estable durante su lifecycle soportado;
- v2 se selecciona deliberadamente;
- mutaciones v2 no hacen downgrade silencioso a v1;
- consumidores disponen de ventana de migración documentada antes de una retirada ordinaria;
- cambios de autoridad/autenticación/idempotencia son breaking aunque el payload parezca compatible.

## Upgrades de datos persistentes

Usa la disciplina de [`MIGRATIONS.es.md`](MIGRATIONS.es.md): **expand → migrate → contract** cuando pueda conservarse compatibilidad.

No despliegues cleanup destructivo/contract antes de que todos los lectores soportados estén preparados y se cumplan las condiciones de recuperación.

## Rollback y upgrades fallidos

Antes de ejecutar, clasifica recuperación como:

- **rollback solo aplicación**;
- **reverse migration**;
- **restore de backup**;
- **recuperación forward-only**.

Nunca “corrijas” un upgrade fallido moviendo/reutilizando un tag. Despliega un artefacto inmutable conocido como correcto y sigue la recuperación documentada.

## Actualizaciones de seguridad

Un aviso de seguridad puede exigir una ruta acelerada de upgrade o una retirada/deprecación más rápida. El aviso debe indicar versiones origen/destino soportadas y migraciones de emergencia.

La urgencia no permite identidad ambigua, migración destructiva oculta ni exposición de secretos.

## Registro de verificación

En upgrades productivos conserva un registro operativo sanitizado con:

- versión/SHA origen y destino;
- identificadores de migración ejecutados;
- punto de backup/restore cuando aplique;
- resultado de verificación;
- clasificación de rollback/recuperación;
- momento de finalización.

No registres secretos ni datos protegidos de viajeros/clientes.

## Automatización

La política queda protegida por:

```bash
npm run check:upgrade-deprecations
npm run verify
```

El gate verifica que las reglas de upgrade/deprecación permanezcan sincronizadas con releases, migraciones, compatibilidad, soporte y contribución.
