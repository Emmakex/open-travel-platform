# Open Travel Platform v1.2.0

**Release:** 29 de agosto de 2026  
**Clasificación:** release MINOR backward-compatible  
**Hito:** Fase 11 — Ecosistema de distribución y despliegue

v1.2.0 convierte el core standalone verificado de Open Travel Platform en un artefacto de distribución reproducible, attestable y provider-neutral, manteniendo los contratos públicos existentes de aplicación/dominio.

## Destacados

- imagen OCI/Docker multi-stage reproducible basada en el runtime standalone Next.js verificado;
- identidad runtime no-root fija `10001:10001` y configuración privilegiada únicamente en runtime;
- publicación GHCR auditada encadenada a una release de código inmutable;
- identidades exactas `v1.2.0` y `sha-<sha-source-auditado>` sin aliases móviles `latest`, major o minor;
- metadatos OCI source/revision/version/license;
- generación BuildKit `provenance: mode=max` y SBOM;
- GitHub artifact attestation ligada al digest OCI publicado;
- recetas Docker Compose demo/producción neutrales al proveedor;
- baseline Kubernetes provider-neutral con Deployment/Service/ConfigMap/Kustomize;
- MongoDB, secretos, TLS e ingress externos;
- liveness mediante `/api/health/live` y readiness de tráfico mediante `/api/health/ready`;
- upgrades y rollback por digest exacto verificado;
- verificación automatizada mediante pull/run público limpio del artefacto publicado.

## Compatibilidad

v1.2.0 es una release **MINOR backward-compatible** respecto a v1.1.0.

No introduce cambios incompatibles intencionados en:

- interfaces públicas repository/adapter;
- identificadores REST/event/signature soportados;
- semántica de autoridad/autenticación/idempotencia;
- schemas MongoDB persistentes requeridos por despliegues existentes.

La Fase 11 no exige migración de datos. Los caminos source y standalone existentes permanecen válidos. Las rutas de distribución contenedor/Compose/Kubernetes son aditivas y opcionales.

## Identidad de distribución

La release source es inmutable:

```text
v1.2.0
```

La imagen OCI pública se publica como:

```text
ghcr.io/emmakex/open-travel-platform:v1.2.0
ghcr.io/emmakex/open-travel-platform:sha-<sha-main-auditado>
```

Producción debe desplegar el digest verificado en lugar de cualquiera de esos tags legibles:

```text
ghcr.io/emmakex/open-travel-platform@sha256:<digest-verificado>
```

Después de publicar y verificar limpiamente, el GitHub Release recibe:

```text
distribution-verification-1.2.0.json
```

Ese asset es el registro machine-readable del SHA source y digest OCI exactos verificados por el workflow final de Fase 11.

## Verificación posterior a la publicación

El pipeline debe demostrar que:

- la imagen GHCR pública puede descargarse antes de autenticar en el registry;
- los tags SemVer y source-SHA resuelven al mismo digest;
- los labels OCI source/revision/version/license corresponden a v1.2.0 y su commit source;
- el provenance BuildKit expone metadatos SLSA;
- el SBOM expone datos SPDX;
- la GitHub artifact attestation verifica contra el digest OCI;
- un pull limpio por digest funciona como UID/GID `10001:10001`;
- liveness/readiness y rutas HTTP/static representativas pasan.

La Fase 11 permanece abierta hasta que esa verificación post-publicación tenga éxito.

## Despliegue

Evaluación local:

```bash
docker compose -f deploy/compose/compose.demo.yml up -d --build --wait
```

El self-host productivo debe consumir el digest inmutable publicado mediante `deploy/compose/compose.production.yml` o mediante un overlay Kubernetes controlado por el operador basado en `deploy/kubernetes/base/`.

MongoDB, servicios duraderos, secretos privilegiados, TLS e ingress siguen siendo dependencias externas gestionadas por el operador.

Consulta:

- `docs/CONTAINERS.es.md`
- `docs/REGISTRY.es.md`
- `docs/DEPLOYMENT-RECIPES.es.md`
- `docs/RELEASE-AUDIT-1.2.0.es.md`

## Upgrade desde v1.1.0

La Fase 11 no introduce migración persistente.

1. completa la revisión normal de aplicación/configuración del despliegue objetivo;
2. verifica la release source v1.2.0 y la evidencia de distribución;
3. registra la identidad desplegada actual;
4. despliega v1.2.0 mediante artefacto source exacto o digest OCI;
5. espera `/api/health/ready` antes de enrutar tráfico;
6. ejecuta smokes críticos de aplicación.

## Rollback

La release source anterior es `v1.1.0`.

v1.1.0 es anterior al baseline Docker, así que intencionadamente **no existe un digest OCI público v1.1.0**. Por ello el primer registro de verificación de distribución indica:

```text
rollbackSourceTag: v1.1.0
rollbackImageDigest: null
```

Para consumidores source/standalone es posible volver a la release source inmutable anterior sujeto a compatibilidad normal de aplicación/datos. Para consumidores OCI, v1.2.0 es la primera imagen pública verificada y no se fabrica una imagen anterior artificial para rollback.

## Integridad histórica

El proyecto no reconstruye ni reetiqueta v1.1.0 retroactivamente. Su historial inmutable permanece intacto.

## Validación externa de proveedores

La validación Stripe/Redsys TEST/LIVE con credenciales continúa pendiente de cuentas adecuadas. Esta dependencia externa no reabre el baseline de ingeniería completado de Fase 9 y está separada de la verificación provider-neutral de distribución v1.2.0.

## Licencia y branding

El software continúa bajo MIT. Kairoseth Travel permanece como implementación oficial alojada/comercial de referencia. La release de distribución no concede a despliegues independientes derecho a presentarse como Kairoseth Travel oficial.
