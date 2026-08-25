# Roadmap

<p align="center"><a href="./ROADMAP.md">English</a> · <strong>Español</strong></p>

Open Travel Platform es el core open-source reutilizable bajo licencia MIT. **Kairoseth Travel** es la implementación comercial/de referencia oficial desplegada en **https://travel.kairoseth.com**.

El roadmap mantiene alineados dos objetivos:

1. conservar el core público portable, neutral respecto a proveedores y útil para otras agencias/desarrolladores;
2. continuar endureciendo Kairoseth Travel hasta convertirlo en una plataforma turística completa sin acoplar el core a un PSP, proveedor, CRM, ERP, CMS o hosting concreto.

_Última actualización: 25 de agosto de 2026._

---

# Posición actual

El proyecto ya está muy por encima del MVP inicial de catálogo/reservas.

Las bases completadas incluyen identidad persistente cliente/personal, RBAC, reservas de viajes/servicios, pricing por viajero, servicios independientes, email transaccional, contabilidad de pagos, configuración cifrada de PSP, checkout neutral respecto al proveedor, depósitos/cuotas, datos post-compra cifrados, modificaciones de reserva, alojamiento reutilizable, inventario transaccional de habitaciones, suplementos opcionales del paquete, responsable/notas de reserva, tareas y seguimientos internos y gestión de proveedores/fulfilment.

La validación E2E con credenciales Stripe/Redsys continúa pendiente hasta disponer de cuentas de proveedor adecuadas. Los adapters están implementados, pero la capacidad de pago productiva no se considera validada hasta probar TEST/LIVE.

**Las Fases 6B y 6C están funcionalmente completadas. La Fase 7A — Operaciones avanzadas está EN CURSO: 7A-1, 7A-2 y 7A-3 están completadas y el siguiente bloque es 7A-4 — búsqueda, filtros y colas operativas.**

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
- salidas, capacidad e inventario;
- despliegue público en `travel.kairoseth.com`.

## Identidad, RBAC y seguridad — COMPLETADO

- registro/login persistente de clientes;
- autenticación Operator/Admin;
- sesiones separadas cliente/personal;
- RBAC server-side;
- bloqueo de cuenta;
- cambio/recuperación de contraseña;
- SMTP de recuperación;
- auditoría de autenticación.

## Operaciones de reserva y email — COMPLETADO

- reservas persistentes de viajes;
- ownership/pricing/inventario validados en servidor;
- workflows confirmar/cancelar;
- liberación transaccional de inventario;
- cola de reservas Operator;
- historial de cliente;
- auditoría operativa;
- emails transaccionales.

## Fase 5A — Pagos neutrales respecto a proveedor — COMPLETADO

- ledger de pagos/reembolsos;
- estado de pago separado del estado de reserva;
- unpaid / pending / partially paid / paid / partially refunded / refunded;
- transferencia / efectivo / terminal externo;
- reembolsos controlados;
- protecciones de conciliación;
- visibilidad financiera Operator;
- metadata provider/idempotency.

## Fase 5B — Viajeros y pricing por edad — COMPLETADO

- viajero principal e individuales;
- fecha de nacimiento / nacionalidad;
- bandas de edad configurables;
- precio por viajero y por salida;
- adulto responsable para menores;
- consumo de plaza configurable por banda;
- snapshots históricos de precio.

## Fase 5C — Catálogo independiente de servicios — COMPLETADO

- Actividades, Transporte y Protección de viaje;
- catálogo/fichas públicas;
- CRUD protegido;
- contenido multidioma;
- precio por persona / reserva / unidad / edad.

## Fase 5D — Disponibilidad e inventario de servicios — COMPLETADO

- calendarios de actividad/transporte;
- slots de fecha/hora;
- capacidad/plazas reservadas;
- inventario de unidades de transporte;
- cierre seguro de slots;
- inventario separado del viaje.

