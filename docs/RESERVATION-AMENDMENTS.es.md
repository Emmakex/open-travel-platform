# Modificaciones de reserva

La Fase 6B incorpora cambios controlados después de la reserva sin borrar ni reescribir el historial operativo original.

## Regla principal

El documento de reserva representa el **estado operativo actual**. Cada cambio material posterior a la compra se escribe también en un historial independiente e inmutable para poder ver qué cambió, quién lo cambió, por qué y cuándo.

Colección MongoDB:

```text
travel_reservation_amendments
```

El ledger de pagos sigue siendo la fuente autoritativa de los movimientos financieros y no se reescribe al modificar una reserva.

## Fase 6B-1 — correcciones de viajeros

Este primer bloque soporta únicamente correcciones que no obligan a recalcular precio ni mover inventario:

- nombre;
- apellidos;
- nacionalidad.

Cada corrección exige un motivo por parte de Operador/Admin y guarda:

- ID de reserva;
- ID de viajero;
- tipo de modificación;
- identidad y rol del operador;
- únicamente los campos modificados;
- valor anterior;
- valor nuevo;
- motivo;
- fecha y hora.

La actualización de la reserva y la inserción del historial se ejecutan dentro de la misma transacción MongoDB. No debe ser posible que quede un cambio parcial.

Las reservas canceladas no se pueden modificar.

### Bloqueado intencionadamente en 6B-1

Por ahora son de solo lectura:

- fecha de nacimiento;
- edad a la salida;
- banda/código de tarifa;
- precio del viajero;
- consumo de inventario;
- relación con el adulto responsable;
- salida del viaje.

Modificar cualquiera de estos datos puede afectar al precio, a las reglas de menores o a la capacidad. Se abordarán en los siguientes bloques de 6B con recálculo en servidor y protección de inventario.

Los datos avanzados post-compra de identidad/documentación no se muestran ni se copian a este historial. Continúan en el almacén cifrado de datos de viajeros.

## Flujo del Operador

```text
Operador → Reservas → Detalle de reserva → Viajeros
→ Corregir datos del viajero
```

1. Abrir el control de corrección del viajero.
2. Corregir nombre, apellidos y/o nacionalidad.
3. Introducir un motivo obligatorio.
4. Guardar.
5. La reserva muestra inmediatamente el valor actual corregido.
6. El panel **Historial de cambios** conserva el valor original como `antes → después` junto con operador, motivo y fecha.

## Plan de entrega

### 6B-1

- modelo de modificaciones e índices MongoDB;
- escritura transaccional segura;
- correcciones de nombre/nacionalidad desde Operador;
- historial antes/después en la interfaz.

### 6B-2

- cambio de salida;
- reservar primero la nueva capacidad y liberar después la anterior;
- movimiento atómico de inventario y rollback.

### 6B-3

- cambios de viajeros que afecten a edad/tarifa;
- recálculo autoritativo en servidor;
- delta de precio, saldo pendiente y saldo reembolsable;
- los movimientos históricos del ledger no se alteran.

### 6B-4

- altas/bajas de servicios vinculados;
- notificaciones de modificaciones;
- fechas límite configurables para cambios/cancelaciones;
- políticas de modificación más amplias.

## Pruebas de producción para 6B-1

1. Abrir una reserva de viaje no cancelada en Operador.
2. Corregir un campo de un viajero e indicar un motivo.
3. Confirmar que aparece el nuevo valor en la reserva.
4. Confirmar que **Historial de cambios** muestra valor anterior y nuevo.
5. Recargar y comprobar que estado e historial persisten.
6. Enviar exactamente los mismos valores y comprobar que se rechaza como `Sin cambios`.
7. Confirmar que una reserva cancelada no muestra controles de corrección.
8. Confirmar que los datos cifrados avanzados de documento/residencia no aparecen en el historial.
