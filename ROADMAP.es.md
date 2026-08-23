# Roadmap

<p align="center"><a href="./ROADMAP.md">English</a> · <strong>Español</strong></p>

Open Travel Platform es el core open-source reutilizable bajo licencia MIT. **Kairoseth Travel** es la implementación comercial/de referencia oficial desplegada en **https://travel.kairoseth.com**.

El roadmap mantiene alineados dos objetivos:

1. conservar el core público portable, neutral respecto a proveedores y útil para otras agencias/desarrolladores;
2. continuar endureciendo Kairoseth Travel hasta convertirlo en una plataforma turística completa de producción sin acoplar el core a un PSP, proveedor, CRM, ERP, CMS o hosting concreto.

_Última actualización: 23 de agosto de 2026._

---

## Posición actual

El proyecto ya ha superado el MVP inicial de catálogo/reservas. El código actual incluye identidad persistente, RBAC cliente/personal, reservas de viajes y servicios, pricing por edad, actividades/transporte/seguros independientes, correo transaccional, contabilidad de pagos, configuración cifrada de pasarelas desde Admin y adaptadores de checkout online neutrales respecto al proveedor.

La validación end-to-end con credenciales Stripe/Redsys se pospone deliberadamente hasta disponer de cuentas adecuadas. La implementación está presente, pero la capacidad de pago productiva no debe considerarse validada hasta probar los flujos TEST y LIVE con los proveedores.

---

# Hitos completados

## Foundation y catálogo — COMPLETADO

- base Next.js / React / TypeScript;
- quality gates CI y checks de release;
- interfaces públicas y de operador bilingües EN/ES;
- catálogo de destinos y viajes;
- adapters persistentes sobre MongoDB;
- backoffice protegido de catálogo;
- biblioteca multimedia GridFS, galerías, portadas y puntos focales;
- itinerarios estructurados multidioma;
- salidas, capacidad e inventario en vivo;
- despliegue público de referencia en `travel.kairoseth.com`.

## Identidad, RBAC y seguridad de cuenta — COMPLETADO

- registro/login persistente de clientes;
- autenticación persistente operator/admin;
- sesiones cliente/personal separadas;
- validaciones RBAC server-side;
- bloqueo de cuenta tras intentos fallidos repetidos;
- cambio de contraseña y revocación de sesiones;
- recuperación de contraseña con tokens de un solo uso y caducidad;
- envío SMTP de recuperación;
- auditoría de autenticación;
- indicador de sesión/rol activo en frontend.

## Operaciones de reserva y email — COMPLETADO

- reservas persistentes de viajes;
- ownership, pricing e inventario validados en servidor;
- workflow confirmar/cancelar;
- liberación de inventario al cancelar;
- cola de reservas para Operator;
- vista de cliente tipo CRM;
- auditoría operativa;
- emails de reserva recibida / confirmada / cancelada;
- historial de reservas del cliente.

## Fase 5A — Fundación de pagos neutral respecto a proveedor — COMPLETADO

- ledger `travel_payment_transactions`;
- pagos y reembolsos separados del estado de reserva;
- estados unpaid / pending / partially paid / paid / partially refunded / refunded;
- registro manual de transferencia bancaria, efectivo y terminal externo;
- reembolsos manuales;
- protección contra sobrepago/sobrereembolso;
- historial financiero visible para el cliente;
- dashboard financiero de Operator;
- campos provider/idempotency preparados para adapters PSP.

## Fase 5B — Motor de viajeros y pricing por edad — COMPLETADO

- viajero principal y fichas individuales;
- fecha de nacimiento y nacionalidad;
- edad calculada contra la fecha de salida/servicio;
- bandas de edad configurables;
- precio por viajero;
- overrides de precio por salida;
- adulto responsable obligatorio para menores;
- consumo de inventario configurable por banda de edad;
- snapshots históricos de precio;
- viajeros visibles para cliente y Operator.

Los requisitos avanzados de documentación de viaje quedan como trabajo futuro y se detallan más abajo.

## Fase 5C — Catálogo independiente de servicios — COMPLETADO

- productos independientes de **Actividades**, **Transporte** y **Seguros**;
- catálogo y fichas públicas sin necesidad de login;
- CRUD protegido desde Operator;
- contenido multidioma;
- modelos de precio por persona / por reserva / por unidad / según edad;
- reutilización del motor de bandas de edad;
- URLs y navegación pública específicas por tipo de servicio.

## Fase 5D — Disponibilidad e inventario de servicios — COMPLETADO

- calendario independiente para actividades y transporte;
- slots de fecha/hora;
- capacidad y plazas reservadas;
- inventario por unidades de transporte y capacidad por unidad;
- cierre seguro de slots con reservas en lugar de borrado destructivo;
- frontend público muestra solo slots futuros/abiertos/disponibles;
- inventario de servicios separado del inventario de viajes.

## Fase 5E — Reservas independientes de servicios — COMPLETADO