## Fase 5E — Reservas independientes de servicios — COMPLETADO

- actividad, transporte y protección;
- vínculo opcional a viaje Kairoseth;
- modo independiente para viajes externos;
- inventario transaccional;
- área Mis servicios;
- cola Operator;
- pagos en el ledger común.

## Fase 5F — PSP y checkout unificado — IMPLEMENTADO

- perfiles TEST/LIVE solo Admin;
- adapters Stripe y Redsys;
- secretos cifrados;
- checkout unificado viajes/servicios;
- webhooks Stripe firmados e idempotencia;
- notificaciones Redsys firmadas;
- retornos de navegador no autoritativos;
- E2E con credenciales pendiente de cuentas proveedor.

## Fase 5G — Depósitos, cuotas y condiciones de pago — COMPLETADO

- pago completo/depósito;
- depósitos configurables;
- cuotas y vencimientos;
- snapshots de condiciones;
- saldo pendiente y próximo pago;
- calendario de pagos cliente;
- gestión Operator;
- compatibilidad con movimientos manuales/online.

## Fase 6A — Datos post-compra de viajeros — COMPLETADO

- presets por producto;
- snapshot por reserva;
- documento/residencia solo cuando aplica;
- deadlines de edición;
- cifrado AES-256-GCM;
- almacenamiento separado;
- retención TTL;
- auditoría sin guardar valores sensibles;
- visibilidad de completitud Operator;
- sin subida estándar de DNI/pasaporte;
- datos médicos excluidos del flujo estándar.

## Fase 6A.1 — UX/documentación de datos de viajeros — COMPLETADO

- estados No requerido / Pendiente / Completo;
- tareas visibles para cliente;
- completitud agregada/por viajero en Operator;
- semántica de snapshot clara;
- documentación EN/ES.

## Fase 6B — Modificaciones de reserva — COMPLETADO

Objetivo cumplido: soportar cambios post-reserva sin destruir el historial original de reserva/pagos.

### 6B-1 — Modelo de modificaciones y correcciones de viajeros

- colección separada `travel_reservation_amendments`;
- cambios before/after;
- actor, motivo y fecha;
- correcciones controladas desde Operator;
- historial financiero intacto.

### 6B-2 — Cambio de salida e inventario atómico

- selección de salida alternativa;
- recalculo de edad/pricing en nueva fecha;
- reserva primero nueva capacidad y después libera la antigua;
- transacción/rollback MongoDB;
- protección contra overselling;
- historial con movimiento de inventario y delta de precio.

### 6B-3 — Delta financiero

- total actualizado después de modificación;
- saldo adicional cuando aumenta el precio;
- revisión de reembolso cuando baja por debajo de lo pagado;
- sin reembolso automático;
- movimientos del ledger nunca se reescriben;
- límites server-side de reembolso.

### 6B-4 — Servicios vinculados, notificaciones y plazos

- servicios independientes vinculados al viaje;
- servicios visibles desde la reserva principal;
- cancelación controlada y liberación de inventario;
- políticas de cambio/cancelación guardadas como snapshot;
- deadlines cliente/personal aplicados server-side;
- notificaciones configurables;
- motivos internos nunca se envían al cliente.

## Fase 6C — Alojamiento, suplementos y composición de paquetes — COMPLETADO

Objetivo cumplido: evolucionar de viajes + servicios independientes hacia paquetes reutilizables con alojamiento transaccional.

### 6C-1 — Base de alojamiento

- dominio reutilizable de alojamiento;
- tipos de habitación y límites de ocupación;
- periodos de inventario;
- catálogo público de alojamiento;
- gestión Operator;
- invariantes que evitan modificar reservas manualmente de forma insegura;
- portada mediante biblioteca multimedia compartida.

### 6C-2 — Vínculo con viajes y tarifas comerciales

