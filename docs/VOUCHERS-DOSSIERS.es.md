# Vouchers y expedientes de reserva

<p align="center"><a href="./VOUCHERS-DOSSIERS.md">English</a> · <strong>Español</strong></p>

La Fase 7B-3 añade vouchers seguros para cliente y un expediente imprimible interno para Operator sobre la capa ya existente de confirmaciones y documentos por salida.

## Tipos de documento

### Voucher de alojamiento

Disponible para una **reserva de viaje confirmada que tenga alojamiento**.

El cliente y un Operator autorizado pueden descargar el mismo documento orientado al cliente. Se genera desde el snapshot de la reserva e incluye:

- referencia de reserva;
- viaje y fechas;
- nombres de viajeros;
- alojamiento y tipo de habitación;
- fechas de entrada/salida;
- régimen;
- distribución de habitaciones guardada como snapshot;
- confirmación/localizador de proveedor cuando esa referencia haya sido aprobada explícitamente para divulgarse al cliente;
- versión/estado del documento y fecha/hora UTC de generación.

No lee el almacenamiento post-compra protegido del viajero y no incluye costes de proveedor ni notas internas.

### Voucher de servicio

Disponible para una **reserva de servicio independiente confirmada**.

Cliente y Operator autorizado pueden descargar el mismo voucher seguro para actividades, transporte o protección de viaje. Incluye el snapshot contratado del servicio, fecha/horario o fechas del viaje cubierto, viajeros y una referencia aprobada del proveedor cuando corresponda.

### Expediente de reserva Operator

El expediente es un **documento operativo interno** disponible para personal con la capacidad Reservas.

Consolida:

- estado y fechas de reserva;
- resumen de contacto del cliente;
- datos ordinarios del snapshot de viajeros;
- distribución de alojamiento;
- suplementos del paquete;
- reservas de servicios vinculadas;
- resumen de pagos únicamente si la cuenta actual tiene capacidad Finanzas;
- resumen de fulfilment únicamente si la cuenta actual tiene capacidad Proveedores;
- versión/estado y fecha/hora UTC de generación.

El expediente excluye deliberadamente valores protegidos post-compra de documento/residencia, costes de proveedor y notas internas de texto libre.

## Frontera de divulgación de referencias de proveedor

Las referencias de proveedor son internas por defecto.

Una referencia puede aparecer en un voucher de cliente solo después de que personal con capacidad Proveedores apruebe explícitamente **esa referencia exacta y actual** desde el panel de Gestión de proveedores.

La aprobación se guarda por separado del registro operativo de fulfilment y queda auditada. El registro de divulgación conserva la referencia exacta aprobada. La proyección orientada al cliente exige simultáneamente:

1. que el componente siga teniendo una referencia de proveedor;
2. que la divulgación siga activada;
3. que la referencia aprobada coincida exactamente con la referencia actual.

Si posteriormente se cambia el localizador, la aprobación anterior deja de coincidir y el nuevo valor queda automáticamente oculto hasta aprobarlo de nuevo. Así una aprobación antigua nunca autoriza silenciosamente un valor nuevo.

## Reglas de acceso

Las rutas de cliente siempre resuelven al cliente autenticado actual y cargan únicamente una reserva propiedad de esa identidad.

Los vouchers exigen además que la reserva esté `confirmed`. El voucher de alojamiento requiere también un alojamiento guardado en el snapshot.

Las rutas Operator de voucher/expediente requieren capacidad Reservas. El expediente comprueba por separado Finanzas y Proveedores antes de cargar esos conjuntos de datos.

Todos los endpoints PDF usan:

```text
Cache-Control: private, no-store, max-age=0
X-Content-Type-Options: nosniff
```

## Rutas

```text
/account/reservations/[id]/accommodation-voucher
/account/services/[id]/voucher

/operator/reservations/[id]/accommodation-voucher
/operator/service-reservations/[id]/voucher
/operator/reservations/[id]/dossier
```

La entrada principal de Operator es `/operator/documents`.

## Persistencia

La política de divulgación se guarda separada de los datos operativos del proveedor:

```text
travel_supplier_reference_disclosures
travel_supplier_reference_disclosure_audit
```

La auditoría registra identidad/rol del personal, objetivo/componente, visibilidad before/after, referencia exacta aprobada y fecha/hora. Las rutas de cliente nunca leen este historial de auditoría.

## Quality gate

Ejecutar:

```bash
npm run check:voucher-documents
```

El check genera PDFs EN/ES reales y verifica propiedad/autorización, requisito de confirmación, headers privados, aprobación de referencia exacta, persistencia de auditoría y fronteras de privacidad del renderer.

`npm run verify` y GitHub CI incluyen este gate junto con los checks existentes de documentos de reserva/salida, fulfilment y permisos del personal.
