# Publicación en registry y procedencia

<p align="center"><a href="./REGISTRY.md">English</a> · <strong>Español</strong></p>

Estado: **Política Fase 11.2 COMPLETADA; Fase 11.4 cierra la primera distribución OCI pública auditada con v1.2.0**

## Objetivo

GitHub Container Registry (GHCR) es el registry público de referencia para releases oficiales del core MIT de Open Travel Platform. Es un canal de distribución, no una dependencia runtime: un operador puede autoconstruir o replicar un digest OCI verificado en otro registry.

Namespace público:

```text
ghcr.io/emmakex/open-travel-platform
```

## Cadena auditada de publicación

```text
main mergeado/verificado
  → Release audit
  → Publish audited release
  → tag vX.Y.Z inmutable + GitHub Release
  → Publish audited container
  → Verify published distribution
```

El publisher de source crea un tag/release nuevo únicamente cuando la auditoría versionada aprueba explícitamente la versión actual. El historial inmutable existente nunca se mueve ni recrea.

El publisher del contenedor hace checkout del SHA auditado exacto y publica únicamente cuando el tag SemVer de código resuelve al mismo commit.

## Límite histórico v1.1.0

`v1.1.0` se publicó antes de que el baseline Docker/OCI existiera dentro de su tag source inmutable. Por tanto no se reconstruye ni etiqueta retroactivamente como imagen.

`v1.2.0` es la primera release elegible para el pipeline OCI público auditado completo porque su revisión source inmutable contiene Dockerfile, validación de contenedor, política registry/provenance, recetas de despliegue y workflow de verificación post-publicación.

## Identidades inmutables

Para `vX.Y.Z` desde `<sha>` auditado se publican únicamente:

```text
ghcr.io/emmakex/open-travel-platform:vX.Y.Z
ghcr.io/emmakex/open-travel-platform:sha-<sha-completo-del-codigo>
```

Aliases móviles prohibidos:

```text
latest
1
1.2
stable
```

La identidad productiva es el digest OCI:

```bash
docker pull ghcr.io/emmakex/open-travel-platform@sha256:<digest>
```

Los tags SemVer/SHA sirven para localizar; `@sha256:<digest>` es la identidad runtime inmutable.

## Metadatos OCI

La imagen publicada contiene al menos:

```text
org.opencontainers.image.source
org.opencontainers.image.revision
org.opencontainers.image.version
org.opencontainers.image.licenses=MIT
```

La revisión debe coincidir con el SHA auditado y la versión con el release source inmutable.

## SBOM y provenance

El build de publicación genera:

- BuildKit `provenance: mode=max`;
- `sbom: true`;
- GitHub artifact attestation ligada al digest OCI publicado.

SBOM y provenance proceden del mismo build que realiza el push; no se fabrican reconstruyendo posteriormente.

Las Actions de publicación están fijadas por SHA completo y reciben únicamente permisos necesarios (`contents: read`, `packages: write`, `attestations: write`, `id-token: write`).

## Verificación post-publicación

Fase 11.4 añade `Verify published distribution`, aguas abajo de `Publish audited container`.

Para un release auditado nuevo comprueba:

1. pull público del tag SemVer sin credenciales de registry;
2. tag SemVer y `sha-<sha-completo>` resolviendo al mismo digest OCI;
3. ejecución posterior exactamente por ese digest;
4. labels OCI source/revision/version/license contra la release auditada;
5. presencia de provenance BuildKit;
6. presencia de SBOM SPDX;
7. verificación de GitHub artifact attestation para el sujeto OCI;
8. pull/run por digest con perfil demo sin secretos;
9. UID/GID runtime `10001:10001`;
10. éxito de `/api/health/live`, `/api/health/ready` y rutas/assets representativos.

Tras éxito se adjunta a GitHub Release `distribution-verification-X.Y.Z.json`, con tag, SHA source auditado y digest OCI exacto para referencia/rollback.

## Verificación del operador

Pull por digest:

```bash
docker pull ghcr.io/emmakex/open-travel-platform@sha256:<digest>
```

Verifica la attestation OCI:

```bash
gh attestation verify \
  oci://ghcr.io/emmakex/open-travel-platform@sha256:<digest> \
  --repo Emmakex/open-travel-platform
```

Contrasta:

- release source `vX.Y.Z`;
- commit del tag;
- labels OCI revision/version;
- digest OCI;
- registro de verificación adjunto al release;
- GitHub artifact attestation.

Cualquier discrepancia bloquea el despliegue.

## Secretos y extensiones privadas

La imagen pública contiene únicamente el core MIT. MongoDB, SMTP, PSP, Traveller Data, secretos de adapters/integraciones y configuración cliente siguen siendo estado externo/runtime.

Adapters privados Kairoseth/cliente y configuración propietaria permanecen fuera de la imagen pública. Ejecutar o replicar esta imagen no convierte un despliegue independiente en Kairoseth Travel oficial; consulta `TRADEMARKS.es.md`.

## Validación permanente

```bash
npm run check:registry-provenance
npm run check:release-audit
npm run check:phase-11-distribution
npm run verify
```

`Registry publication and provenance` protege la política estática. `Release audit` protege la release source actual y `Verify published distribution` aporta evidencia real del artefacto público tras publicación.
