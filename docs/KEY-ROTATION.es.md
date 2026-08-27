# Base para rotación de claves de cifrado

La Fase 9C-5 introduce un keyring versionado AES-256-GCM para **credenciales de proveedores de pago** y **secretos de firma de integraciones salientes**. Mantiene compatibilidad hacia atrás con ciphertext versión 1 y permite una rotación escalonada sin volver ilegibles inmediatamente los registros antiguos cuando cambia la clave actual.

Los datos protegidos post-compra de viajeros no se migran en este bloque. `TRAVELLER_DATA_KEY` debe permanecer estable hasta completar el trabajo específico de rotación/migración de datos de viajeros.

## Por qué hace falta un keyring

Antes de esta fase, los registros cifrados guardaban únicamente:

```text
versión + iv + authentication tag + ciphertext
```

No identificaban la clave utilizada. Sustituir una clave maestra podía por tanto volver ilegibles los datos existentes.

Los nuevos secretos de pagos/integraciones pueden usar ahora ciphertext versión 2 con un `keyId` estable. Los ciphertext versión 1 existentes siguen siendo legibles durante una migración probando la clave actual y después un conjunto acotado de claves anteriores configuradas explícitamente.

## Modelo de configuración

### Credenciales de pago

- `PAYMENT_SECRETS_KEY` — clave AES actual de 32 bytes.
- `PAYMENT_SECRETS_KEY_ID` — ID estable opcional de la clave actual, por ejemplo `pay-2026-08`.
- `PAYMENT_SECRETS_PREVIOUS_KEYS` — objeto JSON opcional que relaciona IDs anteriores con claves anteriores.

Ejemplo solo de estructura; nunca confirmes material real en el repositorio:

```text
PAYMENT_SECRETS_KEY_ID=pay-2026-09
PAYMENT_SECRETS_PREVIOUS_KEYS={"pay-2026-08":"<old-32-byte-key>"}
```

### Secretos de firma de integraciones

- `INTEGRATION_SECRETS_KEY`
- `INTEGRATION_SECRETS_KEY_ID`
- `INTEGRATION_SECRETS_PREVIOUS_KEYS`

Los mapas de claves anteriores admiten como máximo ocho entradas. Los IDs se limitan a 1–64 caracteres seguros y el ID actual no puede aparecer también dentro del mapa de claves anteriores.

## Compatibilidad hacia atrás

Si no se configura un ID para la clave actual, las nuevas escrituras conservan el formato ciphertext versión 1. Así una actualización no cambia silenciosamente la semántica de almacenamiento antes de que el operador prepare un plan de rotación.

Cuando existe un ID de clave, las nuevas escrituras usan versión 2 y almacenan únicamente el `keyId` no secreto junto al ciphertext. El valor de la clave sigue siendo configuración server-only.

Los valores versión 1 no tienen ID. Durante una rotación escalonada se descifran intentando la clave actual y luego las claves anteriores configuradas explícitamente. La autenticación AES-GCM hace que una clave incorrecta falle de forma segura.

## Procedimiento de rotación escalonada

Para claves de pago o integración, de forma independiente:

1. Conserva la clave maestra actual dentro del proceso seguro de backup de secretos del despliegue. Nunca la copies a código fuente, tickets, chats, logs ni registros de auditoría de base de datos.
2. Asigna a la clave actual un ID estable antes de comenzar rotaciones rutinarias. Los registros v1 existentes siguen siendo compatibles.
3. Genera una nueva clave de 32 bytes y un nuevo ID único.
4. Configura la nueva clave como `*_KEY` y su nuevo ID como `*_KEY_ID`.
5. Añade la clave anterior al objeto JSON `*_PREVIOUS_KEYS` correspondiente bajo su ID anterior.
6. Despliega y verifica lecturas/escrituras de secretos de pago/integración. Las nuevas escrituras usarán el nuevo ID; los registros antiguos seguirán siendo legibles.
7. Vuelve a guardar o recifra los registros restantes con la clave actual antes de eliminar material anterior. Un bloque posterior proporcionará recifrado masivo acotado para todos los almacenes protegidos.
8. Elimina una clave anterior únicamente cuando un inventario confirme que ningún ciphertext almacenado sigue dependiendo de ella.

No elimines una clave anterior solo porque la aplicación arranque correctamente. Algunos secretos se leen únicamente durante un webhook, checkout de proveedor o entrega de integración y pueden permanecer inactivos durante periodos largos.

## Procedimiento de recuperación

Si se pierde la clave actual pero existe un backup seguro, restaura exactamente esa clave junto con su ID asociado. No generes una nueva esperando que descifre ciphertext existente.

Si una clave anterior se elimina accidentalmente de la configuración, restáurala con exactamente el mismo ID. El ciphertext versión 2 selecciona la clave por ID y falla de forma segura si ese ID no está disponible.

Si se pierden todas las copias de una clave necesaria por ciphertext existente, la aplicación no puede recuperar esos datos AES-GCM. Las credenciales/secretos deberán sustituirse desde el proveedor externo autoritativo y guardarse de nuevo.

## Fronteras de seguridad

- Las claves maestras y mapas JSON de claves anteriores son server-only y nunca deben usar `NEXT_PUBLIC_*`.
- Los IDs de clave son metadata, no secretos.
- El keyring nunca registra material de clave ni plaintext descifrado.
- Se aceptan como máximo ocho claves anteriores para mantener acotada la prueba de claves legacy.
- Una configuración malformada del keyring falla de forma segura.
- La autoridad de pagos/integraciones no cambia por la selección de clave.
- Los registros de auditoría privilegiada continúan excluyendo valores secretos.

## Limitación actual del alcance

`TRAVELLER_DATA_KEY` sigue usando el formato original de una sola clave en este bloque. No rotes todavía esa clave. Los datos de viajeros requieren una migración validada por separado porque pueden existir muchos registros retenidos y el recifrado debe preservar TTL, auditoría y privacidad post-compra.
