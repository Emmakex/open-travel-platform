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

Las bases completadas incluyen identidad persistente cliente/personal, RBAC, reservas de viajes/servicios, pricing por viajero, servicios independientes, email transaccional, contabilidad de pagos, PSP cifrados, checkout neutral, depósitos/cuotas, datos post-compra cifrados, modificaciones de reserva, alojamiento reutilizable, inventario transaccional de habitaciones, suplementos, operaciones avanzadas, permisos granulares, PDFs de confirmación, manifiestos, rooming lists, vouchers seguros para cliente y expediente interno de reserva.

La validación E2E con credenciales Stripe/Redsys continúa pendiente hasta disponer de cuentas proveedor adecuadas. Los adapters están implementados, pero la capacidad productiva no se considera validada hasta probar TEST/LIVE.

**Las Fases 6B, 6C y 7A están completadas. La Fase 7B — Documentos, exportaciones y reporting está EN CURSO: 7B-1, 7B-2 y 7B-3 están completadas. La Fase 7B-4 — CSV/XLSX, conciliación y reporting es el SIGUIENTE bloque.**

---

# Hitos completados

## Foundation y catálogo — COMPLETADO

- base Next.js / React / TypeScript;
- adapters MongoDB;
- quality gates de CI/release;
- experiencia pública/Operator EN/ES;
- destinos, viajes e itinerarios multidioma;
- GridFS, portadas, galerías y puntos focales;
- salidas, capacidad e inventario;
- despliegue de referencia en `travel.kairoseth.com`.

## Identidad, RBAC y seguridad — COMPLETADO

- autenticación persistente cliente/personal;
- sesiones separadas;
- RBAC y capacidades granulares server-side;
- bloqueo, cambio/recuperación de contraseña y SMTP;
- auditoría de autenticación.

## Operaciones de reserva y email — COMPLETADO

- reservas persistentes de viajes;
- pricing/ownership/inventario autoritativos;
- confirmar/cancelar y liberación transaccional;
- vistas cliente/Operator;
- auditoría operativa;
- email transaccional.

## Fase 5A — Pagos neutrales — COMPLETADO

- ledger de pagos/reembolsos separado del estado de reserva;
- transferencia / efectivo / terminal externo;
- reembolsos controlados y conciliación;
- visibilidad financiera Operator;
- metadata provider/idempotencia.

## Fase 5B — Viajeros y pricing por edad — COMPLETADO

- viajero principal/individuales;
- nacimiento/nacionalidad;
- bandas de edad y pricing por salida;
- reglas de tutor para menores;
- consumo de plazas configurable;
- snapshots históricos.

## Fase 5C — Catálogo de servicios — COMPLETADO

- Actividades, Transporte y Protección de viaje;
- catálogo/fichas públicas;
- CRUD Operator;
- contenido multidioma;
- pricing por persona/reserva/unidad/edad.

## Fase 5D — Disponibilidad e inventario de servicios — COMPLETADO

- calendarios y slots;
- capacidad/plazas e inventario de unidades;
- cierre seguro;
- inventario separado del viaje.

## Fase 5E — Reservas independientes de servicios — COMPLETADO

- reservas de actividad/transporte/protección;
- vínculo opcional con viaje Kairoseth;
- inventario transaccional;
- Mis servicios y cola Operator;
- ledger común.

## Fase 5F — PSP y checkout unificado — IMPLEMENTADO

- configuración TEST/LIVE solo Admin;
- adapters Stripe/Redsys y secretos cifrados;
- checkout viaje/servicio;
- webhooks Stripe firmados + idempotencia;
- notificaciones Redsys firmadas;
- retornos del navegador no autoritativos;
- E2E TEST/LIVE con credenciales pendiente.

## Fase 5G — Depósitos, cuotas y condiciones — COMPLETADO

- pago completo/depósito;
- depósitos/cuotas configurables;
- snapshots y vencimientos;
- saldo pendiente/próximo pago;
- calendario cliente y gestión Operator.

## Fase 6A — Datos post-compra seguros — COMPLETADO

