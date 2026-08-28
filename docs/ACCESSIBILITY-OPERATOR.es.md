# Cierre de accesibilidad de Operator

Este documento registra el cierre técnico de accesibilidad de la Fase 9D-4 para los flujos protegidos de Operator en Open Travel Platform / Kairoseth Travel.

Es un baseline de ingeniería orientado a WCAG 2.2 AA. **No** es una certificación WCAG automática ni una declaración legal de conformidad. Los despliegues de producción siguen necesitando revisión manual con teclado, lector de pantalla, zoom/reflow, contraste y contenido sobre flujos representativos del personal.

## Gestión interna de la reserva

El workspace de reserva da ahora a la gestión interna un encabezado programático estable y expone los resultados devueltos por servidor mediante regiones vivas:

- los cambios correctos de workflow o notas usan `role="status"` con `aria-live="polite"`;
- los fallos accionables usan `role="alert"` con `aria-live="assertive"`;
- los formularios de workflow y notas referencian la región de error correspondiente mediante `aria-describedby`;
- responsable, prioridad, etiquetas y nota pueden exponer `aria-invalid` cuando el código de validación devuelto identifica esos controles;
- las etiquetas conservan a la vez su ayuda visible y la relación programática con errores devueltos.

No se modifica la autoridad de la reserva, inventario, pricing, visibilidad del cliente ni semántica de auditoría.

## Tareas y seguimientos

La superficie de tareas expone creación, actualización y comentarios con el mismo contrato de status frente a alert. Los formularios repetidos reciben nombres accesibles contextuales, cada tarea se presenta como `article` con encabezado y los historiales tienen nombres vinculados a la tarea correspondiente.

Los códigos de validación devueltos pueden marcar como inválidos título, responsable, vencimiento, estado o seguimiento. La autoridad de tareas, reglas de transición, permisos de staff e historial persistente no cambian.

## Fulfilment de proveedores

El fulfilment de proveedores mantiene su autoridad local y el modelo seguro del adapter externo mientras mejora la semántica para tecnologías de asistencia:

- feedback de éxito/error mediante regiones estables de status polite y alert assertive;
- cada componente se presenta como `article` nombrado por su encabezado;
- formularios repetidos, grupos de acciones del adapter, controles de referencia para vouchers y formularios de notas reciben nombres accesibles contextuales;
- proveedor, estado, coste y nota pueden exponer `aria-invalid`;
- la visibilidad de la referencia para vouchers se comunica como estado no erróneo;
- auditorías e historiales quedan nombrados por componente.

Estos cambios no alteran transiciones de proveedor, payloads del adapter externo, costes de proveedor, pricing del cliente, ledger de pagos ni límites de Traveller Data protegidos.

## Evidencia bloqueante de navegador

`tests/e2e/accessibility-operator.spec.ts` se ejecuta con autenticación persistente de cliente y staff respaldada por MongoDB. Crea una reserva real, inicia sesión en Operator con el Admin bootstrap y verifica que el workspace de reserva expone la severidad correcta de status/alert, nombres de formularios, relaciones de error y estado inválido de controles.

El workflow CI dedicado utiliza un replica set descartable de MongoDB 8, el seed determinista existente, build de producción y Chromium fijado.

## Revisión manual todavía necesaria

Los checks automáticos no pueden demostrar conformidad completa. Antes de que un despliegue realice una declaración formal de accesibilidad, debe revisarse como mínimo:

- navegación y operación completa solo con teclado en colas y workspaces representativos de Operator;
- NVDA/JAWS en Windows y VoiceOver en macOS/iOS para flujos representativos del personal;
- orden de foco y recuperación de foco después de fallos reales de validación server-side;
- zoom 200%/400% y reflow estrecho en pantallas operativas densas;
- contraste de texto, iconos y estados con el tema de marca desplegado;
- labels, instrucciones y mensajes de error con contenido operativo real;
- páginas externas de pago/proveedor por separado, porque las superficies de terceros quedan fuera de la autoridad de renderizado de este core.

La Fase 9D-4 cierra por tanto el baseline técnico del core, manteniendo la validación manual específica de cada despliegue como responsabilidad de release.