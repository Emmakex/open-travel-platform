# Roadmap

<p align="center"><a href="./ROADMAP.md">English</a> · <strong>Español</strong></p>

Open Travel Platform es el core open-source reutilizable bajo licencia MIT. **Kairoseth Travel** es la implementación comercial/de referencia oficial desplegada en **https://travel.kairoseth.com**.

El roadmap mantiene alineados dos objetivos:

1. conservar el core público portable, neutral respecto a proveedores y útil para otras agencias/desarrolladores;
2. continuar endureciendo Kairoseth Travel hasta convertirlo en una plataforma turística completa sin acoplar el core a un PSP, proveedor, CRM, ERP, CMS o hosting concreto.

_Última actualización: 26 de agosto de 2026._

---

# Posición actual

El proyecto está muy por encima del MVP original de catálogo/reservas.

Las bases completadas incluyen identidad persistente cliente/personal, RBAC, reservas de viajes/servicios, pricing por viajero, servicios independientes, email transaccional, contabilidad de pagos neutral respecto a proveedor, adapters Stripe/Redsys, depósitos/cuotas, datos post-compra cifrados, modificaciones de reserva, alojamiento reutilizable, inventario transaccional de habitaciones, suplementos, operaciones avanzadas, permisos granulares, documentos de reserva/salida, vouchers seguros para cliente, expedientes internos, reporting CSV/XLSX, exportaciones sensibles auditadas, eventos salientes neutrales, operativa programada de integraciones, un adapter REST genérico de reservas y una frontera neutral de adapter de fulfilment de proveedores.

La validación E2E con credenciales Stripe/Redsys sigue pendiente hasta disponer de cuentas proveedor adecuadas. Sus adapters están implementados, pero la capacidad productiva de pagos no se considera validada hasta probar los flujos TEST/LIVE.

**Las Fases 6B, 6C, 7A, 7B, 8A y 8B están completadas. La Fase 8C — Adapters de negocio está EN CURSO. La Fase 8C-1 — Adapter REST genérico de reservas y la Fase 8C-2 — Frontera de adapter de fulfilment de proveedores están COMPLETADAS. La Fase 8C-3 — Adapter de sincronización CRM es la SIGUIENTE.**

---

# Hitos completados

## Foundation y catálogo — COMPLETADO

- base Next.js / React / TypeScript;
- adapters de capacidades MongoDB;
- quality gates de CI/release;
- experiencia pública y Operator EN/ES;
- destinos, viajes e itinerarios multidioma estructurados;
- GridFS, portadas, galerías y puntos focales;
- salidas, capacidad e inventario vivo;
- despliegue público de referencia en `travel.kairoseth.com`.

## Identidad, RBAC y seguridad de cuenta — COMPLETADO

- autenticación persistente cliente/personal;
- sesiones cliente/personal separadas;
- RBAC y capacidades granulares server-side;
- bloqueo, cambio/recuperación de contraseña y SMTP;
- eventos de auditoría de autenticación.

## Operaciones de reserva y email — COMPLETADO

- reservas persistentes de viajes;
- pricing, ownership e inventario autoritativos en servidor;
- workflows confirmar/cancelar con liberación transaccional de inventario;
- vistas cliente/Operator y auditoría operativa;
- email transaccional de reserva.

## Fase 5A — Pagos neutrales respecto a proveedor — COMPLETADO

- ledger de pagos/reembolsos separado del estado de reserva;
- transferencia, efectivo y terminal externo;
- reembolsos controlados y protecciones de conciliación;
- visibilidad financiera Operator;
- metadata de provider/idempotencia.

## Fase 5B — Viajeros y pricing por edad — COMPLETADO

- viajero principal e individuales;
- fecha de nacimiento y nacionalidad;
- bandas de edad configurables y pricing por salida;
- reglas de tutor para menores;
- consumo de plazas configurable;
- snapshots históricos de viajero/pricing.

