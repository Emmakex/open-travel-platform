# Baseline de seguridad y operabilidad productiva

La Fase 9A añade un baseline reutilizable de endurecimiento productivo alrededor de las capacidades existentes. **No** sustituye pentesting específico del despliegue, monitorización, backup/restore, revisión regulatoria ni E2E de pagos con credenciales reales.

## 1. Headers de seguridad HTTP

`next.config.ts` aplica globalmente:

- `Content-Security-Policy`;
- `Referrer-Policy: strict-origin-when-cross-origin`;
- `X-Content-Type-Options: nosniff`;
- `X-Frame-Options: DENY`;
- `Permissions-Policy` desactivando cámara, micrófono, geolocalización y browsing topics;
- `Cross-Origin-Opener-Policy: same-origin-allow-popups`;
- `Origin-Agent-Cluster: ?1`;
- `X-DNS-Prefetch-Control: off`;
- `X-Permitted-Cross-Domain-Policies: none`.

Los builds productivos añaden además HSTS y `upgrade-insecure-requests`.

La CSP mantiene deliberadamente formularios/frames HTTPS externos porque proveedores de pago como Redsys/Stripe pueden necesitar redirects, formularios o frames alojados. Los estilos/scripts inline siguen permitidos donde el runtime actual de Next.js lo necesita. `unsafe-eval` no está permitido. Una CSP con nonce puede evaluarse más adelante como endurecimiento específico del despliegue.

## 2. Modelo CSRF / mutaciones de navegador

Existen dos fronteras de mutación de navegador.

### Next Server Actions

La aplicación usa Next Server Actions para la mayoría de formularios. Next aplica su propia comprobación Origin/Host para Server Actions. El core no añade un segundo token CSRF propio que duplicaría o podría entrar en conflicto con esa frontera.

### Route Handlers autenticados por cookie

Los Route Handlers explícitos que aceptan mutaciones de navegador validan `Origin` mediante `browserMutationHasTrustedOrigin()` antes de realizar trabajo autenticado:

- subida de media;
- borrado de media;
- POST de exportación de viajeros protegidos.

Orígenes aceptados:

1. el origen propio de la request;
2. `KTRAVEL_PUBLIC_URL`;
3. orígenes exactos listados en `KTRAVEL_ALLOWED_BROWSER_ORIGINS`.

No se admiten wildcards.

Callbacks de proveedores/servidor son fronteras distintas y **no** deben usar Browser Origin como autenticación:

- webhook Stripe: firma Stripe;
- notificación Redsys: firma Redsys;
- integration worker: Bearer server-only.

## 3. Controles de abuso de autenticación

Se mantiene el bloqueo de cuenta existente. 9A añade una segunda capa distribuida de rate limiting en:

- login cliente;
- login staff;
- registro cliente;
- solicitud de reset de contraseña cliente;
- solicitud de reset de contraseña staff.

Colección:

`travel_security_rate_limits`

Propiedades:

- persistencia MongoDB compartida entre instancias;
- contadores fixed-window atómicos;
- limpieza TTL;
- identificadores de bucket SHA-256;
- no se guarda email ni IP en claro en la colección.

Defaults actuales:

| Scope | Límite por sujeto | Límite por cliente | Ventana |
| --- | ---: | ---: | ---: |
| Login cliente | 10 | 30 | 15 min |
| Login staff | 8 | 20 | 15 min |
| Registro cliente | 3 | 10 | 60 min |
| Reset contraseña cliente | 3 | 10 | 60 min |
| Reset contraseña staff | 3 | 10 | 60 min |

El bucket por sujeto siempre está activo. El bucket por IP solo se activa cuando se habilita explícitamente la confianza en headers IP del proxy.

El throttling de recuperación mantiene la misma respuesta genérica de éxito para no crear señales de enumeración de cuentas.

## 4. Headers IP de proxy confiable

Default:

```text
KTRAVEL_TRUST_PROXY_IP_HEADERS=false
```

No debe activarse solo porque exista `X-Forwarded-For`.

Configúralo a `true` únicamente cuando el edge/reverse proxy seleccionado:

