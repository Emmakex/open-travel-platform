# Baseline de observabilidad

Open Travel Platform emite logs operativos neutrales respecto a proveedores como un objeto JSON por línea. El core escribe eventos estructurados en stdout/stderr en lugar de acoplar el proyecto a un proveedor de monitorización concreto. La infraestructura de despliegue puede reenviar estas líneas JSON a la plataforma de logs/errores elegida por la organización.

## Registro estructurado

Los eventos operativos usan la versión de esquema `1` y un conjunto acotado de campos:

- `schemaVersion`
- `timestamp`
- `service`
- `level` (`info`, `warn`, `error`)
- `event`
- `component`
- `correlationId` opcional
- `fields` escalares saneados opcionales
- `errorType` y `errorCode` seguros opcionales

El logger nunca serializa el mensaje ni el stack de una excepción. Los mensajes de error pueden contener payloads de proveedor, PII o secretos y por ello no forman parte del contrato operativo genérico.

## Correlación de requests

Las rutas instrumentadas aceptan `X-Request-Id` únicamente cuando es un token acotado compuesto por letras, dígitos, `.`, `_`, `:` o `-`. Texto arbitrario, espacios o valores similares a emails se rechazan y se sustituyen por `req-<uuid>` generado por el servidor.

El correlation ID resultante se devuelve como `X-Request-Id`, permitiendo unir logs de aplicación, reverse proxy y diagnóstico del llamante sin exponer datos del cliente.

Superficies críticas instrumentadas actualmente:

- worker interno de integraciones;
- webhook firmado de Stripe;
- notificación firmada de Redsys;
- readiness productivo cuando no está listo o cuando falla la propia comprobación.

Los probes de readiness correctos no se registran para evitar ruido de alto volumen.

## Redacción y minimización de datos

El logger genérico acepta únicamente campos escalares y elimina nombres de campo sensibles, incluyendo credenciales/autenticación, cookies, firmas, identificadores de cliente/contacto, dirección, email/teléfono, pasaporte/DNI/documentos/datos de salud/viajero, tarjeta, cuerpos/payloads crudos y referencias de proveedor.

Los textos seguros se normalizan y limitan a 240 caracteres. Los números no finitos se descartan. Un fallo del propio logging es fail-safe y nunca convierte un error de aplicación en un segundo fallo.

Nunca se deben enviar al logging operativo cuerpos HTTP crudos, firmas de pago, access tokens, secretos cifrados, datos protegidos de viajeros ni payloads de error del proveedor.

## Callbacks de pago

La observabilidad no cambia el modelo de autoridad de pagos:

- las firmas del proveedor siguen siendo autoritativas;
- los retornos del navegador siguen sin ser autoritativos;
- los claims duplicados de webhook siguen siendo idempotentes;
- errores de base de datos/finalización devuelven HTTP 500 para permitir retry del proveedor;
- los logs contienen únicamente proveedor, outcome/motivo normalizado, tipo de evento cuando sea seguro, duración y metadatos de correlación.

No se emiten importe, moneda, identificador checkout/pedido, referencia proveedor, código de autorización, firma ni cuerpo firmado.

## Worker de integraciones

El worker registra eventos seguros para configuración no disponible, autenticación rechazada, ejecución aplazada/ocupada, finalización y fallo. No serializa el resultado de entregas, secretos de endpoints ni respuestas de proveedor.

## Recolección centralizada

En producción se deben recoger los JSON de stdout/stderr con la infraestructura de runtime/logging existente y reenviarlos a un almacén central consultable con controles de acceso y retención. Los transports específicos de vendors de observabilidad deben implementarse detrás de un adapter opcional separado, no dentro del dominio core.

## Gates automatizados

- `npm run test:observability` valida dinámicamente request IDs, estructura JSON y redacción.
- `npm run check:observability` protege estáticamente la frontera y la instrumentación de rutas críticas.

Ambos son gates bloqueantes de CI. Browser E2E sigue siendo una señal informativa/no bloqueante independiente.