## Fase 5C — Catálogo independiente de servicios — COMPLETADO

- Actividades, Transporte y Protección de viaje;
- catálogo y fichas públicas;
- CRUD Operator protegido;
- contenido multidioma;
- pricing por persona / reserva / unidad / edad.

## Fase 5D — Disponibilidad e inventario de servicios — COMPLETADO

- calendarios y slots de actividad/transporte;
- capacidad/plazas reservadas e inventario de unidades;
- cierre seguro de slots;
- inventario de servicios separado del inventario de viajes.

## Fase 5E — Reservas independientes de servicios — COMPLETADO

- reservas de actividad, transporte y protección;
- relación opcional con un viaje Kairoseth;
- inventario transaccional de servicios;
- Mis servicios para cliente y cola Operator;
- ledger de pagos común.

## Fase 5F — Proveedores de pago y checkout unificado — IMPLEMENTADO

- configuración TEST/LIVE exclusiva de Admin;
- credenciales Stripe/Redsys cifradas;
- checkout unificado de viaje/servicio;
- webhooks Stripe firmados + idempotencia;
- notificaciones server-side Redsys firmadas;
- los retornos del navegador no son autoritativos;
- E2E TEST/LIVE con credenciales todavía pendiente de cuentas proveedor.

## Fase 5G — Depósitos, cuotas y condiciones de pago — COMPLETADO

- políticas de pago completo/depósito;
- depósitos/cuotas configurables;
- snapshots de vencimientos;
- cálculo de saldo pendiente y próximo pago;
- calendario cliente y gestión Operator.

## Fase 6A — Datos post-compra seguros del viajero — COMPLETADO

- presets de requisitos y snapshots por reserva;
- campos avanzados de identidad/documento/residencia solo cuando son necesarios;
- deadlines;
- cifrado AES-256-GCM y almacenamiento sensible separado;
- retención/eliminación TTL;
- auditoría solo de nombres de campos;
- visibilidad Operator de completitud;
- escaneos DNI/pasaporte y datos de salud excluidos del flujo estándar.

## Fase 6A.1 — UX/documentación de datos de viajero — COMPLETADO

- estados No requerido / Pendiente / Completo;
- tareas visibles al cliente;
- completitud agregada/por viajero;
- semántica snapshot y guía EN/ES.

## Fase 6B — Modificaciones de reserva — COMPLETADO

- historial explícito con actor/motivo/before/after/timestamp;
- correcciones controladas de viajeros;
- cambios atómicos de salida;
- reasignación de pricing/alojamiento;
- delta financiero sin reescribir movimientos históricos del ledger;
- estado controlado de revisión de reembolso;
- tratamiento de servicios vinculados;
- deadlines de cambio/cancelación y notificaciones guardados como snapshot.

## Fase 6C — Alojamiento, suplementos y composición de paquetes — COMPLETADO

- alojamiento reutilizable y tipos de habitación;
- inventario de habitaciones y límites de ocupación;
- catálogo público/Operator y galerías;
- vínculos viaje ↔ alojamiento;
- pricing estacional/ocupación;
- asignación automática viajero → habitación;
- inventario transaccional viaje + habitación;
- contabilidad de alojamiento incluido/opcional;
- reasignación de alojamiento durante modificaciones;
- suplementos y snapshots server-authoritative.

---

# Fase 7A — Workflow avanzado de operaciones — COMPLETADO

### 7A-1 — Responsable, notas y prioridades — COMPLETADO
- asignación de responsable, notas internas, prioridad, tags y timeline;
- cambios auditados e invariante de privacidad cliente.

### 7A-2 — Tareas y seguimientos — COMPLETADO
- responsable, vencimiento, estado, comentarios y vistas de dashboard;
- cambios auditados.

### 7A-3 — Seguimiento proveedor/fulfilment — COMPLETADO
- fulfilment por componente de viaje/servicio/alojamiento;
- estado/referencia/coste/deadline de proveedor;
- notas, auditoría, cola global y métricas de atención;
- los datos de proveedor no pueden reescribir totales de cliente ni ledger.

