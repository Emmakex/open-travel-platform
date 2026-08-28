# Roadmap

<p align="center"><a href="./ROADMAP.md">English</a> · <strong>Español</strong></p>

Open Travel Platform es el core reutilizable bajo licencia MIT. **Kairoseth Travel** es el despliegue comercial/de referencia oficial en **https://travel.kairoseth.com**.

_Última actualización: 28 de agosto de 2026._

## Posición actual

**Fase 8 — Integraciones externas: COMPLETADA.**  
**Fase 9 — Baseline de hardening productivo: COMPLETADA.**  
**Fase 10 — Productización open-source — COMPLETADA.**

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
```

Auditoría final: [`docs/PHASE-10-RELEASE-AUDIT.es.md`](docs/PHASE-10-RELEASE-AUDIT.es.md)  
Release notes: [`docs/RELEASE-NOTES-1.1.0.es.md`](docs/RELEASE-NOTES-1.1.0.es.md)

La validación Stripe/Redsys TEST/LIVE con credenciales sigue siendo un ítem dependiente del proveedor y no reabre Fase 9 ni bloquea el release provider-neutral v1.1.0.

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
- workflow de publicación crea tag inmutable `v1.1.0` y GitHub Release únicamente tras audit exitoso en main;
- tags existentes nunca se mueven ni recrean;
- se documenta honestamente el estado histórico 1.0.0 sin fabricar tag retroactivo.

Documentos: [`docs/PHASE-10-RELEASE-AUDIT.es.md`](docs/PHASE-10-RELEASE-AUDIT.es.md), [`docs/RELEASE-NOTES-1.1.0.es.md`](docs/RELEASE-NOTES-1.1.0.es.md).

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
→ tag/release inmutable cuando corresponda
→ trabajo posterior del roadmap
```

## Evolución post-Fase-10

Adapters opcionales según demanda comercial/comunitaria y capacidades específicas de Kairoseth continúan como evolución normal. No son bloqueos retroactivos de Fase 10 salvo que se promuevan explícitamente a una nueva fase del core.

Posibles temas futuros: más adapters de proveedor, packaging/distribución del ecosistema y nuevas capacidades de producto, cada uno con fase/scope explícitos antes de implementación.

## No-objetivos

El core público no debe quedar ligado permanentemente a un PSP, proveedor, CRM/ERP, CMS, vendor de identidad, monitorización, hosting o infraestructura exclusiva de Kairoseth.
