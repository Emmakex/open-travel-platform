# Roadmap

<p align="center"><a href="./ROADMAP.md">English</a> · <strong>Español</strong></p>

Open Travel Platform es el core reutilizable bajo licencia MIT. **Kairoseth Travel** es el despliegue comercial/de referencia oficial en **https://travel.kairoseth.com**.

_Última actualización: 28 de agosto de 2026._

## Posición actual

**Fase 8 — Integraciones externas: COMPLETADA.**  
**Fase 9 — Baseline de hardening productivo: COMPLETADA.**  
**Fase 10 — Productización open-source: EN CURSO.**

Estado de Fase 10 después del merge de cierre de 10.3.3:

```text
10.1     Bootstrap demo desde clon limpio --------------------- COMPLETADA
10.2     Despliegue self-host standalone ---------------------- COMPLETADA
10.3.1   Inventario de extensiones + mapa de autoridad -------- COMPLETADA
10.3.2   Política de compatibilidad/versionado ---------------- COMPLETADA
10.3.3   Adapters de referencia para contribuidores ----------- COMPLETADA
10.3.4   Validación permanente de contratos ------------------- ACTIVA
```

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
- Traveller Data post-compra cifrado;
- modificaciones con manejo transaccional de inventario;
- alojamiento/habitaciones y suplementos de paquete.

## Operaciones, documentos y reporting — COMPLETADO

- ownership, notas, tags, prioridad y timeline;
- tareas/seguimientos;
- fulfilment proveedor;
- permisos Operator/Admin y auditoría;
- confirmaciones, manifiestos, rooming lists, vouchers y dossier;
- exportaciones CSV/XLSX según permisos;
- conciliación, saldos e ingresos.

---

# Fase 8 — Integraciones externas — COMPLETADA

- eventos versionados y outbox MongoDB transaccional;
- webhooks HTTPS firmados con retry/dead-letter;
- worker durable autenticado y replay/diagnóstico Admin;
- `BookingRepository` REST genérico;
- adapter REST de fulfilment;
- CRM y ERP/contabilidad downstream-only;
- idempotencia estable y validación contractual sobre HTTP local real.

---

# Fase 9 — Hardening productivo — COMPLETADA

- CSP/headers, HSTS, Origin y throttling;
- liveness/readiness y perfiles fail-closed `demo|live`;
- concurrencia/rollback MongoDB e idempotencia pagos/webhooks;
- logging estructurado, failure transport y monitorización externa;
- auditoría privilegiada y keyrings de cifrado;
- backup/restore MongoDB e índices/query plans;
- derechos de privacidad y retención;
- gates de accesibilidad orientados a WCAG 2.2 AA;
- baselines de lecturas, throughput y recursos runtime.

---

# Fase 10 — Productización open-source — EN CURSO

Objetivo: hacer que el core MIT sea fácil de adoptar, desplegar, extender, publicar y contribuir sin dependencias ocultas de Kairoseth.

## 10.1 — Bootstrap demo reproducible — COMPLETADA

- instalación bloqueada con `npm ci`;
- `.env.demo.example` seguro;
- `npm run setup:demo` no destructivo;
- sin infraestructura externa obligatoria para evaluación;
- smoke de build/start/HTTP desde checkout limpio;
- onboarding EN/ES.

## 10.2 — Despliegue standalone provider-neutral — COMPLETADA

- runtime Next.js `output: standalone`;
- `npm run package:standalone`;
- smoke HTTP/static real del standalone;
- documentación de secretos runtime, readiness, TLS/proxy, MongoDB, workers y rollback;
- Kairoseth Travel sigue siendo referencia, no dependencia del core.

## 10.3 — Contratos de extensión y adapters de referencia — ACTIVA

Documento autoritativo: [`docs/EXTENSION-CONTRACTS.es.md`](docs/EXTENSION-CONTRACTS.es.md).

### 10.3.1 — Inventario y mapa de autoridad — COMPLETADA