1. elimine headers de forwarding enviados por el cliente; y
2. escriba él mismo la dirección real del cliente.

Cuando está activo, se acepta la primera dirección válida de:

- `CF-Connecting-IP`;
- `X-Real-IP`;
- primera entrada de `X-Forwarded-For`.

La dirección se valida sintácticamente y se hashea antes de persistirla.

## 5. Baseline de sesiones

Las sesiones persistentes cliente/staff ya usan:

- tokens opacos aleatorios de 32 bytes;
- hashes SHA-256 del token en MongoDB en lugar del token en claro;
- índices TTL de expiración;
- revocación server-side;
- cookies de sesión `HttpOnly`;
- cookies `Secure` en producción;
- `SameSite=Lax` para clientes;
- `SameSite=Strict` para staff;
- fronteras separadas cliente/staff;
- duración cliente de 30 días;
- duración staff de 8 horas;
- revocación de todas las sesiones tras cambio de contraseña.

Son defaults de aplicación y no sustituyen una política organizativa específica de ciclo de vida de sesión/cuentas.

## 6. Health y readiness

### Liveness

`GET /api/health/live`

Responde si el proceso Node.js puede servir requests. No ejecuta consultas de base de datos ni downstream.

### Readiness

`GET /api/health/ready`

Devuelve HTTP 200 cuando el perfil configurado está listo y HTTP 503 en caso contrario.

Ambos endpoints son dinámicos, `no-store` y `noindex`.

### Perfiles de despliegue

```text
KTRAVEL_DEPLOYMENT_PROFILE=demo
```

`demo` permite que el despliegue de referencia/demo funcione sin fingir que las capacidades demo son productivas.

Para un rollout real:

```text
KTRAVEL_DEPLOYMENT_PROFILE=live
```

En `live`, readiness falla cuando:

- la URL pública canónica no es HTTPS válida;
- catálogo/identidad/staff/reservas/operaciones siguen en modo `demo`;
- un safety switch demo está activo;
- MongoDB es necesario para las capacidades elegidas y falta o no responde;
- supplier/CRM/ERP REST está habilitado sin token del integration worker de 32+ caracteres.

Cuando MongoDB es necesario se ejecuta `ping`. La respuesta pública solo expone categorías de check seguras, nunca credenciales, connection strings ni errores internos de base de datos.

## 7. Reverse proxy y múltiples orígenes

`KTRAVEL_PUBLIC_URL` debe ser la URL HTTPS canónica visible externamente.

Si una mutación legítima de navegador puede originarse desde otro origen exacto:

```text
KTRAVEL_ALLOWED_BROWSER_ORIGINS=https://ops.example.com,https://travel.example.com
```

Evita allowlists amplias. Cada origen añadido pasa a ser confiable para los Route Handlers autenticados por cookie.

## 8. Gate CI

Ejecuta:

```bash
npm run check:production-security
```

Comprueba:

- headers/CSP defensivos;
- ausencia de `unsafe-eval`;
- validación explícita de Browser Origin;
- separación de fronteras webhook/worker;
- rate limiting persistente hasheado + TTL;
- throttling de login/registro/recovery;
- sesiones hasheadas/expirables y atributos seguros de cookies;
- contratos liveness/readiness;
- reglas de perfil `live`;
- variables de entorno documentadas.

El smoke de GitHub Actions además arranca el build productivo, valida headers/health endpoints y confirma que un POST de media con Origin externo recibe 403 antes del procesamiento privilegiado.

## 9. Pendiente dentro de Fase 9

9A es un baseline. El endurecimiento productivo aún incluye:

- E2E Stripe/Redsys TEST/LIVE con credenciales;
- E2E navegador de journeys críticos;
- tests de integración/concurrencia MongoDB;
- logs estructurados y errores centralizados;
- revisión de auditoría de acciones privilegiadas;
- procedimientos de recuperación/rotación de claves;
- simulaciones de backup/restore y disaster recovery;
- workflows GDPR/privacidad/exportación/eliminación/retención;
- revisión legal/regulatoria por mercado;
- pruebas de accesibilidad y rendimiento.
