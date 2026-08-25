# Suplementos opcionales del paquete de viaje

## Objetivo

Los suplementos del paquete son pequeños adicionales comerciales opcionales que forman parte de la propia reserva del viaje. Están pensados para opciones como una mejora de equipaje, una cena especial, un upgrade privado sin cupo propio u otro suplemento que no gestione inventario independiente.

Son deliberadamente distintos de los servicios de viaje independientes.

Debe usarse una actividad, transporte u otro servicio independiente cuando el producto tenga su propia fecha, cupo, disponibilidad o ciclo de reserva. Un suplemento de paquete solo debe utilizarse cuando no haya inventario separado que consumir.

## Reglas comerciales

- los suplementos son siempre opcionales;
- los costes obligatorios pertenecen a la tarifa base del viaje;
- un suplemento puede cobrarse una vez por reserva o una vez por cada viajero seleccionado;
- todos los suplementos tienen título visible para cliente en inglés y español;
- las descripciones, cuando se utilicen, deben completarse en ambos idiomas;
- el suplemento utiliza la moneda del viaje;
- cada viaje admite hasta 20 suplementos configurados;
- los suplementos desactivados no pueden ser seleccionados por clientes.

## Flujo de reserva

Durante la reserva del viaje el cliente puede revisar los suplementos activos después de elegir viajeros y alojamiento.

Un suplemento `por reserva` se selecciona una sola vez y añade una unidad a la reserva.

Un suplemento `por viajero` permite elegir exactamente a qué viajeros se aplica. El total es el precio unitario configurado multiplicado por el número de viajeros seleccionados.

El navegador solo muestra una previsión. La acción de reserva reconstruye la selección utilizando la configuración actual del viaje y los viajeros ya validados antes de crear la reserva. Las selecciones desconocidas, desactivadas o manipuladas se rechazan.

## Snapshot de la reserva

Los suplementos seleccionados se copian a la reserva como snapshots comerciales estables con:

- ID y código del suplemento;
- títulos en inglés y español;
- descripción en inglés y español cuando exista;
- modalidad de cobro;
- precio unitario;
- cantidad;
- IDs de viajeros seleccionados para suplementos por viajero;
- total final del suplemento.

La reserva también guarda `packageAddOnTotal`.

Modificar después un suplemento en catálogo no reescribe reservas históricas.

## Composición del precio

El total de reserva se calcula como:

`tarifa de viajeros + alojamiento opcional añadido + total de suplementos del paquete`

El alojamiento incluido conserva su valoración y snapshot, pero no se vuelve a sumar al precio.

## Cambios y cancelación

Un cambio de salida recalcula la tarifa de viajeros y el alojamiento sensible a fechas, mientras que el snapshot de suplementos ya contratado permanece sin cambios. Su importe continúa formando parte del total de la reserva.

Cancelar una reserva no necesita liberar inventario de suplementos porque estos no gestionan cupo. El snapshot permanece en la reserva cancelada para conservar el histórico.

Si posteriormente un producto necesita gestión de capacidad, debe migrarse al modelo de servicio independiente en lugar de añadir inventario a los suplementos del paquete.

## Flujo de Operator

1. Abrir un viaje en Operator.
2. Ir a **Suplementos opcionales del paquete**.
3. Añadir un suplemento.
4. Completar títulos en inglés y español.
5. Añadir descripciones equivalentes en ambos idiomas cuando sean necesarias.
6. Definir el precio.
7. Elegir `Una vez por reserva` o `Por viajero seleccionado`.
8. Activarlo cuando esté preparado para clientes.
9. Guardar los suplementos.
10. Revisar la ficha pública y el booking en ambos idiomas.

## Protección contra regresiones

El test permanente de suplementos comprueba:

- reglas bilingües de configuración;
- códigos únicos;
- pricing por reserva;
- pricing por viajeros seleccionados;
- eliminación de selecciones duplicadas;
- rechazo de suplementos desconocidos o desactivados;
- rechazo de viajeros que no pertenezcan a la reserva;
- conservación del snapshot aunque cambie posteriormente el catálogo.