- reservas de actividades;
- reservas de transporte;
- reservas de seguros basadas en fechas/destino/viajeros en lugar de slots;
- vínculo opcional a un viaje Kairoseth;
- modo completamente independiente para viajes comprados fuera;
- consumo/liberación transaccional del inventario donde aplica;
- área `Mis servicios` para clientes;
- cola de reservas de servicios para Operator;
- confirmación/cancelación de servicios;
- reservas de servicios integradas en el mismo ledger financiero.

## Fase 5F — Pasarelas y checkout unificado — IMPLEMENTADO

### Gestión Admin de pasarelas

- configuración solo para admin;
- perfiles TEST y LIVE separados;
- activación/desactivación por proveedor;
- adapters iniciales Stripe y Redsys;
- cifrado AES-256-GCM de secretos persistidos;
- clave server-side estable `PAYMENT_SECRETS_KEY`;
- los secretos guardados nunca vuelven al navegador;
- detalles de infraestructura fuera de la UI de Operator.

### Checkout unificado

- checkout común para reservas de viaje y servicios;
- Stripe Checkout alojado;
- verificación de webhooks firmados de Stripe;
- procesamiento idempotente de webhooks;
- flujo formulario/redirección de Redsys;
- validación de notificación firmada de Redsys;
- referencias del proveedor vinculadas al ledger interno;
- las URLs de retorno del navegador nunca se consideran confirmación autoritativa;
- el cliente no puede cancelar directamente reservas con movimientos financieros completados/pendientes que requieren tratamiento operativo.

### Estado de validación

- safety del código: completado;
- TypeScript/build/smoke CI: completado;
- implementación de adapters: completado;
- **Stripe TEST E2E con credenciales: pendiente de cuenta de proveedor**;
- **Redsys TEST E2E con credenciales: pendiente de cuenta de proveedor**;
- activación LIVE: pendiente intencionalmente.

## Contexto de próximo viaje en la cuenta — COMPLETADO

- la cuenta prioriza el próximo viaje futuro real y no cancelado del cliente;
- las reservas futuras se ordenan por fecha de salida;
- accesos directos a reserva, itinerario y servicios complementarios;
- la recomendación del catálogo solo aparece como fallback cuando no existen viajes futuros;
- el fallback prioriza un viaje que el cliente no haya reservado anteriormente.

---

# Próximas prioridades

## Fase 5G — Depósitos, cuotas y condiciones de pago — SIGUIENTE

Objetivo: soportar calendarios de pago reales de una agencia de viajes y no solamente un saldo único.

- política pago completo vs depósito;
- depósito fijo o porcentual;
- fecha de vencimiento del depósito;
- fecha de vencimiento del saldo final;
- calendarios opcionales de varias cuotas;
- importe y fecha por cuota;
- cálculo automático de `due now` y saldo pendiente;
- estado de cuota vencida;
- recordatorios de pago por email;
- visibilidad para Operator de saldos próximos/vencidos;
- snapshot de condiciones de pago guardado con la reserva;
- calendario de pagos visible para el cliente;
- compatibilidad con pagos manuales y ejecución futura mediante Stripe/Redsys;
- reglas explícitas de reembolso/cancelación frente a calendarios de cuotas.

Esta fase puede desarrollarse completamente sobre el ledger actual sin esperar a disponer de credenciales Stripe/Redsys.

## Fase 6A — Requisitos avanzados de viajeros y documentos

Objetivo: recopilar solamente los datos de viajero exigidos por cada producto/proveedor.

Ya disponible: viajero principal, fichas individuales, menores/tutores, fecha de nacimiento, nacionalidad y pricing por edad.

Pendiente:

- campos obligatorios configurables por producto;
- pasaporte / DNI únicamente cuando sea necesario;
- número de documento, país emisor y caducidad;
- campos opcionales exigidos por proveedor;
- estado de completitud de viajeros;
- edición self-service hasta una fecha límite configurable;
- vista de completitud para Operator;
- exportación segura de viajeros;
- reglas de minimización/retención para datos sensibles;
- auditoría de cambios en datos de viajeros.

## Fase 6B — Modificaciones de reserva

Objetivo: soportar el ciclo normal posterior a la reserva sin destruir el registro original.

- añadir/eliminar/modificar viajeros;
- cambiar salida cuando exista disponibilidad;
- añadir/quitar actividades, transporte y seguros;
- recalcular totales server-side;
- conservar snapshots originales y modificados;
- timeline/auditoría de modificaciones;
- reasignación controlada de inventario;
- cobrar diferencia cuando aumenta el precio;
- generar saldo reembolsable cuando disminuye;
- notificaciones de modificación;
- deadlines configurables para cambios/cancelaciones.

## Fase 6C — Alojamiento, suplementos y composición de paquetes

Objetivo: evolucionar de viajes + servicios independientes hacia construcción de paquetes más completos.

- productos/componentes de alojamiento;
- tipos de habitación;
- reglas de ocupación;
- suplemento individual;
- pricing doble/twin/triple;
- reglas de niños compartiendo habitación;
- inventario de habitaciones;
- suplementos estacionales;
- extras opcionales;
- estructura incluido/no incluido;
- composición de paquetes usando productos turísticos reutilizables;
- servicio server-side de pricing de paquetes con tests.