Inventario autoritativo: [`docs/EXTENSION-POINT-INVENTORY.es.md`](docs/EXTENSION-POINT-INVENTORY.es.md).

Completado:

- verificadas las 9 interfaces de primer nivel bajo `repositories/`;
- mapeadas composición, implementaciones y contratos de red;
- incorporado `PaymentRepository` al inventario formal;
- clasificada la autoridad acotada/local/workflow/downstream/monitorización;
- mantenidos SMTP/módulos internos fuera del contrato público;
- clasificados Stripe/Redsys como PSP, no repositories del ledger.

### 10.3.2 — Compatibilidad/versionado — COMPLETADA

Política autoritativa: [`docs/EXTENSION-COMPATIBILITY.es.md`](docs/EXTENSION-COMPATIBILITY.es.md).

Completado:

- interfaces in-process públicas siguen SemVer del core;
- rutas/headers REST v1 existentes permanecen estables;
- catálogo sin versión congelado como semántica legacy-v1;
- versión de schema de evento y firma webhook son independientes;
- autoridad/auth/idempotencia/estados/allowlists son contractuales;
- prohibido downgrade oculto de mutaciones;
- breaking changes requieren ruta explícita de versión/migración/deprecación.

### 10.3.3 — Adapters de referencia para contribuidores — COMPLETADA

Guía autoritativa: [`docs/REFERENCE-ADAPTERS.es.md`](docs/REFERENCE-ADAPTERS.es.md).

Completado:

- `RestBookingRepository` designado como referencia de repository con autoridad acotada;
- `RestSupplierFulfilmentAdapter` + `performSupplierAdapterOperation()` como referencia workflow-subordinate/audit-before-apply;
- `RestCrmSyncAdapter` como referencia downstream-only;
- `RestFailureTransport` como patrón opcional de monitorización;
- documentadas credenciales server-only, HTTPS/redirect safety, transporte acotado, validación runtime y errores estables;
- documentadas idempotencia determinista y audit-before-apply;
- documentada absorción de cambios vendor dentro del adapter;
- documentada migración deliberada v1→v2 sin fallback oculto;
- documentada frontera de adapters privados Kairoseth/cliente;
- confirmada cobertura existente en `tests/rest-adapter-contracts.ts` para las referencias de red.

### 10.3.4 — Validación permanente de contratos — ACTIVA después del merge

Siguiente trabajo: añadir un gate automatizado permanente que proteja el modelo formalizado en 10.3.1–10.3.3.

Cobertura objetivo:

- interfaces/rutas públicas verificadas siguen presentes;
- versiones y documentación permanecen sincronizadas;
- payloads provider no pueden filtrarse a interfaces compartidas;
- CRM/ERP siguen siendo downstream-only;
- respuestas supplier siguen pasando por auditoría/transición local;
- adapters de referencia conservan credenciales server-only, transporte acotado y parsing runtime;
- documentación de proyecto/contratos/adapters permanece consistente;
- gate final registrado en `npm run verify` y CI.

## Gate de cierre de Fase 10.3

10.3 no se considera completada hasta que:

1. 10.3.1–10.3.4 estén completadas;
2. documentación EN/ES, README, ROADMAP y CHANGELOG estén sincronizados;
3. validación permanente esté ejecutándose en `npm run verify` y CI;
4. CI obligatorio esté verde;
5. PR de cierre esté mergeado a `main`;
6. `main` se verifique antes de empezar otro slice de Fase 10.

---

# Siguientes bloques de Fase 10

Después de cerrar 10.3:

- convenciones de release y migraciones;
- política de upgrades/deprecaciones;
- templates de contribución/release;
- política de trademark/branding entre Open Travel Platform y Kairoseth Travel;
- adapters opcionales según demanda comercial/comunitaria.

## No-objetivos del core

El core público no debe quedar ligado permanentemente a un PSP, proveedor, CRM/ERP, CMS, vendor de identidad, monitorización, hosting o infraestructura exclusiva de Kairoseth.
