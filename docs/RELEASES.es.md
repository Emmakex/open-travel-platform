# Convenciones de release

<p align="center"><a href="./RELEASES.md">English</a> · <strong>Español</strong></p>

Estado: **Fase 10.4 — COMPLETADA**

## Propósito

Open Travel Platform utiliza releases reproducibles e inmutables. Un release es un commit revisado de `main`, identificado por la versión del paquete y un tag Git inmutable.

Este documento define el contrato público de releases del core MIT. Kairoseth Travel puede desplegar el core de forma independiente, pero el estado del despliegue alojado no redefine la versión pública del core.

## Formato de versión

Los releases públicos estables usan Semantic Versioning:

```text
MAJOR.MINOR.PATCH
```

Los tags Git usan:

```text
vX.Y.Z
```

Ejemplo:

```text
package.json  -> 1.2.3
Git tag       -> v1.2.3
CHANGELOG     -> ## [1.2.3] - YYYY-MM-DD
```

Los checks actuales aceptan deliberadamente versiones estables `x.y.z`. Introducir prereleases como `-rc.1` exige un cambio futuro explícito de política y validación.

## Política SemVer

### PATCH

Para correcciones backward-compatible sin cambios obligatorios de configuración pública, contratos públicos o interpretación persistente.

Ejemplos:

- corrección de bugs;
- fixes de seguridad compatibles;
- correcciones documentales;
- mejoras de rendimiento sin cambios contractuales.

### MINOR

Para adiciones backward-compatible.

Ejemplos:

- nuevas capacidades opcionales;
- adapters opt-in detrás de contratos existentes;
- campos opcionales aditivos con ausencia segura;
- nuevos endpoints/eventos sin alterar consumidores existentes.

### MAJOR

Para breaking changes públicos.

Ejemplos:

- eliminar/renombrar campos o métodos públicos obligatorios;
- requisitos incompatibles de configuración;
- cambiar semántica de autoridad, autenticación o idempotencia;
- cambios wire breaking sin versión compatible paralela;
- cambios de datos persistentes que exijan una migración incompatible.

Las reglas específicas de extensiones siguen definidas en [`EXTENSION-COMPATIBILITY.es.md`](EXTENSION-COMPATIBILITY.es.md).

## Fuente de verdad del release

Un release público se corta únicamente desde un commit revisado y ya mergeado a `main`.

Deben coincidir:

- versión de `package.json`;
- badge de versión del README;
- heading correspondiente en `CHANGELOG.md`;
- tag Git `vX.Y.Z`.

Los tags son inmutables. Nunca se mueve, recrea o reutiliza un tag publicado para cambiar el contenido de un release.

## Secuencia obligatoria

1. **Determinar impacto** — PATCH, MINOR o MAJOR según la compatibilidad real.
2. **Revisar migraciones** — clasificar cambios de configuración, datos y contratos con [`MIGRATIONS.es.md`](MIGRATIONS.es.md).
3. **Actualizar versión** — fijar `package.json` a la versión estable objetivo.
4. **Cerrar changelog** — mover entradas relevantes de Unreleased a `## [X.Y.Z] - YYYY-MM-DD` y conservar una sección Unreleased para trabajo futuro.
5. **Sincronizar documentación** — README, ROADMAP, migraciones y docs de capacidades deben reflejar el release.
6. **Validar desde el lockfile**:

```bash
npm ci
npm run verify
```

7. **Validar runtime productivo**:

```bash
npm run build
npm run package:standalone
```

8. **Mergear el PR de release a `main`** solo con CI obligatorio verde.
9. **Verificar `main`** después del merge.
10. **Crear tag inmutable** `vX.Y.Z` sobre ese commit verificado de `main`.
11. **Publicar release notes** desde el CHANGELOG, incluyendo migración/rollback cuando aplique.
12. **Desplegar consumidores de forma separada** y registrar exactamente versión/commit ejecutado.

Nunca se crea un tag público desde una feature branch sin merge.

## Contrato de CHANGELOG

`CHANGELOG.md` conserva sección Unreleased e historial inmutable de releases.

Categorías útiles:

- Added;
- Changed;
- Fixed;
- Security;
- Deprecated;
- Removed;
- Migration;
- Compatibility.

Cambios breaking u operacionalmente relevantes deben enlazar o explicar el procedimiento de migración requerido.

Los registros históricos no se reescriben simplemente porque hayan cambiado las versiones actuales de herramientas/dependencias.

## Artefacto de release

El runtime productivo provider-neutral es el output standalone de Next.js documentado en [`DEPLOYMENT.es.md`](DEPLOYMENT.es.md).

El consumidor debe construir desde el source/tag y lockfile exactos y tratar el artefacto como inmutable. Secretos runtime y datos cliente son estado de despliegue, no contenido del release.

Nunca se incluyen credenciales productivas en un release público.

## Gate de migración

Si un release cambia estado persistente, configuración obligatoria o un contrato wire público, debe incluir guidance de migración en el mismo PR.

Preguntas obligatorias:

- ¿Es backward-compatible?
- ¿Exige nuevas variables de entorno?
- ¿MongoDB requiere transformación de datos/índices?
- ¿Cambia versión REST/evento?
- ¿Afecta datos cifrados/protegidos?
- ¿El código anterior puede leer el estado migrado durante el rollout?
- ¿Cuál es el rollback?

Consulta [`MIGRATIONS.es.md`](MIGRATIONS.es.md).

## Rollback

El rollback de aplicación debe desplegar normalmente el release/artefacto inmutable anterior conocido como correcto.

Nunca se mueve un tag existente para “corregir” un release.

Si los datos ya fueron migrados:

- migraciones aditivas/expand deben preservar compatibilidad temporal con lectores anteriores;
- pasos destructivos/contract necesitan backup/restore o reverse migration explícita;
- cambios irreversibles deben declararse antes del release y contar con recuperación probada.

## Releases de seguridad

Un fix de seguridad puede reducir ventanas de deprecación/divulgación, pero no elimina validación, identidad del release ni seguridad de migración.

Consulta [`../SECURITY.md`](../SECURITY.md).

## Automatización

La deriva se protege mediante:

```bash
npm run check:release
npm run check:release-migrations
npm run verify
```

El gate de Fase 10.4 valida documentación requerida, identidad de release, reglas de seguridad de migración y registro en CI.

## Registro de cierre

La Fase 10.4 cumple la regla de cierre del proyecto: implementación, validación, documentación EN/ES, sincronización README/ROADMAP/CHANGELOG, CI obligatorio, merge a `main` y verificación de `main` son obligatorios antes de considerar activo cualquier bloque posterior de Fase 10.
