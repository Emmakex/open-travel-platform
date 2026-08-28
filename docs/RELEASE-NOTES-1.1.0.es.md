# Open Travel Platform v1.1.0

Fecha de release: **28 de agosto de 2026**  
Tipo: **MINOR**  
Licencia del software: **MIT**

Open Travel Platform v1.1.0 completa el baseline de productización open-source de la Fase 10. El release se centra en adopción reproducible, self-host provider-neutral, contratos de extensión, disciplina de releases/upgrades, tooling de contribución y separación explícita entre derechos del software MIT y branding comercial Kairoseth.

## Destacados

- bootstrap demo reproducible sin infraestructura externa;
- empaquetado/validación standalone Next.js provider-neutral;
- nueve interfaces públicas de extensión con autoridad explícita;
- adapters reales de referencia y validación contractual permanente;
- convenciones SemVer, releases y migraciones de datos persistentes;
- rutas de upgrade soportadas y lifecycle `ACTIVE → DEPRECATED → REMOVED`;
- PR template canónico, issue forms seguros y checklist de release reutilizable;
- política de branding/marcas que separa el core Open Travel Platform de Kairoseth Travel oficial;
- CI permanente de seguridad, MongoDB, privacidad, accesibilidad, performance y browser E2E.

## Compatibilidad

v1.1.0 es un release MINOR backward-compatible respecto al baseline documentado 1.0.0.

- no elimina intencionadamente interfaces públicas soportadas;
- los identificadores REST v1 permanecen sin cambios;
- las versiones de eventos/firma mantienen su semántica;
- la autoridad sigue siendo provider-neutral;
- no exige migración destructiva de datos;
- demo/self-host no exige nuevas credenciales de proveedor.

## Upgrade desde el baseline 1.0.0

1. Conserva configuración y backup de estado persistente según `docs/MIGRATIONS.es.md`.
2. Revisa `CHANGELOG.md`, `docs/UPGRADES.es.md` y `docs/DEPRECATIONS.es.md`.
3. Instala desde el tag/commit exacto `v1.1.0`.
4. Ejecuta:

```bash
npm ci
npm run verify
npm run build
npm run package:standalone
```

5. Valida las capacidades habilitadas antes de tráfico productivo.

No se requiere una migración destructiva únicamente por pasar del baseline 1.0.0 documentado a v1.1.0.

## Modelo de extensiones

El release formaliza y protege `TravelRepository`, `IdentityRepository`, `BookingRepository`, `OperationsRepository`, `PaymentRepository`, `SupplierFulfilmentAdapter`, `CrmSyncAdapter`, `ErpAccountingAdapter` y `FailureTransport`.

`PaymentRepository` continúa siendo el ledger financiero local provider-neutral. Stripe/Redsys siguen siendo integraciones PSP/checkout. CRM/ERP permanecen downstream-only y supplier fulfilment subordinado a transiciones locales auditadas.

## Seguridad, privacidad y calidad

CI permanente cubre seguridad pública/productiva, invariantes booking/pagos, concurrencia/idempotencia/recovery MongoDB, cifrado/rotación de Traveller Data, privacidad, auditoría privilegiada, accesibilidad, performance, fresh-clone, standalone y browser E2E persistente.

## Política de release

v1.1.0 será el primer release público bajo la convención de Fase 10 con Git tag inmutable y GitHub Release.

El repositorio registraba previamente 1.0.0, pero no existe tag/GitHub Release histórico; no se fabrica retroactivamente uno.

Consulta `docs/RELEASES.es.md`, `docs/MIGRATIONS.es.md`, `docs/UPGRADES.es.md`, `docs/DEPRECATIONS.es.md` y `docs/CONTRIBUTION-TEMPLATES.es.md`.

## Branding

Open Travel Platform es el core/proyecto público provider-neutral bajo MIT. Kairoseth Travel es la implementación oficial alojada/comercial en `https://travel.kairoseth.com`.

Usar el software MIT no concede por sí solo estado oficial Kairoseth/Kairoseth Travel. Consulta `TRADEMARKS.es.md`.

## Validación externa conocida

La validación Stripe/Redsys TEST/LIVE con credenciales sigue pendiente de cuentas adecuadas. Es un ítem dependiente del proveedor y no bloquea el release del core provider-neutral ni reabre la Fase 9.

English release notes: [`RELEASE-NOTES-1.1.0.md`](RELEASE-NOTES-1.1.0.md)

Auditoría final: [`PHASE-10-RELEASE-AUDIT.es.md`](PHASE-10-RELEASE-AUDIT.es.md)
