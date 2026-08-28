# Roadmap

<p align="center"><a href="./ROADMAP.md">English</a> · <strong>Español</strong></p>

Open Travel Platform es el core open-source reutilizable bajo licencia MIT. **Kairoseth Travel** es la implementación comercial/de referencia oficial desplegada en **https://travel.kairoseth.com**.

El roadmap mantiene alineados dos objetivos:

1. conservar el core público portable, provider-neutral y útil para agencias/desarrolladores;
2. continuar endureciendo y ampliando Kairoseth Travel sin acoplar el core a un PSP, proveedor, CRM, ERP, CMS, vendor de identidad o hosting concreto.

_Última actualización: 28 de agosto de 2026._

---

# Posición actual

La plataforma está muy por encima del MVP original de catálogo/reservas. Ya están implementadas identidad persistente, reservas/inventario transaccionales, pricing de viajeros, alojamiento, servicios independientes, pagos, Traveller Data post-compra protegido, modificaciones, workflows Operator, permisos granulares, documentos, reporting, infraestructura de integraciones, controles de hardening productivo y onboarding self-host open-source.

**Fase 8 — Integraciones externas está COMPLETADA.**

**Fase 9 — Baseline de ingeniería de endurecimiento productivo está COMPLETADA.** Incluye seguridad/operabilidad, validación crítica de persistencia/concurrencia/contratos, observabilidad/recovery/auditoría, privacidad/retención, accesibilidad y preparación de rendimiento/carga.

**Fase 10 — Productización open-source está EN CURSO. Las Fases 10.1 y 10.2 están COMPLETADAS. La Fase 10.3 — Contratos de extensión y adapters de referencia está ACTIVA: 10.3.1 inventario/mapa de autoridad y 10.3.2 compatibilidad/versionado están COMPLETADAS; 10.3.3 adapters de referencia para contribuidores está ACTIVA.**

La validación E2E TEST/LIVE con credenciales Stripe/Redsys sigue pendiente hasta disponer de cuentas adecuadas. Es una validación de release dependiente de proveedores y no reabre el baseline de ingeniería completado de la Fase 9.

---

# Bases completadas

## Foundation, catálogo e identidad — COMPLETADO

- foundation Next.js / React / TypeScript;
- adapters de capacidades MongoDB;
- experiencia pública y Operator bilingüe EN/ES;
- destinos, viajes, itinerarios, salidas e inventario vivo;
- multimedia GridFS, galerías y puntos focales;
- autenticación persistente cliente/personal;
- sesiones separadas, RBAC, capacidades granulares y auditoría de auth;
- despliegue de referencia público en `travel.kairoseth.com`.

## Fase 5 — Base comercial — COMPLETADO / IMPLEMENTADO

- **5A Ledger de pagos:** contabilidad provider-neutral de pagos/reembolsos separada del estado de reserva;
- **5B Viajeros:** menores, tutores, bandas de edad y snapshots de pricing confiables;
- **5C–5E Servicios independientes:** Actividades, Transporte y Protección de viaje con disponibilidad/reservas;
- **5F Checkout Stripe/Redsys:** adapters implementados; validación TEST/LIVE con credenciales pendiente;
- **5G Condiciones de pago:** pago completo, depósitos, cuotas y saldos pendientes.

## Fase 6 — Integridad post-compra y paquetes — COMPLETADO

- Traveller Data post-compra cifrado con controles de retención;
- modificaciones de reserva con reasignación atómica de inventario y delta financiero explícito;
- alojamiento/habitaciones reutilizables, pricing estacional/ocupación y suplementos de paquete.

## Fase 7A — Workflow avanzado de operaciones — COMPLETADO

- responsable, notas, prioridad, tags y timeline;
- tareas/seguimientos;
- fulfilment de proveedor por componente;
- colas/búsqueda/filtros avanzados;
- permisos Admin + Operator granulares con auditoría.

## Fase 7B — Documentos, exportaciones y reporting — COMPLETADO

- confirmaciones, manifiestos y rooming lists;
- vouchers seguros para cliente y expediente interno Operator;
- divulgación controlada de referencias proveedor;
- CSV/XLSX según permisos;
- conciliación, saldos pendientes e ingresos;
- exportación auditada de Traveller Data protegido.

---

# Fase 8 — Integraciones externas — COMPLETADO

Objetivo: conectar sistemas reales mediante fronteras provider-neutral explícitas sin filtrar payloads ni autoridad de vendors hacia dominios centrales.

## 8A — Integraciones salientes — COMPLETADO

- eventos versionados de reservas;
- outbox transaccional MongoDB;
- webhooks HTTPS firmados gestionados por Admin;
- secretos cifrados, protección SSRF/DNS rebinding y transportes acotados;
- retry/backoff, leasing, historial y dead-letter.

