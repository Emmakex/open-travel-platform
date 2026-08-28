# Validación permanente de contratos de extensión

<p align="center"><a href="./EXTENSION-VALIDATION.md">English</a> · <strong>Español</strong></p>

Estado: **Fase 10.3.4 — COMPLETADA**  
Gate: `npm run check:extension-contracts`  
Implementación: `scripts/extension-contract-check.mjs`  
CI dedicado: `.github/workflows/extension-contracts.yml`

## Propósito

La Fase 10.3.4 convierte el modelo de extensiones documentado en 10.3.1–10.3.3 en un contrato automatizado permanente. El objetivo es fallar pronto cuando un cambio futuro altere silenciosamente el inventario público, las fronteras de autoridad, las versiones wire, la seguridad de los adapters de referencia o la documentación de contribuidores.

El gate complementa los checks específicos existentes; no sustituye las pruebas reales de integración.

## Qué protege el gate estático

### 1. Inventario público de extensiones

El inventario `repositories/*.ts` debe seguir coincidiendo con las nueve interfaces públicas de primer nivel documentadas:

- `BookingRepository`
- `CrmSyncAdapter`
- `ErpAccountingAdapter`
- `FailureTransport`
- `IdentityRepository`
- `OperationsRepository`
- `PaymentRepository`
- `SupplierFulfilmentAdapter`
- `TravelRepository`

Si se añade o elimina una interfaz, el gate falla hasta actualizar de forma deliberada el inventario, mapa de autoridad y reglas de validación.

### 2. Pureza de interfaces/repositories

Los contratos públicos no pueden depender directamente de:

- implementaciones concretas `adapters/*`;
- implementaciones de aplicación `lib/*`;
- MongoDB;
- variables de entorno de despliegue;
- llamadas de red `fetch()`.

Esto conserva los contratos provider-neutral y evita convertir detalles de implementación en dependencias públicas accidentales.

### 3. Autoridad downstream/workflow

El gate fija las superficies de métodos de las interfaces sensibles a autoridad:

- `CrmSyncAdapter`: únicamente `upsertContact`, `upsertReservation`;
- `ErpAccountingAdapter`: únicamente `upsertMovement`;
- `SupplierFulfilmentAdapter`: únicamente `execute`;
- `FailureTransport`: únicamente `deliver`.

También rechaza formas comunes de autoridad inversa en CRM/ERP e impide que fulfilment gane campos públicos para mutar totales de cliente o costes de proveedor.

Una ampliación legítima exige revisión contractual explícita y actualización del gate; no puede entrar de forma silenciosa.

### 4. Audit-before-apply de proveedor

El coordinador de fulfilment debe conservar este orden:

```text
respuesta externa
    ↓
persistir auditoría de respuesta recibida
    ↓
aplicar mediante saveSupplierFulfilment/transición local
    ↓
registrar applied/no-change/conflict/failed
```

El gate verifica que la auditoría ocurre antes de la aplicación local y que siguen rechazándose transiciones inválidas.

### 5. Identificadores de versión

El gate protege los identificadores v1 definidos en 10.3.2:

- Booking: `X-OTP-Contract-Version: 1`;
- Supplier: `X-OTP-Contract-Version: 1`;
- CRM: `X-OTP-Contract-Version: 1`;
- ERP/contabilidad: `X-OTP-Accounting-Contract-Version: 1`;
- FailureTransport: `X-OTP-Failure-Contract-Version: 1`;
- `FailureTransportEvent.schemaVersion: 1`;
- `IntegrationEventEnvelope.version: 1`;
- firma webhook genérica: `X-OTP-Signature: v1=...`.

Cambiar uno exige trabajo deliberado de versión/migración bajo `EXTENSION-COMPATIBILITY.es.md`, no una edición in-place.

### 6. Seguridad de adapters de referencia

Las referencias Booking, Supplier y CRM deben conservar:

