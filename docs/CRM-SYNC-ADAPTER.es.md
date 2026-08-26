# Adapter de sincronización CRM

La Fase 8C-3 añade una capacidad opcional de sincronización CRM exclusivamente downstream, sin convertir al CRM en autoritativo para reservas, pricing, inventario, fulfilment de proveedores ni contabilidad de pagos.

La implementación reutiliza la infraestructura existente de eventos/outbox/worker de las Fases 8A/8B. **No** crea una segunda cola en background.

## Modo de despliegue

La sincronización CRM es opt-in:

```text
CRM_SYNC_MODE=disabled
```

Modos soportados:

- `disabled` — por defecto; los flujos normales de cliente, reservas y Operator continúan sin entregar al CRM;
- `rest` — habilita el adapter REST CRM genérico versión 1.

Configuración REST:

```text
CRM_SYNC_MODE=rest
REST_CRM_BASE_URL=https://crm.example.com/otp/
REST_CRM_BEARER_TOKEN=<secreto-server-only>
REST_CRM_TIMEOUT_MS=10000
REST_CRM_MAX_RESPONSE_BYTES=262144
```

En producción los destinos deben usar HTTPS. HTTP solo se acepta contra localhost durante desarrollo. La URL base no puede contener credenciales, fragmentos ni query params. El token Bearer nunca debe almacenarse en una variable `NEXT_PUBLIC_*`.

## Frontera de autoridad

La sincronización CRM es **solo downstream**.

El CRM puede confirmar un upsert y devolver un identificador externo. No puede devolver ni aplicar cambios sobre:

- estado de reserva;
- precio de reserva del cliente;
- ledger de pagos/reembolsos;
- inventario;
- estado/coste/referencia de fulfilment de proveedor;
- registros de viajeros;
- datos post-compra protegidos del viajero.

Las fronteras de dominio locales siguen siendo autoritativas.

## Eventos y una sola cola durable

CRM reutiliza las colecciones existentes `travel_integration_events`, `travel_integration_deliveries` y el historial de intentos.

CRM consume:

```text
customer.created
customer.profile.updated
trip.reservation.created
trip.reservation.status.changed
service.reservation.created
service.reservation.status.changed
```

Los dos eventos `customer.*` se mantienen expresamente fuera de `WebhookIntegrationEventType`. No pueden seleccionarse en endpoints webhook genéricos configurados por Admin.

Los eventos de reservas continúan siendo elegibles para webhooks firmados. Cuando CRM está configurado, el mismo evento recibe además una entrega al destino CRM virtual dedicado:

```text
crm-rest:primary
```

Por tanto, la entrega CRM hereda la infraestructura existente:

- cola durable;
- unicidad `(eventId, endpointId)`;
- lease del worker;
- ejecución por scheduler/manual Admin;
- retries/backoff limitados;
- historial de intentos;
- dead-letter;
- replay desde Admin;
- métricas de salud de cola;
- política de retención de entregas completadas.

## Transaccionalidad de eventos de cliente

El registro persistente de cliente y las actualizaciones de perfil encolan su evento CRM usando la misma sesión/transacción MongoDB que la escritura del usuario.

La creación/cambio de estado de reservas ya utiliza el outbox transaccional y, por tanto, se vuelve CRM-capable sin añadir otra ruta de mutación.

## Contrato REST

El adapter de referencia usa:

```text
POST /v1/crm/contacts/upsert
POST /v1/crm/reservations/upsert
```

Cada petición incluye:

```text
X-OTP-Contract-Version: 1
X-OTP-Request-Id: <id-asociado-a-entrega>
X-OTP-Operation: upsert
Idempotency-Key: <clave-estable-derivada-del-evento>
Authorization: Bearer <token-server-only>   # cuando está configurado
Content-Type: application/json
```

El CRM debe devolver:

```text
X-OTP-Contract-Version: 1
```

con un JSON:

```json
{
  "externalId": "crm-object-id",
  "outcome": "upserted"
}
```

Los outcomes aceptados son `upserted` y `unchanged`.

## Allowlist de contacto

El snapshot genérico de contacto contiene solo:

