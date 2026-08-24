# Alojamientos y paquetes de viaje

## Objetivo

El alojamiento es un producto reutilizable del catálogo. Un hotel/alojamiento se crea una sola vez, mantiene sus tipos de habitación y su inventario, y después puede vincularse a uno o varios viajes.

El viaje nunca recibe una copia del hotel ni duplica el inventario de habitaciones.

## Fase 6C-1

La base de alojamiento incluye:

- productos de alojamiento;
- tipos de habitación;
- reglas de ocupación de adultos y niños;
- periodos de inventario;
- protección de capacidad;
- páginas públicas de alojamiento;
- portada mediante la biblioteca multimedia.

## Fase 6C-2

Los tipos de habitación pueden definir ahora:

- tipo comercial: individual, doble, twin, triple, familiar, suite u otro;
- régimen;
- tarifa base de referencia por habitación/noche.

Los componentes de alojamiento del viaje referencian:

- ID del alojamiento;
- ID del tipo de habitación;
- día de entrada dentro del viaje;
- número de noches;
- si la estancia está incluida o es opcional.

El servidor comprueba que la habitación pertenece al alojamiento seleccionado y que la estancia cabe dentro de la duración del viaje.

## Límite del pricing

`baseNightlyRate` es una tarifa base/de referencia. Todavía no constituye el motor completo de pricing de paquetes.

Temporadas, suplementos, ajustes por niños compartiendo habitación y pricing dinámico en la reserva pertenecen a los siguientes bloques de alojamiento.

Vincular un alojamiento no reescribe silenciosamente el `fromPrice` ni las tarifas históricas por viajero del viaje.

## Límite del inventario

El inventario permanece en `travel_accommodation_inventory` y nunca se copia dentro del viaje.

La Fase 6C-2 todavía no consume ni libera habitaciones al crear/cancelar una reserva de viaje. Esa operación se añadirá de forma transaccional cuando la selección de alojamiento forme parte del booking.

## Flujo de Operator

1. Crear el alojamiento y sus tipos de habitación.
2. Guardarlo.
3. Editarlo y configurar tipo de habitación, régimen y tarifa base por noche.
4. Abrir un viaje.
5. En **Alojamiento del viaje**, añadir una estancia.
6. Seleccionar alojamiento y habitación.
7. Definir día de entrada y noches.
8. Elegir Incluido u Opcional.
9. Guardar el alojamiento del viaje.

## Checklist de validación

- solo se pueden seleccionar habitaciones reales del alojamiento elegido;
- el día de entrada es como mínimo el día 1;
- las noches son como mínimo 1;
- día de entrada + noches no puede superar la duración del viaje;
- el mismo alojamiento puede reutilizarse en otro viaje;
- cambiar la vinculación no duplica inventario;
- tarifa base × noches se muestra solo como referencia en Operator;
- la ficha pública del viaje muestra hotel/habitación/noches sin IDs internos ni cálculos internos.
