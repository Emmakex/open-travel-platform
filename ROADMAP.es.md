# Roadmap

<p align="center"><a href="./ROADMAP.md">English</a> · <strong>Español</strong></p>

Open Travel Platform es el core open-source reutilizable bajo licencia MIT. **Kairoseth Travel** es la implementación comercial/de referencia oficial desplegada en **https://travel.kairoseth.com**.

El roadmap mantiene alineados dos objetivos:

1. conservar el core público portable, neutral respecto a proveedores y útil para otras agencias/desarrolladores;
2. continuar endureciendo Kairoseth Travel sin acoplar el core a un PSP, proveedor, CRM, ERP, CMS, vendor de identidad o hosting concreto.

_Última actualización: 28 de agosto de 2026._

---

# Posición actual

La plataforma está muy por encima del MVP original de catálogo/reservas. Ya están implementadas identidad persistente, reservas/inventario transaccionales, pricing por viajero, alojamiento, servicios independientes, pagos, datos post-compra, modificaciones, workflow Operator avanzado, permisos granulares, documentos, reporting y la infraestructura común de integraciones.

**La Fase 8 está COMPLETADA. El baseline de ingeniería de la Fase 9 — Endurecimiento productivo está COMPLETADO: Fase 9A de seguridad/operabilidad productiva, Fase 9B de persistencia/concurrencia/contratos críticos, Fase 9C de observabilidad/recuperación/auditoría privilegiada y Fase 9D de privacidad/regulación/accesibilidad/rendimiento. La Fase 10 — Productización open-source es la SIGUIENTE.**

La validación E2E TEST/LIVE con credenciales Stripe/Redsys sigue pendiente hasta disponer de cuentas proveedor adecuadas. Debe incorporarse en cuanto existan credenciales, Permanece como validación de release dependiente de proveedores y no reabre el baseline de ingeniería completado de la Fase 9. El Browser E2E general permanece como señal CI informativa/no bloqueante por política explícita del proyecto; los journeys dedicados de accesibilidad para foundation global, autenticación cliente, Traveller Data/privacidad, booking/pagos y workflows Operator se ejecutan como workflows bloqueantes. Los gates bloqueantes también cubren seguridad determinista, TypeScript/build/smoke, concurrencia/idempotencia/modificaciones MongoDB, contratos HTTP locales de adapters, observabilidad/failure transport, rollback de auditoría privilegiada, rotación de claves, recovery MongoDB, planes de consulta MongoDB reales e invariantes de privacidad/retención.

---

# Bases completadas

## Foundation, catálogo e identidad — COMPLETADO

- base Next.js / React / TypeScript;
- adapters de capacidades MongoDB;
- quality gates de CI/release;
- experiencia pública y Operator EN/ES;
- destinos, viajes, itinerarios, salidas e inventario vivo;
- GridFS, portadas, galerías y puntos focales;
- autenticación persistente cliente/personal;
- sesiones separadas, RBAC, capacidades granulares y auditoría de autenticación;
- despliegue público de referencia en `travel.kairoseth.com`.

## Fase 5 — Base comercial — COMPLETADO / IMPLEMENTADO

### 5A — Ledger de pagos neutral — COMPLETADO
- movimientos de pago/reembolso separados del estado de reserva;
- transferencia, efectivo y terminal externo;
- protecciones de conciliación y metadata provider/idempotencia.

### 5B — Viajeros y pricing por edad — COMPLETADO
- viajero principal/individuales, menores/tutores y bandas de edad;
- pricing por salida y consumo de inventario configurable;
- snapshots históricos de viajero/pricing.

### 5C–5E — Servicios independientes — COMPLETADO
- catálogos de Actividades, Transporte y Protección de viaje;
- calendarios de disponibilidad/inventario;
- reservas independientes vinculables opcionalmente a un viaje;
- ledger de pagos común.

### 5F — Checkout Stripe/Redsys — IMPLEMENTADO
- configuración TEST/LIVE Admin y credenciales cifradas;
- webhooks Stripe firmados/idempotentes;
- notificaciones server-side Redsys firmadas;
- los retornos del navegador no son autoritativos;
- E2E TEST/LIVE con credenciales todavía pendiente de cuentas proveedor.

