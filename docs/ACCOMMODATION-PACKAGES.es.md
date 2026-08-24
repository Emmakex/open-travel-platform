# Alojamientos y paquetes de viaje

## Objetivo

El alojamiento es un producto reutilizable del catálogo. Un hotel/alojamiento se crea una sola vez, mantiene sus habitaciones, fotografías, reglas de precio e inventario, y después puede vincularse a uno o varios viajes.

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

Los tipos de habitación pueden definir:

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

## Fase 6C-3

### Galería general y galerías por habitación

El alojamiento dispone ahora de dos niveles multimedia reutilizables:

- una galería general para exterior, zonas comunes y experiencia global del alojamiento;
- una galería independiente para cada tipo de habitación.

Ambos niveles usan la biblioteca multimedia compartida y la subida directa. Las fotografías de una habitación acompañan a ese tipo de habitación cuando se reutiliza en varios viajes.

La ficha pública del alojamiento muestra la galería general y las fotografías de cada habitación. En la ficha del viaje se utiliza preferentemente la primera foto de la habitación vinculada y, si no existe, la portada del alojamiento.

### Pricing por temporada

El alojamiento puede definir reglas de precio por fechas. Cada regla incluye:

- nombre;
- fecha inicial/final;
- todas las habitaciones o un tipo concreto;
- suplemento o descuento;
- importe fijo por habitación/noche o porcentaje sobre la tarifa de habitación.

Las reglas se evalúan noche a noche, por lo que una estancia que cruza dos temporadas se calcula correctamente.

### Pricing por ocupación

Las reglas reutilizables de ocupación permiten configurar:

- suplemento individual;
- descuento por ocupación triple;
- descuento de niño compartiendo habitación;
- reglas personalizadas.

Pueden limitarse por:

- tipo de habitación;
- adultos mínimos/máximos;
- niños mínimos/máximos;
- rango de edad del niño.

Los ajustes pueden calcularse como:

- importe fijo por habitación/noche;
- porcentaje sobre la estancia de habitación;
- importe fijo por niño válido/noche;
- porcentaje sobre la parte proporcional del niño en la habitación.

Las reglas compatibles pueden acumularse. Por ejemplo, una temporada alta y un descuento de niño compartiendo pueden aplicarse a la misma estancia.

### Previsión real de precio del paquete

Cada estancia vinculada a un viaje guarda una **ocupación de referencia** para la planificación del paquete:

- número de adultos;
- edades de niños opcionales.

Operator calcula el valor del alojamiento para cada salida utilizando:

1. tarifa base de la habitación;
2. fecha real de entrada derivada de salida del viaje + día de entrada;
3. reglas de temporada aplicables;
4. reglas de ocupación aplicables;
5. número de noches.

La previsión muestra base, ajuste de temporada, ajuste de ocupación y total final de alojamiento por salida.

El cálculo es compatible con servidor y está cubierto por el test permanente de invariantes de alojamiento.

## Límite del pricing

6C-3 incorpora el motor reutilizable de pricing de alojamiento y la previsión sensible a fecha/ocupación para paquetes.

No modifica silenciosamente `fromPrice`, tarifas históricas por viajero ni snapshots de reservas existentes.

La asignación de habitaciones durante el booking reutilizará más adelante este mismo motor con la distribución real de viajeros antes de consumir inventario.

## Límite del inventario

El inventario permanece en `travel_accommodation_inventory` y nunca se copia dentro del viaje.

6C-3 todavía no consume ni libera habitaciones al crear/cancelar una reserva de viaje. Esa operación debe ser transaccional y pertenece al siguiente bloque de booking de alojamiento.

## Flujo de Operator

1. Crear alojamiento y habitaciones.
2. Guardar.
3. Configurar tipo comercial, régimen y tarifa base por noche.
4. Añadir reglas de temporada y ocupación.
5. Añadir galería general y galerías por habitación.
6. Abrir un viaje.
7. En **Alojamiento del viaje**, añadir una estancia.
8. Seleccionar alojamiento y habitación.
9. Definir día de entrada y noches.
10. Elegir Incluido u Opcional.
11. Definir adultos de referencia y edades de niños si corresponde.
12. Revisar la previsión real por cada salida.
13. Guardar el alojamiento del viaje.

## Checklist de validación

- solo se pueden seleccionar habitaciones reales del alojamiento elegido;
- el día de entrada es como mínimo el día 1;
- las noches son como mínimo 1;
- día de entrada + noches no puede superar la duración del viaje;
- la ocupación de referencia debe ser válida para la habitación;
- las edades de niños deben respetar el límite de la habitación;
- los rangos de temporada deben ser válidos;
- los porcentajes de ajuste permanecen dentro de límites seguros;
- el alojamiento sigue siendo reutilizable en otros viajes;
- cambiar el vínculo no duplica inventario;
- editar los datos básicos del alojamiento no elimina tarifas ni galerías;
- las páginas públicas no exponen IDs internos ni detalles de implementación del pricing.
