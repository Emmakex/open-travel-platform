# Guía de despliegue

Open Travel Platform es provider-neutral y no exige un proveedor de hosting concreto. El repositorio genera un runtime Next.js `standalone` para VM, contenedores, PaaS u otros entornos compatibles con Node.js 24 junto con los servicios persistentes elegidos.

`travel.kairoseth.com` es el despliegue comercial/de referencia de Kairoseth y no es una dependencia del core MIT.

Antes de un rollout productivo revisa:

- [`RELEASES.es.md`](RELEASES.es.md) — identidad del release, SemVer, tags inmutables y secuencia de publicación;
- [`MIGRATIONS.es.md`](MIGRATIONS.es.md) — migraciones de configuración/datos/wire/claves, verificación y rollback;
- [`CONTAINERS.es.md`](CONTAINERS.es.md) — build OCI/Docker provider-neutral, runtime no-root, secretos solo en runtime y health checks cuando uses contenedores;
- [`PRODUCTION-CHECKLIST.md`](PRODUCTION-CHECKLIST.md) — revisión final de producción.

## Identidad exacta del release

Producción debe desplegar una release/revisión exacta y revisada, no una rama móvil sin fijar.

En un release público deben coincidir:

```text
package.json  -> X.Y.Z
Git tag       -> vX.Y.Z
CHANGELOG     -> ## [X.Y.Z] - YYYY-MM-DD
```

Construye desde el source/tag exacto y su lockfile versionado. Registra release/tag/commit exactos en las operaciones de despliegue para poder identificar qué estaba ejecutándose durante incidencias y rollbacks.

Los tags publicados son inmutables. Un rollback selecciona una release anterior conocida como buena; nunca mueve ni reutiliza un tag.

## Runtime soportado

El objetivo actual es Node.js 24 LTS y npm 11. Utiliza:

```bash
npm ci
npm run check:release
npm run check:release-migrations
npm run verify
```

`next.config.ts` usa `output: "standalone"`. Construye y prepara el runtime transportable con:

```bash
npm run build
npm run package:standalone
```

El runtime queda en `.next/standalone` y se inicia con configuración protegida ya inyectada:

```bash
HOSTNAME=0.0.0.0 PORT=3000 node .next/standalone/server.js
```

No copies `.env.local` ni secretos productivos dentro del artefacto. Suministra configuración server-only desde el entorno protegido o gestor de secretos.

El workflow bloqueante `Self-host standalone` valida instalación limpia → build → package → servidor standalone → smoke HTTP/assets sin secretos productivos.

## Vía de despliegue en contenedor

La Fase 11.1 empaqueta ese mismo runtime standalone como imagen OCI/Docker provider-neutral. No crea un segundo runtime de aplicación.

```bash
docker build -t open-travel-platform:local .

docker run --rm \
  --env-file .env.demo.example \
  -p 127.0.0.1:3000:3000 \
  open-travel-platform:local
```

La imagen final se ejecuta como usuario no-root `app` (`10001:10001`). La configuración privilegiada permanece inyectada en runtime; no incrustes archivos `.env` productivos, credenciales MongoDB, secretos de pago, claves de cifrado ni tokens de adapters en capas.

El healthcheck de la imagen usa `/api/health/live`; ingress/orquestadores de producción deben usar `/api/health/ready` antes de enrutar tráfico. Ejecuta `npm run check:container` para el contrato estático y utiliza el workflow bloqueante `Container distribution` para build/start/health/smoke HTTP real.

Consulta [`CONTAINERS.es.md`](CONTAINERS.es.md). La publicación en un registry público queda intencionadamente fuera de la Fase 11.1.

## Configuración de build y runtime

`NEXT_PUBLIC_*` es visible en navegador y puede quedar embebido en build. Trátalo como configuración pública y reconstruye cuando cambie.

MongoDB, claves de cifrado, secretos de pago y tokens de workers son server-only. Nunca coloques valores privilegiados en `NEXT_PUBLIC_*`.

Usa `.env.example` como inventario completo y `.env.demo.example` solo para evaluación.

## Revisión de migración antes del despliegue

Antes de desplegar una revisión, clasifica si cambia:

- configuración/variables obligatorias;
- colecciones, documentos o índices MongoDB;
- datos históricos de pagos/finanzas;
- semántica de reservas/inventario;
- contratos públicos REST/eventos/firma;
- Traveller Data cifrado/protegido o estado de claves.

Si no requiere migración, regístralo explícitamente en la revisión del release/despliegue.

Si requiere migración, sigue [`MIGRATIONS.es.md`](MIGRATIONS.es.md). Cuando sea viable, utiliza **expand → migrate → contract**.

**No dependas del startup de la aplicación, evaluación de módulos o requests normales para ejecutar migraciones destructivas persistentes.** Las migraciones operativas deben ser deliberadas, revisables, verificables y recuperables.

## Rollout con migración

Secuencia segura:

1. registrar release/commit actual y objetivo;
2. clasificar compatibilidad y tipo de migración;
3. tomar/verificar backup o punto de restore en cambios destructivos/de alto riesgo;
4. desplegar primero cambios expand-compatible cuando sea posible;
5. ejecutar migración deliberadamente con autorización operativa;
6. verificar postcondiciones mediante counts/invariantes de dominio, no solo exit status;
7. comprobar readiness y journeys críticos cliente/Operator;
8. observar salud de negocio/infraestructura durante la ventana compatible;
9. hacer cleanup/contract destructivo solo tras satisfacer rollback;
10. registrar finalización y release activa.

Los cambios irreversibles deben declarar antes del release si la recuperación es forward-only o mediante restore de backup.

## Perfil de despliegue

Usa:

```text
KTRAVEL_DEPLOYMENT_PROFILE=demo
```

para evaluación y:

```text
KTRAVEL_DEPLOYMENT_PROFILE=live
```

para producción.

`live` hace que `/api/health/ready` falle de forma cerrada si siguen activos modos demo, la URL canónica no es HTTPS, MongoDB requerido no está disponible o adapters habilitados carecen de configuración obligatoria.

## Entorno mínimo de producción

Un despliegue live suele necesitar configuración equivalente a:

```text
KTRAVEL_PUBLIC_URL=https://travel.example.com
KTRAVEL_DEPLOYMENT_PROFILE=live
NEXT_PUBLIC_DATA_MODE=<modo público/persistente>
TRAVEL_DATA_MODE=<mongodb|rest>
IDENTITY_MODE=<mongodb|adapter revisado>
STAFF_AUTH_MODE=<mongodb|adapter revisado>
BOOKING_MODE=<mongodb|adapter revisado>
OPERATIONS_MODE=<mongodb|adapter revisado>
PAYMENT_LEDGER_MODE=<mongodb cuando haya pagos>
DEMO_IDENTITY_ENABLED=false
DEMO_BOOKING_ENABLED=false
DEMO_OPERATIONS_ENABLED=false
```

Añade solo las credenciales exigidas por capacidades activas. Una integración deshabilitada no debe necesitar secretos placeholder.

## Endpoints de salud

```text
GET /api/health/live
GET /api/health/ready
```

- **liveness**: salud del proceso;
- **readiness**: perfil productivo y dependencias seleccionadas.

Usa readiness para controlar tráfico; no sustituyas readiness por liveness.

## Proxy inverso y HTTPS

Coloca el proceso standalone detrás de TLS/proxy inverso o ingress gestionado. El edge debe:

1. terminar HTTPS en el hostname canónico;
2. redirigir HTTP cuando aplique;
3. proxyear al puerto privado;
4. controlar forwarding headers según el modelo de confianza;
5. aplicar límites adecuados de request/body.

`KTRAVEL_PUBLIC_URL` debe coincidir con el origen HTTPS externo. Las mutaciones con cookie validan `Origin`; orígenes adicionales exactos se configuran en `KTRAVEL_ALLOWED_BROWSER_ORIGINS`.

Mantén `KTRAVEL_TRUST_PROXY_IP_HEADERS=false` salvo que el edge confiable elimine headers falsificables y suministre IP autoritativa. Consulta [`PRODUCTION-SECURITY.es.md`](PRODUCTION-SECURITY.es.md).

## MongoDB y estado persistente

Un despliegue seguro incluye:

1. usuario MongoDB/Atlas con mínimos privilegios;
2. Network Access restringido cuando sea posible;
3. `MONGODB_URI` / `MONGODB_DB_NAME` protegidos;
4. seeding/migración deliberados solo para datos previstos;
5. modos persistentes seleccionados;
6. verificación de readiness y flujos críticos;
7. release anterior inmutable y ownership probado de backup/restore.