### 7A-4 — Búsqueda, filtros y colas operativas — COMPLETADO
- búsqueda libre y filtros de reserva/pago/responsable/prioridad/tag/salida;
- filtros de saldo/cuotas;
- vistas Mías / Requieren atención / Sin responsable;
- orden y paginación.

### 7A-5 — Workflow de modificación de suplementos — COMPLETADO
- añadir/quitar suplementos post-reserva;
- cambios de asignación de viajeros;
- preservación de precio contratado;
- snapshots exactos before/after y delta financiero.

### 7A-6 — Permisos granulares de personal — COMPLETADO
- Admin superusuario + matriz Operator más limitada;
- capacidades reservas/catálogo/finanzas/datos-viajero/proveedores/tareas;
- fronteras server-authoritative de rutas/actions/datos;
- auditoría transaccional de permisos;
- invariante CI permanente.

---

# Fase 7B — Documentos, exportaciones y reporting — COMPLETADO

## 7B-1 — PDFs de confirmación — COMPLETADO

- capa reutilizable `pdf-lib`;
- confirmaciones cliente y Operator;
- render EN/ES;
- fechas, viajeros, alojamiento, suplementos y resumen de contacto;
- finanzas solo cuando hay permiso;
- endpoints privados `no-store` e invariante PDF permanente.

## 7B-2 — Listas de viajeros y rooming lists — COMPLETADO

- manifiestos de viajeros por salida;
- rooming lists desde asignaciones guardadas como snapshot;
- rutas PDF Operator protegidas;
- salida imprimible EN/ES;
- datos post-compra protegidos, proveedores y notas internas excluidos;
- gate permanente `check:departure-documents`.

## 7B-3 — Vouchers y expediente imprimible — COMPLETADO

- vouchers de alojamiento/servicio seguros para cliente;
- descarga Operator autorizada del mismo voucher seguro;
- expediente interno consolidado;
- secciones de finanzas/proveedores cargadas solo con la capacidad correspondiente;
- versión/estado y timestamp UTC explícitos;
- referencias proveedor internas por defecto y divulgación de referencia exacta explícitamente aprobada/auditada;
- cambiar una referencia invalida la aprobación anterior;
- costes proveedor, notas internas y valores protegidos del viajero excluidos de vouchers de cliente;
- respuestas privadas `no-store` + `nosniff`;
- invariante permanente `check:voucher-documents`.

## 7B-4 — CSV/XLSX, conciliación y reporting — COMPLETADO

- workspace protegido `/operator/reports`;
- exportaciones CSV/XLSX de reservas de viaje, servicios y clientes;
- contratos tabulares compartidos y estables;
- filtros server-side por fecha y exportaciones de navegador limitadas;
- conciliación, saldos/vencidos e ingresos solo con permiso Finanzas;
- agrupación y dashboards seguros por moneda;
- mitigación de inyección de fórmulas CSV/spreadsheet;
- XLSX OOXML ligero con cabecera congelada/autofiltro;
- auditoría persistente de exportaciones sin guardar valores de celdas;
- exportación de viajeros protegidos aislada, ligada a finalidad y fail-closed ante fallo de auditoría;
- gate permanente `check:reporting-exports` y documentación EN/ES.

---

# Fase 8 — Integraciones externas — EN CURSO

Objetivo: conectar despliegues con ecosistemas de negocio reales mediante adapters, manteniendo los payloads específicos de proveedor fuera de los dominios centrales.

## 8A — Integraciones salientes neutrales respecto a proveedor — COMPLETADO

