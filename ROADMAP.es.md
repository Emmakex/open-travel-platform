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

Las bases completadas incluyen identidad persistente cliente/personal, RBAC, reservas de viajes/servicios, pricing por viajero, servicios independientes, email transaccional, contabilidad de pagos, PSP cifrados, checkout neutral, depósitos/cuotas, datos post-compra cifrados, modificaciones de reserva, alojamiento reutilizable, inventario transaccional de habitaciones, suplementos, operaciones avanzadas, permisos granulares, documentos de reserva/salida, vouchers seguros para cliente, expediente interno, exportaciones operativas CSV/XLSX, conciliación/reporting financiero y exportación auditada de datos protegidos de viajeros.

La validación E2E con credenciales Stripe/Redsys continúa pendiente hasta disponer de cuentas proveedor adecuadas. Los adapters están implementados, pero la capacidad productiva no se considera validada hasta probar TEST/LIVE.

**Las Fases 6B, 6C, 7A y 7B están completadas. La Fase 8 — Integraciones externas es la SIGUIENTE.**

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

# Fase 7B — Documentos, exportaciones y reporting — COMPLETADO

Objetivo cumplido: proporcionar documentos operativos, exportaciones seguras y reporting comercial/financiero sin filtrar datos protegidos o exclusivamente internos.

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
- secciones de pago/proveedor cargadas solo cuando las capacidades del personal lo permiten;
- versión/estado y timestamp UTC explícitos;
- referencias proveedor internas por defecto y divulgación de referencia exacta aprobada/auditada explícitamente;
- cambiar una referencia invalida la aprobación anterior;
- costes proveedor, notas internas y valores post-compra protegidos excluidos de vouchers de cliente;
- respuestas privadas `no-store` + `nosniff`;
- invariante permanente `check:voucher-documents`.

## 7B-4 — CSV/XLSX, conciliación y reporting — COMPLETADO

- workspace protegido `/operator/reports` con secciones según capacidades;
- exportaciones de reservas de viaje, servicios y clientes en CSV/XLSX;
- contratos de columnas estables y compartidos para ambos formatos;
- filtros server-side por fecha de creación y normalización de rangos invertidos;
- límites de descarga: 10.000 filas ordinarias y 500 viajeros protegidos por reserva seleccionada;
- conciliación, saldos pendientes/cuotas vencidas e ingresos por producto/servicio solo con permiso Finanzas;
- moneda incluida en las claves de agrupación financiera y totales de dashboard separados siempre por moneda;
- dashboard de Pagos corregido para impedir sumas entre monedas diferentes;
- mitigación de inyección de fórmulas CSV/spreadsheet para texto controlado por usuarios;
- generador XLSX OOXML ligero con cabecera congelada y autofiltro;
- respuestas privadas `no-store` + `nosniff` y nombres de archivo seguros;
- auditoría persistente con actor/tipo/formato/filtros/columnas/número de filas/timestamp sin guardar valores de celdas exportadas;
- exportación de datos post-compra protegidos separada de las exportaciones ordinarias;
- export sensible exige permisos Datos de viajeros + Reservas, reserva activa y motivo operativo de 10–500 caracteres;
- endpoint sensible exclusivamente POST para que motivo/objetivo no aparezcan en el historial de URL;
- export sensible fail-closed: la auditoría persistente debe guardarse antes de devolver bytes CSV/XLSX descifrados;
- los registros protegidos respetan almacenamiento cifrado y ventana de retención existentes;
- invariante permanente `check:reporting-exports` integrada en `npm run verify` y GitHub CI;
- documentación de seguridad de reporting/exportaciones EN/ES.

---

# Fase 8 — Integraciones externas — SIGUIENTE

Objetivo: conectar los despliegues con ecosistemas de negocio reales mediante adapters, manteniendo los payloads específicos de proveedores fuera de los dominios centrales.

Candidatos:

- APIs de proveedores/reservas;
- CRM;
- ERP/contabilidad;
- webhooks salientes;
- CMS/catálogo;
- identidad enterprise;
- adapter REST genérico;
- PSP adicionales.

Primer bloque recomendado: crear la frontera de eventos/integraciones salientes y un adapter de referencia antes de añadir integraciones específicas, resolviendo una sola vez reintentos, idempotencia, auditoría y gestión de secretos.

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
8   Integraciones externas
 ↓
9   Hardening productivo
 ↓
10  Productización open-source / release
```

La validación TEST Stripe/Redsys con credenciales se insertará cuando existan cuentas proveedor adecuadas y no necesita bloquear la Fase 8.

El testing/security de Fase 9 debe continuar incrementalmente.

---

# No-objetivos del core

Open Travel Platform no debe quedar ligado permanentemente a una sola pasarela, CMS, CRM/ERP, proveedor de reservas, identidad, hosting o infraestructura exclusiva de Kairoseth.

El core público sigue bajo MIT y reutilizable. Kairoseth Travel puede añadir hosting comercial, soporte, adapters premium/privados e integraciones específicas alrededor del core.
