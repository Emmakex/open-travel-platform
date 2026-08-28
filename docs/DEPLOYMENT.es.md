# Guía de despliegue

Open Travel Platform es provider-neutral y no exige un proveedor de hosting concreto. El repositorio genera un runtime Next.js `standalone` que puede desplegarse en una VM, plataforma de contenedores, PaaS u otro entorno compatible con Node.js 24 junto con los servicios persistentes elegidos por cada despliegue.

`travel.kairoseth.com` es el despliegue comercial/de referencia de Kairoseth. No es una dependencia del core MIT y su infraestructura privada no es necesaria para autoalojar Open Travel Platform.

## Runtime soportado

El objetivo actual es Node.js 24 LTS y npm 11. El repositorio versiona `package-lock.json`; utiliza la instalación reproducible:

```bash
npm ci
npm run verify
```

`next.config.ts` utiliza `output: "standalone"`. Por tanto, el entrypoint desplegable **no** es `next start`. Construye y prepara el runtime transportable con:

```bash
npm run build
npm run package:standalone
```

`npm run package:standalone` conserva el servidor standalone trazado por Next.js y añade los assets que Next.js no copia automáticamente a esa carpeta:

- `.next/static` → `.next/standalone/.next/static`
- `public` → `.next/standalone/public`

La raíz del runtime resultante es `.next/standalone`. Arráncalo con las variables del entorno de despliegue ya inyectadas:

```bash
HOSTNAME=0.0.0.0 PORT=3000 node .next/standalone/server.js
```

No copies `.env.local` ni secretos productivos dentro de una imagen/artefacto. Suministra la configuración server-only mediante el entorno protegido o el gestor de secretos del hosting.

El workflow bloqueante `Self-host standalone` demuestra instalación limpia → build → empaquetado → servidor standalone → smoke HTTP/assets sin MongoDB ni credenciales de proveedores externos. Esto valida el contrato público de empaquetado, no la capacidad productiva del hosting.

## Configuración de build y de runtime

Los valores `NEXT_PUBLIC_*` son visibles en navegador y pueden quedar embebidos durante el build. Trátalos como configuración pública. Si cambian branding, orígenes públicos de API u otros `NEXT_PUBLIC_*`, reconstruye el artefacto.

MongoDB, claves de cifrado, secretos de pago y tokens de workers son server-only y deben inyectarse de forma segura en runtime. Nunca coloques valores privilegiados dentro de `NEXT_PUBLIC_*`.

Usa `.env.example` como inventario completo de capacidades y `.env.demo.example` únicamente para evaluación local/sin infraestructura.

## Perfil de despliegue

El contrato de readiness utiliza:

```text
KTRAVEL_DEPLOYMENT_PROFILE=demo
```

para evaluación/referencia, y:

```text
KTRAVEL_DEPLOYMENT_PROFILE=live
```

para un despliegue productivo real.

`live` no habilita capacidades automáticamente. Hace más estricto `/api/health/ready` para evitar que un despliegue aparezca como listo mientras queden activos modos demo del core, la URL canónica no sea HTTPS, MongoDB requerido no esté disponible o integraciones habilitadas carezcan de configuración server-side obligatoria.

No uses `live` como etiqueta estética. Actívalo solo después de configurar las capacidades persistentes y secretos productivos previstos.

## Entorno mínimo de producción

La configuración exacta depende de las capacidades habilitadas, pero un despliegue live normalmente necesita:

```text
KTRAVEL_PUBLIC_URL=https://travel.example.com
KTRAVEL_DEPLOYMENT_PROFILE=live
NEXT_PUBLIC_DATA_MODE=<modo público/persistente>
TRAVEL_DATA_MODE=<mongodb|rest según corresponda>
IDENTITY_MODE=<mongodb|adaptador revisado>
STAFF_AUTH_MODE=<mongodb|adaptador revisado>
BOOKING_MODE=<mongodb|adaptador revisado>
OPERATIONS_MODE=<mongodb|adaptador revisado>
PAYMENT_LEDGER_MODE=<mongodb cuando haya pagos>
DEMO_IDENTITY_ENABLED=false
DEMO_BOOKING_ENABLED=false
DEMO_OPERATIONS_ENABLED=false
```

Añade únicamente las credenciales exigidas por capacidades activas. Ejemplos: `MONGODB_URI`, SMTP, perfiles de proveedores de pago, `PAYMENT_SECRETS_KEY`, `TRAVELLER_DATA_KEY`, `INTEGRATION_SECRETS_KEY` y `KTRAVEL_INTEGRATION_WORKER_TOKEN`.

Una integración deshabilitada no debe necesitar credenciales ficticias para que la aplicación arranque.

## Endpoints de salud

Existen dos endpoints no cacheables:

```text
GET /api/health/live
GET /api/health/ready
```

`/api/health/live` comprueba el proceso y evita deliberadamente dependencias. `/api/health/ready` evalúa el perfil seleccionado y la infraestructura requerida.

Semántica recomendada para orquestación:

- **liveness**: reiniciar/alertar cuando el proceso esté realmente insano;
- **readiness**: sacar la instancia del tráfico cuando las dependencias configuradas o requisitos de producción no estén listos.

No uses liveness como sustituto de readiness.

## Proxy inverso y HTTPS

En producción coloca el proceso Node standalone detrás del terminador TLS/proxy inverso o ingress gestionado elegido. El edge debe:

1. terminar HTTPS con el hostname canónico;
2. redirigir HTTP cuando corresponda;
3. reenviar peticiones al puerto privado de la aplicación;
4. conservar o sobrescribir de forma deliberada los forwarding headers según el modelo de confianza;
5. aplicar límites de infraestructura de petición/body adecuados al despliegue.

