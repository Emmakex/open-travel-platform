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

Las bases completadas incluyen identidad persistente cliente/personal, RBAC, reservas de viajes/servicios, pricing por viajero, servicios independientes, email transaccional, contabilidad de pagos, configuración cifrada de PSP, adapters de checkout neutrales, depósitos/cuotas, datos post-compra cifrados, modificaciones de reserva, alojamiento reutilizable, inventario transaccional de habitaciones, suplementos opcionales, responsable/notas de reserva, tareas/seguimientos, fulfilment de proveedores, colas operativas avanzadas, modificación post-reserva de suplementos, permisos granulares, PDFs de confirmación, manifiestos de viajeros y rooming lists PDF.

La validación E2E con credenciales Stripe/Redsys continúa pendiente hasta disponer de cuentas proveedor adecuadas. Los adapters están implementados, pero la capacidad de pago productiva no se considera validada hasta probar TEST/LIVE.

**Las Fases 6B, 6C y 7A están funcionalmente completadas. La Fase 7B — Documentos, exportaciones y reporting está EN CURSO: 7B-1 PDFs de confirmación y 7B-2 listas de viajeros/rooming lists están completadas. 7B-3 vouchers y expediente imprimible es el SIGUIENTE bloque.**

---

# Hitos completados

## Foundation y catálogo — COMPLETADO

- base Next.js / React / TypeScript;
- adapters MongoDB;
- quality gates CI y checks de release;
- experiencia pública/Operator EN/ES;
- destinos y viajes;
- biblioteca GridFS, portadas, galerías y puntos focales;
- itinerarios multidioma;
- salidas, capacidad e inventario en vivo;
- despliegue público de referencia en `travel.kairoseth.com`.

## Identidad, RBAC y seguridad de cuenta — COMPLETADO

- registro/login persistente de clientes;
- autenticación persistente Operator/Admin;
- sesiones cliente/personal separadas;
- RBAC server-side y bloqueo de cuenta;
- cambio/recuperación de contraseña con SMTP;
- eventos de auditoría de autenticación.

## Operaciones de reserva y email — COMPLETADO

- reservas persistentes de viajes;
- ownership/pricing/inventario autoritativos en servidor;
- workflows confirmar/cancelar;
- liberación transaccional de inventario;
- vistas cliente/Operator;
- auditoría operativa;
- email transaccional de reserva.

## Fase 5A — Pagos neutrales respecto a proveedor — COMPLETADO

- ledger de pagos/reembolsos neutral;
- estado de pago independiente del estado de reserva;
- transferencia / efectivo / terminal externo;
- reembolsos controlados y protecciones de conciliación;
- visibilidad financiera Operator;
- metadata de provider/idempotencia.

## Fase 5B — Viajeros y pricing por edad — COMPLETADO

- viajero principal e individuales;
- fecha de nacimiento / nacionalidad;
- bandas de edad y pricing por salida configurables;
- tutor requerido para menores;
- consumo de plaza configurable por banda;
- snapshots históricos de viajeros/pricing.

## Fase 5C — Catálogo independiente de servicios — COMPLETADO

- Actividades, Transporte y Protección de viaje;
- catálogo/fichas públicas;
- CRUD protegido Operator;
- contenido multidioma;
- pricing por persona / reserva / unidad / edad.

## Fase 5D — Disponibilidad e inventario de servicios — COMPLETADO

- calendarios de actividad/transporte;
- slots de fecha/hora;
- capacidad/plazas reservadas e inventario de unidades;
- cierre seguro de slots;
- inventario de servicios separado del viaje.

## Fase 5E — Reservas independientes de servicios — COMPLETADO

- reservas de actividad, transporte y protección;
- relación opcional con viaje Kairoseth;
- modo independiente para viajes reservados externamente;
- inventario transaccional;
- Mis servicios y cola Operator;
- pagos de servicios en el ledger común.

## Fase 5F — PSP y checkout unificado — IMPLEMENTADO

- configuración TEST/LIVE solo Admin;
- adapters Stripe/Redsys;
- secretos cifrados;
- checkout unificado viaje/servicio;
- webhooks Stripe firmados + idempotencia;
- notificaciones Redsys firmadas;
- retornos de navegador no autoritativos;
- E2E TEST/LIVE con credenciales pendiente de cuentas proveedor.

## Fase 5G — Depósitos, cuotas y condiciones de pago — COMPLETADO

- políticas de pago completo/depósito;
- depósitos y cuotas configurables;
- snapshots de condiciones y vencimientos;
- saldo pendiente / próximo pago;
- calendario cliente y gestión Operator.

## Fase 6A — Datos post-compra seguros de viajeros — COMPLETADO