### 5G — Depósitos, cuotas y condiciones de pago — COMPLETADO
- políticas full/deposit/installments;
- snapshots de vencimientos, saldo pendiente y próximo pago;
- calendario cliente y gestión Operator.

## Fase 6 — Integridad post-compra y paquetes — COMPLETADO

### 6A / 6A.1 — Datos post-compra seguros — COMPLETADO
- snapshots de requisitos, deadlines y estados UX;
- almacenamiento AES-256-GCM con retención TTL;
- auditoría solo de nombres de campos;
- escaneos DNI/pasaporte y datos de salud excluidos del flujo estándar.

### 6B — Modificaciones de reserva — COMPLETADO
- historial explícito actor/motivo/before/after;
- correcciones de viajeros, cambios atómicos de salida y reasignación de inventario;
- delta financiero sin reescribir movimientos históricos de pago;
- revisión controlada de reembolso y snapshots de política de cambios.

### 6C — Alojamiento, inventario de habitaciones y suplementos — COMPLETADO
- catálogo reutilizable de alojamientos/habitaciones;
- pricing estacional/ocupación;
- inventario transaccional viaje + habitación;
- asignación viajero → habitación;
- contabilidad de alojamiento incluido/opcional;
- suplementos y modificaciones post-reserva.

---

# Fase 7A — Workflow avanzado de operaciones — COMPLETADO

- responsable, notas, prioridad, tags y timeline;
- tareas/seguimientos con responsable, vencimiento, estado y comentarios;
- fulfilment por componente de viaje/servicio/alojamiento;
- estado/referencia/coste/deadline de proveedor y auditoría interna;
- búsqueda avanzada, filtros, orden y colas operativas;
- workflow post-reserva de modificaciones de paquete;
- matriz Admin + capacidades granulares Operator con cambios auditados.

Los datos de proveedor no reescriben totales de cliente ni el ledger de pagos.

---

# Fase 7B — Documentos, exportaciones y reporting — COMPLETADO

### 7B-1 — PDFs de confirmación — COMPLETADO
- confirmaciones cliente/Operator EN/ES;
- finanzas solo cuando el permiso lo permite;
- endpoints privados `no-store`.

### 7B-2 — Manifiestos y rooming lists — COMPLETADO
- manifiestos por salida y rooming lists desde snapshots;
- rutas PDF protegidas para Operator;
- valores protegidos del viajero y datos internos de proveedor excluidos.

### 7B-3 — Vouchers y expediente imprimible — COMPLETADO
- vouchers de alojamiento/servicio seguros para cliente;
- expediente interno consolidado;
- divulgación de referencia exacta de proveedor solo tras aprobación/auditoría separada;
- costes, notas y datos protegidos excluidos de vouchers cliente.

### 7B-4 — CSV/XLSX y reporting financiero — COMPLETADO
- workspace `/operator/reports` según capacidades;
- CSV/XLSX de reservas/servicios/clientes;
- conciliación, saldos/vencidos e ingresos;
- agrupación segura por moneda;
- mitigación de inyección de fórmulas;
- auditoría persistente sin guardar valores de celdas;
- exportación de viajeros protegidos ligada a finalidad y fail-closed.

---

# Fase 8 — Integraciones externas — COMPLETADO

Objetivo: conectar sistemas reales mediante fronteras de adapters explícitas sin filtrar payloads específicos de vendors a dominios centrales.

## 8A — Integraciones salientes neutrales — COMPLETADO

- eventos versionados de reservas de viaje/servicio;
- outbox MongoDB transaccional dentro de la misma mutación de reserva;
- entrega única por `(eventId, endpointId)`;
- webhooks HTTPS firmados gestionados por Admin;
- secretos de firma cifrados;
- protecciones SSRF/DNS rebinding y pinning a IP validada;
- timeout/respuesta limitados, lease, retry/backoff, historial y dead-letter;
- datos post-compra protegidos excluidos del contrato genérico;
- gate permanente `check:outbound-integrations`.

## 8B — Scheduler, replay y observabilidad — COMPLETADO

- worker server-only con Bearer auth;
- lease global durable y frecuencia/lote limitados;
- replay dead-letter desde Admin conservando historial;
- diagnóstico de eventos/entregas y métricas de salud;
- retención de éxitos completados y auditoría de retención;
- gate permanente `check:integration-operations`.

## 8C — Adapters de negocio — COMPLETADO

