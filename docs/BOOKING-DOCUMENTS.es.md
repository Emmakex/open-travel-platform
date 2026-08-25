# Documentos de reserva

<p align="center"><a href="./BOOKING-DOCUMENTS.md">English</a> · <strong>Español</strong></p>

Open Travel Platform incorpora una capa reutilizable de documentos server-side para documentos de reserva orientados al cliente. Kairoseth Travel la utiliza como implementación de referencia.

## PDF de confirmación de reserva

Las reservas de viaje pueden generar una confirmación PDF bilingüe EN/ES a partir del snapshot actual de la reserva.

Ruta de cliente:

```text
/account/reservations/:id/confirmation
```

Ruta de Operator:

```text
/operator/reservations/:id/confirmation
```

El personal de Operator también dispone del espacio protegido:

```text
/operator/documents
```

## Qué contiene la confirmación

El PDF puede incluir:

- referencia y estado actual de la reserva;
- nombre del viaje y fechas contratadas;
- fecha de creación de la reserva;
- número de viajeros y total de la reserva;
- resumen de contacto del cliente;
- nombres de viajeros del snapshot de la reserva;
- alojamiento contratado, habitación, fechas, noches, número de habitaciones y régimen;
- suplementos del paquete y sus importes contratados;
- estado de pago, neto pagado y saldo pendiente cuando quien genera el documento tiene autorización para acceder a esa información.

El documento es un resumen de reserva e indica expresamente que no sustituye una factura fiscal.

## Autorización y privacidad

### Cliente

Un cliente solo puede descargar la confirmación de una reserva perteneciente a su propia identidad autenticada. La consulta al repositorio queda limitada por `identityId` y por el ID de la reserva.

### Operator

Generar una confirmación desde Operator exige la capability `reservations`.

Los datos de pago solo se cargan en un PDF generado por personal cuando la identidad dispone además de la capability `finance`. Un Operator con Reservas pero sin Finanzas puede generar el resumen de reserva para el cliente, pero se omiten estado de pago, importe pagado y saldo pendiente.

### Datos excluidos deliberadamente

El renderer de confirmación **no** carga ni expone:

- datos post-compra cifrados de viajeros/documentación;
- campos de pasaporte/DNI recogidos después de reservar;
- notas internas de reserva;
- comentarios de tareas o seguimientos;
- referencias/localizadores de proveedor;
- costes internos de proveedor;
- notas de proveedor o eventos de auditoría de fulfilment;
- motivos internos de modificaciones;
- datos de autenticación o seguridad del personal.

Esta separación es intencionada. Las exportaciones más sensibles deben tener su propio contrato de autorización, auditoría y retención en lugar de reutilizar un documento orientado al cliente.

## Arquitectura técnica

El renderer reutilizable se implementa en:

```text
lib/booking-confirmation-document.ts
```

Utiliza `pdf-lib` sobre runtime Node.js y devuelve directamente bytes PDF. No requiere navegador externo, suite ofimática, servicio PDF ni binarios específicos del hosting.

Los endpoints de documentos son dinámicos y usan cabeceras privadas `no-store`.

El renderer es deliberadamente independiente de MongoDB y de la autenticación. Las rutas son responsables de cargar únicamente los datos autorizados y pasar una entrada segura al renderer. Esto permite reutilizar la capa documental en futuros adapters y despliegues.

## Invariante de CI

`npm run check:booking-documents` genera PDFs reales en EN y ES y comprueba:

- salida válida `%PDF-`;
- generación segura de nombres de archivo;
- acceso de cliente limitado a sus propias reservas;
- capability Reservas en rutas Operator;
- control de Finanzas para detalles de pago;
- espacio de documentos Operator protegido;
- ausencia de dependencias de datos post-compra de viajeros y proveedores dentro del renderer.

El check forma parte tanto de `npm run verify` como de GitHub Actions CI.

## Siguientes documentos

La base documental compartida puede ampliarse ahora para:

- rooming lists;
- listas de viajeros;
- vouchers;
- expedientes imprimibles de reserva;
- exportaciones CSV/XLSX controladas;
- exportaciones auditadas de datos sensibles cuando exista un uso operativo legítimo.
