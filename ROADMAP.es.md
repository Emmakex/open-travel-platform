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
10.7     Política de branding y marcas ------------------------ COMPLETADA
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

Entregado:

- última release estable del major actual como target principal de soporte/upgrade;
- sin LTS/backports garantizados salvo anuncio explícito;
- rutas soportadas dentro del mismo major y desde el major inmediatamente anterior;
- lifecycle `ACTIVE → DEPRECATED → REMOVED`;
- retirada ordinaria pública únicamente en MAJOR;
- excepción acelerada explícita por seguridad;
- `check:upgrade-deprecations` y workflow dedicado.

## 10.6 — Plantillas de contribución y release — COMPLETADA

Documentos:

- [`docs/CONTRIBUTION-TEMPLATES.es.md`](docs/CONTRIBUTION-TEMPLATES.es.md)
- [`docs/CONTRIBUTION-TEMPLATES.md`](docs/CONTRIBUTION-TEMPLATES.md)

Entregado:

- una única plantilla PR canónica;
- issue forms bug/feature enriquecidos;
- plantilla reutilizable de release;
- checklists de arquitectura/release/lifecycle/seguridad/UX;
- `check:contribution-templates` dentro de `npm run verify`;
- workflow dedicado de plantillas.

## 10.7 — Política de branding y marcas — COMPLETADA

Documentos autoritativos:

- [`TRADEMARKS.es.md`](TRADEMARKS.es.md)
- [`TRADEMARKS.md`](TRADEMARKS.md)

Contrato:

- MIT continúa licenciando el software y no cambia por la política de branding;
- **Open Travel Platform** identifica el core/proyecto público provider-neutral;
- **Kairoseth Travel** identifica la implementación oficial alojada/comercial de referencia;
- `https://travel.kairoseth.com` es el despliegue oficial de referencia;
- referencias descriptivas veraces de atribución/compatibilidad siguen permitidas;
- forks/servicios independientes usan branding principal diferenciado y no implican estado oficial Kairoseth;
- logos, wordmarks y claims oficiales Kairoseth/Kairoseth Travel requieren autorización separada cuando corresponda;
- la política no afirma que una marca esté registrada en todas las jurisdicciones;
- soporte, licencia de software y branding comercial/oficial quedan explícitamente separados.

Automatización:

```bash
npm run check:branding-policy
npm run verify
```

Entregado:

- `scripts/branding-policy-check.mjs`;
- `check:branding-policy` dentro de `verify`;
- workflow `.github/workflows/branding-policy.yml`;
- revisión de branding integrada en templates PR/release, CONTRIBUTING, SUPPORT y release consistency.

## Trabajo final planificado de Fase 10

Ningún bloque posterior está activo por aparecer aquí. Tendrá su propia rama y gate completo cuando comience.

Siguiente slice de cierre:

- **10.8 — auditoría final de documentación/release de Fase 10 y corte del siguiente release público**.

Adapters opcionales según demanda comercial/comunitaria continúan como evolución y no bloquean el cierre de Fase 10 salvo decisión explícita.

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
