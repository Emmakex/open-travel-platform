# Listas de viajeros y rooming lists por salida

La Fase 7B-2 añade documentos operativos agrupados por salida real del viaje.

## Alcance

El personal de Operator con permiso de **Reservas** puede generar dos PDFs privados desde **Operator → Documentos**:

- **Lista de viajeros** — todos los viajeros asociados a reservas no canceladas de la salida seleccionada.
- **Rooming list** — los snapshots de alojamiento y distribución de habitaciones guardados en esas reservas.

La clave de agrupación es `tripId + availabilityId`. Las reservas canceladas se excluyen automáticamente.

## Lista de viajeros

Incluye únicamente datos básicos guardados en el snapshot de reserva:

- referencia y estado de la reserva;
- nombre y apellidos;
- indicador de viajero principal;
- fecha de nacimiento;
- edad calculada para la salida contratada;
- nacionalidad;
- etiqueta de tarifa contratada.

Es un manifiesto operativo, no una exportación segura de documentación de identidad.

## Rooming list

El rooming list utiliza la distribución de alojamiento guardada cuando la reserva fue calculada/creada o posteriormente modificada. Incluye:

- nombre del alojamiento;
- fechas de entrada/salida y noches;
- tipo de habitación;
- régimen;
- cada habitación reservada;
- referencia de reserva;
- viajeros asignados a cada habitación.

Así no reconstruimos la distribución utilizando el catálogo actual cuando la reserva histórica ya tiene su propio snapshot.

## Privacidad y permisos

Ambas rutas exigen server-side el permiso **Reservas** y responden con `private, no-store`.

Estos documentos no cargan ni exportan:

- valores cifrados post-compra de documentación/residencia de viajeros;
- notas internas de reserva;
- comentarios de tareas;
- referencias, costes o notas de proveedor;
- motivos internos de modificaciones;
- secretos de pago/proveedor.

Una entrega posterior de 7B incorporará una vía separada y auditada para exportar datos post-compra protegidos cuando exista una necesidad operativa legítima. Las listas normales de viajeros/rooming no deben convertirse silenciosamente en ese canal.

## CI

`npm run check:departure-documents` verifica:

- exclusión de reservas canceladas;
- agrupación de varias reservas activas en una misma salida;
- estabilidad de filas de viajeros y habitaciones;
- generación de PDFs de viajeros EN/ES;
- generación de rooming lists EN/ES;
- permiso Reservas obligatorio en ambas rutas;
- ausencia de imports de datos protegidos o módulos de proveedor en esas rutas.
