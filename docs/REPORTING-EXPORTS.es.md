# Reporting y exportaciones

La Fase 7B-4 añade exportaciones operativas CSV/XLSX, conciliación financiera y una ruta estrictamente controlada para exportar datos post-compra protegidos de viajeros.

## Workspace de Operator

El workspace protegido está disponible en:

```text
/operator/reports
```

Las secciones visibles dependen de las capacidades de la cuenta de personal.

- **Reservas**: reservas de viaje, reservas de servicios y exportaciones de clientes.
- **Finanzas**: conciliación, saldos pendientes e ingresos por producto/servicio.
- **Datos de viajeros + Reservas**: exportación de datos protegidos del viajero para una reserva activa concreta.

El servidor vuelve a comprobar las capacidades en cada endpoint de exportación. Ocultar un botón en la interfaz nunca se considera autorización suficiente.

## CSV y XLSX

Los datasets operativos y financieros están disponibles en CSV y XLSX.

Ambos formatos se generan desde la misma definición `TabularExport`, evitando que el significado de las columnas diverja silenciosamente entre formatos.

El generador XLSX es intencionadamente pequeño y crea un workbook OOXML estándar con:

- una hoja;
- fila de cabecera congelada;
- autofiltro;
- anchos de columna limitados;
- strings inline en lugar de fórmulas de hoja de cálculo.

Los valores CSV que empiezan con caracteres de control de fórmulas (`=`, `+`, `-`, `@`, tabulador o retorno de carro) se fuerzan a texto literal antes de serializarlos. Esto reduce el riesgo de inyección de fórmulas CSV/spreadsheet al abrir un export de forma interactiva.

Todas las respuestas de descarga utilizan:

```text
Cache-Control: private, no-store, max-age=0
X-Content-Type-Options: nosniff
```

## Filtros de fecha

El workspace admite filtros opcionales `from` / `to`. Se aplican a la **fecha de creación del registro**, no a la fecha de salida o del servicio.

Si las dos fechas se introducen invertidas, el servidor las normaliza al rango cronológico correcto.

## Informes financieros

El personal con permiso de Finanzas puede exportar:

- conciliación por reserva/servicio;
- saldos pendientes activos e importes de cuotas vencidas;
- valor reservado, cobrado neto, reembolsado y pendiente agrupado por producto/servicio.

Las monedas nunca se suman entre sí. La interfaz mantiene los totales separados por moneda y cada export incluye su columna de moneda.

El estado de la reserva y el estado del pago siguen siendo conceptos separados también en reporting.

## Auditoría de exportaciones estándar

Cuando está activo el modo de operaciones MongoDB, las exportaciones normales registran metadatos en:

```text
travel_operator_export_audit
```

La auditoría guarda:

- tipo y formato de exportación;
- ID, rol y nombre visible del actor;
- fecha/hora;
- número de filas;
- nombres de columnas exportadas;
- filtros de fecha normalizados;
- indicador de exportación sensible.

**No guarda los valores de las celdas exportadas.**

En modo de operaciones demo/no persistente se pueden generar exportaciones normales, pero no existe auditoría persistente.

## Exportación de datos protegidos de viajeros

Los valores post-compra protegidos permanecen separados de las exportaciones operativas normales.

El endpoint sensible:

```text
POST /operator/reports/protected-travellers/export
```

requiere simultáneamente:

1. sesión de personal autenticada;
2. capacidad `traveller-data`;
3. capacidad `reservations`;
4. una reserva activa de viaje o servicio;
5. un motivo operativo explícito de entre 10 y 500 caracteres;
6. clave de cifrado de datos de viajeros configurada;
7. modo de operaciones MongoDB persistente para poder guardar correctamente la auditoría.

Este endpoint es exclusivamente POST para que el motivo operativo y el identificador de la reserva seleccionada no aparezcan en query strings ni en el historial de URL del navegador.

### Orden fail-closed

Las exportaciones sensibles funcionan de forma fail-closed. La secuencia es:

1. autorizar al personal;
2. validar objetivo y motivo;
3. leer/descifrar los registros de viajeros aún dentro de retención para esa reserva concreta;
4. construir la tabla;
5. guardar la auditoría sensible;
6. solo entonces devolver los bytes CSV/XLSX.

Si no se puede guardar la auditoría persistente, no se entrega ningún archivo sensible.

### Alcance

La exportación protegida incluye los campos básicos de identidad del viajero de la reserva y los campos post-compra que todavía estén dentro de su ventana de retención.

No convierte los datos protegidos en una exportación general de clientes ni evita el almacenamiento cifrado existente.

## Límites

Las exportaciones normales están limitadas a 10.000 filas por petición. Las exportaciones protegidas de viajeros están limitadas a 500 viajeros para la reserva seleccionada.

Las integraciones masivas con BI/data warehouse deben resolverse mediante un adapter futuro y no mediante una descarga de navegador sin límites.

## Invariantes permanentes

Ejecuta:

```bash
npm run check:reporting-exports
```

El gate verifica, entre otros puntos:

- protección contra inyección de fórmulas CSV;
- salida XLSX real en ZIP/OOXML;
- nombres de archivo seguros;
- normalización de filtros de fecha;
- invariantes de tablas financieras/reporting;
- fronteras de autorización en exports normales y de Finanzas;
- export sensible exclusivamente por POST;
- export sensible exige permisos de Datos de viajeros y Reservas;
- motivo operativo obligatorio;
- la auditoría sensible se guarda antes de devolver la respuesta;
- el modelo de auditoría no define valores protegidos del viajero;
- se mantienen las cabeceras privadas/no-store.
