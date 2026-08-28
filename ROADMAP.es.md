# Roadmap

<p align="center"><a href="./ROADMAP.md">English</a> · <strong>Español</strong></p>

Open Travel Platform es el core reutilizable bajo licencia MIT. **Kairoseth Travel** es el despliegue comercial/de referencia oficial en **https://travel.kairoseth.com**.

_Última actualización: 28 de agosto de 2026._

## Posición actual

**Fase 8 — Integraciones externas: COMPLETADA.**  
**Fase 9 — Baseline de hardening productivo: COMPLETADA.**  
**Fase 10 — Productización open-source: COMPLETADA.**  
**Fase 11 — Ecosistema de distribución y despliegue: EN CURSO.**

Release de cierre de Fase 10: **v1.1.0**.

```text
10.1     Bootstrap demo/fresh-clone reproducible -------------- COMPLETADA
10.2     Despliegue standalone provider-neutral --------------- COMPLETADA
10.3     Contratos de extensión/adapters referencia ----------- COMPLETADA
10.4     Convenciones de release y migración ------------------ COMPLETADA
10.5     Lifecycle de upgrades y deprecaciones ---------------- COMPLETADA
10.6     Plantillas de contribución y release ----------------- COMPLETADA
10.7     Política de branding y marcas ------------------------ COMPLETADA
10.8     Auditoría final/release + v1.1.0 --------------------- COMPLETADA

11.1     Baseline reproducible OCI/Docker --------------------- COMPLETADA
11.2     Publicación registry + procedencia ------------------- COMPLETADA
11.3     Recetas de despliegue / orquestadores ---------------- PLANIFICADA
11.4     Verificación de release de distribución -------------- PLANIFICADA
```

Auditoría final de Fase 10: [`docs/PHASE-10-RELEASE-AUDIT.es.md`](docs/PHASE-10-RELEASE-AUDIT.es.md)  
Despliegue en contenedores: [`docs/CONTAINERS.es.md`](docs/CONTAINERS.es.md)  
Registry/provenance: [`docs/REGISTRY.es.md`](docs/REGISTRY.es.md)

La validación Stripe/Redsys TEST/LIVE con credenciales sigue siendo un ítem dependiente del proveedor y no reabre Fase 9 ni bloquea el trabajo provider-neutral de distribución.

---

# Fundaciones completadas de la plataforma

Catálogo, identidad, booking, commerce, post-purchase, operaciones, documentos/reporting, integraciones externas, hardening de Fase 9 y productización open-source de Fase 10 están completados. El core incluye adapters MongoDB persistentes, fronteras provider-neutral de pagos, Traveller Data cifrado, workflows operativos, integraciones firmadas, gates de privacidad/accesibilidad, recovery, baselines repetibles de rendimiento y lifecycle de releases verificado.

---

# Fase 10 — Productización open-source — COMPLETADA

Objetivo conseguido: el core MIT puede evaluarse, self-hostearse, extenderse, publicarse, actualizarse y recibir contribuciones sin dependencias ocultas de Kairoseth.

## 10.1 — Bootstrap demo reproducible — COMPLETADA

- `npm ci` bloqueado;
- bootstrap demo seguro/no destructivo;
- evaluación sin infraestructura externa obligatoria;
- smoke build/start/HTTP;
- onboarding EN/ES.

## 10.2 — Standalone provider-neutral — COMPLETADA

- runtime Next.js `output: standalone`;
- `npm run package:standalone`;
- smoke HTTP/static real;
- guía readiness/TLS/MongoDB/workers/rollback.

## 10.3 — Contratos de extensión/adapters referencia — COMPLETADA

- nueve interfaces provider-neutral verificadas;
- mapa explícito de autoridad;
- reglas de compatibilidad/versionado;
- adapters reales de referencia;
- gate permanente `check:extension-contracts`.

