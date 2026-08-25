# Permisos granulares del personal

<p align="center"><a href="./STAFF-PERMISSIONS.md">English</a> · <strong>Español</strong></p>

Kairoseth Travel mantiene los roles sencillos `operator` / `admin` y añade capacidades autoritativas en servidor para los despliegues que necesitan accesos más limitados.

## Modelo de acceso

- `admin` es un superusuario con acceso completo y siempre recibe todas las capacidades, incluida administración;
- un `operator` existente sin una asignación explícita mantiene el perfil Operator heredado para conservar compatibilidad;
- en cuanto un administrador guarda la matriz de permisos de un Operator, esa asignación explícita pasa a ser autoritativa;
- las nuevas cuentas Operator reciben una asignación explícita al crearse desde **Operator → Acceso del personal**;
- la capacidad `administration` no puede asignarse a Operators.

De esta forma no hace falta una migración manual que pueda bloquear inesperadamente cuentas existentes y cada despliegue puede avanzar hacia mínimo privilegio de manera controlada.

## Capacidades

| Capacidad | Principales áreas protegidas |
| --- | --- |
| `reservations` | colas de reservas de viajes/servicios, estados, modificaciones y operaciones de clientes/reservas |
| `catalogue` | viajes, destinos, servicios, alojamientos, inventario de habitaciones, precios, disponibilidad y multimedia |
| `finance` | estado de pagos, movimientos, reembolsos, saldos pendientes, condiciones y recordatorios de pago |
| `traveller-data` | estado/completitud de los datos post-compra protegidos de viajeros |
| `suppliers` | gestión de proveedores, referencias, coste interno y seguimiento |
| `tasks` | tareas internas, comentarios, asignaciones, vencimientos y espacios de tareas |
| `administration` | acceso exclusivo de administradores; nunca asignable a una cuenta Operator |

Los precios y totales comerciales de una reserva siguen formando parte de la reserva. El permiso Finanzas protege específicamente el estado contable de pagos/reembolsos y las condiciones de pago. Los datos básicos del viajero capturados al reservar siguen disponibles para personal con Reservas, mientras que el estado de datos post-compra protegidos requiere `traveller-data`.

## Aplicación de permisos

La autorización se aplica en varias capas:

1. los layouts protegidos de Operator llaman a `requireStaffCapability(...)`;
2. las server actions sensibles repiten la comprobación antes de cualquier escritura;
3. las páginas compartidas solo consultan datasets sensibles de finanzas, tareas, proveedores o viajeros cuando la identidad actual dispone de la capacidad correspondiente;
4. la navegación y los paneles ocultan las áreas no autorizadas;
5. la gestión de cuentas continúa protegida exclusivamente por `requireAdminIdentity()`.

Ocultar un botón nunca se considera una barrera de seguridad suficiente.

## Persistencia y auditoría

Las asignaciones explícitas de Operator se guardan en:

- `travel_staff_capabilities`

Los cambios de permisos se auditan en:

- `travel_staff_capability_audit`

Cada cambio real registra:

- usuario de personal afectado;
- modo anterior (`legacy` o `explicit`) y capacidades anteriores cuando existen;
- modo y capacidades nuevas;
- identidad del administrador que realizó el cambio;
- fecha y hora.

La actualización de la asignación y el evento de auditoría se escriben dentro de la misma transacción MongoDB. Guardar exactamente la misma configuración no genera un evento de auditoría engañoso.

## Procedimiento operativo

1. Inicia sesión como Admin.
2. Abre **Operator → Acceso del personal**.
3. Crea un nuevo Operator o abre uno existente en el directorio del equipo.
4. Marca únicamente las capacidades necesarias para su trabajo.
5. Guarda los permisos.
6. Revisa **Auditoría de permisos** en la misma página para comprobar el antes/después.
7. Prueba esa cuenta: las secciones no autorizadas no deben cargarse ni mostrarse, y los intentos por URL directa o invocación de acciones deben ser rechazados en servidor.

Las cuentas Admin no se pueden restringir mediante esta matriz, reduciendo el riesgo de eliminar accidentalmente la última vía de acceso administrativo.

## Invariante de CI

`npm run check:staff-permissions` verifica la semántica de roles/capacidades y los puntos permanentes de protección para reservas, catálogo, finanzas, datos de viajeros, proveedores, tareas, multimedia y auditoría de permisos. Forma parte de `npm run verify` y, por tanto, de la puerta normal de CI para releases.
