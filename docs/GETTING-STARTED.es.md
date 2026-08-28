# Primeros pasos desde un clon limpio

La Fase 10.1 hace que el core open-source pueda ejecutarse para evaluación sin infraestructura específica de Kairoseth ni cuentas de proveedores externos.

## Requisitos

- Node.js 24 LTS
- npm 11 (el repositorio declara la versión de npm esperada)
- Git

MongoDB, SMTP, Stripe, Redsys, CRM, ERP y las integraciones de proveedores **no son necesarios** para el perfil demo local.

## Demo local rápida

```bash
git clone https://github.com/Emmakex/open-travel-platform.git
cd open-travel-platform
npm ci
npm run setup:demo
npm run dev
```

Abre `http://localhost:3000`.

`npm run setup:demo` copia `.env.demo.example` a `.env.local`. Por defecto se niega a sobrescribir un `.env.local` existente. Si quieres reemplazar intencionadamente una configuración local existente, usa:

```bash
npm run setup:demo -- --force
```

## Qué habilita el perfil demo

El perfil demo utiliza el catálogo ficticio incluido, identidades temporales de cliente/personal y las capacidades demo de reservas y operaciones. Desactiva deliberadamente el ledger de pagos persistente y todas las integraciones salientes de proveedor, CRM, ERP y transporte de fallos.

Es un perfil de evaluación, no una configuración productiva. Las identidades demo y las escrituras demo de reservas/operaciones no deben habilitarse en un despliegue live.

## Smoke test del build productivo

Para probar el mismo tipo de build optimizado de Next.js utilizado por los entornos de despliegue:

```bash
npm run typecheck
npm run build
npm start
```

Comprueba al menos:

- `http://localhost:3000/`
- `http://localhost:3000/trips`
- `http://localhost:3000/destinations`
- `http://localhost:3000/operator/sign-in`
- `http://localhost:3000/api/health/live`

El workflow dedicado `Fresh clone demo` de GitHub Actions repite este recorrido desde un checkout limpio y trata cualquier fallo como bloqueante.

## Pasar del demo a capacidades persistentes

Utiliza `.env.example` como inventario completo de configuración cuando habilites capacidades persistentes o productivas. Añade cada capacidad de forma deliberada en lugar de copiar los switches demo a producción:

1. MongoDB para catálogo/identidad/reservas/operaciones persistentes cuando corresponda.
2. SMTP para correo transaccional.
3. credenciales únicamente del proveedor de pagos que realmente actives.
4. credenciales del worker solo cuando actives integraciones salientes.
5. keyrings productivos para secretos cifrados de pagos, Traveller Data e integraciones.
6. `KTRAVEL_DEPLOYMENT_PROFILE=live` solo cuando `/api/health/ready` esté sano con el conjunto de capacidades live previsto.

Nunca hagas commit de `.env.local`, credenciales de proveedores, claves de cifrado ni tokens.

## Frontera del core

El repositorio público sigue siendo provider-neutral. `travel.kairoseth.com` es el despliegue comercial/de referencia de Kairoseth, no una dependencia necesaria para un clon limpio de Open Travel Platform.
