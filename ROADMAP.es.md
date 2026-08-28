# Roadmap

<p align="center"><a href="./ROADMAP.md">English</a> · <strong>Español</strong></p>

Open Travel Platform es el core reutilizable bajo licencia MIT. **Kairoseth Travel** es el despliegue comercial/de referencia oficial en **https://travel.kairoseth.com**.

_Última actualización: 28 de agosto de 2026._

## Posición actual

**Fase 8 — Integraciones externas: COMPLETADA.**  
**Fase 9 — Baseline de hardening productivo: COMPLETADA.**  
**Fase 10 — Productización open-source: EN CURSO.**

Estado de cierre de Fase 10.3:

```text
10.3.1   Inventario + mapa de autoridad ----------------------- COMPLETADA
10.3.2   Compatibilidad/versionado ---------------------------- COMPLETADA
10.3.3   Adapters de referencia ------------------------------- COMPLETADA
10.3.4   Validación permanente de contratos ------------------ candidata a COMPLETADA
```

**La Fase 10.3 solo será oficialmente COMPLETADA cuando el PR de cierre 10.3.4 tenga CI verde, esté mergeado a `main` y `main` haya sido verificado.** No empieza ningún bloque posterior de Fase 10 antes de ese gate.

La validación Stripe/Redsys TEST/LIVE con credenciales sigue siendo una dependencia externa separada y no reabre la Fase 9.

---

# Bases completadas

## Catálogo, identidad y booking — COMPLETADO

- foundation Next.js / React / TypeScript;
- adapters MongoDB;
- superficies públicas/Operator EN/ES;
- destinos, viajes, itinerarios, salidas e inventario;
- identidad persistente cliente/staff y RBAC;
- booking transaccional con pricing/inventario confiable;
- viajeros/menores/tutores y snapshots históricos.

## Comercio y post-compra — COMPLETADO

- ledger provider-neutral de pagos/reembolsos;
- integraciones checkout Stripe/Redsys;
- depósitos/cuotas/saldo pendiente;
- Actividades, Transporte y Protección de viaje;
- Traveller Data cifrado;
- modificaciones con inventario transaccional;
- alojamiento/habitaciones y suplementos.

## Operaciones, documentos y reporting — COMPLETADO

- ownership, notas, tags, prioridad y timeline;
- tareas/seguimientos;
- fulfilment proveedor;
- permisos Operator/Admin y auditoría;
- confirmaciones, manifiestos, rooming lists, vouchers y dossier;
- exportaciones según permisos;
- conciliación, saldos e ingresos.

---

# Fase 8 — Integraciones externas — COMPLETADA

- eventos versionados y outbox MongoDB transaccional;
- webhooks HTTPS firmados con retry/dead-letter;
- worker durable y replay/diagnóstico Admin;
- `BookingRepository` REST genérico;
- fulfilment REST;
- CRM y ERP/contabilidad downstream-only;
- idempotencia estable y contratos HTTP reales.

---

# Fase 9 — Hardening productivo — COMPLETADA

- CSP/headers, HSTS, Origin y throttling;
- liveness/readiness y perfiles `demo|live`;
- concurrencia/rollback MongoDB e idempotencia;
- logging, failure transport y monitorización externa;
- auditoría privilegiada y keyrings;
- backup/restore e índices/query plans;
- privacidad/retención;
- gates de accesibilidad orientados a WCAG 2.2 AA;
- baselines de lectura, throughput y recursos runtime.

---

# Fase 10 — Productización open-source — EN CURSO

Objetivo: hacer el core MIT fácil de adoptar, desplegar, extender, publicar y contribuir sin dependencias ocultas de Kairoseth.

## 10.1 — Bootstrap demo reproducible — COMPLETADA

- instalación bloqueada con `npm ci`;
- configuración demo segura;
- `npm run setup:demo` no destructivo;
- evaluación sin infraestructura externa obligatoria;
- smoke de build/start/HTTP;
- onboarding EN/ES.

