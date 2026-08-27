# Endurecimiento de auditoría privilegiada

La Fase 9C-4 hace que las mutaciones administrativas de alto impacto sean **fail-closed** junto con su registro persistente de auditoría. Un cambio privilegiado no se considera confirmado salvo que la mutación de negocio y su evento de auditoría se confirmen juntos dentro de la misma transacción MongoDB.

## Superficies privilegiadas cubiertas

### Configuración de proveedores de pago

Los cambios de configuración TEST/LIVE de Stripe y Redsys se confirman transaccionalmente con `travel_payment_provider_audit`.

La auditoría guarda únicamente metadata operativa como proveedor, entorno, estado enabled, identidad/rol del actor y timestamp. Las API keys, secretos webhook, claves de firma Redsys y demás valores secretos nunca se escriben en los registros de auditoría.

Si falla la inserción de auditoría, el reemplazo de la configuración del proveedor de pago se revierte automáticamente. Así se evita que exista un cambio privilegiado de credenciales/configuración sin su correspondiente evento de auditoría.

### Endpoints de integraciones salientes

La creación, actualización y eliminación de endpoints webhook se confirma transaccionalmente con `travel_integration_endpoint_audit`.

La metadata de auditoría se limita de forma intencionada a identidad del endpoint, acción, actor, estado enabled, nombres de eventos suscritos y timestamp. El secreto de firma cifrado no se copia al histórico de auditoría.

Si falla la persistencia de la auditoría, la creación/actualización/eliminación del endpoint se revierte.

### Capacidades del personal

La asignación y eliminación explícita de capacidades del personal ya utiliza transacciones MongoDB junto con `travel_staff_capability_audit`. La Fase 9C-4 conserva ese contrato como comportamiento de referencia para otras mutaciones privilegiadas.

## Regla fail-closed

Para una mutación privilegiada auditada:

```text
leer estado autoritativo actual
        ↓
aplicar mutación privilegiada
        ↓
insertar evento de auditoría acotado
        ↓
confirmar una única transacción MongoDB
```

Cualquier excepción antes del commit aborta la transacción. La aplicación no debe capturar un fallo de auditoría y continuar aplicando la mutación privilegiada.

Esto es deliberadamente más estricto que la observabilidad ordinaria. Los logs estructurados y `FailureTransport` son diagnósticos operativos best-effort/no autoritativos; la auditoría privilegiada persistente forma parte de la frontera de integridad de la mutación.

## Frontera de privacidad de auditoría

La auditoría persistente debe responder **quién cambió qué categoría de estado privilegiado, cuándo y hacia qué estado de alto nivel** sin convertirse en un segundo almacén de secretos o datos personales.

No guardes en registros genéricos de auditoría privilegiada:

- API keys, secretos de firma, contraseñas, tokens de sesión o claves de cifrado;
- payloads raw de proveedores/webhooks;
- datos personales de clientes o viajeros;
- valores completos de datos protegidos post-compra;
- datos de tarjeta u otras credenciales de pago.

Cuando sea necesaria evidencia forense adicional, correlaciona el evento de auditoría acotado con los logs operativos estructurados mediante identificadores seguros y timestamps, en lugar de duplicar payloads sensibles.

## Requisito MongoDB

La auditoría privilegiada fail-closed requiere soporte de transacciones MongoDB. Los despliegues productivos MongoDB/Atlas deben proporcionar un replica set u otra topología compatible con transacciones. Esto ya está alineado con los requisitos transaccionales de reservas, inventario y outbox.

## Validación

La validación bloqueante incluye:

- invariantes estáticos que demuestran que pagos, integraciones y permisos de staff usan sesiones/transacciones MongoDB;
- una prueba contra replica set MongoDB real que fuerza intencionadamente un fallo de escritura de auditoría;
- prueba de que un cambio rechazado de configuración de pago conserva la configuración anterior;
- prueba de que una eliminación rechazada de endpoint de integración conserva el endpoint.

Un bloque posterior de la Fase 9C abordará por separado los procedimientos de recuperación/rotación de claves de cifrado y re-cifrado. El endurecimiento de auditoría no hace por sí solo que las claves maestras sean rotables de forma segura.
