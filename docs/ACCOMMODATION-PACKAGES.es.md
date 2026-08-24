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

Los componentes de alojamiento del viaje referencian alojamiento, habitación, día de entrada, noches y si la estancia está incluida o es opcional.

El servidor comprueba que la habitación pertenece al alojamiento seleccionado y que la estancia cabe dentro de la duración del viaje.

## Fase 6C-3

### Galería general y galerías por habitación

El alojamiento dispone de dos niveles multimedia reutilizables:

- una galería general para exterior, zonas comunes y experiencia global del alojamiento;
- una galería independiente para cada tipo de habitación.

Ambos niveles usan la biblioteca multimedia compartida y la subida directa. Las fotografías de una habitación acompañan a ese tipo de habitación cuando se reutiliza en varios viajes.

### Pricing por temporada y ocupación

El alojamiento puede definir suplementos/descuentos por fechas y reglas reutilizables para suplemento individual, descuento por triple, niño compartiendo y escenarios personalizados.

Las temporadas se evalúan noche a noche y las reglas de ocupación pueden limitarse por tipo de habitación, número de adultos/niños y rango de edad del niño. Las reglas compatibles pueden acumularse.

Operator puede revisar una previsión por cada salida del viaje antes de vender el producto.

## Fase 6C-4

### Distribución real de habitaciones en la reserva

El booking utiliza ahora los viajeros reales en lugar de la ocupación de referencia.

Para cada estancia incluida o alojamiento opcional seleccionado, el servidor:

1. calcula la edad de cada viajero en la fecha de entrada al hotel;
2. clasifica la ocupación de adulto/niño según la edad máxima de niño configurada en la habitación;
3. busca el número mínimo válido de habitaciones;
4. distribuye los viajeros entre esas habitaciones;
5. valida adultos, niños y ocupación máxima;
6. calcula cada habitación usando el mismo motor de temporada/ocupación de 6C-3;
7. comprueba que exista inventario de habitación para todas las noches.

El navegador muestra la distribución prevista antes de confirmar, pero el servidor vuelve a calcularla con los viajeros enviados. No se confían al cliente ni el precio ni la distribución de habitaciones.

### Alojamiento incluido frente a opcional

`included` significa que la estancia ya forma parte de la tarifa del viaje/paquete. Su valor actual se calcula y se guarda como snapshot para operaciones, pero **no se vuelve a sumar al precio del viaje**.

`optional` requiere selección del cliente. Cuando se selecciona, su precio calculado sí se añade al total de la reserva.

Así evitamos cobrar dos veces un hotel ya incluido y, al mismo tiempo, conservamos el valor real del alojamiento dentro del histórico de la reserva.

### Snapshot de alojamiento

Las nuevas reservas pueden guardar:

- referencia y nombre del alojamiento/habitación;
- entrada, salida, noches y régimen;
- número exacto de habitaciones;
- IDs de viajeros asignados a cada habitación;
- adultos y edades de niños de hotel por habitación;
- base, ajuste de temporada y ajuste de ocupación por habitación;
- valor total calculado del alojamiento;
- importe realmente añadido al total de la reserva;
- periodos de inventario y cantidad de habitaciones consumidas.

Las reservas antiguas no se rellenan ni se modifican retroactivamente.

### Inventario transaccional

Las plazas de la salida y las habitaciones del alojamiento se reservan dentro de la misma transacción MongoDB que crea la reserva.

Si falla la capacidad de la salida o cualquiera de las habitaciones necesarias, se revierte toda la operación.

Las cancelaciones desde cliente y Operator liberan plazas y habitaciones en la misma transacción. Si la liberación no es segura, también se revierte la cancelación.

### Cambio de salida

Cuando una reserva ya contiene un snapshot de alojamiento y Operator cambia de salida, el alojamiento se mueve también.

La transacción:

1. recalcula viajeros para la nueva salida;
2. asegura la capacidad de la nueva salida;
3. recalcula distribución y precio del hotel para las nuevas fechas;
4. reserva cualquier incremento necesario de inventario de habitación;
5. libera las habitaciones que ya no se necesitan;
6. libera la capacidad de la salida anterior;
7. actualiza reserva e historial de modificaciones.

Los movimientos de habitación se calculan por delta neto. Si la estancia antigua y la nueva pertenecen al mismo periodo de inventario, no se exige capacidad duplicada artificialmente.

El historial conserva los snapshots de alojamiento anteriores y posteriores al cambio.

## Límite de moneda

6C-4 no incorpora todavía un motor de cambio de divisas. El alojamiento vinculado debe utilizar la misma moneda que el viaje para venderse dentro de su booking.

Si las monedas no coinciden, la reserva se bloquea en lugar de aplicar una conversión sin tipo de cambio definido.

## Propiedad del inventario

`travel_accommodation_inventory` continúa siendo la fuente real del inventario de habitaciones. El inventario nunca se copia en la ficha del viaje.

La reserva guarda una asignación histórica para poder liberar o mover las habitaciones de forma segura.

## Flujo de Operator

1. Crear alojamiento y habitaciones.
2. Configurar ocupación e inventario.
3. Configurar tipo comercial, régimen y tarifa base por noche.
4. Añadir temporadas y reglas de ocupación.
5. Añadir galería general y galerías por habitación.
6. Vincular alojamiento/habitación a un viaje.
7. Elegir Incluido u Opcional, día de entrada y noches.
8. Crear inventario que cubra las fechas de las salidas.
9. Crear una reserva nueva con viajeros reales.
10. Revisar la distribución generada tanto en Mi cuenta como en Operator.
11. Cancelar o cambiar de salida para comprobar la liberación/reasignación transaccional.

## Checklist de validación

- la distribución usa las fechas de nacimiento reales;
- cada viajero aparece exactamente en una habitación por estancia seleccionada;
- se cumplen las reglas de ocupación;
- la edad de niño de hotel se calcula en la entrada;
- el alojamiento incluido no se cobra dos veces;
- el alojamiento opcional seleccionado se añade al total;
- un opcional no seleccionado no consume habitación;
- todas las noches tienen inventario abierto;
- falta de habitaciones bloquea la reserva completa;
- cancelar libera salida y habitaciones;
- cambiar de salida asegura primero la nueva asignación;
- el historial conserva los snapshots anterior/posterior;
- reservas antiguas sin snapshot de alojamiento continúan funcionando sin cambios.
