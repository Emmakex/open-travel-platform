# Roadmap

<p align="center"><a href="./ROADMAP.md">English</a> · <strong>Español</strong></p>

Open Travel Platform es el core reutilizable bajo licencia MIT. **Kairoseth Travel** es el despliegue comercial/de referencia oficial en **https://travel.kairoseth.com**.

_Última actualización: 28 de agosto de 2026._

## Posición actual

**Fase 8 — Integraciones externas: COMPLETADA.**  
**Fase 9 — Baseline de hardening productivo: COMPLETADA.**  
**Fase 10 — Productización open-source: EN CURSO.**

Slices completados de Fase 10:

```text
10.1     Bootstrap demo/fresh-clone reproducible -------------- COMPLETADA
10.2     Despliegue standalone provider-neutral --------------- COMPLETADA
10.3     Contratos de extensión/adapters referencia ----------- COMPLETADA
10.4     Convenciones de release y migración ------------------ COMPLETADA
```

La validación Stripe/Redsys TEST/LIVE con credenciales sigue siendo una dependencia externa separada y no reabre la Fase 9.

---

# Bases completadas

## Catálogo, identidad y booking — COMPLETADO

- foundation Next.js / React / TypeScript;
- adapters MongoDB;
- superficies públicas/Operator EN/ES;
- destinos, viajes, itinerarios, salidas e inventario;
- identidad persistente cliente/staff y RBAC;
- booking transaccional con pricing/inventario confiable;
- viajeros/menores/tutores y snapshots históricos.

## Comercio, post-compra y operaciones — COMPLETADO

- ledger provider-neutral y checkout Stripe/Redsys;
- depósitos/cuotas/saldo pendiente;
- Actividades, Transporte y Protección de viaje;
- Traveller Data cifrado y modificaciones;
- alojamiento/habitaciones y suplementos;
- workflows Operator, fulfilment, documentos, exportaciones y reporting.

---

# Fase 8 — Integraciones externas — COMPLETADA

- eventos versionados y outbox MongoDB transaccional;
- webhooks HTTPS firmados, retry/dead-letter y worker durable;
- `BookingRepository` REST;
- fulfilment REST;
- CRM y ERP/contabilidad downstream-only;
- validación contractual HTTP real.

---

# Fase 9 — Hardening productivo — COMPLETADA

- CSP/headers, HSTS, Origin y throttling;
- liveness/readiness y perfiles `demo|live`;
- concurrencia/rollback MongoDB e idempotencia;
- observabilidad, recovery y auditoría privilegiada;
- privacidad/retención;
- gates WCAG 2.2 AA-oriented;
- baselines de lectura, throughput y recursos runtime.

---

# Fase 10 — Productización open-source — EN CURSO

Objetivo: hacer el core MIT fácil de adoptar, desplegar, extender, publicar y contribuir sin dependencias ocultas de Kairoseth.

## 10.1 — Bootstrap demo reproducible — COMPLETADA

- `npm ci` bloqueado;
- bootstrap demo seguro/no destructivo;
- evaluación sin infraestructura externa obligatoria;
- smoke de build/start/HTTP;
- onboarding EN/ES.

## 10.2 — Despliegue standalone provider-neutral — COMPLETADA

- runtime Next.js `output: standalone`;
- `npm run package:standalone`;
- smoke HTTP/static real;
- guía de readiness/TLS/MongoDB/workers/rollback.

## 10.3 — Contratos de extensión y adapters de referencia — COMPLETADA

Documentos autoritativos:

- [`docs/EXTENSION-POINT-INVENTORY.es.md`](docs/EXTENSION-POINT-INVENTORY.es.md)
- [`docs/EXTENSION-COMPATIBILITY.es.md`](docs/EXTENSION-COMPATIBILITY.es.md)
- [`docs/REFERENCE-ADAPTERS.es.md`](docs/REFERENCE-ADAPTERS.es.md)
- [`docs/EXTENSION-VALIDATION.es.md`](docs/EXTENSION-VALIDATION.es.md)

Entregado:

- nueve interfaces públicas provider-neutral verificadas;
- mapa explícito de autoridad;
- política de compatibilidad/versionado/deprecación;
- adapters reales de referencia;
- gate permanente `check:extension-contracts` y workflow bloqueante.

## 10.4 — Convenciones de release y migraciones — COMPLETADA

Documentos autoritativos:

- [`docs/RELEASES.md`](docs/RELEASES.md)
- [`docs/RELEASES.es.md`](docs/RELEASES.es.md)
- [`docs/MIGRATIONS.md`](docs/MIGRATIONS.md)
- [`docs/MIGRATIONS.es.md`](docs/MIGRATIONS.es.md)

Contrato de release:

- releases públicos estables siguen Semantic Versioning;
- `package.json` usa `X.Y.Z` y Git tags inmutables `vX.Y.Z`;
- package, badge README, CHANGELOG y tag deben coincidir;
- releases únicamente desde `main` verificado;
- `npm ci` + `npm run verify` obligatorio;
- tags y entradas históricas son registros inmutables.

Contrato de migración:

- cambios de configuración, datos persistentes, wire, cifrado/claves y destructivos se clasifican explícitamente;
- evolución compatible usa **expand → migrate → contract**;
- migraciones operativas son deterministas, acotadas, retry-safe/idempotentes o resumibles y verificables;
- prohibidas migraciones destructivas ocultas en startup;
- protecciones explícitas para pagos/historial, booking/inventario y Traveller Data protegido;
- toda migración no trivial declara rollback/recuperación.

Automatización permanente:

```bash
npm run check:release
npm run check:release-migrations
npm run verify
```

Entregado:

- `scripts/release-migration-check.mjs`;
- `check:release-migrations` dentro de `verify`;
- `release-check.mjs` exige las políticas EN/ES;
- workflow bloqueante `.github/workflows/release-migrations.yml`;
- CONTRIBUTING exige clasificación explícita de impacto release/migración.

## Trabajo planificado de Fase 10

Que un slice aparezca aquí no significa que ya esté activo. Cada uno tendrá rama propia y gate completo cuando empiece.

Posibles siguientes slices:

- **10.5 — política de ciclo de vida de upgrades y deprecaciones**;
- templates más completos de contribución/release;
- política de trademark/branding entre Open Travel Platform y Kairoseth Travel;
- adapters opcionales según demanda comercial/comunitaria.

## Gate permanente de fases

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

## No-objetivos del core

El core público no debe quedar ligado permanentemente a un PSP, proveedor, CRM/ERP, CMS, vendor de identidad, monitorización, hosting o infraestructura exclusiva de Kairoseth.
