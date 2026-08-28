# Plantillas de contribución y release

<p align="center"><a href="./CONTRIBUTION-TEMPLATES.md">English</a> · <strong>Español</strong></p>

Estado: **Fase 10.6 — candidata a COMPLETADA pendiente PR/CI/merge de cierre**

## Propósito

La Fase 10.6 convierte las políticas de las Fases 10.3–10.5 en plantillas prácticas para contribuidores y mantenedores.

Las plantillas no sustituyen las políticas autoritativas de arquitectura/release. Hacen difícil omitir las preguntas obligatorias durante el trabajo normal en GitHub.

## Plantilla canónica de pull request

La única plantilla PR canónica del repositorio es:

```text
.github/PULL_REQUEST_TEMPLATE.md
```

No debe existir una segunda plantilla diferenciada solo por mayúsculas/minúsculas. Los duplicados generan comportamiento ambiguo y deriva documental.

La plantilla obliga a clasificar:

- frontera de capacidad/extensión;
- impacto SemVer/release;
- clase de migración;
- transición de lifecycle de deprecación/retirada;
- impacto de autoridad/seguridad/privacidad;
- impacto visible UX/accesibilidad;
- validación realizada;
- documentación EN/ES e impacto operativo;
- requisitos de cierre cuando el PR cierra un slice del proyecto.

## Formularios de issues

Los formularios públicos se mantienen deliberadamente simples:

- `bug-report.yml` captura versión/commit exactos, comportamiento reproducible, entorno, contexto de regresión/upgrade y confirmación obligatoria de seguridad de datos;
- `feature-request.yml` captura el problema reutilizable, frontera de capacidad, impacto de contrato público, neutralidad de proveedor, migración/lifecycle y consideraciones de autoridad/seguridad/privacidad;
- `config.yml` deriva vulnerabilidades a la política privada de seguridad y mantiene deshabilitados los issues en blanco.

Los formularios recogen contexto suficiente sin obligar a cada usuario a conocer todo el proceso de release.

## Plantilla de release

`.github/RELEASE_TEMPLATE.md` es el checklist reutilizable de release notes para mantenedores.

Incluye:

- identidad inmutable (`X.Y.Z`, `vX.Y.Z`, SHA verificado de `main`);
- clasificación SemVer y release soportada anterior;
- compatibilidad de contratos/configuración;
- clase/procedimiento/verificación/recuperación de migración;
- deprecaciones y retiradas con metadata de lifecycle;
- comandos permanentes de validación;
- estado fresh-clone/standalone/proveedores;
- documentación;
- registro merge → verificar main → tag inmutable → publicación GitHub Release.

Es una plantilla operativa, no una automatización de release. Tags y releases siguen `RELEASES.md`, `MIGRATIONS.md`, `UPGRADES.md` y `DEPRECATIONS.md`.

## Seguridad y privacidad

Las plantillas nunca deben solicitar:

- credenciales/tokens productivos;
- registros privados de clientes;
- Traveller Data protegido;
- payloads completos de proveedor con datos protegidos;
- valores secretos de variables de entorno.

Las vulnerabilidades se reportan mediante `SECURITY.md`, no en issues públicos.

## Validación permanente

La Fase 10.6 añade:

```bash
npm run check:contribution-templates
```

El gate verifica que:

- exista exactamente una plantilla PR canónica;
- contenga las secciones obligatorias de release/migración/lifecycle/seguridad/validación;
- los formularios bug/feature conserven seguridad y contexto de compatibilidad;
- la plantilla de release conserve identidad, migración, deprecación y publicación;
- esta guía bilingüe y la documentación central permanezcan enlazadas;
- el check siga dentro de `npm run verify` y exista workflow dedicado.

Un cambio legítimo puede modificar vocabulario protegido, pero docs, gate e impacto de política deben evolucionar juntos.

## Regla de cierre

La Fase 10.6 solo será oficialmente COMPLETADA después de CI verde, merge a `main` y verificación de `main`. No se inicia branding/trademark antes de cumplir ese gate.