### 8C-1 — Adapter REST genérico de reservas — COMPLETADO

- `BOOKING_MODE=rest` detrás de `BookingRepository`;
- contrato `/v1` versionado y Bearer server-only;
- HTTPS productivo, rechazo de redirects y transporte acotado;
- validación runtime y revalidación de ownership/alcance;
- create/cancel idempotentes con retries limitados;
- ledger, operaciones, catálogo y datos de viajeros siguen como capacidades separadas;
- gate permanente `check:rest-booking-adapter`.

### 8C-2 — Frontera de adapter de fulfilment de proveedores — COMPLETADO

- `SupplierFulfilmentAdapter` neutral;
- REST v1 opt-in para request/status/cancel;
- idempotencia determinista y errores estables;
- auditoría de respuesta externa antes de aplicarla;
- las respuestas vuelven a entrar por la máquina de estados local;
- transiciones inválidas nunca se fuerzan;
- coste/moneda de proveedor se preservan localmente;
- divulgación de referencia en voucher cliente sigue separada;
- gate permanente `check:supplier-fulfilment-adapter`.

### 8C-3 — Adapter de sincronización CRM — COMPLETADO

- `CrmSyncAdapter` neutral y exclusivamente downstream;
- `CRM_SYNC_MODE=disabled|rest` con implementación REST v1;
- contratos upsert de contacto/reserva con allowlists estrictas;
- registro/actualización de perfil del cliente encolan triggers CRM transaccionalmente;
- eventos `customer.*` fuera de suscripciones webhook genéricas;
- CRM reutiliza el outbox/worker/retry/dead-letter/replay existente, sin segunda cola;
- eventos de reserva hacen upsert del contacto antes de la reserva;
- idempotency keys estables derivadas del evento;
- datos de pago, proveedor, inventario mutable, arrays de viajeros y datos post-compra protegidos excluidos;
- IDs externos guardados separadamente en `travel_crm_sync_links`;
- auditoría de outcomes sin PII en `travel_crm_sync_audit`;
- diagnóstico Admin en `/operator/integrations/crm`;
- gate permanente `check:crm-sync-adapter`.

### 8C-4 — Adapter ERP/contabilidad — COMPLETADO

- `ErpAccountingAdapter` neutral y exclusivamente downstream;
- `ERP_ACCOUNTING_MODE=disabled|rest` con adapter REST v1 de upsert de movimientos;
- solo los movimientos autoritativos `succeeded` de pago/reembolso del ledger local son elegibles;
- la finalización del pago/reembolso y su trigger ERP se confirman en la misma transacción MongoDB;
- se preservan importe, moneda, provider y referencia inmutable exactos del movimiento de origen;
- IDs de evento deterministas e idempotency keys estables derivadas del evento;
- los eventos financieros ERP no se exponen a webhooks genéricos ni son consumidos por CRM;
- el mismo worker aporta retry/backoff, dead-letter, replay y métricas sin crear una segunda cola;
- referencias externas separadas en `travel_erp_accounting_links`;
- auditoría de acknowledgements en `travel_erp_accounting_audit` sin importes, moneda, referencia provider, PII ni cuerpos HTTP crudos;
- diagnóstico Admin en `/operator/integrations/erp`;
- el core genérico exporta movimientos preparados para contabilidad y no afirma generar facturas legales específicas de jurisdicción sin datos fiscales/de facturación autoritativos;
- el mapping específico de plan contable/impuestos permanece dentro de adapters downstream;
- gate permanente `check:erp-accounting-adapter`.

### Adapters futuros opcionales

Son extensiones y no bloquean el cierre de la frontera core de la Fase 8:

- adapter de fuente CMS/catálogo;
- identidad enterprise/SSO cuando aporte valor;
- PSP adicionales cuando exista justificación comercial;
- adapters de facturación específicos de vendor/jurisdicción después de modelar datos fiscales autoritativos.

---

# Fase 9 — Endurecimiento productivo — COMPLETADO (baseline de ingeniería)

El baseline de ingeniería de endurecimiento para la amplia superficie del producto está completado. La validación con credenciales proveedor permanece separada cuando requiere cuentas externas.

## 9A — Baseline de seguridad / operabilidad productiva — COMPLETADO