## Fase 7A — Operaciones avanzadas

Objetivo: convertir Operator en herramienta de trabajo diaria para una agencia.

- asignar responsable/operador de reserva;
- notas internas;
- tareas/seguimientos;
- etiquetas y prioridad;
- timeline operativo enriquecido;
- estados con proveedores;
- historial de contacto con cliente;
- búsqueda, filtros y paginación;
- acciones masivas seguras;
- permisos least-privilege más granulares que operator/admin.

## Fase 7B — Documentos, exportaciones y reporting

Objetivo: soportar documentos e informes habituales de equipos turísticos.

- confirmación de reserva PDF/documento;
- listas de viajeros / rooming lists;
- vouchers;
- exportaciones de reservas y servicios;
- CSV/XLSX de clientes y pagos;
- export de conciliación financiera;
- informe de saldos pendientes;
- ingresos por producto/servicio;
- dashboards operativos/comerciales;
- expediente imprimible de Operator.

## Fase 8 — Integraciones externas

Objetivo: conectar Kairoseth Travel con ecosistemas reales mediante adapters sin filtrar payloads de proveedor al dominio core.

Adapters candidatos:

- APIs de proveedores/reservas;
- sincronización CRM;
- integraciones ERP/contabilidad;
- webhooks salientes genéricos;
- ejemplo de fuente CMS/catálogo;
- Auth.js/OIDC para identidad empresarial;
- adapter REST genérico de booking;
- PSP adicionales más allá de Stripe/Redsys.

## Fase 9 — Hardening de producción

Objetivo: completar el trabajo necesario antes de posicionar un despliegue para clientes productivos reales.

### Testing

- E2E de navegador registro → reserva → servicio → pago → Operator;
- tests de integración MongoDB;
- tests de webhook/idempotencia;
- tests de viajeros/menores/pricing;
- tests de concurrencia de inventario;
- regresiones de accesibilidad;
- budgets de rendimiento;
- contract tests de adapters productivos.

### Seguridad

- revisión CSRF de operaciones mutables;
- rate limiting en auth, reset de contraseña y endpoints sensibles;
- revisión CSP/security headers;
- revisión de cookies/sesiones;
- escaneo de dependencias y secretos;
- auditoría de acciones privilegiadas;
- procedimiento de recuperación/rotación de secretos de pago;
- pruebas de backup/restore.

### Observabilidad y operaciones

- logs estructurados;
- reporting centralizado de errores;
- monitorización uptime/health;
- visibilidad de fallos de webhook/pagos;
- procedimiento de backup/disaster recovery;
- rollback de despliegues;
- revisión de índices/rendimiento de base de datos.

### Privacidad/legal

- política de privacidad;
- términos y condiciones de reserva;
- política/consentimiento de cookies cuando aplique;
- política de retención/eliminación;
- exportación/eliminación de datos del cliente;
- datos legales/empresa configurables por despliegue;
- revisión legal de distribución de seguros donde se vendan comercialmente;
- requisitos regulatorios específicos de cada operador/mercado.

## Fase 10 — Productización open-source

Objetivo: hacer que Open Travel Platform sea fácil de adoptar por terceros mientras Kairoseth Travel continúa como implementación comercial oficial.

- documentación `.env.example` lista para producción;
- flujo limpio de demo seed/setup;
- guía de instalación/despliegue desde un clon limpio;
- adapters de referencia;
- contratos de extensión/plugins más claros;
- releases versionadas y notas de migración;
- templates de contribución/issues;
- documentación pública de API/extensiones;
- ejemplo opcional Docker/self-host;
- política de marca diferenciando **Open Travel Platform** de **Kairoseth Travel**;
- mantener integraciones propietarias de Kairoseth/clientes fuera del core MIT cuando corresponda.

---

# Orden de entrega sugerido

```text
5G  Depósitos / cuotas / condiciones de pago
 ↓
6A  Requisitos avanzados de viajeros / documentos
 ↓
6B  Modificaciones de reserva
 ↓
6C  Alojamiento / suplementos / composición de paquetes
 ↓
7A  Operaciones avanzadas
 ↓
7B  Documentos / exports / reporting
 ↓
8   Integraciones externas
 ↓
9   Hardening producción
 ↓
10  Productización / release open-source
```

La validación TEST con credenciales Stripe/Redsys debe insertarse en cuanto existan las cuentas necesarias; no tiene por qué bloquear la Fase 5G.

Parte del trabajo de seguridad/testing de Fase 9 debe seguir realizándose de manera incremental y no esperar hasta el final, especialmente en pagos, datos de viajeros y concurrencia de inventario.

---

# No objetivos del core

Open Travel Platform **no** debe quedar permanentemente ligado a:

- una única pasarela de pago;
- un único CMS;
- un único CRM/ERP;
- un único proveedor de booking;
- un único proveedor de autenticación;
- un único hosting;
- infraestructura exclusiva de Kairoseth.

El core público sigue bajo licencia MIT y es reutilizable. Kairoseth Travel puede construir alrededor del core hosting comercial, soporte, implementación, adapters premium/privados e integraciones específicas de clientes.
