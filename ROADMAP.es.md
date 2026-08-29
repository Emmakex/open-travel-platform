# Roadmap

<p align="center"><a href="./ROADMAP.md">English</a> · <strong>Español</strong></p>

Open Travel Platform es el core reutilizable bajo licencia MIT. **Kairoseth Travel** es el despliegue comercial/de referencia oficial en **https://travel.kairoseth.com**.

_Última actualización: 29 de agosto de 2026._

## Estado del roadmap — CONGELADO / SOLO MANTENIMIENTO

Open Travel Platform **v1.2.0** es el baseline open-source estable completado. La Fase 11 ha sido publicada y verificada independientemente, y **no se planifica una Fase 12 ni existe un roadmap activo de nuevas funcionalidades para OTP**.

Este roadmap se conserva como registro histórico de ingeniería del core estable. El trabajo futuro en el repositorio público queda limitado al alcance de mantenimiento definido en [`MAINTENANCE.es.md`](MAINTENANCE.es.md): seguridad, correcciones críticas de fiabilidad/corrección, mantenimiento necesario de compatibilidad/runtime y correcciones documentales.

El desarrollo comercial/de producto activo continúa por separado en **Kairoseth Travel**. Las nuevas funciones de Kairoseth Travel, adapters privados y capacidades específicas de clientes no se devuelven automáticamente a OTP.

## Posición actual

**Fase 8 — Integraciones externas: COMPLETADA.**  
**Fase 9 — Baseline de hardening productivo: COMPLETADA.**  
**Fase 10 — Productización open-source: COMPLETADA.**  
**Fase 11 — Ecosistema de distribución y despliegue — COMPLETADA.**

