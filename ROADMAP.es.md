# Roadmap

<p align="center"><a href="./ROADMAP.md">English</a> · <strong>Español</strong></p>

Open Travel Platform es el core reutilizable bajo licencia MIT. **Kairoseth Travel** es el despliegue comercial/de referencia oficial en **https://travel.kairoseth.com**.

_Última actualización: 28 de agosto de 2026._

## Posición actual

**Fase 8 — Integraciones externas: COMPLETADA.**  
**Fase 9 — Baseline de hardening productivo: COMPLETADA.**  
**Fase 10 — Productización open-source: EN CURSO.**

Slices completados:

```text
10.1     Bootstrap demo/fresh-clone reproducible -------------- COMPLETADA
10.2     Despliegue standalone provider-neutral --------------- COMPLETADA
10.3     Contratos de extensión/adapters referencia ----------- COMPLETADA
10.4     Convenciones de release y migración ------------------ COMPLETADA
10.5     Lifecycle de upgrades y deprecaciones ---------------- COMPLETADA
10.6     Plantillas de contribución y release ----------------- COMPLETADA
```

La validación Stripe/Redsys TEST/LIVE con credenciales sigue siendo una dependencia externa separada y no reabre la Fase 9.

---

# Fase 10 — Productización open-source — EN CURSO

Objetivo: hacer el core MIT fácil de adoptar, desplegar, extender, publicar, actualizar y contribuir sin dependencias ocultas de Kairoseth.

## 10.1 — Bootstrap demo reproducible — COMPLETADA

Instalación bloqueada, bootstrap demo seguro, evaluación sin infraestructura, smoke build/start/HTTP y onboarding EN/ES.

## 10.2 — Despliegue standalone provider-neutral — COMPLETADA

Runtime standalone, packaging, smoke HTTP/static real y guía de readiness/TLS/MongoDB/workers/rollback.

## 10.3 — Contratos de extensión y adapters de referencia — COMPLETADA

Nueve interfaces provider-neutral verificadas, mapa de autoridad, compatibilidad/versionado, adapters reales de referencia y gate permanente `check:extension-contracts`.

## 10.4 — Convenciones de release y migraciones — COMPLETADA

Semantic Versioning, tags inmutables `vX.Y.Z`, releases desde `main` verificado, clases de migración, **expand → migrate → contract**, recuperación y gate `check:release-migrations`.

## 10.5 — Lifecycle de upgrades y deprecaciones — COMPLETADA

Rutas soportadas de upgrade, lifecycle `ACTIVE → DEPRECATED → REMOVED`, retirada ordinaria solo en MAJOR, excepciones de seguridad documentadas y gate `check:upgrade-deprecations`.

## 10.6 — Plantillas de contribución y release — COMPLETADA

Documentos autoritativos:

- [`docs/CONTRIBUTION-TEMPLATES.es.md`](docs/CONTRIBUTION-TEMPLATES.es.md)
- [`docs/CONTRIBUTION-TEMPLATES.md`](docs/CONTRIBUTION-TEMPLATES.md)

Entregado:

- una única `.github/PULL_REQUEST_TEMPLATE.md` canónica; eliminado el duplicado por mayúsculas/minúsculas;
- checklist PR alineado con fronteras de capacidad, SemVer, migraciones, lifecycle, autoridad/seguridad/privacidad, UX/accesibilidad y cierre de fases;
- issue forms bug/feature con versión exacta, compatibilidad/contrato público y seguridad de datos;
- `.github/RELEASE_TEMPLATE.md` reutilizable con identidad, compatibilidad, upgrade/migración, deprecaciones/retiradas, rollback, validación y publicación;
- `scripts/contribution-template-check.mjs` y `npm run check:contribution-templates`;
- workflow dedicado `.github/workflows/contribution-templates.yml`;
- gate integrado en `npm run verify` y documentación de contribución.

## Trabajo posterior planificado

Ningún bloque posterior está activo por aparecer aquí. Cada uno recibe rama propia y gate completo al iniciarse.

Posibles siguientes slices:

- política de trademark/branding entre Open Travel Platform y Kairoseth Travel;
- auditoría final de documentación/release de Fase 10 y corte del siguiente release público;
- adapters opcionales según demanda comercial/comunitaria, fuera del bloqueo de cierre de Fase 10 salvo decisión explícita.

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
→ siguiente fase
```

## No-objetivos

El core público no debe quedar ligado permanentemente a un PSP, proveedor, CRM/ERP, CMS, vendor de identidad, monitorización, hosting o infraestructura exclusiva de Kairoseth.