- CSP global y headers HTTP defensivos;
- HSTS y upgrade de requests inseguras solo en producción;
- validación explícita same-origin en Route Handlers autenticados por cookie que realizan mutaciones;
- callbacks Stripe/Redsys siguen autenticados por firma del proveedor y el integration worker interno sigue autenticado por Bearer;
- throttling persistente MongoDB para login cliente/staff, registro cliente y solicitudes de reset de contraseña;
- los buckets de rate limit guardan solo identificadores SHA-256, nunca email/IP en claro;
- throttling adicional por cliente/IP solo cuando se habilita explícitamente la confianza en headers IP del proxy;
- tokens de sesión opacos almacenados como hash, con expiración TTL, revocación server-side y atributos seguros de cookie;
- endpoint de liveness `/api/health/live`;
- endpoint de readiness `/api/health/ready`;
- contrato explícito `KTRAVEL_DEPLOYMENT_PROFILE=demo|live`;
- en `live`, readiness rechaza capacidades demo, URL pública HTTPS inválida, MongoDB requerido no disponible y ausencia de autenticación del worker outbound;
- guía de seguridad productiva EN/ES más guía de despliegue/checklist modernizados;
- gate permanente `check:production-security` y smoke CI de headers, health y rechazo de mutaciones con Origin externo.

## 9B — E2E críticos y validación de persistencia/concurrencia — COMPLETADO (baseline core)

### 9B-1 — Journey persistente de navegador — IMPLEMENTADO / INFORMATIVO
- existe el flujo registro → reserva → cuenta cliente → Operator en Playwright/Chromium;
- seed/build/journey persistentes sobre MongoDB corren en un job CI independiente;
- `Browser E2E (non-blocking)` es intencionadamente informativo y conserva diagnóstico sin bloquear entregas.

### 9B-2 — Concurrencia / rollback de reservas MongoDB — COMPLETADO
- replica set local desechable MongoDB 8 en CI;
- carrera concurrente de reservas demuestra que nunca se sobrevende capacidad;
- rollback transaccional cubre un fallo posterior de inventario;
- cancelación duplicada libera inventario y emite el cambio de estado una sola vez.

### 9B-3 — Idempotencia de pagos y webhooks — COMPLETADO
- validación real MongoDB de finalización/idempotencia de pagos;
- entregas duplicadas del proveedor/webhook no duplican movimientos autoritativos;
- el trigger ERP transaccional permanece consistente con movimientos finalizados del ledger.

### 9B-4 — Pricing de viajeros/menores y modificaciones — COMPLETADO
- validación exacta de edad en fecha de salida, incluyendo 17 → 18 en la nueva salida;
- requisitos de tutor y snapshots de pricing/inventario child/adult;
- movimiento atómico de inventario en cambio de salida y delta de precio explícito;
- los movimientos históricos de pago permanecen inmutables;
- correcciones de identidad del viajero no provocan repricing accidental;
- capacidad insuficiente en destino demuestra rollback transaccional total.

### 9B-5 — Validación de contratos/integración de adapters REST — COMPLETADO
- servidor HTTP local real sobre puerto localhost efímero; sin mock de `fetch`;
- adapters Booking, Supplier fulfilment, CRM y ERP/contabilidad ejercitados mediante su transporte real;
- Bearer auth, headers de versión, MIME JSON, respuestas acotadas y protecciones de redirects/timeout preservadas;
- fallos transitorios reintentan como máximo una vez con idempotency keys estables;
- respuestas 4xx no transitorias no se reintentan;
- mismatches de ownership/trip/departure en Booking fallan cerrados;
- allowlists salientes de Supplier/CRM/ERP impiden filtrar campos comerciales/protegidos;
- Supplier, CRM y ERP rechazan respuestas exitosas no JSON de forma consistente con Booking;
- gates bloqueantes permanentes `check:adapter-contract-validation` y `test:rest-adapter-contracts`.

### Validación con credenciales de proveedor — DEPENDENCIA EXTERNA DIFERIDA
- E2E Stripe/Redsys TEST/LIVE con credenciales sigue siendo necesario antes de afirmar validación productiva completa de esos proveedores;
- debe insertarse inmediatamente cuando existan cuentas/credenciales adecuadas;
- la ausencia de credenciales no bloquea el trabajo de la Fase 9D.

## 9C — Observabilidad, recuperación y endurecimiento de auditoría privilegiada — COMPLETADO