En backfills usa batches acotados, criterios/cursor estables y restart explícito. No hagas commit de cadenas de conexión.

## Primer administrador persistente

Usa `KTRAVEL_BOOTSTRAP_ADMIN_*` temporalmente. Después del primer acceso correcto:

1. elimina la contraseña bootstrap del entorno;
2. redespliega/reinicia;
3. verifica sign-in y readiness.

## Pagos

Secuencia recomendada para Stripe/Redsys:

1. perfiles TEST y clave de cifrado;
2. checkout → callback firmado → conciliación;
3. callbacks duplicados para idempotencia;
4. devoluciones/conciliación cuando corresponda;
5. comparar importe/divisa/referencias con proveedor;
6. LIVE solo tras cerrar TEST;
7. transacciones LIVE controladas antes de tráfico general.

Las URLs de retorno del navegador nunca sustituyen callbacks firmados. El E2E TEST/LIVE con credenciales es una validación externa específica del despliegue.

Una migración del ledger debe preservar identidad/idempotencia, importe, divisa, referencias e historial payment/refund. Nunca recalcules movimientos históricos desde estado actual mutable de reservas.

## Integraciones salientes y workers

Cuando se habiliten Supplier/CRM/ERP, configura `KTRAVEL_INTEGRATION_WORKER_TOKEN` de alta entropía y programa:

```text
POST /api/internal/integrations/process
Authorization: Bearer <token>
```

Monitoriza retries, dead letters, readiness y latencia. Mantén deshabilitados adapters no usados.

## Claves y datos protegidos

Usa claves independientes para pagos, Traveller Data e integraciones. Mantenlas estables, respáldalas y sigue los procedimientos keyring/re-encryption para rotación.

Nunca incluyas claves en `.next/standalone`, capas de contenedor, source o logs.

Las migraciones de Traveller Data protegido usan acceso mínimo necesario y outputs redactados/basados en counts; nunca escriben valores protegidos en logs.

## Release inmutable

Un release self-host debe ser reproducible desde un tag/SHA exacto. El artefacto contiene el runtime standalone; la configuración runtime permanece separada.

Conserva el artefacto anterior para que el rollback no dependa de reconstruir source histórico con dependencias nuevas.

## Backups y rollback

El plan cubre código y efectos persistentes:

- release/tag/SHA/artefacto anterior exacto;
- punto MongoDB backup/restore y ownership probado;
- ventana compatible de schemas/índices;
- disponibilidad de claves;
- acciones externas de pagos/integraciones no reversibles por rollback de código.

Antes de una migración no trivial declara si rollback es solo aplicación, reverse migration, restore de backup o irreversible/forward-only.

## Verificación productiva

Para la revisión exacta a publicar/desplegar:

```bash
npm ci
npm run check:release
npm run check:release-migrations
npm run check:container
npm run verify
npm run build
npm run package:standalone
```

Cuando despliegues el artefacto de contenedor, realiza también el build/run de imagen descrito en [`CONTAINERS.es.md`](CONTAINERS.es.md).

Después verifica como mínimo:

- `/api/health/live` = 200;
- `/api/health/ready` = 200 cuando estén listas las dependencias;
- catálogo/assets públicos;
- autenticación/cuenta cliente;
- booking/pagos habilitados;
- login Operator y colas críticas;
- worker de integraciones si está activo;
- postcondiciones específicas de migración si el release incluye una.

CI/demo no sustituyen el sign-off específico del despliegue.

## Revisión final

Antes de producción revisa:

- [`RELEASES.es.md`](RELEASES.es.md);
- [`MIGRATIONS.es.md`](MIGRATIONS.es.md);
- [`CONTAINERS.es.md`](CONTAINERS.es.md) si despliegas contenedor;
- [`PRODUCTION-CHECKLIST.md`](PRODUCTION-CHECKLIST.md);
- [`PRODUCTION-SECURITY.es.md`](PRODUCTION-SECURITY.es.md);
- [`EXTERNAL-MONITORING.es.md`](EXTERNAL-MONITORING.es.md);
- `SECURITY.md`;
- documentación de pagos/integraciones y regulación aplicable.