- presets de requisitos y snapshot por reserva;
- documento/identidad/residencia solo cuando aplica;
- deadlines de edición;
- cifrado AES-256-GCM y almacenamiento sensible separado;
- retención/borrado TTL;
- auditoría solo de nombres de campos;
- visibilidad de completitud Operator;
- escaneos de DNI/pasaporte y datos médicos fuera del flujo estándar.

## Fase 6A.1 — UX/documentación de datos de viajeros — COMPLETADO

- estados No requerido / Pendiente / Completo;
- tareas visibles para cliente;
- completitud agregada/por viajero para Operator;
- semántica de snapshot explícita;
- documentación y pruebas EN/ES.

## Fase 6B — Modificaciones de reserva — COMPLETADO

- historial explícito de modificaciones con actor, motivo, before/after y fecha;
- correcciones controladas de viajeros;
- cambio atómico de salida reservando primero la nueva capacidad;
- recalculo de pricing y reasignación de alojamiento;
- delta financiero sin reescribir movimientos del ledger;
- revisión controlada de reembolso, nunca devolución automática;
- visibilidad/cancelación de servicios vinculados;
- plazos de modificación/cancelación guardados como snapshot y notificaciones configurables.

## Fase 6C — Alojamiento, suplementos y composición de paquetes — COMPLETADO

- dominio reutilizable de alojamiento y habitaciones;
- inventario y límites de ocupación;
- catálogo público/Operator;
- galerías de establecimiento y habitación;
- vínculos viaje ↔ alojamiento y tarifas de referencia;
- pricing estacional y por ocupación;
- distribución automática viajeros → habitaciones;
- inventario de viaje + habitación transaccional;
- contabilidad correcta de alojamiento incluido/opcional;
- reasignación de alojamiento al cambiar salida;
- suplementos opcionales sin inventario;
- pricing y snapshots server-side de suplementos.

---

# Madurez operativa

## Fase 7A — Operaciones avanzadas — COMPLETADO

Objetivo cumplido: convertir Operator en herramienta de trabajo diaria para operaciones turísticas, no solo catálogo y estados de reserva.

### 7A-1 — Responsable, notas y prioridad — COMPLETADO

- asignación de responsable/operador;
- notas internas nunca expuestas al cliente;
- prioridad baja / normal / alta / urgente;
- tags normalizados y timeline operativo;
- auditoría e invariante permanente de privacidad.

### 7A-2 — Tareas y seguimientos — COMPLETADO

- tareas sobre reserva de viaje / servicio / cliente;
- responsable, vencimiento y estado;
- vistas vencidas/hoy/próximas;
- dashboard global y Mis tareas;
- comentarios append-only y cambios auditados.

### 7A-3 — Proveedor/fulfilment — COMPLETADO

- fulfilment por componente de viaje/servicio/alojamiento;
- estados no solicitado / solicitado / confirmado / rechazado / cancelado;
- referencia/localizador proveedor;
- coste interno opcional + moneda;
- deadline y visibilidad de vencidos;
- notas/eventos append-only;
- cola global y métricas de atención;
- datos de proveedor no reescriben total de cliente ni ledger.

### 7A-4 — Búsqueda, filtros y colas — COMPLETADO

- búsqueda libre por reserva/cliente/viaje/viajero/responsable/tag;
- filtros de reserva/pago/responsable/prioridad/tag/salida;
- filtros de saldo pendiente y cuotas vencidas;
- vistas Mías / Requieren atención / Sin responsable;
- orden y paginación server-side;
- invariante permanente de CI.

### 7A-5 — Modificación post-reserva de suplementos — COMPLETADO

- añadir/quitar suplementos después de reservar;
- cambiar asignación por viajero;
- conservar precio contratado de suplementos existentes;
- usar precio actual solo para suplementos nuevos;
- snapshots before/after exactos;
- delta financiero gestionado por el modelo 6B;
- notificación al cliente sin exponer motivo interno.

### 7A-6 — Permisos granulares — COMPLETADO

- Admin como superusuario completo;
- matriz explícita de capacidades más limitada para Operator;
- perfil heredado preservado hasta restricción explícita;
- capacidades separan reservas, catálogo, finanzas, datos protegidos, proveedores y tareas;
- autorización de rutas/actions/carga de datos usando las mismas fronteras server-side;
- cambios persistidos y auditados transaccionalmente;
- invariante permanente `check:staff-permissions`.

---

# Fase 7B — Documentos, exportaciones y reporting — EN CURSO

Objetivo: soportar documentación e informes habituales de operaciones turísticas sin filtrar datos protegidos o exclusivamente internos.

## 7B-1 — PDFs de confirmación de reserva — COMPLETADO