### 9C-1 — Observabilidad operativa estructurada — COMPLETADO
- logging JSON-line neutral respecto a proveedor con schema, servicio, evento, componente y severidad;
- correlación `X-Request-Id` validada con UUID server-side de fallback;
- redacción central de credenciales, PII cliente/viajero, payloads crudos, valores de tarjeta, referencias provider e importes;
- instrumentación de integration worker, Stripe, Redsys y readiness;
- gates bloqueantes `check:observability` y `test:observability` más documentación EN/ES.

### 9C-2 — Transporte centralizado de visibilidad de fallos — COMPLETADO
- `FailureTransport` neutral `disabled|rest` con collector HTTPS confiable, Bearer opcional, timeout/respuesta acotados y sin redirects;
- eventos normalizados `warning|error|critical` con fingerprint SHA-256 estable para agrupación;
- allowlist saliente más estricta que excluye PII, credenciales, firmas, payloads crudos, referencias provider e importes;
- monitorización best-effort y no autoritativa: nunca modifica reservas, pagos, integraciones ni readiness;
- validación HTTP local real de auth, contrato, redacción, agrupación y single-attempt;
- gates `check:failure-transport` y `test:failure-transport` más documentación EN/ES.

### 9C-3 — Monitorización externa de uptime/readiness y alertas accionables — COMPLETADO
- contrato exacto de probes externos para `/api/health/live` y `/api/health/ready`;
- intervalos, timeouts y umbrales consecutivos de fallo/recuperación recomendados;
- mapping accionable de severidad/escalado para degradación de readiness y fingerprints normalizados;
- runbook neutral para routing de alertas sin acoplar el core MIT a un SDK concreto de monitorización;
- monitorización fuera de la autoridad de negocio y fuera de datos protegidos cliente/viajero;
- gate bloqueante de contrato/configuración de monitorización externa.

### 9C-4 — Integridad de auditoría de acciones privilegiadas — COMPLETADO
- cambios de configuración de proveedores de pago y endpoints de integración confirman la mutación y su audit bounded dentro de la misma transacción MongoDB;
- asignación/eliminación de capacidades staff conserva la misma frontera fail-closed;
- secretos, PII, payloads crudos y valores protegidos excluidos de la auditoría privilegiada;
- prueba MongoDB real demuestra rollback de la mutación si falla la escritura de audit;
- workflow bloqueante y runbook EN/ES.

### 9C-5 — Base de keyring de cifrado versionado — COMPLETADO
- keyring AES-256-GCM v1/v2 compartido para credenciales de pago y secretos de firma de integraciones;
- `keyId` estable no secreto y mapas acotados de claves anteriores para rotación escalonada;
- ciphertext legacy legible durante migración y formatos inválidos/desconocidos fail-closed;
- procedimientos de recuperación/rotación, contrato de entorno y gate bloqueante dedicado.

### 9C-6 — Rotación y recifrado de Traveller Data — COMPLETADO
- Traveller Data usa el keyring versionado con frontera dedicada de clave actual/anterior;
- batches transaccionales acotados recifran únicamente el payload cifrado;
- TTL, completitud y timestamps de negocio se preservan;
- compare-and-set sobre ciphertext impide sobreescribir cambios concurrentes de viajeros;
- errores de descifrado/recifrado/conflicto revierten todo el batch;
- mantenimiento criptográfico no crea falsos eventos de cambio de datos cliente;
- pruebas MongoDB reales demuestran rollback, lectura post-rotación e idempotencia.

### 9C-7 — Backup/restore MongoDB y disaster recovery — COMPLETADO
- runbook EN/ES neutral con RPO/RTO y separación del recovery de claves de cifrado;
- drill real `mongodump`/`mongorestore` sobre MongoDB 8 desechable;
- daño deliberado de la fuente seguido de restore en base aislada, nunca directamente sobre la base activa;
- validación de canarios de reservas, pagos, auditoría y Traveller Data más índices únicos/TTL antes del cutover;
- checksum de backup y procedimiento de rollback/cutover incluidos en el workflow bloqueante.