- sobre versionado de eventos de reservas de viaje/servicio;
- outbox transaccional MongoDB dentro de la misma transacción de la reserva;
- entrega idempotente por `(eventId, endpointId)`;
- configuración Admin de endpoints y suscripciones;
- secretos de firma AES-256-GCM dedicados;
- adapter webhook HTTPS firmado HMAC-SHA256;
- validación solo HTTPS, bloqueo de redes privadas/reservadas y revalidación DNS;
- conexión al IP validado conservando SNI/Host original;
- sin redirects, timeout y respuesta limitados;
- leasing, recuperación tras caída, reintentos/backoff e historial dead-letter;
- datos protegidos del viajero excluidos de eventos genéricos;
- gate permanente `check:outbound-integrations`.

## 8B — Ejecución programada, replay y observabilidad — COMPLETADO

- entry point server-only `POST /api/internal/integrations/process`;
- autenticación Bearer dedicada con comparación timing-safe;
- lease durable del worker compartido por scheduler/ejecución manual Admin;
- controles limitados de lote/frecuencia y `Retry-After`;
- replay dead-letter auditado desde Admin;
- vistas de detalle de evento/entrega e historial de intentos;
- métricas de salud para pending/retrying/dead-letter, vencida más antigua y éxito/fallo 24h;
- política de retención de éxitos completados preservando trabajo activo/dead-letter/auditoría de replay;
- respuestas scheduler privadas `no-store` + `nosniff`;
- gate permanente `check:integration-operations`.

## 8C — Adapters de negocio — EN CURSO

Los adapters concretos de negocio se sitúan detrás de interfaces neutrales respecto a proveedor y no deben convertirse en autoritativos fuera de la capacidad que tienen asignada.

### 8C-1 — Adapter REST genérico de reservas — COMPLETADO

- `BOOKING_MODE=rest` detrás de la interfaz existente `BookingRepository`;
- contrato `/v1` versionado mediante `X-OTP-Contract-Version: 1`;
- autenticación Bearer server-only y HTTPS obligatorio en producción;
- sin redirects, `no-store`, timeout limitado y cap de respuesta en streaming;
- validación runtime antes de que JSON externo entre en el dominio de reservas;
- ownership del cliente y alcance viaje/salida revalidados tras el mapping;
- create/cancel usan claves de idempotencia estables y reintentos transitorios limitados;
- traducción estable de errores de aplicación;
- ledger, operaciones de personal, catálogo, datos de viajeros e integraciones salientes siguen siendo componibles por separado;
- documentación EN/ES y gate permanente `check:rest-booking-adapter`.

### 8C-2 — Frontera de adapter de fulfilment de proveedores — COMPLETADO

- interfaz neutral `SupplierFulfilmentAdapter`;
- composición opt-in `disabled | rest` independiente de la persistencia de reservas;
- operaciones REST v1 versionadas `request`, `status` y `cancel`;
- `request` solo normaliza a `requested`; `cancel` solo normaliza a `cancelled`; confirmación/rechazo llega mediante `status`;
- autenticación Bearer server-only y HTTPS obligatorio en producción;
- rechazo de redirects, `no-store`, timeout limitado y cap de respuesta en streaming;
- claves de idempotencia deterministas para request/cancel con reintentos transitorios limitados;
- payload externo mínimo: IDs operativos del componente, nombre/referencia de proveedor y deadline;
- totales de cliente, ledger de pagos/reembolsos, coste proveedor, instrucciones de inventario y datos protegidos del viajero excluidos del payload genérico;
- respuesta externa normalizada persistida en `travel_supplier_fulfilment_adapter_audit` antes de aplicarse localmente;
- la respuesta vuelve a entrar por la frontera existente `saveSupplierFulfilment()`;
- transiciones externas inválidas se registran como conflicto y nunca se fuerzan;
- coste/moneda de proveedor locales se preservan explícitamente;
- referencias devueltas externamente siguen internas hasta aprobar el flujo separado de referencia exacta para voucher de cliente;
- controles Operator protegidos por la capacidad existente `suppliers`;
- seguimiento manual de proveedor sigue totalmente disponible cuando el adapter externo está desactivado;
- documentación EN/ES, plantilla de entorno y gate CI permanente `check:supplier-fulfilment-adapter`.