```text
localId
firstName
lastName
email
phone?
country?
preferredLocale?
```

Son datos ordinarios de cliente/contacto; el despliegue sigue siendo responsable de disponer de la base jurídica y configuración de privacidad adecuadas para sincronizarlos con el CRM elegido.

Nunca se incluyen passwords, hashes/salts, tokens de sesión, detalles de auditoría de autenticación ni datos post-compra protegidos del viajero.

## Allowlist de reserva

El snapshot genérico de reserva contiene exclusivamente:

```text
reservationType
localId
contactLocalId
productId
productTitle?
status
partySize
startDate?
endDate?
createdAt
updatedAt?
```

El adapter CRM genérico excluye expresamente:

- `totalPrice`, `unitPrice`, moneda y condiciones de pago;
- movimientos del ledger de pagos/reembolsos;
- referencias/costes de proveedor;
- cantidades o instrucciones de mutación de inventario;
- arrays de viajeros;
- fecha de nacimiento, nacionalidad y campos de identidad/documentos;
- valores post-compra protegidos;
- notas/tareas/tags internos de Operator.

Si un despliegue necesita campos CRM adicionales, debe ampliarlos intencionadamente dentro de un adapter específico y no enviar documentos completos de reserva/cliente a través del contrato genérico.

## Sincronización de snapshot actual

Los eventos funcionan como triggers durables. Cuando se procesa una entrega CRM, la plataforma carga el cliente/reserva local actual y genera un snapshot allowlisted nuevo.

Para eventos de reserva el flujo es:

1. upsert del contacto;
2. upsert de la reserva.

Así la reserva puede referenciar un contacto CRM incluso si el evento de alta del cliente no llegó anteriormente al CRM.

## Idempotencia

Las claves derivan del ID inmutable del evento:

```text
otp-crm:<eventId>:contact
otp-crm:<eventId>:reservation
```

Los retries de transporte, reintentos de cola y replay dead-letter reutilizan claves estables para la misma operación lógica. Los CRMs deberían persistir/deduplicar estas claves en sus endpoints upsert.

## Referencias externas

Los upserts correctos guardan exclusivamente metadata de mapping en:

```text
travel_crm_sync_links
```

Cada enlace contiene:

```text
adapterId
entityType
localId
externalId
firstSyncedAt
lastSyncedAt
```

Los IDs CRM nunca sustituyen al identificador local ni se escriben dentro de documentos de dominio de cliente/reserva.

## Auditoría CRM

Los outcomes normalizados correctos se guardan en:

```text
travel_crm_sync_audit
```

La auditoría contiene:

- IDs del evento y delivery;
- adapter ID;
- tipo de entidad e ID local;
- ID externo CRM;
- outcome normalizado;
- estado HTTP cuando está disponible;
- timestamp.

No guarda nombres de contacto, email, teléfono, credenciales Bearer, cuerpos HTTP crudos, importes de pago ni valores protegidos del viajero.

Los fallos de transporte, retries y dead-letter siguen visibles mediante el historial existente de intentos de Integration Delivery.

## Operación desde Admin

Admin puede consultar:

```text
/operator/integrations/crm
```

La vista muestra modo/readiness y metadata reciente de auditoría CRM sin PII. Cada registro enlaza con el diagnóstico normal de la entrega para mantener el mismo modelo operativo de los webhooks.

## Seguridad de transporte

El adapter REST de referencia:

- se ejecuta únicamente server-side;
- exige HTTPS en producción;
- rechaza redirects;
- usa `no-store`;
- limita timeout;
- limita estrictamente el tamaño leído de respuesta;
- exige cabecera de versión exacta;
- traduce fallos de proveedor/transporte a códigos CRM estables;
- nunca expone cuerpos crudos del proveedor en superficies de navegador.

## Regla de extensión

Autenticación, mapping de campos y objetos específicos del vendor deben permanecer dentro de implementaciones de:

```text
repositories/crm-sync-adapter.ts
```

Un adapter CRM no debe escribir directamente en colecciones de reservas, pagos, proveedores, inventario o datos protegidos de viajeros.
