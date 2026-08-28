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
10.7     Política de trademark/branding e identidad ----------- COMPLETADA
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

Entregado: Semantic Versioning, tags `vX.Y.Z` inmutables, releases desde `main` verificado, clasificación de migraciones, **expand → migrate → contract**, recuperación y gate `check:release-migrations`.

## 10.5 — Política de lifecycle de upgrades y deprecaciones — COMPLETADA

Documentos:

- [`docs/UPGRADES.es.md`](docs/UPGRADES.es.md)
- [`docs/UPGRADES.md`](docs/UPGRADES.md)
- [`docs/DEPRECATIONS.es.md`](docs/DEPRECATIONS.es.md)
- [`docs/DEPRECATIONS.md`](docs/DEPRECATIONS.md)

Entregado: rutas soportadas de upgrade, lifecycle `ACTIVE → DEPRECATED → REMOVED`, retirada ordinaria solo en MAJOR, excepciones de seguridad y gate `check:upgrade-deprecations`.

## 10.6 — Plantillas de contribución y release — COMPLETADA

Documentos:

- [`docs/CONTRIBUTION-TEMPLATES.es.md`](docs/CONTRIBUTION-TEMPLATES.es.md)
- [`docs/CONTRIBUTION-TEMPLATES.md`](docs/CONTRIBUTION-TEMPLATES.md)

Entregado: una plantilla PR canónica, issue forms enriquecidos, release template reutilizable, `check:contribution-templates`, workflow dedicado y documentación sincronizada con 10.3–10.5.

## 10.7 — Política de trademark/branding e identidad — COMPLETADA

Documentos autoritativos:

- [`TRADEMARKS.es.md`](TRADEMARKS.es.md)
- [`TRADEMARKS.md`](TRADEMARKS.md)

Entregado:

- separación explícita entre derechos MIT del software y reglas de identidad del proyecto/despliegue de referencia;
- Open Travel Platform definido como identidad del core upstream público;
- Kairoseth Travel definido como implementación oficial alojada/comercial de referencia en `travel.kairoseth.com`;
- atribución veraz “Basado en/Powered by Open Travel Platform” permitida cuando la identidad propia del despliegue independiente sea principal;
- despliegues públicos/comerciales independientes deben configurar su propio `NEXT_PUBLIC_SITE_NAME`/identidad de presentación;
- sin claims no verificados de marca registrada, oficial, certificado, aprobado, partner o endorsement;
- actualmente no existe un paquete oficial de logos designado por esta política;
- variables legacy `KTRAVEL_*` clasificadas como identificadores técnicos de compatibilidad y no como derechos de branding;
- futura migración del namespace `KTRAVEL_*` debe seguir lifecycle de deprecación/upgrade/migración y nunca renombrarse silenciosamente;
- templates PR/release incorporan clasificación de impacto de branding/identidad;
- `scripts/branding-policy-check.mjs`, `npm run check:branding-policy` y workflow `.github/workflows/branding-policy.yml`.

## Cierre final de Fase 10 — PLANIFICADO

Ningún cierre final se activa hasta que 10.7 tenga CI verde, se mergee y `main` quede verificado.

El único bloqueo restante de Fase 10 será una auditoría final de documentación/release y corte del siguiente release público. Ese slice debe:

- auditar enlaces, documentación EN/ES, templates y gates permanentes desde `main` limpio;
- confirmar fresh-clone/demo y standalone;
- clasificar finalmente por SemVer todo el trabajo posterior a 1.0;
- convertir `Unreleased` en la release estable elegida (previsiblemente MINOR salvo que la auditoría detecte un breaking change);
- sincronizar versión del package, badge README, CHANGELOG y tag Git inmutable;
- ejecutar CI completo y verificar `main` antes de crear tag/GitHub Release;
- marcar Fase 10 COMPLETADA solo después de verificar el registro de release.

Adapters opcionales por demanda comercial/comunitaria quedan como evolución posterior y no bloquean Fase 10 salvo decisión explícita.

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