### 8C-3 — Adapter de sincronización CRM — SIGUIENTE

Objetivo: sincronizar información seleccionada del ciclo de vida de clientes/reservas con sistemas CRM sin convertir al CRM en autoritativo para reservas, inventario, pricing o contabilidad de pagos.

Alcance previsto:

- interfaz neutral de sincronización CRM;
- contrato normalizado de contacto/ciclo de vida de reserva;
- semántica explícita create/update con referencias externas estables;
- mutaciones salientes idempotentes y traducción estable de errores de proveedor;
- allowlists estrictas de campos y minimización de datos;
- sin datos post-compra protegidos del viajero en el contrato CRM genérico;
- outcomes de sincronización auditados y visibilidad operativa de reintentos;
- autenticación/mapping específicos de CRM contenidos dentro de adapters;
- reservas, fulfilment de proveedores, ledger e inventario siguen siendo autoritativos en sus fronteras actuales.

### Candidatos posteriores de 8C

- ERP/contabilidad;
- fuentes CMS/catálogo;
- identidad enterprise cuando corresponda;
- proveedores de pago adicionales cuando aporten valor comercial.

Los payloads específicos de proveedor deben permanecer dentro de adapters y consumir fronteras estables neutrales, sin filtrarse a dominios centrales.

---

# Fase 9 — Endurecimiento productivo

### Testing
- E2E navegador registro → reserva → alojamiento/extras → servicio → pago → Operator;
- tests de integración MongoDB;
- tests de webhooks/idempotencia de pagos;
- tests de pricing de viajeros/menores;
- tests de concurrencia de inventario viaje/servicio/habitación;
- E2E de modificaciones/reasignación;
- accesibilidad/rendimiento y tests de contratos de adapters.

### Seguridad/privacidad
- CSRF, rate limiting, CSP/security headers y revisión de cookies/sesiones;
- escaneo de dependencias/secretos;
- revisión de auditoría de acciones privilegiadas;
- procedimientos de recuperación/rotación de claves y backup/restore;
- workflows GDPR/privacidad/reservas/cookies/retención/exportación/eliminación;
- revisión regulatoria por mercado.

### Observabilidad/operaciones
- logs estructurados y errores centralizados;
- monitorización de uptime/salud;
- visibilidad de fallos webhook/pago/integraciones;
- disaster recovery y rollback;
- revisión de índices/rendimiento de base de datos.

---

# Fase 10 — Productización open-source

- documentación de entorno productivo;
- seed/setup demo limpio;
- guía de instalación/despliegue desde clon limpio;
- adapters de referencia y contratos de extensión;
- releases/migraciones versionadas;
- templates de contribución;
- documentación pública de API/extensiones;
- ejemplo opcional Docker/self-host;
- política de marca/trademark;
- adapters propietarios de Kairoseth/clientes fuera del core MIT cuando corresponda.

---

# Orden de entrega sugerido

```text
8C-3  Adapter de sincronización CRM
  ↓
8C    Adapters de negocio restantes según valor comercial
  ↓
9     Endurecimiento productivo
  ↓
10    Productización open-source / release
```

La validación TEST/LIVE con credenciales Stripe/Redsys debe insertarse en cuanto existan cuentas proveedor adecuadas y no necesita bloquear la Fase 8.

El trabajo de testing/seguridad de la Fase 9 debe continuar de forma incremental, sin esperar al final.

---

# No-objetivos del core

Open Travel Platform no debe quedar ligado permanentemente a una pasarela de pago, CMS, CRM/ERP, proveedor de reservas, vendor de autenticación, plataforma de hosting o infraestructura exclusiva de Kairoseth.

El core público permanece bajo licencia MIT y reutilizable. Kairoseth Travel puede construir alrededor hosting comercial, soporte, adapters premium/privados e integraciones específicas de clientes.
