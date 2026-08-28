# Despliegue en contenedores

<p align="center"><a href="./CONTAINERS.md">English</a> · <strong>Español</strong></p>

Estado: **Fase 11.1 — ACTIVA hasta mergear y verificar en `main`**

## Objetivo

Open Travel Platform puede empaquetarse como imagen OCI/Docker provider-neutral reutilizando exactamente el runtime standalone de Next.js ya validado por el workflow self-host. La vía de contenedor no introduce un segundo runtime de aplicación ni una dependencia de despliegue ligada a un proveedor.

La Fase 11.1 cubre despliegue local/en hosts de contenedores y validación CI. **La publicación en un registry queda fuera de este slice** y requerirá un bloque posterior de Fase 11.

## Construir la imagen

Desde un checkout limpio:

```bash
docker build -t open-travel-platform:local .
```

La imagen multi-stage:

1. instala el grafo exacto con `npm ci`;
2. ejecuta `npm run build`;
3. ejecuta `npm run package:standalone`;
4. copia únicamente `.next/standalone` al stage de runtime.

La imagen final usa Node.js 24 sobre Debian slim y no necesita el árbol de código fuente, caché npm ni toolchain de build en runtime.

## Runtime demo sin infraestructura

El perfil demo sigue funcionando sin MongoDB, SMTP, PSP, CRM, ERP ni credenciales de proveedor:

```bash
docker run --rm \
  --name open-travel-platform \
  --env-file .env.demo.example \
  -p 127.0.0.1:3000:3000 \
  open-travel-platform:local
```

Luego abre `http://127.0.0.1:3000`.

`.env.demo.example` se pasa en **runtime**. No es una configuración de producción y nunca debe sustituirse por secretos dentro del Dockerfile o en capas de imagen.

## Configuración en runtime

La configuración productiva se entrega al arrancar el contenedor, por ejemplo mediante `--env-file`, mecanismos de secrets/config del orquestador o variables de entorno de la plataforma.

No se deben incrustar credenciales en la imagen mediante `ARG`, `ENV`, copia de archivos `.env` o código generado. Esto incluye credenciales MongoDB, passwords SMTP, secretos PSP, claves de Traveller Data, claves de integración y tokens de adapters.

La imagen solo fija defaults seguros para:

```text
NODE_ENV=production
HOSTNAME=0.0.0.0
PORT=3000
NEXT_TELEMETRY_DISABLED=1
```

Toda configuración privilegiada de capacidades permanece server-side e inyectada en runtime.

## Runtime no-root

La imagen final crea y ejecuta el usuario dedicado `app` con UID/GID fijo `10001:10001`.

No se debe volver a root para resolver montajes escribibles. Si un operador necesita almacenamiento persistente escribible, debe provisionarlo con ownership explícito y el mínimo alcance necesario.

## Health checks

El healthcheck Docker integrado consulta:

```text
GET /api/health/live
```

Liveness indica si el proceso está vivo.

Para enrutar tráfico productivo debe utilizarse el endpoint de readiness más fuerte:

```text
GET /api/health/ready
```

Readiness puede reflejar dependencias productivas necesarias y debe ser la señal usada por proxy inverso u orquestador antes de enviar tráfico.

## Validación

Invariantes estáticas/de código:

```bash
npm run check:container
```

El workflow dedicado de GitHub Actions además construye una imagen real, la inicia con `.env.demo.example`, espera la aplicación, verifica usuario no-root y health, y prueba rutas HTTP representativas y assets estáticos.

El gate completo del proyecto sigue siendo:

```bash
npm run verify
```

## Notas para producción

- termina TLS y proxy inverso delante del contenedor según `DEPLOYMENT.es.md`;
- inyecta secretos productivos en runtime mediante la plataforma, nunca mediante capas de imagen;
- utiliza referencias/digests de imagen inmutables cuando exista una fase de publicación en registry;
- mantén MongoDB y otros servicios con estado fuera del contenedor de aplicación salvo que una arquitectura específica gestione expresamente ese estado;
- conserva las fronteras provider-neutral de repositories/adapters;
- valida `/api/health/ready` antes de tráfico productivo;
- registra versión/tag exactos de Open Travel Platform y digest de imagen en los registros de despliegue.

## Frontera Kairoseth

Este Dockerfile pertenece al core público MIT de Open Travel Platform. No contiene adapters privados Kairoseth/cliente ni concede branding oficial Kairoseth Travel a imágenes/servicios operados de forma independiente. Consulta `TRADEMARKS.es.md`.

El despliegue oficial Kairoseth Travel puede consumir este contrato público de contenedor manteniendo integraciones propietarias y configuración de despliegue fuera del core MIT.
