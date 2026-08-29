# Recetas de despliegue neutrales al proveedor

> Baseline de despliegue/orquestación de la Fase 11.3. Esta fase solo queda oficialmente completada cuando su PR está verde, se integra en `main` y la revisión fusionada de `main` queda verificada.

Open Travel Platform mantiene los ejemplos de despliegue deliberadamente pequeños y neutrales al proveedor. Reutilizan el runtime OCI definido en [`CONTAINERS.es.md`](CONTAINERS.es.md) y el contrato inmutable de registro/procedencia de [`REGISTRY.es.md`](REGISTRY.es.md); no crean un segundo modelo de empaquetado de la aplicación.

## Nota importante sobre releases

El tag inmutable de código `v1.1.0` es anterior al Dockerfile, por lo que **intencionadamente no existe una imagen de contenedor retroactiva v1.1.0**. Las recetas productivas de este documento son plantillas para una futura imagen auditada publicada por el workflow de la Fase 11.2. La Fase 11.4 verificará de extremo a extremo el primer artefacto de distribución publicado.

La identidad de imagen de producción debe tener esta forma:

```text
ghcr.io/emmakex/open-travel-platform@sha256:<digest-verificado>
```

Nunca despliegues `latest`, un alias móvil major/minor ni un digest no verificado.

## Superficies soportadas

- `deploy/compose/compose.demo.yml` — evaluación local y smoke controlado usando el Dockerfile del repositorio y el perfil demo sin secretos.
- `deploy/compose/compose.production.yml` — receta de self-host controlado que consume un digest OCI inmutable ya publicado.
- `deploy/kubernetes/base/` — baseline Kubernetes neutral con Deployment, Service `ClusterIP` y ConfigMap seguro sin secretos.

Estas recetas **no** incluyen MongoDB, certificados TLS, ingress controllers, gestores de secretos ni adaptadores privados de Kairoseth/clientes.

## Demo con Docker Compose

La receta demo construye el mismo Dockerfile del repositorio validado en la Fase 11.1 y usa `.env.demo.example`.

```bash
docker compose -f deploy/compose/compose.demo.yml up -d --build --wait
curl --fail http://127.0.0.1:3000/api/health/live
curl --fail http://127.0.0.1:3000/api/health/ready
docker compose -f deploy/compose/compose.demo.yml exec -T app id -u
docker compose -f deploy/compose/compose.demo.yml down --volumes
```

El UID esperado es `10001`. El servicio se publica solo en `127.0.0.1:3000`, usa filesystem raíz de solo lectura, `/tmp` efímero y limitado, elimina capacidades Linux y activa `no-new-privileges`.

Este camino sirve para evaluación/smoke; no convierte el estado demo en una base de datos de producción.

## Receta Docker Compose de producción

Prepara un fichero de entorno de runtime fuera del repositorio. Parte de `.env.example`, selecciona los modos reales de persistencia/autenticación/integraciones que necesites e inyecta credenciales únicamente en runtime.

Define explícitamente la imagen inmutable:

```bash
export OTP_IMAGE='ghcr.io/emmakex/open-travel-platform@sha256:<digest-verificado>'
export OTP_ENV_FILE='/ruta/absoluta/open-travel-platform.production.env'
export OTP_BIND_ADDRESS='127.0.0.1'
export OTP_PORT='3000'

docker compose -f deploy/compose/compose.production.yml config
docker compose -f deploy/compose/compose.production.yml pull
docker compose -f deploy/compose/compose.production.yml up -d --wait
```

El fichero Compose productivo no contiene `build:` de forma intencionada. Consume el artefacto auditado en lugar de reconstruir el código en el host de despliegue.

### Estado externo

MongoDB y los demás servicios duraderos siguen siendo dependencias operativas externas. No añadas un contenedor MongoDB productivo a esta receta. Configura réplica/concurrencia, backup/restore, cifrado/privacidad e índices según la documentación productiva existente antes de enviar tráfico real.

## Baseline Kubernetes

`deploy/kubernetes/base/deployment.yaml` contiene deliberadamente un digest compuesto por ceros:

```text
ghcr.io/emmakex/open-travel-platform@sha256:0000000000000000000000000000000000000000000000000000000000000000
```

Copia el baseline a un overlay controlado por el operador y sustituye ese placeholder por el digest **verificado** antes del despliegue. No hagas commit de credenciales productivas en el repositorio público.

El baseline espera:

- ConfigMap `open-travel-platform-runtime` para valores seguros no secretos;
- Secret externo `open-travel-platform-secrets` para configuración privilegiada de runtime;
- MongoDB/dependencias stateful gestionadas externamente;
- TLS/ingress o balanceador gestionados externamente.

