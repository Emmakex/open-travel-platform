# Roadmap

<p align="center"><a href="./ROADMAP.md">English</a> · <strong>Español</strong></p>

Open Travel Platform es el core open-source reutilizable bajo licencia MIT. **Kairoseth Travel** es la implementación comercial/de referencia oficial desplegada en **https://travel.kairoseth.com**.

El roadmap mantiene alineados dos objetivos:

1. conservar el core público portable, neutral respecto a proveedores y útil para otras agencias/desarrolladores;
2. continuar endureciendo Kairoseth Travel sin acoplar el core a un PSP, proveedor, CRM, ERP, CMS, vendor de identidad o hosting concreto.

_Última actualización: 26 de agosto de 2026._

---

# Posición actual

La plataforma está muy por encima del MVP original de catálogo/reservas. Ya están implementadas identidad persistente, reservas/inventario transaccionales, pricing por viajero, alojamiento, servicios independientes, pagos, datos post-compra, modificaciones, workflow Operator avanzado, permisos granulares, documentos, reporting y la infraestructura común de integraciones.

**La Fase 8C — Adapters de negocio está EN CURSO. 8C-1 adapter REST genérico de reservas, 8C-2 fulfilment de proveedores y 8C-3 sincronización CRM están COMPLETADAS. La Fase 8C-4 — adapter ERP/contabilidad es la SIGUIENTE.**

La validación E2E TEST/LIVE con credenciales Stripe/Redsys sigue pendiente hasta disponer de cuentas proveedor adecuadas. Los adapters están implementados, pero la capacidad productiva de pagos no se considera validada hasta probar dichos flujos.

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

# Fase 8 — Integraciones externas — EN CURSO

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

## 8C — Adapters de negocio — EN CURSO

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

### 8C-4 — Adapter ERP/contabilidad — SIGUIENTE

Objetivo: sincronizar documentos/movimientos preparados para contabilidad sin permitir que el ERP reescriba estados de reserva ni el ledger neutral de pagos.

Frontera prevista:

- interfaz neutral ERP/contabilidad;
- contrato explícito para clientes, facturas/recibos o movimientos contables según corresponda;
- payload contable derivado de snapshots autoritativos de reserva/pago, nunca documentos crudos de proveedor;
- moneda exacta y referencias de origen inmutables;
- idempotencia determinista y mapping de IDs externos;
- auditoría/retry/dead-letter mediante el worker de integraciones cuando aplique;
- sin datos protegidos del viajero, notas operativas de proveedor ni valores de autenticación;
- los acknowledgements del ERP no pueden modificar automáticamente historial de reservas/pagos;
- mapping específico de plan contable/impuestos contenido en adapters.

### Candidatos posteriores 8C

- adapter de fuente CMS/catálogo;
- identidad enterprise/SSO cuando aporte valor;
- PSP adicionales cuando exista justificación comercial.

---

# Fase 9 — Endurecimiento productivo

Debe avanzar de forma incremental sin esperar a finalizar la Fase 8.

### Testing
- E2E navegador registro → reserva → paquete/servicios → pago → Operator;
- integración/concurrencia MongoDB;
- webhooks/idempotencia de pagos;
- pricing de viajeros/menores y modificaciones;
- tests de contratos/integración de adapters;
- accesibilidad/rendimiento.

### Seguridad/privacidad
- CSRF, rate limiting, CSP/security headers y cookies/sesiones;
- escaneo de dependencias/secretos;
- revisión de auditoría privilegiada;
- recuperación/rotación de claves y backup/restore;
- workflows GDPR/privacidad/reservas/cookies/retención/exportación/eliminación;
- revisión regulatoria por mercado.

### Observabilidad/operaciones
- logs estructurados y errores centralizados;
- uptime/health;
- visibilidad de fallos de pagos/integraciones;
- disaster recovery/rollback;
- revisión de índices/rendimiento de base de datos.

---

# Fase 10 — Productización open-source

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
8C-4  Adapter ERP/contabilidad
  ↓
8C    Adapters de negocio restantes según valor comercial
  ↓
9     Endurecimiento productivo
  ↓
10    Productización open-source / release
```

La validación TEST/LIVE Stripe/Redsys debe insertarse en cuanto existan cuentas proveedor adecuadas y no necesita bloquear la Fase 8.

---

# No-objetivos del core

Open Travel Platform no debe quedar ligado permanentemente a una pasarela, CMS, CRM/ERP, proveedor de reservas, vendor de identidad, hosting o infraestructura exclusiva de Kairoseth.

El core público permanece bajo licencia MIT y reutilizable. Kairoseth Travel puede añadir servicios alojados/comerciales, adapters premium/privados e integraciones específicas de clientes alrededor de ese core.
