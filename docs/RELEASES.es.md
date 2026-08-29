# Convenciones de release

<p align="center"><a href="./RELEASES.md">English</a> · <strong>Español</strong></p>

Estado: **Política Fase 10.4 COMPLETADA; lifecycle auditado de distribución de Fase 11.4 añadido**

## Propósito

Open Travel Platform utiliza releases públicos reproducibles e inmutables. Un release es una revisión ya mergeada y verificada en `main`, identificada por versión de paquete, tag Git inmutable y—cuando aplica distribución OCI—por el digest publicado/verificado.

Esta política se complementa con [`MIGRATIONS.es.md`](MIGRATIONS.es.md), [`UPGRADES.es.md`](UPGRADES.es.md), [`DEPRECATIONS.es.md`](DEPRECATIONS.es.md), [`REGISTRY.es.md`](REGISTRY.es.md) y [`DEPLOYMENT-RECIPES.es.md`](DEPLOYMENT-RECIPES.es.md).

## Formato de versión

Los releases públicos estables usan Semantic Versioning:

```text
MAJOR.MINOR.PATCH
```

Los tags usan `vX.Y.Z` y la identidad debe coincidir entre:

```text
package.json  -> X.Y.Z
badge README  -> X.Y.Z
CHANGELOG.md  -> ## [X.Y.Z] - YYYY-MM-DD
tag Git        -> vX.Y.Z
```

Los **tags son inmutables**. Nunca se mueve, recrea o reutiliza un tag publicado para cambiar su contenido.

Los checks actuales aceptan versiones estables `x.y.z`; introducir prereleases exige una política futura explícita.

## Política SemVer

### PATCH

Correcciones backward-compatible sin cambios incompatibles obligatorios de contratos, configuración o interpretación persistente.

### MINOR

Adiciones backward-compatible, incluidas capacidades opcionales, adapters aditivos o nuevas superficies opcionales de distribución.

PATCH/MINOR no realizan retirada ordinaria de una superficie pública soportada.

### MAJOR

Breaking changes públicos: campos/métodos/configuración requerida incompatibles, cambios de autoridad/autenticación/idempotencia, wire contracts incompatibles o migraciones persistentes breaking.

Las extensiones siguen además [`EXTENSION-COMPATIBILITY.es.md`](EXTENSION-COMPATIBILITY.es.md).

## Fuente de verdad

Un release público se corta únicamente desde una revisión ya mergeada en `main`.

Antes de publicar, debe verificarse `main` y el audit de release actual debe pasar sobre exactamente esa revisión.

Archivos versionados de auditoría/notas:

```text
docs/RELEASE-AUDIT-X.Y.Z.md
docs/RELEASE-AUDIT-X.Y.Z.es.md
docs/RELEASE-NOTES-X.Y.Z.md
docs/RELEASE-NOTES-X.Y.Z.es.md
```

Las auditorías históricas se conservan como registros históricos. Por ejemplo, `check:phase-10-release` sigue protegiendo v1.1.0 y no se reescribe para versiones posteriores.

## Secuencia obligatoria

1. Determinar impacto SemVer real.
2. Revisar deprecaciones/retiradas con `DEPRECATIONS.es.md`.
3. Revisar migraciones con `MIGRATIONS.es.md`.
4. Revisar ruta de upgrade con `UPGRADES.es.md`.
5. Sincronizar `package.json`, README, CHANGELOG y auditoría/release notes versionados.
6. Conservar `Unreleased` en CHANGELOG.
7. Sincronizar documentación EN/ES.
8. Validar desde el grafo bloqueado:

```bash
npm ci
npm run check:release
npm run check:release-migrations
npm run check:upgrade-deprecations
npm run check:release-audit
npm run verify
npm run package:standalone
```

9. Abrir/revisar PR de cierre.
10. Mergear a `main` solo con CI obligatorio verde.
11. Verificar `main` después del merge.
12. Dejar que `Release audit` valide esa revisión exacta.
13. Dejar que `Publish audited release` cree el tag/GitHub Release inmutable solo cuando la auditoría versionada lo aprueba.
14. Cuando aplica OCI, `Publish audited container` publica únicamente si el tag SemVer resuelve al SHA auditado exacto.
15. `Verify published distribution` verifica digest, metadata, provenance, SBOM, attestation y runtime antes de considerar completa la distribución.
16. Desplegar consumidores por separado usando identidad exacta versión/SHA/digest.

Nunca se crea un tag público desde una feature branch sin merge.

## Automatización auditada

### Release audit

`Release audit` valida en `main` mergeado:

- consistencia de identidad;
- aprobación versionada;
- `npm run verify`;
- packaging standalone.

### Release source inmutable

`Publish audited release` se ejecuta después del audit correcto. Rechaza reescribir tags/releases existentes y usa las release notes versionadas revisadas.

### Publicación OCI

`Publish audited container` exige igualdad tag SHA = SHA auditado y publica únicamente identidades inmutables SemVer/SHA. `v1.1.0` histórico queda excluido de OCI retroactivo.

### Verificación del artefacto publicado

Cuando aplica distribución OCI, `Verify published distribution` comprueba:

- pull público;
- tags SemVer/SHA resolviendo al mismo digest;
- metadata OCI source/revision/version/license;
- provenance BuildKit;
- SBOM;
- GitHub artifact attestation;
- runtime limpio por digest;
- identidad no-root;
- liveness/readiness y comportamiento HTTP/static representativo.

El registro de verificación se adjunta a GitHub Release tras éxito.

## Contrato de CHANGELOG

`CHANGELOG.md` conserva `Unreleased` e historial inmutable. Los registros históricos publicados no se reescriben porque evolucione tooling o política.

## Gate de migración

Si un release cambia estado persistente, configuración obligatoria o contrato wire público, debe incluir guidance de migración/upgrade en el mismo PR.

Preguntas mínimas:

- ¿Es backward-compatible?
- ¿Exige nuevas variables?
- ¿MongoDB cambia datos/índices?
- ¿Cambia un contrato REST/evento?
- ¿Afecta datos cifrados/protegidos?
- ¿Se depreca/retira alguna superficie?
- ¿Cuál es la versión origen mínima soportada?
- ¿Código anterior puede leer estado durante rollout?
- ¿Cuál es el rollback/recuperación?

Consulta [`MIGRATIONS.es.md`](MIGRATIONS.es.md), [`UPGRADES.es.md`](UPGRADES.es.md) y [`DEPRECATIONS.es.md`](DEPRECATIONS.es.md).

## Rollback

El **Rollback** de aplicación usa normalmente la identidad inmutable anterior conocida como buena. Nunca se corrige un release moviendo un tag Git o OCI publicado.

Para OCI debe registrarse el digest anterior y realizar rollback por digest. Si el estado persistente cambió, recovery depende de la clase documentada: application-only, reverse migration, restore de backup o forward-only.

## Seguridad

Un fix de seguridad puede comprimir lifecycle, pero no salta identidad, validación, seguridad de migración ni verificación del artefacto. Consulta `SECURITY.md` y la excepción de `DEPRECATIONS.es.md`.

## Validación permanente

```bash
npm run check:release
npm run check:release-migrations
npm run check:upgrade-deprecations
npm run check:release-audit
npm run check:phase-11-distribution
npm run verify
```

Fase 10.4 sigue siendo la base de release/migración. Fase 11.4 añade el lifecycle reutilizable auditado de source + OCI sin reescribir registros históricos.