- capa PDF server-side reutilizable con `pdf-lib`;
- descarga de confirmación propia para cliente;
- workspace protegido Documentos en Operator;
- confirmación EN/ES con fechas, viajeros, alojamiento y suplementos;
- resumen de contacto y total actual;
- datos de pago para cliente y solo para personal con permiso Finanzas;
- sin notas internas, referencias/costes proveedor ni datos protegidos de viajeros;
- endpoints privados `no-store`;
- nombres seguros e invariante de PDF real en CI.

## 7B-2 — Listas de viajeros y rooming lists — COMPLETADO

- manifiesto operativo de viajeros agrupado por salida/reserva;
- rooming list derivada de la asignación de alojamiento guardada como snapshot;
- rutas PDF protegidas desde el workspace Documentos;
- salida imprimible EN/ES;
- acceso controlado por capacidades server-side;
- solo datos ordinarios del snapshot de reserva/viajero;
- campos documentales post-compra, datos de proveedor y notas internas excluidos;
- respuestas privadas `no-store` y nombres de archivo seguros;
- invariante permanente `check:departure-documents` en CI.

## 7B-3 — Vouchers y expediente imprimible — SIGUIENTE

- vouchers de alojamiento;
- vouchers de servicios independientes;
- referencias de proveedor orientadas al cliente solo cuando estén configuradas explícitamente para divulgación;
- expediente consolidado imprimible de reserva para Operator;
- fecha/hora de generación y versión/estado explícitos;
- fronteras de privacidad/autorización e invariantes PDF permanentes.

## 7B-4 — Exportaciones CSV/XLSX y reporting de conciliación

- exportaciones de reservas/servicios;
- exportaciones de clientes;
- conciliación de pagos y saldos pendientes;
- exportación segura/auditada de datos de viajeros para uso operativo legítimo;
- ingresos por producto/servicio;
- dashboards operativos/comerciales.

---

# Fase 8 — Integraciones externas

Objetivo: conectar despliegues con ecosistemas reales mediante adapters sin contaminar el core con payloads de proveedor.

Candidatos:

- APIs de proveedores/reservas;
- CRM;
- ERP/contabilidad;
- webhooks salientes;
- fuente CMS/catálogo;
- identidad enterprise;
- adapter REST genérico;
- PSP adicionales.

# Fase 9 — Hardening productivo

Testing:

- E2E navegador registro → reserva → alojamiento/extras → servicio → pago → Operator;
- integración MongoDB;
- webhooks/idempotencia de pagos;
- viajeros/menores/pricing;
- concurrencia inventario viaje/servicio/habitación;
- E2E de modificaciones/reasignación;
- regresión de accesibilidad y performance budgets;
- contract tests de adapters.

Seguridad y privacidad:

- revisión CSRF, rate limiting y CSP/security headers;
- revisión cookies/sesiones;
- scanning dependencias/secretos;
- auditoría de acciones privilegiadas;
- recuperación/rotación de claves de pagos/viajeros;
- backup/restore;
- privacidad/RGPD, términos de reserva, cookies, retención/borrado y exportación/borrado de cliente;
- revisión de distribución de seguros y normativa por mercado cuando aplique.

Observabilidad y operaciones:

- logs estructurados y reporting centralizado de errores;
- uptime/health;
- visibilidad de fallos webhook/pago;
- backup/disaster recovery y rollback;
- revisión de índices/rendimiento.

# Fase 10 — Productización open-source

- documentación productiva de entorno;
- seed/setup limpio;
- guía de instalación/despliegue fresh clone;
- adapters de referencia y contratos de extensiones/plugins;
- releases versionadas y notas de migración;
- templates de issues/contribución;
- documentación pública de API/extensiones;
- ejemplo Docker/self-host opcional;
- política de marca/trademark;
- adapters propietarios Kairoseth/cliente fuera del core MIT cuando corresponda.

---

# Orden recomendado

```text
7B  Documentos / exportaciones / reporting
 ↓
8   Integraciones externas
 ↓
9   Hardening productivo
 ↓
10  Productización open-source / release
```

La validación TEST Stripe/Redsys con credenciales debe insertarse cuando existan las cuentas proveedor necesarias; no bloquea 7B.

El testing/security de Fase 9 debe continuar incrementalmente, especialmente en pagos, datos de viajeros, modificaciones e inventario concurrente.

---

# No-objetivos del core

Open Travel Platform **no** debe quedar ligado permanentemente a una sola pasarela, CMS, CRM/ERP, proveedor de reservas, proveedor de identidad, hosting o infraestructura exclusiva de Kairoseth.

El core público sigue bajo MIT y reutilizable. Kairoseth Travel puede construir hosting comercial, soporte, implementación, adapters premium/privados e integraciones específicas alrededor del core.