### 9C-8 — Endurecimiento de índices y planes de consulta MongoDB — COMPLETADO
- baseline aditivo de índices alineados con queries de reservas Operator, Traveller Data activo y cola/historial de integraciones;
- índices de pagos, auditoría y tareas revisados sin añadir sobreindexado especulativo;
- validación real MongoDB 8 con `explain("executionStats")` sobre datos representativos;
- los hot paths críticos exigen índices esperados, ausencia de `COLLSCAN` y documentos examinados acotados;
- seguimiento Atlas Query Profiler/Performance Advisor y ciclo de vida seguro de índices documentados EN/ES;
- gate permanente `check:mongodb-index-performance` más prueba real de query plans.

## 9D — Preparación de privacidad, regulación, accesibilidad y rendimiento — COMPLETADO

### 9D-1 — Base de solicitudes de derechos y revisión de retención — COMPLETADO
- solicitudes autenticadas de acceso, rectificación, supresión, limitación, oposición y portabilidad;
- seguimiento desde cliente y consola de privacidad solo para Admin;
- una solicitud abierta por cliente/derecho, plazos/prórrogas acotados y persistencia transaccional de solicitud + auditoría;
- revisión explícita de retención antes de cerrar una supresión;
- inventario técnico de datos personales separando datos exportables/cliente de credenciales, internals de seguridad y stores sujetos a revisión;
- validación MongoDB real de duplicados, plazos, rollback e inmutabilidad terminal.

### 9D-2 — Acceso/portabilidad, limitación y supresión controlada — COMPLETADO
- exportaciones JSON autenticadas aprobadas por Admin para acceso y portabilidad;
- portabilidad deliberadamente más limitada que acceso, excluyendo internals de pagos/contabilidad/expedientes/auditoría staff;
- exportación de Traveller Data protegido fail-closed si no están disponibles las claves necesarias;
- limitación deshabilita la cuenta cliente y revoca sesiones sin borrar registros de negocio;
- supresión exige confirmación explícita Admin y revisión de retención en estado clear;
- identidad de cuenta/reserva/viajero anonimizada o seudonimizada preservando estructura de reserva, inventario y finanzas autoritativas;
- ejecución destructiva online acotada, transaccional donde es autoritativa y segura ante reintentos de limpieza secundaria;
- invariantes estáticos bloqueantes y prueba MongoDB real de ejecución de privacidad.

### 9D-3 — Baseline regulatorio de política de retención — COMPLETADO
- registry 1:1 de política de retención para cada área del inventario de datos personales;
- estrategias explícitas `ttl`, `case-review`, `business-record-review` y `security-review` con responsable operativo;
- los holds documentados prevalecen sobre la elegibilidad de expiración;
- el evaluador solo puede devolver `retain`, `review-required` o `eligible-for-expiry`, nunca una instrucción automática de borrado;
- registros de negocio como reservas/pagos/auditorías permanecen sujetos a revisión y no reciben un TTL legal universal de base de datos;
- guía EN/ES cita fuentes oficiales RGPD, mercantiles/fiscales españolas y de viajes/consumo UE/España sin afirmar certificación jurídica;
- gate bloqueante `check:privacy-retention-policy`, test unitario y workflow CI dedicado.

### 9D-4 — Preparación de accesibilidad — COMPLETADO
- baseline global de teclado con skip navigation bilingüe, `:focus-visible`, soporte de reduced motion, forced-colors y smoke de reflow a 320px;
- formularios cliente de login, registro y recuperación/reset de contraseña exponen errores server-side, controles inválidos, relaciones de ayuda y comportamiento de foco accionable;
- Traveller Data y workflows de derechos de privacidad exponen labels estables, regiones vivas de error/status, nombres contextuales de acciones y recuperación dirigida de foco/estado inválido;
- reservas de viaje/servicio y flujos autenticados de pago exponen errores assertive, estados de pago polite, resúmenes/grupos de métodos nombrados y semántica de retorno de proveedor sin cambiar la autoridad de pagos;
- workflow protegido de reservas Operator, tareas/seguimientos y fulfilment de proveedores exponen nombres contextuales de formularios/grupos, `aria-invalid`, relaciones de error y semántica diferenciada status/alert;
- workflows Playwright/Chromium bloqueantes ejercitan journeys persistentes con MongoDB real y autenticación cliente/staff para los slices críticos;
- documentación de ingeniería EN/ES y gates permanentes de invariantes preservan el contrato implementado;
- es un baseline técnico orientado a WCAG 2.2 AA, no una certificación: la revisión específica de cada despliegue con teclado, lector de pantalla, contraste, zoom/reflow y contenido real sigue siendo responsabilidad de release.