## 10.2 — Despliegue standalone provider-neutral — COMPLETADA

- runtime Next.js `output: standalone`;
- `npm run package:standalone`;
- smoke HTTP/static real;
- documentación de readiness, TLS/proxy, MongoDB, workers y rollback;
- Kairoseth Travel sigue siendo referencia, no dependencia del core.

## 10.3 — Contratos de extensión y adapters de referencia — candidata a cierre

### 10.3.1 — Inventario y mapa de autoridad — COMPLETADA

Inventario: [`docs/EXTENSION-POINT-INVENTORY.es.md`](docs/EXTENSION-POINT-INVENTORY.es.md).

- verificadas exactamente nueve interfaces públicas de primer nivel;
- mapeadas composición, implementaciones y contratos;
- clasificada autoridad acotada/local/workflow/downstream/monitorización;
- módulos internos permanecen fuera del contrato público;
- Stripe/Redsys clasificados como PSP, no repositories del ledger.

### 10.3.2 — Compatibilidad/versionado — COMPLETADA

Política: [`docs/EXTENSION-COMPATIBILITY.es.md`](docs/EXTENSION-COMPATIBILITY.es.md).

- interfaces públicas in-process siguen SemVer;
- rutas/headers REST v1 permanecen estables;
- catálogo sin versión mantiene semántica legacy-v1;
- schema de evento y firma evolucionan de forma independiente;
- autoridad/auth/idempotencia/estados/allowlists son contractuales;
- prohibido downgrade oculto de mutaciones;
- breaking changes requieren migración/deprecación/versionado explícitos.

### 10.3.3 — Adapters de referencia — COMPLETADA

Guía: [`docs/REFERENCE-ADAPTERS.es.md`](docs/REFERENCE-ADAPTERS.es.md).

- `RestBookingRepository` — referencia de autoridad acotada;
- `RestSupplierFulfilmentAdapter` + coordinador — workflow-subordinate y audit-before-apply;
- `RestCrmSyncAdapter` — referencia downstream-only;
- `RestFailureTransport` — patrón opcional de monitorización;
- referencias vinculadas a pruebas contractuales HTTP reales existentes.

### 10.3.4 — Validación permanente — candidata a COMPLETADA

Guía: [`docs/EXTENSION-VALIDATION.es.md`](docs/EXTENSION-VALIDATION.es.md).

Implementado:

- `scripts/extension-contract-check.mjs`;
- `npm run check:extension-contracts`;
- registro dentro de `npm run verify`;
- workflow bloqueante `.github/workflows/extension-contracts.yml`;
- el workflow ejecuta invariantes estáticas y `npm run test:rest-adapter-contracts`.

El gate protege:

- inventario público exacto;
- pureza provider-neutral de interfaces;
- autoridad downstream-only de CRM/ERP;
- audit-before-apply y límites de Supplier;
- frontera provider-neutral del ledger;
- identificadores v1 de contratos/headers/schemas/firma;
- protecciones de transporte de adapters de referencia;
- sincronización documental EN/ES.

## Gate final de Fase 10.3

Fase 10.3 será COMPLETADA solo cuando:

1. 10.3.1–10.3.4 estén implementadas;
2. `check:extension-contracts` esté en `verify` y CI;
3. documentación EN/ES, README, ROADMAP y CHANGELOG estén sincronizados;
4. CI obligatorio esté verde;
5. PR de cierre esté mergeado a `main`;
6. `main` esté verificado.

## Trabajo posterior planificado de Fase 10

Solo después del cierre y verificación de Fase 10.3:

- convenciones de release y migraciones;
- política de upgrades/deprecaciones;
- templates de contribución/release;
- política de trademark/branding entre Open Travel Platform y Kairoseth Travel;
- adapters opcionales según demanda comercial/comunitaria.

## No-objetivos del core

El core público no debe quedar ligado permanentemente a un PSP, proveedor, CRM/ERP, CMS, vendor de identidad, monitorización, hosting o infraestructura exclusiva de Kairoseth.
