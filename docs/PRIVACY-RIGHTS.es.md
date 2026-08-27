# Base operativa de derechos de privacidad

La Fase 9D-1 añade un workflow técnico para expedientes autenticados de derechos de privacidad. Está diseñado tomando como referencia el modelo de derechos del RGPD de la UE y la guía de la AEPD española, pero **no constituye una certificación de cumplimiento jurídico ni decide la base jurídica o el plazo legal de conservación de un despliegue**.

Referencias oficiales principales utilizadas para este baseline técnico:

- RGPD (Reglamento (UE) 2016/679), artículos 12 y 15–20: https://eur-lex.europa.eu/eli/reg/2016/679/oj
- Agencia Española de Protección de Datos (AEPD), ejercicio de derechos: https://www.aepd.es/derechos-y-deberes/ejerce-tus-derechos

## Tipos de solicitud soportados

Un cliente autenticado puede presentar y seguir solicitudes de:

- acceso;
- rectificación;
- supresión;
- limitación del tratamiento;
- oposición;
- portabilidad de datos.

Solo se mantiene un expediente abierto del mismo tipo por cliente a la vez. Cuando el expediente termina, puede crearse normalmente una nueva solicitud posterior del mismo derecho.

## Modelo de plazos

`receivedAt` se registra server-side y el `dueAt` inicial se fija un mes natural UTC después, con ajuste seguro de fin de mes.

El workflow Admin puede registrar una prórroga de uno o dos meses naturales adicionales únicamente con motivo estructurado `complexity` o `request-volume`. `dueAt` conserva el plazo original y `extendedDueAt` registra el plazo prorrogado vigente, sin reescribir la línea temporal inicial.

El software no decide si una prórroga está jurídicamente justificada. El operador sigue siendo responsable de comunicarla a tiempo y de aplicar la normativa real al caso.

## Frontera de identidad y minimización

Las solicitudes cliente parten de una sesión persistente autenticada. El expediente almacena:

- ID de identidad del cliente;
- tipo de derecho y estado del workflow;
- timestamps de recepción/plazo;
- códigos estructurados de retención, prórroga y resultado;
- metadata de auditoría acotada.

No copia deliberadamente email del cliente, contraseñas, hashes/salts de contraseña, tokens/hashes de sesión, credenciales de proveedores, payloads cifrados de Traveller Data, números de documento ni narrativas libres del expediente dentro de las colecciones de privacidad.

Si se necesita verificación adicional de identidad, Admin puede mover el expediente a `verification-required`. La Fase 9D-1 no almacena copias de documentos de identidad para esa verificación.

## La supresión se revisa; no es automática

Una solicitud de supresión empieza con `retentionState=pending`.

El workflow Admin puede resolverla como:

- `clear` — sin hold de conservación registrado por esta revisión técnica;
- `hold` — exige un motivo estructurado: `legal-obligation`, `legal-claims`, `rights-of-others` u `other-applicable-basis`.

Un expediente no puede cerrarse como `completed` mientras la revisión de retención de la supresión siga pendiente. Esta regla fail-closed evita que una acción de UI afirme que la supresión fue atendida antes de evaluar la frontera de conservación.

**La Fase 9D-1 nunca elimina físicamente reservas, movimientos del ledger de pagos, cuentas cliente, historial de auditoría ni Traveller Data como consecuencia de presentar o cerrar una solicitud.** El executor real de acceso/portabilidad y supresión/limitación pertenece a un bloque 9D posterior y deberá aplicar una allowlist explícita más la política revisada de retención/holds legales del despliegue.

## Estados y auditoría

El ciclo de vida es:

```text
received
  ├─ verification-required
  ├─ in-review
  │    ├─ action-pending
  │    └─ verification-required
  └─ declined

in-review / action-pending
  ├─ completed
  └─ declined

el cliente puede retirar cualquier expediente no terminal
```

Staff no puede fijar `withdrawn`; solo el cliente propietario puede retirar un expediente abierto. Los expedientes terminales no pueden modificarse.

Creación, retirada, cambios de estado staff, prórrogas y revisión de retención generan eventos de auditoría acotados. La creación cliente y su evento de audit se confirman en la misma transacción MongoDB; si falla el audit, la solicitud se revierte.

Cerrar un expediente revisado por staff exige un resultado estructurado (`fulfilled`, `partially-fulfilled`, `identity-not-verified`, `not-applicable` o `retention-required`).

## Inventario técnico de datos personales

`lib/privacy-data-inventory.ts` es la allowlist técnica inicial para la Fase 9D-2. Clasifica los stores actuales según la frontera de acceso/exportación y el comportamiento de supresión/retención, sin pretender determinar la base jurídica del despliegue.

Entre las fronteras ya registradas están:

- perfil cliente frente a credenciales/internos de seguridad;
- sesiones cliente gestionadas por TTL;
- auditoría de autenticación seudonimizada;
- reservas de viajes y servicios;
- ledger autoritativo de pagos/reembolsos;
- Traveller Data cifrado y audit solo de nombres de campos;
- auditoría de operaciones;
- el propio expediente de privacidad.

El inventario debe revisarse siempre que se introduzca una nueva colección con datos personales o vinculados a clientes.

## Validación

La validación MongoDB bloqueante demuestra:

- cálculo por mes natural, incluidos fin de mes y año bisiesto;
- protección contra duplicados: un expediente abierto por derecho;
- persistencia transaccional solicitud + auditoría;
- rollback si falla la auditoría de privacidad;
- retirada solo por el cliente;
- imposibilidad de completar una supresión con revisión de retención pendiente;
- obligatoriedad de motivo estructurado para un hold;
- obligatoriedad de resultado estructurado para cerrar un expediente staff;
- inmutabilidad de casos terminales;
- ausencia de campos de credenciales/Traveller Data protegidos en storage de expediente/audit.

## Siguiente bloque de privacidad

La Fase 9D-2 debe implementar el paquete real de acceso/portabilidad y el executor controlado de supresión/limitación. Deberá usar la allowlist del inventario, proteger derechos de terceros y datos internos, respetar retención/holds, auditar la ejecución sin copiar los datos exportados al audit y mantener reversibilidad cuando la eliminación no sea jurídicamente u operacionalmente apropiada.
