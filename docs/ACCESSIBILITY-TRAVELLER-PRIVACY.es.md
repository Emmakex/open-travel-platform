# Traveller Data y privacidad accesibles

Este slice de la Fase 9D-4 cubre las interacciones de cliente de Traveller Data y derechos de privacidad. Complementa `ACCESSIBILITY-BASELINE.es.md` y mantiene un enfoque técnico orientado a WCAG 2.2 AA, no una afirmación de certificación.

## Traveller Data

- Cada control requerido tiene un ID único estable y asociación explícita con su label.
- Un fallo de validación devuelto conserva únicamente el `travellerId` técnico ya existente como contexto de workflow para devolver la atención al viajero afectado.
- Los campos de ese viajero exponen `aria-invalid` y referencian el error compartido mediante `aria-describedby`.
- El primer campo afectado recibe el foco tras un error de validación devuelto.
- Los fallos de validación/guardado usan una región asertiva `role="alert"`.
- El progreso y las confirmaciones de guardado usan regiones educadas `role="status"`.
- El cifrado, la retención y la autoridad de ownership no cambian en este slice de accesibilidad.

## Derechos de privacidad

- El selector de derecho tiene relaciones estables de ayuda/error mediante `aria-describedby`.
- El error de derecho inválido usa `role="alert"`; las confirmaciones de creación y retirada usan regiones educadas `role="status"`.
- Las acciones repetidas incluyen el tipo de derecho en su nombre accesible, por ejemplo `Retirar solicitud de Acceso` y `Descargar JSON aprobado de Acceso`.
- El texto de preparación de exportación expone semántica de estado sin modificar la aprobación de entrega ni la autoridad del export.

## Validación bloqueante

Un test dedicado en Chromium usa autenticación persistente de cliente y MongoDB desechable. Crea una reserva real, añade únicamente un snapshot de requisitos Traveller Data local de CI, valida foco/relaciones de error, crea solicitudes reales de privacidad y comprueba los nombres contextuales de las acciones.

El test no almacena secretos productivos ni modifica datos de producción/cliente.

## Trabajo restante de 9D-4

Siguen pendientes las interacciones de reserva/pago, formularios Operator, revisión amplia de contraste/contenido y journeys manuales con tecnologías de apoyo antes de cerrar la preparación de accesibilidad.
