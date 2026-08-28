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
```

La validación Stripe/Redsys TEST/LIVE con credenciales sigue siendo una dependencia externa separada y no reabre la Fase 9.

---

# Fase 10 — Productización open-source — EN CURSO

Objetivo: hacer el core MIT fácil de adoptar, desplegar, extender, publicar, actualizar y contribuir sin dependencias ocultas de Kairoseth.

## 10.1 — Bootstrap demo reproducible — COMPLETADA

- `npm ci` bloqueado;
- bootstrap demo seguro/no destructivo;
- evaluación sin infraestructura externa obligatoria;
- smoke build/start/HTTP;
- onboarding EN/ES.

## 10.2 — Despliegue standalone provider-neutral — COMPLETADA

- runtime Next.js `output: standalone`;
- `npm run package:standalone`;
- smoke HTTP/static real;
- guía de readiness/TLS/MongoDB/workers/rollback.

## 10.3 — Contratos de extensión y adapters de referencia — COMPLETADA

Documentos:

- [`docs/EXTENSION-POINT-INVENTORY.es.md`](docs/EXTENSION-POINT-INVENTORY.es.md)
- [`docs/EXTENSION-COMPATIBILITY.es.md`](docs/EXTENSION-COMPATIBILITY.es.md)
- [`docs/REFERENCE-ADAPTERS.es.md`](docs/REFERENCE-ADAPTERS.es.md)
- [`docs/EXTENSION-VALIDATION.es.md`](docs/EXTENSION-VALIDATION.es.md)

Entregado: nueve interfaces provider-neutral verificadas, mapa de autoridad, versionado/compatibilidad, referencias reales y gate `check:extension-contracts`.

## 10.4 — Convenciones de release y migraciones — COMPLETADA

Documentos:

- [`docs/RELEASES.es.md`](docs/RELEASES.es.md)
- [`docs/RELEASES.md`](docs/RELEASES.md)
- [`docs/MIGRATIONS.es.md`](docs/MIGRATIONS.es.md)
- [`docs/MIGRATIONS.md`](docs/MIGRATIONS.md)

Entregado:

- Semantic Versioning estable y tags inmutables `vX.Y.Z`;
- identidad package/README/CHANGELOG/tag alineada;
- releases solo desde `main` verificado;
- clasificación de migraciones de configuración, datos, wire, claves y cambios destructivos;
- patrón **expand → migrate → contract**;
- sin migraciones destructivas ocultas en startup;
- `check:release-migrations` y workflow bloqueante.

## 10.5 — Política de lifecycle de upgrades y deprecaciones — COMPLETADA

Documentos:

- [`docs/UPGRADES.es.md`](docs/UPGRADES.es.md)
- [`docs/UPGRADES.md`](docs/UPGRADES.md)
- [`docs/DEPRECATIONS.es.md`](docs/DEPRECATIONS.es.md)
- [`docs/DEPRECATIONS.md`](docs/DEPRECATIONS.md)

Contrato de soporte/upgrade:

- la última release estable del major actual es el target soportado principal;
- no hay LTS/backports garantizados salvo anuncio explícito;
- upgrades del mismo major están soportados aplicando migraciones documentadas;
- un major upgrade parte de la última release estable del major inmediatamente anterior cuando la ruta está documentada;
- saltos de major solo si se documentan explícitamente;
- operadores registran versiones/SHAs origen/destino y recuperación exactos.

Lifecycle:

```text
ACTIVE → DEPRECATED → REMOVED
```

- retirada ordinaria de superficies públicas únicamente en una release **MAJOR**;
- avisos indican reemplazo, primera release deprecated y earliest ordinary removal;
- PATCH/MINOR no eliminan ni reinterpretan silenciosamente contratos/configuración soportados;
- configuración, interfaces de extensión, wire contracts y datos persistentes siguen el mismo lifecycle;
- seguridad puede acelerar retirada solo mediante excepción documentada;
- warnings nunca filtran secretos ni datos protegidos.

Automatización:

```bash
npm run check:upgrade-deprecations
npm run verify
```

Entregado:

- `scripts/upgrade-deprecation-check.mjs`;
- `check:upgrade-deprecations` dentro de `verify`;
- workflow `.github/workflows/upgrade-deprecations.yml`;
- integración con releases, migraciones, compatibilidad, SUPPORT y CONTRIBUTING.

## Trabajo posterior planificado

Ningún bloque posterior está activo por aparecer aquí. Cada uno recibe su rama y gate completo al iniciarse.

Posibles slices:

- templates más completos de contribución/release;
- política de trademark/branding entre Open Travel Platform y Kairoseth Travel;
- adapters opcionales según demanda comercial/comunitaria.

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
