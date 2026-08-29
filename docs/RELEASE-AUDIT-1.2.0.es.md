# Auditoría de release Open Travel Platform v1.2.0

**Cierre de la Fase 11 — Ecosistema de distribución y despliegue**  
**Clasificación:** MINOR / backward-compatible  
**Fecha de auditoría:** 29 de agosto de 2026

## Aprobación

**RELEASE APPROVED FOR v1.2.0** sujeto al gate permanente de entrega: este PR de release debe quedar completamente verde, integrarse mediante squash en `main` y la revisión fusionada de `main` debe superar el workflow reutilizable `Release audit`. Solo entonces pueden publicarse el tag/GitHub Release inmutables y la distribución OCI. La Fase 11 solo queda cerrada operativamente cuando el artefacto publicado supera `Verify published distribution`.

## Por qué 1.2.0

v1.2.0 añade capacidades compatibles de distribución y despliegue al core público v1.1.0:

- empaquetado OCI/Docker reproducible;
- publicación GHCR auditada con identidades SemVer/SHA inmutables;
- metadatos OCI source/revision/version/license;
- provenance BuildKit máximo y SBOM;
- GitHub artifact attestation ligada al digest OCI;
- recetas Docker Compose y Kubernetes neutrales al proveedor;
- upgrade/rollback por digest;
- verificación limpia de la distribución publicada.

No se elimina ni cambia de forma incompatible ninguna interfaz repository/adapter soportada, contrato REST/event/signature ni schema persistente. Por ello es una release **MINOR backward-compatible** conforme a la política SemVer existente.

## Compatibilidad y migración

- Compatibilidad API/dominio pública: backward-compatible.
- Migración obligatoria de datos persistentes: ninguna.
- Migración obligatoria MongoDB/índices: ninguna introducida por la Fase 11.
- Migración obligatoria de configuración: ninguna para consumidores source/standalone existentes.
- Uso de contenedor/registry: opcional y aditivo.
- Uso de Docker Compose/Kubernetes: opcional y aditivo.
- El build standalone provider-neutral existente sigue soportado.
- Los adapters privados Kairoseth/cliente permanecen fuera del core MIT.

## Identidad de release

Identidad autoritativa antes del merge:

```text
package.json   1.2.0
Git tag        v1.2.0 (no debe existir antes de la publicación auditada)
CHANGELOG      [1.2.0] - 2026-08-29
Release notes  docs/RELEASE-NOTES-1.2.0.es.md
```

El tag inmutable debe crearse únicamente sobre el SHA exacto de `main` ya fusionado que haya superado `Release audit`. Los tags nunca se mueven ni recrean.

## Identidad de distribución

La primera distribución OCI pública se espera en:

```text
ghcr.io/emmakex/open-travel-platform:v1.2.0
ghcr.io/emmakex/open-travel-platform:sha-<sha-main-auditado>
```

Ambos nombres deben resolver al mismo digest OCI inmutable.

El SHA y digest exactos no pueden registrarse honestamente en esta auditoría pre-merge porque son resultados del pipeline de release fusionado. Tras la publicación, `Verify published distribution` debe adjuntar este asset a la release:

```text
distribution-verification-1.2.0.json
```

Ese registro machine-readable contiene tag source, SHA source, digest de imagen, referencia por digest y timestamp de verificación exactos.

## Gate de verificación del artefacto publicado

Para v1.2.0 el verificador post-publicación debe demostrar contra el artefacto del registry público, y no contra un rebuild local:

1. el pull público/anónimo de `ghcr.io/emmakex/open-travel-platform:v1.2.0` funciona antes de cualquier login al registry;
2. el tag SemVer y `sha-<sha-main-auditado>` resuelven al mismo digest;
3. los labels OCI identifican repositorio source, SHA exacto, versión `1.2.0` y licencia MIT;
4. existe provenance BuildKit con metadatos SLSA;
5. existe SBOM BuildKit con datos SPDX;
6. la GitHub artifact attestation se verifica para el digest OCI;
7. un pull limpio por digest funciona con el perfil demo sin secretos;
8. el contenedor reporta UID/GID `10001:10001`;
9. `/api/health/live` y `/api/health/ready` responden correctamente;
10. rutas públicas representativas y media estática responden correctamente;
11. `distribution-verification-1.2.0.json` queda adjunto al GitHub Release.

Si cualquiera falla, la Fase 11 permanece abierta. El verificador no debe ocultar fallos de visibilidad pública autenticándose antes del pull público limpio.

## Invariantes supply-chain

- Sin aliases móviles `latest`, major-only, minor-only o `stable`.
- `v1.2.0` debe resolver al SHA exacto de `main` auditado antes de publicar la imagen.
- Actions de publicación fijadas mediante SHA completo.
- Build/push con `provenance: mode=max` y `sbom: true`.
- GitHub artifact attestation ligada al digest publicado.
- Producción despliega por digest.
- Credenciales, Traveller Data protegido y configuración propietaria Kairoseth/cliente no forman parte de la imagen.

## Límite histórico v1.1.0

v1.1.0 permanece como la release source inmutable de cierre de Fase 10. Su tag es anterior al baseline Docker, así que intencionadamente **no existe una imagen OCI pública retroactiva v1.1.0**.

El pipeline v1.2.0 no debe reconstruir, reetiquetar ni fabricar una imagen histórica v1.1.0. Por ello el registro de verificación usa de forma honesta:

```text
rollbackSourceTag: v1.1.0
rollbackImageDigest: null
```

Existe rollback de código fuente, pero no un digest OCI público anterior.

## Garantías de runtime y despliegue

La imagen publicada debe conservar:

- runtime standalone compatible con Node.js 24;
- usuario fijo no-root `app`, UID/GID `10001:10001`;
- configuración privilegiada únicamente en runtime;
- `/api/health/live` para liveness;
- `/api/health/ready` para readiness productiva;
- operación provider-neutral;
- sin MongoDB productivo ni infraestructura customer-specific embebida.

Las recetas provider-neutral permanecen en `deploy/compose/` y `deploy/kubernetes/base/`, protegidas por `check:deployment-recipes`.

## Gates permanentes

v1.2.0 conserva todos los gates previos y añade:

```bash
npm run check:release-audit
npm run check:phase-11-distribution
```

Ambos forman parte de `npm run verify`. El workflow reutilizable `Release audit` ejecuta auditoría de release actual, verificación completa y empaquetado standalone tanto en PR como en `main`.

## Validación externa de proveedores

La validación Stripe/Redsys TEST/LIVE con credenciales permanece pendiente de cuentas adecuadas. Esta validación dependiente del proveedor no cambia la clasificación backward-compatible de la distribución de Fase 11 ni permite omitir validación del proveedor de pagos cuando se utilice en un despliegue real.

## Decisión de cierre

v1.2.0 queda aprobada como release MINOR de Fase 11 cuando se complete la secuencia inmutable:

```text
PR de release verde
→ squash merge a main
→ Release audit verde en main fusionado
→ tag source inmutable v1.2.0 + GitHub Release
→ publicación OCI auditada
→ verificación limpia pública por digest + attestations
→ distribution-verification-1.2.0.json adjunto
→ Fase 11 completa
```

No se inicia ninguna fase posterior del roadmap antes de que esa verificación del artefacto publicado finalice correctamente.