### 9D-5 — Preparación de rendimiento/carga — COMPLETADO
- 9D-5.1 añade un baseline HTTP público/solo lectura bloqueante contra build productivo con p50/p95/p99, throughput y fallos estructurados; la primera ejecución aceptada completó 150 peticiones con 0 fallos;
- 9D-5.2 usa sesiones persistentes reales cliente/Admin y una reserva MongoDB real para carga GET crítica autenticada, sin bypass de auth; la primera ejecución aceptada completó 156 peticiones con 0 fallos y p95 aproximados de 45,58–111,26 ms;
- 9D-5.3 ejecuta 32 intentos concurrentes contra 16 plazas, exige exactamente 16 commits + 16 rechazos de capacidad esperados, cancela después todos los commits y demuestra inventario final 0 más cardinalidad exacta de outbox; los primeros p95 de creación/cancelación aceptados fueron 554,78/323,5 ms;
- 9D-5.4 muestrea un proceso Linux productivo Next.js para RSS/VmHWM, descriptores y threads durante 240 peticiones con concurrencia 12 más un pico de 320 con concurrencia 32; la primera ejecución aceptada tuvo 0 fallos, p95 109,10/233,10 ms, RSS 193,78 → 395,74 MB, FDs 40 → 84, threads 15 → 15 y liveness post-carga correcto;
- los budgets de CI son señales de regresión/fugas, no SLO de producción ni garantías de dimensionamiento; los umbrales reales deben calibrarse con telemetría de hosting, Atlas y tráfico;
- la evidencia de query plans de 9C-8 sigue siendo la autoridad para cambios de base de datos/índices, por lo que un escenario de aplicación lento no justifica índices especulativos.

La validación TEST/LIVE Stripe/Redsys con credenciales sigue siendo requisito de hardening productivo y debe insertarse inmediatamente cuando existan cuentas proveedor adecuadas.

---

# Fase 10 — Productización open-source — SIGUIENTE

- documentación de entorno productivo;
- seed/setup demo limpio;
- instalación/despliegue desde clon limpio;
- adapters de referencia y contratos de extensión;
- releases/migraciones versionadas;
- templates de contribución y documentación pública API/extensiones;
- ejemplo opcional Docker/self-host;
- política de marca/trademark;
- adapters propietarios Kairoseth/cliente fuera del core MIT cuando corresponda.

---

# Orden de entrega sugerido

```text
9A    Baseline de seguridad / operabilidad productiva — COMPLETADO
  ↓
9B    Validación crítica de persistencia/concurrencia/contratos — COMPLETADO
  ↓
9C-1  Observabilidad operativa estructurada — COMPLETADO
  ↓
9C-2  Transporte centralizado de visibilidad de fallos — COMPLETADO
  ↓
9C-3  Uptime/readiness externo + routing de alertas — COMPLETADO
  ↓
9C-4  Integridad de auditoría privilegiada — COMPLETADO
  ↓
9C-5  Keyring de cifrado versionado — COMPLETADO
  ↓
9C-6  Rotación/recifrado de Traveller Data — COMPLETADO
  ↓
9C-7  Backup/restore MongoDB + disaster recovery — COMPLETADO
  ↓
9C-8  Índices/planes de consulta MongoDB — COMPLETADO
  ↓
9D-1  Derechos de privacidad + revisión de retención — COMPLETADO
  ↓
9D-2  Acceso/portabilidad + limitación + supresión controlada — COMPLETADO
  ↓
9D-3  Baseline regulatorio de retención — COMPLETADO
  ↓
9D-4  Preparación de accesibilidad — COMPLETADO
  ↓
9D-5  Preparación de rendimiento/carga — COMPLETADO
  ↓
10    Productización open-source / release — SIGUIENTE
  ↓
adapters opcionales según necesidad comercial
```

---

# No-objetivos del core

Open Travel Platform no debe quedar ligado permanentemente a una pasarela, CMS, CRM/ERP, proveedor de reservas, vendor de identidad, hosting o infraestructura exclusiva de Kairoseth.

El core público permanece bajo licencia MIT y reutilizable. Kairoseth Travel puede añadir servicios alojados/comerciales, adapters premium/privados e integraciones específicas de clientes alrededor de ese core.