Documentos: [`docs/EXTENSION-POINT-INVENTORY.es.md`](docs/EXTENSION-POINT-INVENTORY.es.md), [`docs/EXTENSION-COMPATIBILITY.es.md`](docs/EXTENSION-COMPATIBILITY.es.md), [`docs/REFERENCE-ADAPTERS.es.md`](docs/REFERENCE-ADAPTERS.es.md), [`docs/EXTENSION-VALIDATION.es.md`](docs/EXTENSION-VALIDATION.es.md).

## 10.4 — Releases y migraciones — COMPLETADA

- Semantic Versioning y tags inmutables `vX.Y.Z`;
- identidad package/README/CHANGELOG/tag alineada;
- releases desde `main` verificado;
- clases de migración y recovery explícitos;
- **expand → migrate → contract**;
- sin migraciones destructivas ocultas en startup;
- gate `check:release-migrations`.

Documentos: [`docs/RELEASES.es.md`](docs/RELEASES.es.md), [`docs/MIGRATIONS.es.md`](docs/MIGRATIONS.es.md).

## 10.5 — Upgrades y deprecaciones — COMPLETADA

- release estable del major actual como target principal de soporte;
- sin compromiso LTS/backport implícito;
- rutas same-major/adjacent-major documentadas;
- lifecycle `ACTIVE → DEPRECATED → REMOVED`;
- retirada pública ordinaria únicamente en MAJOR;
- excepción explícita de seguridad;
- gate `check:upgrade-deprecations`.

Documentos: [`docs/UPGRADES.es.md`](docs/UPGRADES.es.md), [`docs/DEPRECATIONS.es.md`](docs/DEPRECATIONS.es.md).

## 10.6 — Plantillas de contribución/release — COMPLETADA

- PR template canónico único;
- issue forms seguros y enriquecidos;
- checklist reutilizable de release;
- revisión de arquitectura/release/lifecycle/seguridad/UX;
- gate `check:contribution-templates`.

Documento: [`docs/CONTRIBUTION-TEMPLATES.es.md`](docs/CONTRIBUTION-TEMPLATES.es.md).

## 10.7 — Branding y marcas — COMPLETADA

- derechos MIT separados de derechos de branding;
- Open Travel Platform = core/proyecto público provider-neutral;
- Kairoseth Travel = implementación oficial alojada/comercial;
- despliegue oficial = `https://travel.kairoseth.com`;
- atribución descriptiva veraz sin implicar estado oficial;
- gate `check:branding-policy`.

Documentos: [`TRADEMARKS.es.md`](TRADEMARKS.es.md), [`TRADEMARKS.md`](TRADEMARKS.md).

## 10.8 — Auditoría final y release v1.1.0 — COMPLETADA

- release clasificado MINOR/backward-compatible;
- identidad package/README/CHANGELOG actualizada a 1.1.0;
- auditoría final y release notes bilingües;
- `check:phase-10-release` añadido a `npm run verify`;
- workflow dedicado audita la revisión ya mergeada en `main`;
- workflow de publicación creó el tag inmutable `v1.1.0` y GitHub Release tras audit exitoso en main;
- se documenta honestamente el estado histórico 1.0.0 sin fabricar tag retroactivo.

Documentos: [`docs/PHASE-10-RELEASE-AUDIT.es.md`](docs/PHASE-10-RELEASE-AUDIT.es.md), [`docs/RELEASE-NOTES-1.1.0.es.md`](docs/RELEASE-NOTES-1.1.0.es.md).

---

# Fase 11 — Ecosistema de distribución y despliegue — EN CURSO

Objetivo: hacer que el core standalone verificado pueda distribuirse y operarse como artefacto inmutable provider-neutral sin filtrar secretos, acoplarse a vendors ni incluir implementación privada de Kairoseth.

## 11.1 — Baseline reproducible OCI/Docker — COMPLETADA

Seguimiento: issue **#134**.

Entregado:

- `Dockerfile` multi-stage provider-neutral con Node.js 24 Debian slim;
- el stage de build reutiliza `npm ci`, `npm run build` y `npm run package:standalone`;
- la imagen final contiene el runtime standalone preparado, no todo el source/toolchain de build;
- identidad runtime no-root fija `app` / `10001:10001`;
- defaults de runtime limitados a `NODE_ENV`, `HOSTNAME`, `PORT` y control de telemetría;
- configuración/secretos privilegiados permanecen inyectados en runtime y no se incrustan en capas de imagen;
- healthcheck Docker sobre `/api/health/live`, mientras el routing productivo sigue usando `/api/health/ready`;
- `.dockerignore` reduce build context y excluye entornos/artefactos locales;
- `scripts/container-distribution-check.mjs` + `npm run check:container` forman parte de `npm run verify`;
- workflow bloqueante `Container distribution` construye imagen real, verifica non-root, espera health y ejecuta smoke HTTP/assets;
- guía bilingüe [`docs/CONTAINERS.es.md`](docs/CONTAINERS.es.md) / [`docs/CONTAINERS.md`](docs/CONTAINERS.md).

## 11.2 — Publicación en registry y procedencia — COMPLETADA

Seguimiento: issue **#136**.

Entregado:

- GHCR como registry público de referencia sin convertirlo en dependencia de runtime del core;
- publicación encadenada al workflow de release auditado y no a estado mutable de rama;
- el tag SemVer debe resolver al SHA exacto de `main` auditado antes de publicar cualquier imagen;
- `v1.1.0` histórico queda expresamente excluido de publicación retroactiva porque su tag inmutable es anterior al Dockerfile;
- solo se publican tags exactos `vX.Y.Z` y `sha-<sha-completo>`; quedan prohibidos aliases móviles `latest`, major y minor;
- metadatos OCI source/revision/version/license enlazan imagen y código fuente;
- Docker BuildKit genera `provenance: mode=max` y SBOM en el mismo build de publicación;
- GitHub artifact attestation ligada al digest OCI publicado;
- Actions de publicación fijadas por SHA completo y permisos limitados a package/attestation/OIDC necesarios;
- `scripts/registry-provenance-check.mjs` + `npm run check:registry-provenance` forman parte de `npm run verify`;
- workflow `Registry publication and provenance` protege la política en PR y `main`;
- guía bilingüe [`docs/REGISTRY.es.md`](docs/REGISTRY.es.md) / [`docs/REGISTRY.md`](docs/REGISTRY.md) documenta pulls por digest y `gh attestation verify`.

11.2 no añade recetas de orquestación ni publica imágenes/configuración privadas Kairoseth/cliente.

## 11.3 — Recetas de despliegue / ejemplos de orquestador — PLANIFICADA

Ejemplos provider-neutral candidatos:

- Docker Compose para evaluación local y self-host controlado;
- primitivas Kubernetes/plataforma de contenedores;
- proxy inverso/TLS/readiness;
- inyección de secrets/config y servicios persistentes externos;
- upgrade/rollback mediante digests inmutables.

Ninguna plataforma específica será obligatoria para el core.

## 11.4 — Verificación de release de distribución — PLANIFICADA

Gate potencial de cierre de Fase 11:

- verificar digest del artefacto publicado ↔ tag/commit source;
- clean pull/run del artefacto público;
- validar release notes y documentación upgrade/rollback;
- conservar invariantes non-root, health y secretos de runtime en artefactos publicados;
- cerrar Fase 11 únicamente con el mismo gate documental/PR/CI/merge/verificación de main.

## Gate permanente

```text
implementación
→ tests/validación
→ documentación EN/ES + README/ROADMAP/CHANGELOG
→ revisión de diff
→ PR
→ CI obligatorio verde
→ merge a main
→ verificar main
→ tag/release/artefacto inmutable cuando corresponda
→ trabajo posterior del roadmap
```

## No-objetivos

El core público no debe quedar ligado permanentemente a un PSP, proveedor, CRM/ERP, CMS, vendor de identidad, monitorización, hosting, registry de contenedores o infraestructura exclusiva de Kairoseth.
