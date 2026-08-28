# Convenciones de release

<p align="center"><a href="./RELEASES.md">English</a> · <strong>Español</strong></p>

Estado: **Fase 10.4 — COMPLETADA**

## Propósito

Open Travel Platform utiliza releases reproducibles e inmutables. Un release es un commit revisado de `main`, identificado por la versión del paquete y un tag Git inmutable.

Este contrato se complementa con [`UPGRADES.es.md`](UPGRADES.es.md) y [`DEPRECATIONS.es.md`](DEPRECATIONS.es.md).

## Formato de versión

Los releases públicos estables usan Semantic Versioning:

```text
MAJOR.MINOR.PATCH
```

Los tags Git usan `vX.Y.Z`. Deben coincidir `package.json`, badge README, heading de CHANGELOG y tag Git. Los tags publicados son inmutables.

Los checks actuales aceptan versiones estables `x.y.z`; introducir prereleases exige una política futura explícita.

## Política SemVer

### PATCH

Correcciones backward-compatible sin cambios obligatorios incompatibles de configuración, contratos o interpretación persistente.

### MINOR

Adiciones backward-compatible, como capacidades opcionales, adapters opt-in o campos opcionales seguros.

PATCH/MINOR no pueden realizar una retirada ordinaria de una superficie pública previamente soportada. La deprecación/retirada sigue [`DEPRECATIONS.es.md`](DEPRECATIONS.es.md).

### MAJOR

Breaking changes públicos, incluidos eliminación/rename de campos o métodos requeridos, configuración incompatible, cambios de autoridad/autenticación/idempotencia, wire contracts incompatibles o datos persistentes que exijan migración breaking.

Las extensiones siguen además [`EXTENSION-COMPATIBILITY.es.md`](EXTENSION-COMPATIBILITY.es.md).

## Fuente de verdad

Un release público se corta únicamente desde un commit revisado ya mergeado y verificado en `main`.

Deben coincidir:

- versión de `package.json`;
- badge de README;
- entrada de `CHANGELOG.md`;
- tag `vX.Y.Z`.

Nunca se mueve, recrea o reutiliza un tag publicado.

## Secuencia obligatoria

1. **Determinar impacto SemVer.**
2. **Revisar deprecaciones/retiradas** con [`DEPRECATIONS.es.md`](DEPRECATIONS.es.md).
3. **Revisar migraciones** con [`MIGRATIONS.es.md`](MIGRATIONS.es.md).
4. **Revisar ruta de upgrade soportada** con [`UPGRADES.es.md`](UPGRADES.es.md).
5. **Actualizar versión** estable objetivo.
6. **Cerrar CHANGELOG** y conservar Unreleased.
7. **Sincronizar documentación** EN/ES.
8. **Validar**:

```bash
npm ci
npm run verify
npm run build
npm run package:standalone
```

9. **Mergear a `main`** solo con CI obligatorio verde.
10. **Verificar `main`.**
11. **Crear tag inmutable** `vX.Y.Z` sobre el commit verificado.
12. **Publicar release notes** con migración/upgrade/deprecación cuando aplique.
13. **Desplegar consumidores por separado** registrando versión/SHA exactos.

Nunca se crea un tag público desde una feature branch sin merge.

## Contrato de CHANGELOG

`CHANGELOG.md` conserva Unreleased e historial inmutable. Puede distinguir Added, Changed, Fixed, Security, Deprecated, Removed, Migration y Compatibility.

Una entrada Deprecated identifica reemplazo y earliest ordinary removal. Una entrada Removed enlaza la ruta de upgrade/migración correspondiente. Los registros históricos publicados no se reescriben por cambios posteriores de lifecycle.

## Artefacto de release

El runtime provider-neutral es el output standalone documentado en [`DEPLOYMENT.es.md`](DEPLOYMENT.es.md). Se construye desde source/tag y lockfile exactos y se trata como artefacto inmutable. Secretos y datos cliente son estado de despliegue, nunca contenido del release.

## Gate de migración y upgrade

Si un release cambia estado persistente, configuración obligatoria o contrato wire público, debe incluir guidance de migración y upgrade soportado.

Debe responder:

- ¿Es backward-compatible?
- ¿Exige nuevas variables?
- ¿MongoDB requiere transformación?
- ¿Cambia versión REST/evento?
- ¿Afecta datos cifrados/protegidos?
- ¿Se depreca o retira una superficie?
- ¿Cuál es la release origen mínima soportada?
- ¿Código anterior puede leer el estado migrado?
- ¿Cuál es el rollback/recuperación?

Consulta [`MIGRATIONS.es.md`](MIGRATIONS.es.md), [`UPGRADES.es.md`](UPGRADES.es.md) y [`DEPRECATIONS.es.md`](DEPRECATIONS.es.md).

## Rollback

El rollback debe usar el artefacto/tag inmutable anterior conocido como bueno. Nunca se mueve un tag para “corregir” un release.

Si los datos ya cambiaron, la recuperación puede ser application-only, reverse migration, restore de backup o forward-only según la migración documentada.

## Releases de seguridad

Seguridad puede acelerar una deprecación/retirada, pero no elimina identidad del release, validación ni seguridad de migración. Debe seguir la excepción de seguridad de [`DEPRECATIONS.es.md`](DEPRECATIONS.es.md).

Consulta [`../SECURITY.md`](../SECURITY.md).

## Automatización

```bash
npm run check:release
npm run check:release-migrations
npm run check:upgrade-deprecations
npm run verify
```

Fase 10.4 protege identidad release/migración y Fase 10.5 añade el lifecycle de upgrades/deprecaciones.