## 8B — Operación de integraciones — COMPLETADO

- worker autenticado server-only;
- locking durable y frecuencia/lote acotados;
- replay dead-letter desde Admin;
- diagnóstico de cola/eventos/entregas y controles de retención.

## 8C — Adapters de negocio — COMPLETADO

- adapter REST genérico de `BookingRepository`;
- adapter request/status/cancel de fulfilment;
- adapter CRM exclusivamente downstream;
- adapter ERP/contabilidad exclusivamente downstream;
- validación contractual sobre HTTP local real e idempotencia estable.

Adapters futuros opcionales siguen siendo extensiones comerciales/de ecosistema, no bloqueos del core: CMS/catálogo, SSO, PSP adicionales y facturación específica de vendor/jurisdicción.

---

# Fase 9 — Endurecimiento productivo — COMPLETADO

## 9A — Seguridad / operabilidad — COMPLETADO

- CSP y headers defensivos;
- HSTS productivo;
- comprobación de Origin confiable en mutaciones autenticadas por cookie;
- throttling persistente de autenticación;
- manejo seguro de sesiones;
- `/api/health/live` y `/api/health/ready`;
- contrato fail-closed `KTRAVEL_DEPLOYMENT_PROFILE=demo|live`.

## 9B — Persistencia / concurrencia / contratos — COMPLETADO

- journey persistente de navegador conservado como señal CI informativa/no bloqueante;
- validación de concurrencia/rollback MongoDB;
- validación de idempotencia de pagos/webhooks;
- validación de pricing de viajeros/menores y modificaciones;
- contratos Booking/Supplier/CRM/ERP probados sobre HTTP real local.

## 9C — Observabilidad / recovery / auditoría privilegiada — COMPLETADO

- logging JSON estructurado y correlación de requests;
- failure transport provider-neutral;
- contrato de monitorización externa uptime/readiness;
- auditoría privilegiada fail-closed;
- keyrings versionados y recifrado de Traveller Data;
- drill de backup/restore/disaster recovery MongoDB;
- validación real de índices y query plans MongoDB.

## 9D — Privacidad / regulación / accesibilidad / rendimiento — COMPLETADO

- workflows autenticados de derechos de privacidad y ejecución controlada;
- registro explícito de retención y semántica de holds;
- baseline técnico orientado a WCAG 2.2 AA;
- journeys de accesibilidad dedicados y bloqueantes;
- baselines repetibles de lecturas públicas/autenticadas;
- baseline de throughput/corrección de mutaciones acotadas;
- baseline de RSS/descriptores/threads del runtime standalone y recuperación tras pico.

La validación Stripe/Redsys TEST/LIVE con credenciales sigue siendo una dependencia externa separada.

---

# Fase 10 — Productización open-source — EN CURSO

Objetivo: hacer que el core MIT sea reproducible para adoptar, desplegar, extender, publicar y contribuir sin dependencia oculta de infraestructura Kairoseth.

## 10.1 — Bootstrap demo reproducible desde clon limpio — COMPLETADO

- lockfile npm versionado y contrato de instalación limpia con `npm ci`;
- `.env.demo.example` seguro;
- `npm run setup:demo` no destructivo;
- evaluación sin MongoDB, SMTP, PSP, CRM, ERP ni credenciales de proveedor obligatorias;
- smoke bloqueante desde checkout limpio con typecheck/build/start/HTTP;
- guía de primeros pasos EN/ES.

## 10.2 — Despliegue self-host standalone provider-neutral — COMPLETADO

- frontera productiva Next.js `output: standalone`;
- `npm run package:standalone` empaqueta runtime trazado, assets estáticos y `public`;
- smoke bloqueante del `.next/standalone/server.js` real y assets HTTP;
- baseline de recursos alineado con el mismo proceso standalone;
- guía bilingüe para secretos runtime, readiness live, TLS/proxy inverso, MongoDB, workers, releases inmutables y rollback;
- `travel.kairoseth.com` sigue siendo despliegue de referencia, no dependencia del core MIT.

## 10.3 — Contratos de extensión y adapters de referencia — ACTIVA

Documento autoritativo de la fase: [`docs/EXTENSION-CONTRACTS.es.md`](docs/EXTENSION-CONTRACTS.es.md).

### 10.3.1 — Inventario de puntos de extensión y mapa de autoridad — COMPLETADA

Inventario autoritativo: [`docs/EXTENSION-POINT-INVENTORY.es.md`](docs/EXTENSION-POINT-INVENTORY.es.md).