`KTRAVEL_PUBLIC_URL` debe coincidir con el origen HTTPS visible externamente.

Las mutaciones autenticadas mediante cookie validan `Origin`. Los orígenes de navegador adicionales deben listarse de forma exacta en `KTRAVEL_ALLOWED_BROWSER_ORIGINS`; no se admiten wildcards.

Mantén `KTRAVEL_TRUST_PROXY_IP_HEADERS=false` salvo que el edge confiable elimine headers falsificados y proporcione la IP real de forma autoritativa. Consulta `docs/PRODUCTION-SECURITY.es.md`.

## MongoDB y estado persistente

Producción debe utilizar modos persistentes en lugar de escrituras demo. Un rollout seguro con MongoDB es:

1. provisionar MongoDB/Atlas y un usuario de aplicación con mínimos privilegios;
2. restringir Network Access al camino real de despliegue cuando sea posible;
3. inyectar `MONGODB_URI` y `MONGODB_DB_NAME` mediante configuración protegida;
4. sembrar/migrar únicamente los datos previstos;
5. activar los modos MongoDB de las capacidades seleccionadas;
6. verificar `/api/health/ready` y journeys de cliente/Operator;
7. conservar una release inmutable conocida como buena y un plan probado de restore/rollback de datos.

No hagas commit de cadenas de conexión.

## Primer administrador persistente

El primer administrador de staff en MongoDB puede crearse mediante variables temporales `KTRAVEL_BOOTSTRAP_ADMIN_*`. Una vez verificado el acceso:

1. elimina `KTRAVEL_BOOTSTRAP_ADMIN_PASSWORD` del entorno;
2. redespliega/reinicia sin ese secreto;
3. vuelve a comprobar inicio de sesión y readiness.

No mantengas la contraseña bootstrap como credencial administrativa permanente.

## Pagos

Stripe y Redsys están detrás de la frontera provider-neutral de pagos, pero sus credenciales dependen del despliegue. Secuencia recomendada:

1. configurar perfiles TEST y la clave de cifrado necesaria;
2. ejecutar checkout → callback firmado del servidor → conciliación del ledger;
3. repetir callbacks duplicados para comprobar idempotencia;
4. probar devoluciones/conciliación cuando corresponda;
5. comparar importe, moneda y referencias con el panel del proveedor;
6. pasar a LIVE únicamente después de cerrar TEST;
7. repetir transacciones LIVE controladas antes de abrir tráfico general.

Las URLs de retorno del navegador nunca sustituyen la verificación del callback firmado del proveedor. El E2E TEST/LIVE con credenciales de Stripe/Redsys sigue siendo una validación específica del despliegue porque el repositorio público no contiene cuentas ni secretos de proveedores.

## Integraciones salientes y workers

Cuando se habiliten adaptadores REST de proveedor, CRM o ERP/contabilidad, configura un `KTRAVEL_INTEGRATION_WORKER_TOKEN` de alta entropía y programa:

```text
POST /api/internal/integrations/process
Authorization: Bearer <token>
```

Monitoriza reintentos, dead letters, readiness y latencia downstream. Mantén deshabilitados los adaptadores que no se usan en lugar de asignar credenciales placeholder.

## Claves de cifrado y secretos

La plataforma separa material criptográfico por clase de datos, incluyendo secretos de proveedores de pago, Traveller Data protegido y secretos de firma de integraciones. Genera claves productivas independientes, mantenlas estables, guárdalas en un gestor de secretos protegido y documenta backup/recuperación antes de depender de ciphertext.

Nunca hornees claves dentro de `.next/standalone`, capas de contenedor, repositorio o logs. La rotación debe seguir el procedimiento documentado de keyring/re-encryption.

## Release inmutable

Un despliegue self-host debe ser reproducible desde un SHA Git exacto. Un artefacto simple puede contener únicamente el runtime standalone preparado y metadatos de release:

```text
release/
  server.js
  .next/static/...
  public/...
  node_modules/...   # subconjunto trazado por Next.js standalone
```

La plataforma de despliegue debe inyectar la configuración de runtime por separado. Conserva la release inmutable anterior para que un rollback de aplicación no requiera reconstruir código antiguo con dependencias nuevas.

## Backups y rollback

El rollback productivo debe cubrir código y efectos persistentes:

- SHA/artefacto exacto de release;
- punto de backup/restore de MongoDB y ownership probado del restore;
- evolución de schemas/índices compatible hacia atrás cuando sea posible;
- disponibilidad de claves de cifrado;
- efectos de pagos/integraciones que no se revierten al hacer rollback del código.

Ejecuta un ejercicio documentado de recuperación antes del lanzamiento y repítelo periódicamente.

## Verificación productiva

Para la revisión exacta que se quiere desplegar:

```bash
npm ci
npm run verify
npm run build
npm run package:standalone
```

Después arranca `server.js` con configuración similar a staging/live y verifica como mínimo:

- `/api/health/live` = 200;
- `/api/health/ready` = 200 cuando las dependencias previstas estén listas;
- páginas públicas de catálogo y assets estáticos;
- autenticación/cuenta de cliente;
- reservas y pagos habilitados;
- login de Operator y colas operativas críticas;
- worker de integraciones cuando esté habilitado.

Las credenciales de CI y los smoke tests demo no sustituyen este cierre específico del despliegue.

## Revisión final de producción

Antes del lanzamiento revisa:

- `docs/PRODUCTION-CHECKLIST.md`;
- `docs/PRODUCTION-SECURITY.es.md`;
- `docs/EXTERNAL-MONITORING.es.md`;
- `SECURITY.md`;
- documentación de pagos e integraciones;
- requisitos aplicables de privacidad, viajes, pagos y consumidores del mercado objetivo.