- alojamiento reutilizable en varios viajes;
- múltiples estancias por viaje;
- componente con alojamiento + habitación + día entrada + noches;
- clasificación de habitación y régimen;
- tarifa base por noche;
- preview de coste por salida.

### 6C-3 — Galerías, temporadas y pricing por ocupación

- galería general del establecimiento;
- galería independiente por habitación;
- ajustes estacionales fijos/porcentuales;
- suplemento individual;
- ajustes de ocupación;
- reglas de niño compartiendo;
- pricing usando fecha real de salida;
- test permanente de invariantes de pricing.

### 6C-4 — Booking transaccional de alojamiento

- distribución automática viajeros → habitaciones;
- mínimo número válido de habitaciones;
- ocupación según edades reales;
- pricing autoritativo server-side;
- alojamiento incluido guardado como snapshot sin doble cobro;
- alojamiento opcional añadido al total;
- inventario viaje + hotel reservado/liberado en misma transacción MongoDB;
- snapshot visible para cliente/Operator;
- cambios de salida recalculan y reasignan alojamiento.

### Suplementos opcionales del paquete — COMPLETADO

- extras sin inventario configurables por Operator;
- contenido EN/ES;
- cobro por reserva o por viajero seleccionado;
- selección y total server-side;
- snapshot de precio/cantidad/asignación de viajeros;
- cambios de catálogo no alteran reservas históricas;
- gate permanente de CI para suplementos.

Las actividades/transporte con fecha o cupo siguen siendo reservas independientes y no suplementos ligeros.

---

# Próximas prioridades

## Fase 7A — Operaciones avanzadas — EN CURSO

Objetivo: convertir Operator en herramienta diaria completa para un equipo/agencia, no solo en backoffice de catálogo y estados.

### 7A-1 — Responsable, notas y prioridad — COMPLETADO

- asignación de responsable/operador con validación server-side de personal activo;
- notas internas separadas y nunca visibles al cliente;
- prioridad baja / normal / alta / urgente;
- tags normalizados;
- timeline operativo;
- auditoría de cambios de responsable/prioridad/tags;
- invariante permanente de privacidad en rutas de cliente.

### 7A-2 — Tareas y seguimientos — COMPLETADO

- tareas asociadas a reserva de viaje / reserva de servicio / cliente;
- responsable y vencimiento;
- estados abierta / en curso / completada / cancelada;
- visibilidad vencidas/hoy/próximas;
- dashboard global y vista Mis tareas;
- comentarios de seguimiento append-only y auditoría de cambios;
- validación server-side de objetivo y responsable;
- gate permanente de CI para tareas y privacidad.

### 7A-3 — Estado proveedor/fulfilment — COMPLETADO

- confirmación de proveedor por componente de viaje/servicio/alojamiento;
- claves de componentes reales resueltas server-side desde snapshots de reserva;
- estados no solicitado / solicitado / confirmado / rechazado / cancelado;
- referencia/localizador de proveedor;
- coste interno opcional + moneda;
- fecha límite de confirmación y visibilidad de vencidos;
- notas de proveedor append-only y eventos de auditoría before/after;
- cola global de proveedores;
- métricas de atención de proveedores en dashboard;
- costes/referencias solo internos y sin reescribir total cliente ni ledger;
- límite preparado para futuras integraciones con APIs de proveedor.

### 7A-4 — Búsqueda, filtros y colas — SIGUIENTE

- búsqueda avanzada de reservas;
- filtros por fecha/estado/operador/pago/prioridad/tag;
- incluir atención de tareas/proveedores cuando aporte valor;
- paginación;
- vistas guardadas más adelante si aportan valor;
- acciones masivas seguras con autorización server-side.

### 7A-5 — Modificación post-reserva de suplementos

Cerrar el pequeño hueco operativo restante de los extras del paquete:

- Operator añade/quita suplementos después de reservar;
- cambia asignación por viajero;
- reutiliza historial de modificaciones;
- reutiliza delta financiero 6B para cobro adicional/revisión de reembolso;
- notificación cliente cuando corresponda;
- snapshot anterior conservado en historial.