- verificadas las 9 interfaces de extensión de primer nivel bajo `repositories/`;
- mapeados puntos de composición, implementaciones incluidas y contratos de red;
- añadido `PaymentRepository`, que faltaba en el inventario preliminar;
- clasificada la autoridad como repository acotado, local-autoritativa, subordinada a workflow, downstream-only o solo monitorización;
- confirmado que los webhooks genéricos son entrega downstream, no autoridad de mutación inversa;
- mantenidos SMTP/email y módulos internos arbitrarios fuera del contrato público de plugins;
- clasificados Stripe/Redsys como integraciones PSP y no como sustitutos de `PaymentRepository`.

### 10.3.2 — Compatibilidad y versionado de contratos — COMPLETADA

Política autoritativa: [`docs/EXTENSION-COMPATIBILITY.es.md`](docs/EXTENSION-COMPATIBILITY.es.md).

- las interfaces in-process siguen el SemVer del release core en lugar de versiones numéricas independientes;
- las rutas y headers REST v1 actuales se preservan exactamente;
- Booking/Supplier/CRM pueden compartir `X-OTP-Contract-Version` sin compartir un único ciclo de schema;
- ERP/contabilidad y FailureTransport conservan sus headers v1 especializados;
- el catálogo HTTP sin versión queda congelado como semántica legacy-v1 y no puede romperse in-place;
- schema de evento y versión de firma webhook son dimensiones independientes;
- autoridad, autenticación, idempotencia, estados y allowlists de datos protegidos son semántica contractual;
- se prohíbe el downgrade automático de versión wire en mutaciones;
- la retirada ordinaria de contratos requiere deprecación y guía de migración;
- los breaking changes requieren release major del core o contrato wire paralelo/nuevo deliberado.

### 10.3.3 — Adapters de referencia para contribuidores — ACTIVA

- aportar implementaciones/ejemplos mínimos provider-neutral sobre contratos genéricos existentes;
- demostrar un adapter source/repository acotado y otro exclusivamente downstream;
- demostrar credenciales server-only, validación runtime, transporte acotado y errores estables;
- demostrar idempotencia en mutaciones y audit-before-apply cuando aplique;
- mostrar upgrades de API proveedor absorbidos dentro del adapter manteniendo estable el contrato core;
- mostrar migración deliberada v1 → v2 sin fallback oculto de mutaciones;
- mostrar cómo mantener integraciones propietarias fuera del core MIT genérico.

### 10.3.4 — Validación permanente de contratos de extensión — PLANIFICADA

- añadir invariantes estáticos/runtime para fronteras públicas;
- impedir filtración de payloads provider a tipos centrales;
- impedir que CRM/ERP/proveedores downstream se conviertan en autoridad de reservas/pagos;
- validar headers/identificadores de versión cuando aplique;
- registrar el gate final de 10.3 en `npm run verify`.

### Criterios de cierre de Fase 10.3

10.3 solo puede marcarse COMPLETADA cuando:

1. inventario de extensiones y matriz de autoridad estén documentados EN/ES;
2. política de compatibilidad/versionado sea explícita y orientada a contribuidores;
3. existan ejemplos de adapters de referencia provider-neutral;
4. validación automatizada permanente proteja las fronteras;
5. README/ROADMAP/ADAPTER-GUIDE y documentos contractuales coincidan en el mismo modelo;
6. adapters específicos de Kairoseth/cliente permanezcan fuera del core MIT cuando corresponda;
7. CI esté verde después de registrar la nueva validación.

## Siguientes bloques de Fase 10

Después de 10.3:

- convenciones de release y migraciones;
- política de upgrades/deprecaciones;
- templates más completos de contribución/release;
- política de trademark y branding entre Open Travel Platform y Kairoseth Travel;
- adapters opcionales según demanda comercial/comunitaria.

---

# Orden de entrega sugerido

```text
Fase 8   Integraciones externas ------------------------------- COMPLETADA
Fase 9   Baseline de hardening productivo --------------------- COMPLETADA
10.1     Bootstrap demo desde clon limpio --------------------- COMPLETADA
10.2     Despliegue self-host standalone ---------------------- COMPLETADA
10.3.1   Inventario de extensiones + mapa de autoridad -------- COMPLETADA
10.3.2   Política de compatibilidad/versionado ---------------- COMPLETADA
10.3.3   Ejemplos de adapters de referencia ------------------- ACTIVA
10.3.4   Validación permanente de contratos ------------------- PLANIFICADA
          ↓
Después   Convenciones de release/migración/contribución/marca
```

---

# No-objetivos del core

Open Travel Platform no debe quedar ligado permanentemente a una pasarela, CMS, CRM/ERP, proveedor de reservas, vendor de identidad, vendor de monitorización, hosting o infraestructura exclusiva de Kairoseth.

El core público permanece bajo licencia MIT y reutilizable. Kairoseth Travel puede añadir servicios alojados/comerciales, adapters premium/privados e integraciones específicas de clientes alrededor de ese core.