Release de cierre de Fase 10: **v1.1.0**.  
Release estable de cierre de Fase 11: **v1.2.0**.

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
11.2     Publicación registry + provenance -------------------- COMPLETADA
11.3     Recetas de despliegue / orquestadores ---------------- COMPLETADA
11.4     Verificación de distribución + v1.2.0 ---------------- COMPLETADA
```

El cierre operativo de Fase 11 está completado: PR #141 mergeado a `main`, todos los workflows requeridos de `main` terminaron correctamente, se publicaron `v1.2.0` y su GitHub Release inmutables, se publicó la primera imagen OCI pública auditada y `Verify published distribution` validó correctamente el digest exacto del registry.

Identidad estable de distribución:

```text
Release source: v1.2.0
Source SHA: aae9b2dcd4529cafba37cc44e7cdfec740731508
Digest OCI: sha256:aeda693786e6f7c69fd61348a1098acc5bdf09ddaf859cfe16314ce72d7ba6ac
```

Documentos clave de políticas/cierre:

- Política de mantenimiento: [`MAINTENANCE.es.md`](MAINTENANCE.es.md)
- Política de release: [`docs/RELEASES.es.md`](docs/RELEASES.es.md)
- Política de migraciones: [`docs/MIGRATIONS.es.md`](docs/MIGRATIONS.es.md)
- Política de upgrades: [`docs/UPGRADES.es.md`](docs/UPGRADES.es.md)
- Política de deprecaciones: [`docs/DEPRECATIONS.es.md`](docs/DEPRECATIONS.es.md)
- Plantillas contribución/release: [`docs/CONTRIBUTION-TEMPLATES.es.md`](docs/CONTRIBUTION-TEMPLATES.es.md)
- Política branding/marcas: [`TRADEMARKS.es.md`](TRADEMARKS.es.md)
- Auditoría Fase 10: [`docs/PHASE-10-RELEASE-AUDIT.es.md`](docs/PHASE-10-RELEASE-AUDIT.es.md)
- Auditoría Fase 11 / v1.2.0: [`docs/RELEASE-AUDIT-1.2.0.es.md`](docs/RELEASE-AUDIT-1.2.0.es.md)
- Release notes v1.2.0: [`docs/RELEASE-NOTES-1.2.0.es.md`](docs/RELEASE-NOTES-1.2.0.es.md)
- Runtime contenedor: [`docs/CONTAINERS.es.md`](docs/CONTAINERS.es.md)
- Registry/provenance: [`docs/REGISTRY.es.md`](docs/REGISTRY.es.md)
- Recetas de despliegue: [`docs/DEPLOYMENT-RECIPES.es.md`](docs/DEPLOYMENT-RECIPES.es.md)

La validación Stripe/Redsys TEST/LIVE con credenciales permanece como ítem dependiente del proveedor. No reabre Fase 9 ni bloquea el baseline estable provider-neutral de código/contenedor.

---

# Fundaciones completadas de la plataforma

Catálogo, identidad, booking, commerce, post-purchase, operaciones, documentos/reporting, integraciones externas, hardening de Fase 9 y productización open-source de Fase 10 están completados. El core incluye adapters persistentes MongoDB, fronteras provider-neutral de pagos, Traveller Data cifrado, workflows operativos, integraciones firmadas, gates de privacidad/accesibilidad, recovery, baselines repetibles de rendimiento y lifecycle de releases verificado.

# Fase 10 — Productización open-source — COMPLETADA

Objetivo conseguido: el core MIT puede evaluarse, self-hostearse, extenderse, publicarse, actualizarse y recibir contribuciones sin dependencias ocultas de Kairoseth.

## 10.1 — Bootstrap demo reproducible — COMPLETADA

`npm ci` bloqueado, bootstrap demo seguro sin infraestructura, smoke build/start/HTTP y onboarding EN/ES.

## 10.2 — Standalone provider-neutral — COMPLETADA

Next.js `output: standalone`, `npm run package:standalone`, smoke HTTP/static real y guía readiness/TLS/MongoDB/workers/rollback.

## 10.3 — Contratos de extensión/adapters referencia — COMPLETADA

Nueve interfaces públicas verificadas, mapa de autoridad, versionado/compatibilidad, adapters reales de referencia y gate `check:extension-contracts`.

## 10.4 — Releases y migraciones — COMPLETADA

SemVer estable, tags inmutables `vX.Y.Z`, fuente de release en `main` verificado, clases de migración, expand → migrate → contract y gate `check:release-migrations`. Consulta `RELEASES` y `MIGRATIONS` arriba.

## 10.5 — Upgrades y deprecaciones — COMPLETADA

Rutas source/target soportadas, lifecycle `ACTIVE → DEPRECATED → REMOVED`, retirada ordinaria solo en MAJOR y excepción explícita de seguridad. Consulta `UPGRADES` y `DEPRECATIONS` arriba.

## 10.6 — Plantillas de contribución/release — COMPLETADA

PR template canónico, issue forms seguros, checklist reutilizable, guía `CONTRIBUTION-TEMPLATES` y gate `check:contribution-templates`.

## 10.7 — Branding y marcas — COMPLETADA

Derechos MIT separados de los derechos de branding/estado oficial de Kairoseth/Kairoseth Travel. Consulta `TRADEMARKS.es.md`.

## 10.8 — Auditoría final y release v1.1.0 — COMPLETADA

Fase 10 cerró con tag Git/GitHub Release inmutable `v1.1.0`. El estado histórico 1.0.0 anterior a la política permanece documentado honestamente sin fabricar un tag retroactivo.

---

# Fase 11 — Ecosistema de distribución y despliegue — COMPLETADA

Objetivo conseguido: distribuir y operar el core standalone verificado como artefacto OCI inmutable provider-neutral sin filtrar secretos, acoplar vendors ni incluir implementación privada de Kairoseth. Tanto la release source v1.2.0 como la distribución OCI pública exacta han completado la secuencia requerida de auditoría y verificación post-publicación.

## 11.1 — Baseline reproducible OCI/Docker — COMPLETADA

Seguimiento: issue **#134**.

Entregado:

- Dockerfile multi-stage provider-neutral sobre Node.js 24;
- build reutilizando instalación bloqueada, build productivo y packaging standalone;
- runtime no-root fijo `app` / `10001:10001`;
- configuración privilegiada solo en runtime;
- healthcheck `/api/health/live` y readiness `/api/health/ready`;
- `.dockerignore` endurecido;
- `npm run check:container` dentro de `npm run verify`;
- workflow bloqueante con Docker real build/start/non-root/health/HTTP;
- documentación bilingüe.

## 11.2 — Publicación registry y provenance — COMPLETADA

Seguimiento: issue **#136**.

Entregado:

- GHCR como registry público de referencia sin convertirse en dependencia runtime;
- publicación únicamente tras release source auditada;
- igualdad tag SemVer ↔ SHA exacto de `main` auditado;
- solo tags inmutables `vX.Y.Z` y `sha-<sha-completo>`;
- sin aliases móviles `latest`, major, minor ni `stable`;
- metadatos OCI source/revision/version/license;
- BuildKit `provenance: mode=max` y SBOM del mismo build publicado;
- GitHub artifact attestation ligada al digest OCI;
- Actions de publicación fijadas por SHA completo y permisos mínimos;
- gate permanente `check:registry-provenance`;
- regla histórica explícita: `v1.1.0` no recibe imagen retroactiva.

## 11.3 — Recetas de despliegue / orquestadores — COMPLETADA

Seguimiento: issue **#138**, merge mediante PR **#139**.

Entregado:

- Compose demo sin secretos;
- Compose producción consumiendo únicamente digest OCI inmutable;
- baseline Kubernetes Deployment/Service ClusterIP/ConfigMap/Kustomize provider-neutral;
- Secret y MongoDB/estado externos;
- UID/GID `10001:10001`, filesystem raíz read-only, capacidades eliminadas y sin elevación de privilegios;
- seccomp `RuntimeDefault` en Kubernetes;
- separación liveness/readiness;
- TLS/ingress/reverse proxy bajo control del operador;
- upgrade/rollback por digest verificado;
- gate `check:deployment-recipes` y smoke Compose real.

11.3 quedó oficialmente completa en `main` en el merge `2d3e7e02134fe46a19a26595c02d493dde3f83fb`, con 30/30 workflows de `main` verdes y no-op seguro confirmado para el publisher histórico de v1.1.0.

## 11.4 — Verificación de release de distribución — COMPLETADA

Seguimiento: issue **#140**, cerrado como completado tras superar la verificación del artefacto público.

Release estable: **v1.2.0**, clasificada **MINOR / backward-compatible** desde v1.1.0.

Entregado:

- gate reutilizable `check:release-audit` para la release estable actual;
- preservación del gate histórico `check:phase-10-release` para v1.1.0;
- gate permanente `check:phase-11-distribution`;
- workflow dedicado `Release audit` sobre `main` verificado;
- `Publish audited release` generalizado y aguas abajo del audit actual;
- publisher OCI con matching exacto tag/SHA, SBOM, max provenance y attestation GitHub;
- workflow `Verify published distribution` tras publicar;
- pull público de identidades SemVer y digest;
- verificación de que tags SemVer/SHA resuelven al mismo digest OCI;
- verificación de labels OCI source/revision/version/license;
- verificación SBOM y provenance;
- verificación GitHub OCI attestation;
- smoke limpio **por digest** con perfil demo sin secretos;
- comprobación non-root UID/GID, liveness/readiness y rutas/assets representativos;
- evidencia machine-readable `distribution-verification-1.2.0.json` adjunta a GitHub Release;
- auditoría y release notes v1.2.0 bilingües.

La primera distribución OCI pública auditada queda por tanto completada y verificada. `v1.1.0` histórico permanece deliberadamente sin imagen.

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
→ verificar artefacto publicado cuando corresponda
→ trabajo posterior del roadmap
```

Para OTP, la secuencia termina ahora en **modo mantenimiento**, no en una nueva fase de features.

## No-objetivos

El core público no debe quedar ligado permanentemente a un PSP, proveedor, CRM/ERP, CMS, vendor de identidad, monitorización, hosting, registry de contenedores o infraestructura exclusiva de Kairoseth.