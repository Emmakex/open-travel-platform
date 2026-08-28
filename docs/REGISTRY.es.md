# Publicación en registry y procedencia

<p align="center"><a href="./REGISTRY.md">English</a> · <strong>Español</strong></p>

Estado: **Fase 11.2 — COMPLETADA cuando su PR de cierre esté en verde, mergeada y verificada en `main`**

## Objetivo

Open Travel Platform utiliza GitHub Container Registry (GHCR) como registry público de referencia para las imágenes oficiales del core MIT. El registry es un canal de distribución, no un runtime nuevo: las imágenes se construyen con el mismo Dockerfile verificado y el mismo bundle standalone de Next.js definido en la Fase 11.1.

El namespace público es:

```text
ghcr.io/Emmakex/open-travel-platform
```

La elección de GHCR no hace que la aplicación dependa de GHCR. Un operador puede construir la imagen OCI por su cuenta o replicar un digest inmutable en otro registry.

## Disparo de publicación

La publicación del contenedor queda aguas abajo del ciclo de release auditado:

```text
Auditoría de release de Fase 10
  → Publish audited release
  → tag SemVer inmutable + GitHub Release
  → Publish audited container
```

`Publish audited container` se dispara desde la finalización correcta de `Publish audited release`. El job hace checkout del SHA exacto auditado de `main` y solo publica cuando el tag SemVer del repositorio resuelve al mismo commit.

Por ello, una ejecución correcta del workflow de release para una versión histórica ya publicada se convierte en un no-op seguro para la imagen.

## Límite histórico de v1.1.0

`v1.1.0` fue creado antes de que el baseline Docker/OCI existiera dentro de su tag de código inmutable. Por ese motivo **no** se reconstruye ni se reetiqueta retroactivamente como imagen de contenedor.

La primera imagen pública en GHCR será una release futura cuyo tag de código ya contenga el Dockerfile, la validación de contenedor y el workflow de registry/provenance. No se reescribe el historial de releases para fabricar una imagen histórica.

## Identidades inmutables de imagen

Para una release `vX.Y.Z` construida desde el commit `<sha>`, el workflow publica únicamente:

```text
ghcr.io/Emmakex/open-travel-platform:vX.Y.Z
ghcr.io/Emmakex/open-travel-platform:sha-<sha-completo-del-codigo>
```

No se publican aliases móviles:

```text
latest
1
1.2
stable
```

Los despliegues de producción deben resolver y registrar el digest OCI y desplegar por digest:

```bash
docker pull ghcr.io/Emmakex/open-travel-platform@sha256:<digest>
```

El tag SemVer sirve para localizar una release; el digest es la identidad inmutable del despliegue.

## Metadatos OCI

Las imágenes publicadas incluyen como mínimo estas anotaciones OCI:

```text
org.opencontainers.image.source
org.opencontainers.image.revision
org.opencontainers.image.version
org.opencontainers.image.licenses=MIT
```

La revisión apunta al SHA exacto del código auditado.

## SBOM y provenance

La imagen de release se construye con attestations de BuildKit activadas:

- `provenance: mode=max`
- `sbom: true`

La provenance y el SBOM se generan en el mismo build que publica la imagen. No se generan reconstruyendo el código posteriormente.

El workflow crea además una GitHub artifact attestation ligada al digest OCI publicado. Esa attestation identifica el repositorio y workflow que produjeron exactamente ese digest.

## Verificar una imagen

Descarga por digest y no por un nombre móvil:

```bash
docker pull ghcr.io/Emmakex/open-travel-platform@sha256:<digest>
```

Verifica la attestation de GitHub para el sujeto OCI:

```bash
gh attestation verify \
  oci://ghcr.io/Emmakex/open-travel-platform@sha256:<digest> \
  --repo Emmakex/open-travel-platform
```

Un operador debe contrastar:

1. la release de Open Travel Platform que pretende desplegar;
2. su tag/commit de código inmutable;
3. el metadato OCI de revisión;
4. el digest OCI publicado;
5. la GitHub artifact attestation.

Cualquier discrepancia debe bloquear el despliegue.

## Permisos y pinning de Actions

El workflow de publicación recibe únicamente los permisos necesarios:

- `contents: read`
- `packages: write`
- `attestations: write`
- `id-token: write`

Las GitHub Actions y acciones de terceros usadas para publicar están fijadas por SHA completo. Cambiar esas revisiones se considera un cambio de supply chain que debe revisarse y pasar el gate permanente de registry/provenance.

## Secretos y extensiones privadas

La imagen pública se construye únicamente desde el core MIT. Las credenciales de producción siguen inyectándose en runtime según `CONTAINERS.es.md`; no se incluyen secretos de MongoDB, SMTP, PSP, Traveller Data, adapters ni integraciones dentro de la imagen.

Los adapters privados de Kairoseth/clientes, configuración privada de despliegue y credenciales propietarias deben permanecer fuera de este paquete público. Publicar una imagen operada de forma independiente no convierte ese despliegue en un servicio oficial Kairoseth Travel; consulta `TRADEMARKS.es.md`.

## Validación

Invariantes estáticas de publicación/provenance:

```bash
npm run check:registry-provenance
```

El workflow permanente `Registry publication and provenance` ejecuta este gate y conserva además las invariantes del contenedor de Fase 11.1 y los gates de release anteriores.

El gate global continúa siendo:

```bash
npm run verify
```

## Límite de fase

La Fase 11.2 establece únicamente publicación en registry e identidad verificable de supply chain. Las recetas de orquestación/despliegue, la política multi-plataforma y otras capacidades posteriores de distribución permanecen como slices separados de la Fase 11.
