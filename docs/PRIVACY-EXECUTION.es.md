# Ejecución de derechos de privacidad: exportación, limitación y supresión

Este documento describe la capa técnica de ejecución posterior al workflow de solicitudes de privacidad. Está diseñada tomando como referencia el RGPD de la UE y la guía de la AEPD española, pero **no es asesoramiento jurídico, no decide la base jurídica y no constituye una certificación de cumplimiento** para un despliegue concreto.

Referencias oficiales utilizadas para este baseline técnico:

- RGPD (Reglamento (UE) 2016/679), especialmente artículos 15, 17, 18 y 20: https://eur-lex.europa.eu/eli/reg/2016/679/oj
- AEPD, derecho de acceso: https://www.aepd.es/derechos-y-deberes/conoce-tus-derechos/derecho-de-acceso
- AEPD, derecho de supresión: https://www.aepd.es/derechos-y-deberes/conoce-tus-derechos/derecho-de-supresion-al-olvido
- AEPD, limitación del tratamiento: https://www.aepd.es/derechos-y-deberes/conoce-tus-derechos/derecho-la-limitacion-del-tratamiento
- AEPD, portabilidad: https://www.aepd.es/preguntas-frecuentes/1-tus-derechos/2-tus-derechos-de-proteccion-de-datos/FAQ-0113-que-es-el-derecho-a-la-portabilidad-de-los-datos

## Condición previa de ejecución

Crear una solicitud de privacidad nunca ejecuta por sí sola una exportación, limitación o supresión.

Un Admin debe revisar primero el expediente y moverlo a `action-pending`. Después la capa de ejecución aplica gates específicos:

- acceso / portabilidad: se necesita aprobación explícita de entrega por Admin antes de que aparezca la descarga al cliente;
- limitación: exige confirmación explícita de Admin;
- supresión: exige confirmación explícita de Admin **y** `retentionState=clear`.

Los expedientes terminales (`completed`, `declined`, `withdrawn`) no pueden iniciar nuevas operaciones sobre datos.

## Exportaciones de acceso y portabilidad

Las exportaciones aprobadas se entregan como `application/json`, con `schemaVersion` estable y estructura legible por máquina.

La ruta cliente exige autenticación, está limitada a la identidad propietaria, devuelve el archivo como adjunto y utiliza `private, no-store`.

### Paquete de acceso

El paquete de acceso puede incluir:

- campos seguros del perfil cliente;
- reservas de viaje propiedad del cliente;
- reservas de servicios propiedad del cliente;
- Traveller Data protegido y activo, descifrado únicamente para ese cliente y solo cuando la keyring configurada está disponible;
- historial de movimientos de pago/reembolso relacionados con los identificadores de reserva del cliente;
- historial de expedientes de privacidad;
- historial de estados de reservas relevante para el cliente sin identidades internas de staff no necesarias.

Se excluyen deliberadamente contraseñas, hashes/salts de contraseña, tokens de sesión, hashes de tokens, credenciales de proveedores e identificadores internos de staff no necesarios.

Si existen Traveller Data cifrados activos pero la keyring no está disponible, la exportación falla de forma segura en lugar de entregar un paquete incompleto silenciosamente.

### Paquete de portabilidad

El paquete de portabilidad es más acotado. Se centra en información de cuenta y datos de reservas/servicios/viajeros aportados mediante el uso de la plataforma, en formato JSON estructurado.

Se excluyen del paquete de portabilidad el historial contable/de pagos, los internos del expediente de privacidad y la auditoría de staff. La aplicación del artículo 20 depende todavía de las condiciones jurídicas reales del tratamiento de cada despliegue; el software no selecciona la base jurídica.

## Limitación del tratamiento

El ejecutor técnico actual de limitación suspende la cuenta cliente y revoca todas las sesiones persistentes. **No elimina registros de negocio**.

Esto respeta la diferencia entre conservar datos y suspender su tratamiento/uso ordinario. Procesadores downstream específicos de cada producto o despliegue pueden requerir propagación adicional de la limitación fuera del core open-source.

## Ejecutor de supresión

La supresión falla de forma segura salvo que el expediente haya superado la revisión de retención con `retentionState=clear`.

El ejecutor online acotado:

- deshabilita y anonimiza el perfil cliente;
- sustituye la propiedad directa de reservas por un pseudónimo determinista ligado a la solicitud;
- vacía nombres, apellidos, fecha de nacimiento y nacionalidad de snapshots de viajeros, preservando la estructura de reserva, inventario y financiera;
- pseudonimiza al actor cliente en el historial de estados de servicios;
- revoca sesiones cliente;
- elimina Traveller Data protegido propiedad de esa identidad;
- elimina notas libres de pago e identificadores de actor cliente manteniendo el ledger monetario autoritativo;
- pseudonimiza el vínculo de sujeto en auditoría de autenticación y elimina su hash de email;
- pseudonimiza el vínculo de identidad del expediente/auditoría de privacidad;
- pseudonimiza tareas operativas dirigidas al cliente;
- elimina copias retenidas de eventos de integración de cliente y sus registros de delivery/intentos.

El ID técnico original de la cuenta permanece como primary key del registro deshabilitado, pero los campos directamente identificativos se sustituyen/eliminan y la propiedad secundaria de casos/registros de negocio pasa al pseudónimo determinista. Despliegues con requisitos de eliminación más estrictos pueden añadir una compactación/migración offline posterior cuando todas las restricciones de retención y referencias hayan quedado resueltas.

## Ejecución online acotada y migración offline

La vía online limita deliberadamente la ejecución a un máximo de 500 reservas de viaje y 500 reservas de servicio por identidad. Las cuentas por encima de ese umbral fallan con `PRIVACY_EXECUTION_REQUIRES_OFFLINE_MIGRATION` en lugar de iniciar una transacción web sin límites.

Las cuentas grandes deben gestionarse con un runbook de migración offline controlado, backups, inventario/dry-run y verificación posterior.

## Modelo de reintentos

La supresión principal de cuenta/reservas es transaccional. La limpieza de enlaces secundarios se ejecuta en una segunda transacción idempotente.

El runner consulta primero el registro persistido de ejecución. Si la supresión principal ya se realizó, un reintento reutiliza el mismo pseudónimo y únicamente converge la limpieza secundaria. Así una interrupción de proceso o un fallo transitorio no genera otro pseudónimo ni repite trabajo destructivo principal.

## Cierre del expediente

La ejecución y el cierre del expediente son operaciones separadas. Después de verificar el resultado técnico, Admin debe cerrar la solicitud con el resultado estructurado correspondiente (`fulfilled`, `partially-fulfilled`, `retention-required`, etc.).

Esta separación evita que una operación irreversible afirme implícitamente que todas las obligaciones jurídicas o de comunicación del expediente ya se han cumplido.