### 7A-6 — Permisos más granulares

- evolucionar más allá de operator/admin cuando sea necesario;
- least privilege;
- separar permisos de finanzas/catálogo/datos cliente donde tenga sentido.

## Fase 7B — Documentos, exportaciones y reporting

Objetivo: soportar documentos e informes habituales de operaciones turísticas.

- confirmación PDF/documento;
- listas de viajeros y rooming lists;
- vouchers;
- exportaciones reservas/servicios;
- exportación segura/auditada de datos de viajeros para uso legítimo;
- CSV/XLSX de clientes/pagos;
- conciliación y saldos pendientes;
- ingresos por producto/servicio;
- dashboards operativos/comerciales;
- expediente imprimible Operator.

## Fase 8 — Integraciones externas

Objetivo: conectar despliegues con ecosistemas reales mediante adapters sin contaminar el core con payloads de proveedor.

- APIs proveedores/reservas;
- CRM;
- ERP/contabilidad;
- webhooks salientes;
- fuente CMS/catálogo;
- identidad enterprise;
- adapter REST genérico;
- PSP adicionales.

## Fase 9 — Hardening productivo

### Testing

- E2E navegador registro → reserva → alojamiento/extras → servicio → pago → Operator;
- integración MongoDB;
- webhook/idempotencia;
- viajeros/menores/pricing;
- concurrencia de inventario viaje/servicio/habitación;
- E2E de modificaciones/reasignación;
- regresiones de accesibilidad;
- performance budgets;
- contract tests adapters.

### Seguridad

- revisión CSRF;
- rate limiting;
- CSP/security headers;
- cookies/sesiones;
- scanning de dependencias/secretos;
- auditoría de acciones privilegiadas;
- recuperación/rotación de claves de pago/viajero;
- backup/restore.

### Observabilidad/operaciones

- logs estructurados;
- reporting centralizado de errores;
- uptime/health;
- fallos de webhook/pago;
- backup/disaster recovery;
- rollback;
- revisión de índices/rendimiento.

### Privacidad/legal

- política de privacidad y avisos RGPD específicos;
- términos/condiciones de reserva;
- cookies/consentimiento cuando aplique;
- retención/borrado;
- exportación/borrado de datos cliente;
- datos legales configurables;
- revisión de distribución de seguros si se comercializa protección;
- revisión normativa por operador/mercado.

## Fase 10 — Productización open-source

- documentación productiva de entorno;
- seed/setup limpio;
- guía fresh clone;
- adapters de referencia;
- contratos de extensiones/plugins;
- releases versionadas y migraciones;
- templates issues/contribución;
- documentación API/extensiones;
- ejemplo Docker/self-host opcional;
- política marca/trademark;
- integraciones propietarias fuera del core MIT cuando corresponda.

---

# Orden recomendado

```text
7A  Operaciones avanzadas
 ↓
7B  Documentos / exportaciones / reporting
 ↓
8   Integraciones externas
 ↓
9   Hardening productivo
 ↓
10  Productización open-source / release
```

La validación TEST Stripe/Redsys con credenciales debe insertarse en cuanto existan las cuentas proveedor necesarias; no bloquea 7A.

Parte del testing/security de Fase 9 debe seguir realizándose incrementalmente, especialmente pagos, datos viajeros, modificaciones e inventario concurrente.

---

# No-objetivos del core

Open Travel Platform **no** debe quedar atado permanentemente a:

- una sola pasarela;
- un CMS;
- un CRM/ERP;
- un proveedor de reservas;
- un proveedor de identidad;
- un hosting;
- infraestructura exclusiva de Kairoseth.

El core público sigue bajo MIT y reutilizable. Kairoseth Travel puede construir hosting comercial, soporte, implementación, adapters premium/privados e integraciones específicas alrededor de ese core.