- presets y snapshot por reserva;
- identidad/documento/residencia solo cuando aplica;
- deadlines;
- AES-256-GCM y almacenamiento separado;
- retención TTL;
- auditoría solo de nombres de campos;
- visibilidad de completitud;
- escaneos DNI/pasaporte y datos médicos fuera del flujo estándar.

## Fase 6A.1 — UX/documentación — COMPLETADO

- No requerido / Pendiente / Completo;
- tareas visibles al cliente;
- completitud agregada/por viajero;
- semántica snapshot y guía EN/ES.

## Fase 6B — Modificaciones de reserva — COMPLETADO

- historial explícito actor/motivo/before/after/fecha;
- correcciones controladas;
- cambio atómico de salida;
- recalculo de pricing/alojamiento;
- delta financiero sin reescribir ledger;
- revisión controlada de reembolso;
- servicios vinculados;
- deadlines y notificaciones guardados como snapshot.

## Fase 6C — Alojamiento, suplementos y paquetes — COMPLETADO

- alojamiento reutilizable y habitaciones;
- inventario/ocupación;
- catálogo público/Operator y galerías;
- vínculo viaje ↔ alojamiento;
- pricing estacional/ocupación;
- asignación automática viajero → habitación;
- inventario viaje + habitación transaccional;
- alojamiento incluido/opcional;
- reasignación en modificaciones;
- suplementos y snapshots autoritativos.

---

# Fase 7A — Operaciones avanzadas — COMPLETADO

### 7A-1 — Responsable, notas y prioridad — COMPLETADO
- responsable, notas internas, prioridades, tags y timeline;
- auditoría e invariante de privacidad.

### 7A-2 — Tareas y seguimientos — COMPLETADO
- objetivos, responsable, vencimiento, estado, comentarios y dashboards;
- cambios auditados.

### 7A-3 — Proveedor/fulfilment — COMPLETADO
- fulfilment por componente;
- estado/referencia/coste/deadline;
- notas, auditoría, cola global y métricas;
- sin reescribir precio cliente ni ledger.

### 7A-4 — Búsqueda, filtros y colas — COMPLETADO
- búsqueda libre;
- filtros de reserva/pago/responsable/prioridad/tag/salida;
- saldo/cuotas;
- Mías / Requieren atención / Sin responsable;
- orden y paginación.

### 7A-5 — Modificación de suplementos — COMPLETADO
- añadir/quitar suplementos post-reserva;
- cambiar viajeros;
- preservar precios contratados;
- snapshots exactos y delta financiero.

### 7A-6 — Permisos granulares — COMPLETADO
- Admin superusuario + matriz Operator;
- reservas/catálogo/finanzas/datos viajeros/proveedores/tareas;
- fronteras server-side de rutas/actions/datos;
- auditoría transaccional;
- invariante permanente CI.

---

# Fase 7B — Documentos, exportaciones y reporting — EN CURSO

Objetivo: proporcionar documentos e informes operativos sin filtrar datos protegidos o exclusivamente internos.

## 7B-1 — PDFs de confirmación — COMPLETADO

- capa `pdf-lib` reutilizable;
- confirmaciones cliente/Operator;
- EN/ES;
- fechas, viajeros, alojamiento, suplementos y contacto;
- finanzas solo cuando hay permiso;
- endpoints privados `no-store` e invariante PDF.

## 7B-2 — Listas de viajeros y rooming lists — COMPLETADO

- manifiestos por salida;
- rooming lists desde snapshots de habitaciones;
- rutas PDF Operator protegidas;
- salida EN/ES;
- sin datos post-compra protegidos, proveedores ni notas internas;
- gate permanente `check:departure-documents`.

## 7B-3 — Vouchers y expediente imprimible — COMPLETADO