Ejemplo para crear el Secret desde un fichero local protegido:

```bash
kubectl create secret generic open-travel-platform-secrets \
  --from-env-file=/secure/path/open-travel-platform.secrets.env \
  --dry-run=client -o yaml | kubectl apply -f -
```

No guardes el YAML generado del Secret en el repositorio público.

Renderiza el baseline neutral localmente:

```bash
kubectl kustomize deploy/kubernetes/base
```

Después de sustituir el digest en tu overlay controlado:

```bash
kubectl apply -k /ruta/a/tu/overlay
kubectl rollout status deployment/open-travel-platform
```

## Contrato de seguridad de runtime

Ambas recetas conservan el baseline de seguridad del contenedor:

- UID/GID no-root `10001:10001`;
- filesystem raíz de solo lectura;
- únicamente `/tmp` efímero y limitado;
- sin elevación de privilegios;
- todas las capacidades Linux eliminadas;
- perfil seccomp Kubernetes `RuntimeDefault`;
- valores privilegiados inyectados en runtime, nunca dentro de la imagen.

## Liveness y readiness

Usa los endpoints para propósitos diferentes:

```text
/api/health/live   liveness del proceso
/api/health/ready  readiness para tráfico de producción
```

Kubernetes configura ambos probes explícitamente. Compose usa liveness como healthcheck del contenedor; cualquier reverse proxy/load balancer que admita tráfico productivo debe comprobar `/api/health/ready` o semántica equivalente de readiness.

Un proceso puede estar vivo mientras alguna dependencia necesaria para producción no está preparada. No sustituyas readiness por una simple comprobación de puerto TCP abierto.

## Reverse proxy y TLS

Compose se enlaza a loopback por defecto para que un reverse proxy controlado por el operador termine TLS en el mismo host. Kubernetes expone únicamente un Service `ClusterIP` por defecto. Puedes elegir tu ingress/controller/load-balancer; ninguno es obligatorio para el core.

En el edge:

- termina TLS con certificados gestionados fuera de la imagen;
- conserva el `Host` original y los metadatos de esquema/proxy necesarios;
- no confíes en cabeceras de IP reenviada salvo que `KTRAVEL_TRUST_PROXY_IP_HEADERS` y la topología de proxies confiables estén configuradas deliberadamente;
- mantén las superficies admin/operator detrás de los mismos límites de autenticación/autorización server-side;
- enruta tráfico real solo cuando `/api/health/ready` esté sano.

## Upgrade por digest

1. completa el gate normal de release de código;
2. verifica el digest OCI publicado y la attestation de GitHub según `REGISTRY.es.md`;
3. registra el digest actualmente desplegado;
4. aplica migraciones de configuración/datos según `MIGRATIONS.md` / `UPGRADES.md` cuando sean necesarias;
5. cambia únicamente la imagen de la aplicación al nuevo digest verificado;
6. espera a readiness/finalización del rollout;
7. ejecuta smokes HTTP/aplicación críticos;
8. conserva el digest anterior para recuperación.

En Compose cambia `OTP_IMAGE` y ejecuta `pull` + `up -d --wait`. En Kubernetes cambia el digest del overlay controlado y espera `kubectl rollout status`.

## Rollback por digest

El rollback es explícito, no basado en alias. Restaura el digest anterior registrado y vuelve a aplicar la receta. Si la release incluyó cambios de datos/configuración no compatibles hacia atrás, sigue el camino de recuperación documentado en lugar de asumir que un rollback solo de aplicación es seguro.

No uses un tag móvil para “volver atrás”, porque su identidad histórica sería ambigua.

## Validación

Invariantes estáticos:

```bash
npm run check:deployment-recipes
```

El workflow bloqueante `Deployment recipe validation` de GitHub Actions además:

- renderiza ambas recetas Compose;
- renderiza el baseline Kubernetes Kustomize;
- ejecuta un build/start real con Docker Compose;
- verifica UID/GID `10001:10001`;
- exige éxito HTTP en `/api/health/live` y `/api/health/ready`.

`check:deployment-recipes` forma parte de `npm run verify`.

## Fuera de alcance

La Fase 11.3 no:

- publica una nueva release de código ni una nueva imagen OCI;
- obliga a usar un cloud, distribución Kubernetes, ingress o secret manager concreto;
- incluye MongoDB/servicios stateful productivos;
- introduce credenciales o adaptadores propietarios de Kairoseth/clientes en el core MIT;
- sustituye los controles de release/provenance de las Fases 10 y 11.2.

El primer artefacto de distribución publicado y su verificación clean pull/run pertenecen a la Fase 11.4.
