# Slice de accesibilidad de reserva y pago

Este documento registra el trabajo de accesibilidad de la Fase 9D-4 para el feedback de reserva y el recorrido de pago del cliente en Open Travel Platform / Kairoseth Travel.

Es un baseline técnico, **no una certificación WCAG ni una declaración de conformidad legal**. El objetivo sigue siendo una implementación orientada a WCAG 2.2 AA junto con revisión manual con teclado, lector de pantalla y contenido.

## Feedback de reserva

Las páginas de reserva de viajes y servicios exponen ahora los errores devueltos por servidor mediante regiones estables `role="alert"` con `aria-live="assertive"`. De esta forma, errores por disponibilidad desactualizada, validación de viajeros, inventario, alojamiento o reglas del paquete no se comunican únicamente mediante estilos visuales.

Los formularios de reserva existentes mantienen labels visibles y controles required nativos. La recuperación de errores campo a campo en cliente, los estados dinámicos de preparación de viajeros y una revisión adicional con tecnologías de apoyo quedan como trabajo posterior.

## Feedback del checkout

El checkout autenticado distingue ahora:

- fallos accionables de pago/proveedor mediante `role="alert"` y `aria-live="assertive"`;
- estados no erróneos como reserva cancelada, pago completo, confirmación pendiente, pago online no disponible o calendario de pagos desactualizado mediante `role="status"` y `aria-live="polite"`;
- el resumen de pago mediante una lista de descripción con nombre accesible;
- el área de métodos de pago disponibles mediante un nombre accesible;
- los formularios de proveedor relacionados con el error de checkout devuelto cuando existe.

Estas superficies de accesibilidad no exponen credenciales de proveedor ni payloads de pago.

## Handoff y retorno del proveedor

El puente de Redsys expone el mensaje de redirección como estado polite y conserva el botón manual “Continuar a Redsys”. La página de retorno del proveedor expone una única región de estado atómica: un pago fallido es una alerta assertive, mientras que un pago confirmado o aún pendiente es un status polite.

Las páginas alojadas por el proveedor quedan fuera del DOM de la aplicación open-source y deben revisarse por separado para cada cuenta/proveedor de producción. La validación TEST/LIVE con credenciales reales de Stripe/Redsys sigue siendo un gate dependiente de cuentas externas.

## Evidencia bloqueante en navegador

Un smoke test dedicado en Chromium utiliza un replica set MongoDB desechable y un seed controlado para comprobar:

1. los errores de reserva de viaje se exponen como alertas assertive;
2. un cliente real puede registrarse y crear una reserva persistente;
3. el checkout autenticado expone un error de proveedor como alerta;
4. el resumen de pago tiene un nombre accesible estable;
5. el estado actual/sin proveedor del checkout se expone de forma polite.

El test de navegador no contacta con Stripe ni Redsys.

## Trabajo restante de la Fase 9D-4

Los siguientes slices de accesibilidad incluyen estados y recuperación de errores más ricos dentro de los formularios cliente de viajes/servicios, workflows de Operator, revisión más amplia de contraste/contenido y recorridos manuales con tecnologías de apoyo en superficies inglesas y españolas.