- rechazo de redirects;
- timeout acotado;
- tamaño de respuesta acotado;
- validación de media type JSON;
- ausencia de configuración privilegiada `NEXT_PUBLIC_*`;
- HTTPS obligatorio en producción.

`RestFailureTransport` se valida con protecciones equivalentes de transporte de monitorización.

### 7. Sincronización documental

El gate exige que los documentos centrales permanezcan presentes y documenten `check:extension-contracts`.

Así, la deriva entre README/ROADMAP/CONTRIBUTING y el modelo real se convierte en un fallo de CI.

## Validación runtime

El workflow bloqueante **Extension contract validation** ejecuta:

```bash
npm run check:extension-contracts
npm run test:rest-adapter-contracts
```

La segunda orden usa un servidor HTTP local real y sigue verificando Booking/Supplier/CRM/ERP: versiones, schema/content-type inválido, retries, límites de tamaño, scope e idempotencia estable.

El workflow principal `CI` también conserva la suite real de contratos REST.

## Registro

En `package.json`:

```text
check:extension-contracts -> node scripts/extension-contract-check.mjs
verify                    -> ... && npm run check:extension-contracts && ...
```

Registro CI:

```text
.github/workflows/extension-contracts.yml
```

El mismo gate puede ejecutarse localmente con:

```bash
npm run check:extension-contracts
```

o mediante la validación completa:

```bash
npm run verify
```

## Cómo modificar intencionadamente el modelo

Cuando un cambio legítimo necesite alterar una invariante protegida:

1. modificar deliberadamente la interfaz o contrato wire;
2. clasificar el cambio según `EXTENSION-COMPATIBILITY.es.md`;
3. crear nueva versión/ruta de migración cuando sea breaking;
4. actualizar inventario y mapa de autoridad;
5. actualizar referencias de contribuidores si cambia el patrón recomendado;
6. actualizar `extension-contract-check.mjs` para reflejar la nueva invariante deseada;
7. añadir/ajustar pruebas runtime;
8. actualizar documentación EN/ES, README, ROADMAP y CHANGELOG;
9. exigir CI verde, merge a `main` y verificar `main` antes de avanzar.

El gate es deliberadamente estricto: actualizarlo forma parte de cambiar el contrato público; no es un atajo para silenciar un test.

## Relación con checks existentes

`check:extension-contracts` es el gate arquitectónico global. Permanecen los checks enfocados:

- `check:rest-booking-adapter`;
- `check:supplier-fulfilment-adapter`;
- `check:crm-sync-adapter`;
- `check:erp-accounting-adapter`;
- `check:adapter-contract-validation`;
- `check:failure-transport`;
- `test:rest-adapter-contracts` en CI.

Los checks enfocados prueban cada capacidad; el gate nuevo protege la consistencia del modelo entre capacidades.

## Cierre de Fase 10.3

Todos los slices de Fase 10.3 están completados:

```text
10.3.1  Inventario + mapa de autoridad              COMPLETADA
10.3.2  Compatibilidad/versionado                   COMPLETADA
10.3.3  Adapters de referencia                      COMPLETADA
10.3.4  Validación automatizada permanente          COMPLETADA
10.3     Contratos de extensión/adapters referencia COMPLETADA
```

La validación permanente introducida aquí sigue siendo obligatoria para futuros cambios en extensiones públicas. Cada fase posterior debe cumplir igualmente la regla de cierre antes de iniciar la siguiente.

## Documentación relacionada

- [`EXTENSION-POINT-INVENTORY.es.md`](EXTENSION-POINT-INVENTORY.es.md)
- [`EXTENSION-COMPATIBILITY.es.md`](EXTENSION-COMPATIBILITY.es.md)
- [`REFERENCE-ADAPTERS.es.md`](REFERENCE-ADAPTERS.es.md)
- [`EXTENSION-CONTRACTS.es.md`](EXTENSION-CONTRACTS.es.md)
- [`ADAPTER-GUIDE.md`](ADAPTER-GUIDE.md)