- vouchers de alojamiento para reservas de viaje confirmadas con alojamiento;
- vouchers de servicio para actividades, transporte y protección confirmados;
- descarga Operator autorizada del mismo voucher seguro para cliente;
- expediente consolidado imprimible de Operator;
- secciones de pago/proveedor cargadas solo cuando las capacidades del personal actual lo permiten;
- versión/estado y timestamp UTC explícitos;
- referencias proveedor internas por defecto;
- una referencia exacta debe aprobarse explícitamente por personal con capacidad Proveedores antes de mostrarse al cliente;
- política de divulgación separada del fulfilment y auditada;
- cambiar una referencia invalida automáticamente la aprobación anterior porque el valor aprobado debe coincidir exactamente con el actual;
- costes proveedor, notas internas y valores post-compra protegidos excluidos de vouchers de cliente;
- propiedad del cliente y estado confirmado verificados server-side;
- respuestas PDF `private, no-store` + `nosniff`;
- invariante permanente `check:voucher-documents` integrada en `npm run verify` y GitHub CI.

## 7B-4 — CSV/XLSX, conciliación y reporting — SIGUIENTE

Objetivo: hacer exportables los datos operativos/comerciales sin debilitar permisos ni privacidad.

Alcance previsto:

- exportación de reservas de viaje;
- exportación de reservas de servicios;
- exportación de clientes;
- formatos CSV y XLSX con contratos de columnas estables;
- informe de conciliación de pagos;
- informe de saldos pendientes y cuotas vencidas;
- ingresos por viaje/producto/servicio;
- filtros/rangos de fecha server-side para exportaciones grandes;
- capacidad Finanzas requerida para columnas/informes financieros;
- exportación segura y auditada de datos protegidos de viajeros solo para uso operativo legítimo y con capacidad Datos de viajeros;
- ningún dato protegido del viajero en exportaciones ordinarias de clientes/reservas;
- evento de auditoría de exportación con actor, tipo, filtros y timestamp sin persistir los valores sensibles exportados;
- base de dashboards operativos/comerciales;
- invariantes permanentes de privacidad/autorización de exportaciones.

---

# Fase 8 — Integraciones externas

Candidatos:

- APIs de proveedores/reservas;
- CRM;
- ERP/contabilidad;
- webhooks salientes;
- CMS/catálogo;
- identidad enterprise;
- adapter REST genérico;
- PSP adicionales.

# Fase 9 — Hardening productivo

### Testing
- E2E registro → reserva → alojamiento/extras → servicio → pago → Operator;
- integración MongoDB;
- webhooks/idempotencia;
- viajeros/menores/pricing;
- concurrencia viaje/servicio/habitación;
- modificaciones/reasignación;
- accesibilidad/performance y contratos de adapters.

### Seguridad/privacidad
- CSRF, rate limiting, CSP/security headers y cookies/sesiones;
- scanning de dependencias/secretos;
- auditoría privilegiada;
- recuperación/rotación de claves y backup/restore;
- RGPD, términos, cookies, retención, exportación/borrado;
- revisión normativa por mercado.

### Observabilidad/operaciones
- logs estructurados y errores centralizados;
- uptime/health;
- fallos webhook/pago;
- disaster recovery y rollback;
- revisión de índices/rendimiento.

# Fase 10 — Productización open-source

- documentación productiva;
- seed/setup limpio;
- instalación/despliegue fresh clone;
- adapters de referencia y contratos de extensión;
- releases/migraciones;
- templates de contribución;
- API/extensiones públicas;
- Docker/self-host opcional;
- política de marca;
- adapters propietarios fuera del core MIT cuando corresponda.

---

# Orden recomendado

```text
7B-4  CSV/XLSX / conciliación / reporting
  ↓
8     Integraciones externas
  ↓
9     Hardening productivo
  ↓
10    Productización open-source / release
```

La validación TEST Stripe/Redsys con credenciales se insertará cuando existan cuentas proveedor adecuadas y no bloquea 7B-4.

El testing/security de Fase 9 debe continuar incrementalmente.

---

# No-objetivos del core

Open Travel Platform no debe quedar ligado permanentemente a una sola pasarela, CMS, CRM/ERP, proveedor de reservas, identidad, hosting o infraestructura exclusiva de Kairoseth.

El core público sigue bajo MIT y reutilizable. Kairoseth Travel puede añadir hosting comercial, soporte, adapters premium/privados e integraciones específicas alrededor del core.
