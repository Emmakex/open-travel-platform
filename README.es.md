# Open Travel Platform

<p align="center"><a href="./README.md">English</a> · <strong>Español</strong></p>

> Base open-source reutilizable para agencias, turoperadores y productos de reserva de viajes.

Open Travel Platform es una plataforma clean-room con **Next.js + TypeScript + MongoDB**, organizada alrededor de fronteras explícitas de dominio, repositories y adapters. Soporta onboarding demo sin infraestructura, capacidades persistentes, distribución OCI reproducible y despliegue self-host/orquestado provider-neutral.

La implementación comercial/de referencia oficial es **Kairoseth Travel**, desplegada en **[travel.kairoseth.com](https://travel.kairoseth.com)**.

![Version](https://img.shields.io/badge/version-1.2.0-0d1b2d)
![Next.js](https://img.shields.io/badge/Next.js-16.3.2-000000)
![React](https://img.shields.io/badge/React-19.2.8-149eca)
![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178c6)
![Node](https://img.shields.io/badge/Node-24_LTS-5fa04e)
![MongoDB](https://img.shields.io/badge/MongoDB-supported-47A248)
![License](https://img.shields.io/badge/license-MIT-45d6b5)

## Modelo del proyecto

Este repositorio es el **core MIT provider-neutral**. Kairoseth Travel es la implementación alojada/comercial de referencia.

- los datos de clientes e integraciones propietarias permanecen fuera del repositorio público;
- adapters privados Kairoseth/cliente pueden depender de contratos públicos OTP, nunca al revés;
- sistemas downstream no reciben autoridad implícita sobre booking, inventario, pricing o pagos;
- la licencia MIT del software no concede por sí sola permiso para presentar un fork/servicio independiente como Kairoseth Travel oficial.

El uso de branding y marcas se documenta en [`TRADEMARKS.es.md`](TRADEMARKS.es.md).

## Posición actual

**Fase 8 — Integraciones externas: COMPLETADA.**  
**Fase 9 — Baseline de hardening productivo: COMPLETADA.**  
**Fase 10 — Productización open-source: COMPLETADA.**  
**Fase 11 — Ecosistema de distribución y despliegue: COMPLETADA.**

La Fase 10 se cerró con la release source inmutable **v1.1.0**. Su cierre histórico permanece documentado en [`docs/PHASE-10-RELEASE-AUDIT.es.md`](docs/PHASE-10-RELEASE-AUDIT.es.md).

La Fase 11 se cierra con la release MINOR backward-compatible **v1.2.0**:

- **11.1 Baseline reproducible OCI/Docker — COMPLETADA**
- **11.2 Publicación en registry y provenance — COMPLETADA**
- **11.3 Recetas de orquestación/despliegue — COMPLETADA**
- **11.4 Verificación de release de distribución — COMPLETADA sujeta al gate permanente de PR/merge/verificación del artefacto publicado**

La auditoría v1.2.0 está en [`docs/RELEASE-AUDIT-1.2.0.es.md`](docs/RELEASE-AUDIT-1.2.0.es.md). Este PR declara completado el baseline de ingeniería de Fase 11; el cierre operativo solo es final después de CI verde, squash merge a `main`, `Release audit` verde sobre `main`, publicación del tag inmutable `v1.2.0` y su GitHub Release, creación de la primera imagen OCI pública y éxito de `Verify published distribution` contra el artefacto real del registry.

El workflow post-publicación adjunta `distribution-verification-1.2.0.json` al GitHub Release con el SHA source auditado y digest OCI verificado exactos. La release histórica v1.1.0 nunca se reconstruye retroactivamente como imagen.

La validación Stripe/Redsys TEST/LIVE con credenciales continúa como validación dependiente del proveedor. No reabre la Fase 9 ni es necesaria para la verificación provider-neutral de distribución.

## Capacidades principales

- catálogo y experiencia Operator EN/ES;
- destinos, viajes, itinerarios, salidas, inventario y alojamiento;
- reservas transaccionales y modificaciones post-reserva;
- identidad persistente cliente/staff, RBAC y auditoría;
- ledger provider-neutral, Stripe/Redsys, depósitos y conciliación;
- Traveller Data cifrado, privacidad/retención y rotación de claves;
- CSP/headers, readiness, concurrencia MongoDB, backup/restore e índices;
- accesibilidad WCAG 2.2 AA-oriented y baselines de rendimiento;
- outbox/integraciones, webhooks firmados, CRM/ERP downstream y fulfilment;
- nueve interfaces públicas de extensión verificadas.

## Inicio rápido

Requiere **Node.js 24 LTS** y la versión npm declarada en `packageManager`.

```bash
git clone https://github.com/Emmakex/open-travel-platform.git
cd open-travel-platform
npm ci
npm run setup:demo
npm run dev
```

El perfil demo no exige MongoDB, SMTP, PSP, CRM, ERP ni credenciales de proveedor.

## Self-host standalone

```bash
npm ci
npm run setup:demo
npm run build
npm run package:standalone
node .next/standalone/server.js
```

Para producción consulta [`docs/DEPLOYMENT.es.md`](docs/DEPLOYMENT.es.md) y [`docs/PRODUCTION-CHECKLIST.md`](docs/PRODUCTION-CHECKLIST.md).

## Despliegue en contenedor

Construye el mismo runtime standalone como imagen OCI/Docker provider-neutral:

```bash
docker build -t open-travel-platform:local .

docker run --rm \
  --env-file .env.demo.example \
  -p 127.0.0.1:3000:3000 \
  open-travel-platform:local
```

La imagen final se ejecuta como usuario no-root `app` (`10001:10001`) y expone un healthcheck Docker sobre `/api/health/live`. El tráfico productivo debe usar `/api/health/ready` e inyectar secretos/configuración únicamente en runtime.

Consulta [`docs/CONTAINERS.es.md`](docs/CONTAINERS.es.md).

## Registry y provenance

Para releases auditadas elegibles para distribución por contenedor, GHCR es el registry público de referencia:

```text
ghcr.io/emmakex/open-travel-platform:vX.Y.Z
ghcr.io/emmakex/open-travel-platform:sha-<sha-source-completo>
```

No se publican aliases móviles `latest`, major o minor. Producción despliega el digest verificado:

```bash
docker pull ghcr.io/emmakex/open-travel-platform@sha256:<digest>
```

Las imágenes publicadas incluyen SBOM, BuildKit `provenance: mode=max`, metadatos OCI source/revision/version/license y GitHub artifact attestation ligada al digest. v1.2.0 es la primera release elegible para distribución OCI pública real. `v1.1.0` permanece solo como source porque su tag inmutable es anterior al baseline Docker.

Consulta [`docs/REGISTRY.es.md`](docs/REGISTRY.es.md).

## Recetas de despliegue

Los ejemplos de orquestación provider-neutral no hacen obligatorio ningún hosting concreto:

```bash
docker compose -f deploy/compose/compose.demo.yml up -d --build --wait
kubectl kustomize deploy/kubernetes/base
```

Las recetas productivas Compose y Kubernetes consumen una identidad inmutable como `ghcr.io/emmakex/open-travel-platform@sha256:<digest>`, preservan UID/GID `10001:10001`, filesystem raíz de solo lectura, secretos/estado externos y diferencian `/api/health/live` de `/api/health/ready`. MongoDB productivo no se incluye deliberadamente.

Consulta [`docs/DEPLOYMENT-RECIPES.es.md`](docs/DEPLOYMENT-RECIPES.es.md).

## Verificación de distribución publicada

Tras una release source auditada y publicación OCI, `Verify published distribution` valida el **artefacto del registry**, no un rebuild local. Para v1.2.0 debe demostrar:

- pull público antes de autenticar en el registry;
- tags SemVer y source-SHA resolviendo al mismo digest;
- labels OCI source/revision/version/license coincidentes con la release auditada;
- provenance BuildKit SLSA y SBOM SPDX presentes;
- GitHub artifact attestation válida para el digest;
- ejecución limpia por digest con UID/GID `10001:10001`;
- éxito de `/api/health/live`, `/api/health/ready` y rutas/assets representativos.

El asset `distribution-verification-1.2.0.json` del GitHub Release es el registro machine-readable exacto de esa verificación.

## Contrato de release, upgrade y branding

```text
package.json  -> X.Y.Z
Git tag       -> vX.Y.Z
CHANGELOG     -> ## [X.Y.Z] - YYYY-MM-DD
```

Un upgrade productivo identifica versiones/SHAs exactos, revisa migraciones/deprecaciones, valida un entorno representativo y declara recuperación antes de cambios persistentes.

Lifecycle público:

```text
ACTIVE → DEPRECATED → REMOVED
```

La retirada ordinaria ocurre solo en/después del límite MAJOR anunciado.

Validación:

```bash
npm ci
npm run check:release
npm run check:release-migrations
npm run check:upgrade-deprecations
npm run check:contribution-templates
npm run check:branding-policy
npm run check:phase-10-release
npm run check:container
npm run check:registry-provenance
npm run check:deployment-recipes
npm run check:release-audit
npm run check:phase-11-distribution
npm run verify
```

Consulta [`docs/RELEASES.es.md`](docs/RELEASES.es.md), [`docs/MIGRATIONS.es.md`](docs/MIGRATIONS.es.md), [`docs/UPGRADES.es.md`](docs/UPGRADES.es.md), [`docs/DEPRECATIONS.es.md`](docs/DEPRECATIONS.es.md), [`docs/CONTRIBUTION-TEMPLATES.es.md`](docs/CONTRIBUTION-TEMPLATES.es.md), [`TRADEMARKS.es.md`](TRADEMARKS.es.md), [`docs/CONTAINERS.es.md`](docs/CONTAINERS.es.md), [`docs/REGISTRY.es.md`](docs/REGISTRY.es.md), [`docs/DEPLOYMENT-RECIPES.es.md`](docs/DEPLOYMENT-RECIPES.es.md), [`docs/PHASE-10-RELEASE-AUDIT.es.md`](docs/PHASE-10-RELEASE-AUDIT.es.md) y [`docs/RELEASE-AUDIT-1.2.0.es.md`](docs/RELEASE-AUDIT-1.2.0.es.md).

## Documentación

### Proyecto y entrega

- [`ROADMAP.es.md`](ROADMAP.es.md)
- [`ROADMAP.md`](ROADMAP.md)
- [`CHANGELOG.md`](CHANGELOG.md)
- [`CONTRIBUTING.md`](CONTRIBUTING.md)
- [`SUPPORT.md`](SUPPORT.md)
- [`TRADEMARKS.es.md`](TRADEMARKS.es.md)
- [`TRADEMARKS.md`](TRADEMARKS.md)
- [`docs/PHASE-10-RELEASE-AUDIT.es.md`](docs/PHASE-10-RELEASE-AUDIT.es.md)
- [`docs/RELEASE-NOTES-1.1.0.es.md`](docs/RELEASE-NOTES-1.1.0.es.md)
- [`docs/RELEASE-AUDIT-1.2.0.es.md`](docs/RELEASE-AUDIT-1.2.0.es.md)
- [`docs/RELEASE-AUDIT-1.2.0.md`](docs/RELEASE-AUDIT-1.2.0.md)
- [`docs/RELEASE-NOTES-1.2.0.es.md`](docs/RELEASE-NOTES-1.2.0.es.md)
- [`docs/RELEASE-NOTES-1.2.0.md`](docs/RELEASE-NOTES-1.2.0.md)
- [`docs/RELEASES.es.md`](docs/RELEASES.es.md)
- [`docs/MIGRATIONS.es.md`](docs/MIGRATIONS.es.md)
- [`docs/UPGRADES.es.md`](docs/UPGRADES.es.md)
- [`docs/DEPRECATIONS.es.md`](docs/DEPRECATIONS.es.md)
- [`docs/CONTRIBUTION-TEMPLATES.es.md`](docs/CONTRIBUTION-TEMPLATES.es.md)
- [`docs/DEPLOYMENT.es.md`](docs/DEPLOYMENT.es.md)
- [`docs/CONTAINERS.es.md`](docs/CONTAINERS.es.md)
- [`docs/CONTAINERS.md`](docs/CONTAINERS.md)
- [`docs/REGISTRY.es.md`](docs/REGISTRY.es.md)
- [`docs/REGISTRY.md`](docs/REGISTRY.md)
- [`docs/DEPLOYMENT-RECIPES.es.md`](docs/DEPLOYMENT-RECIPES.es.md)
- [`docs/DEPLOYMENT-RECIPES.md`](docs/DEPLOYMENT-RECIPES.md)

### Extensiones

- [`docs/EXTENSION-POINT-INVENTORY.es.md`](docs/EXTENSION-POINT-INVENTORY.es.md)
- [`docs/EXTENSION-COMPATIBILITY.es.md`](docs/EXTENSION-COMPATIBILITY.es.md)
- [`docs/REFERENCE-ADAPTERS.es.md`](docs/REFERENCE-ADAPTERS.es.md)
- [`docs/EXTENSION-VALIDATION.es.md`](docs/EXTENSION-VALIDATION.es.md)
- [`docs/EXTENSION-CONTRACTS.es.md`](docs/EXTENSION-CONTRACTS.es.md)
- [`docs/ADAPTER-GUIDE.md`](docs/ADAPTER-GUIDE.md)

## Validación permanente

```bash
npm run check:extension-contracts
npm run check:release-migrations
npm run check:upgrade-deprecations
npm run check:contribution-templates
npm run check:branding-policy
npm run check:phase-10-release
npm run check:container
npm run check:registry-provenance
npm run check:deployment-recipes
npm run check:release-audit
npm run check:phase-11-distribution
npm run verify
```

Workflows dedicados protegen contratos de extensión, release/migraciones, lifecycle de upgrades/deprecaciones, plantillas, branding, identidad histórica de release de Fase 10, distribución en contenedores, registry/provenance, recetas de despliegue, auditoría de release actual y verificación de distribución publicada.

## Regla de cierre de fases

Una fase/slice no está completada hasta terminar implementación/pruebas, sincronizar documentación EN/ES, revisar diff, tener CI obligatorio verde, mergear a `main`, verificar `main` y, cuando la fase exige un artefacto de release, publicarlo y verificarlo independientemente antes de iniciar trabajo posterior del roadmap.

La Fase 10 permanece históricamente cerrada mediante v1.1.0. La Fase 11 se cierra mediante v1.2.0 solo cuando la distribución OCI pública supera el workflow final de verificación.

## Licencia y branding

Software: MIT. Consulta [`LICENSE`](LICENSE).

Los nombres del proyecto/comerciales y la identidad visual se regulan separadamente en [`TRADEMARKS.es.md`](TRADEMARKS.es.md). La política de branding no relicencia silenciosamente el software.