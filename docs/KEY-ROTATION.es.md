# Rotación y recuperación de claves de cifrado

Open Travel Platform utiliza keyrings versionados AES-256-GCM para secretos operativos protegidos y datos post-compra de viajeros retenidos. El ciphertext versión 2 guarda un `keyId` estable y no secreto; el material de clave permanece exclusivamente en configuración server-only.

El keyring mantiene compatibilidad con ciphertext versión 1 existente y permite una rotación controlada. Las claves anteriores son dependencias temporales de lectura y no deben eliminarse hasta migrar todos los ciphertext retenidos que dependan de ellas.

## Configuración de keyrings

### Credenciales de proveedores de pago

- `PAYMENT_SECRETS_KEY` — clave AES actual de 32 bytes.
- `PAYMENT_SECRETS_KEY_ID` — ID estable de la clave actual, por ejemplo `pay-2026-09`.
- `PAYMENT_SECRETS_PREVIOUS_KEYS` — objeto JSON opcional que relaciona IDs anteriores con claves anteriores.

### Secretos de firma de integraciones salientes

- `INTEGRATION_SECRETS_KEY`
- `INTEGRATION_SECRETS_KEY_ID`
- `INTEGRATION_SECRETS_PREVIOUS_KEYS`

### Datos protegidos de viajeros

- `TRAVELLER_DATA_KEY`
- `TRAVELLER_DATA_KEY_ID`
- `TRAVELLER_DATA_PREVIOUS_KEYS`

Todo el material de clave es server-only. Nunca debe colocarse en `NEXT_PUBLIC_*`, código fuente, tickets, chats, logs ni registros de auditoría de base de datos. Los mapas de claves anteriores admiten como máximo ocho entradas y el ID actual no puede repetirse dentro del mapa de claves anteriores.

## Compatibilidad de ciphertext

Si no existe un ID para la clave actual, las nuevas escrituras conservan ciphertext versión 1. Esto mantiene compatibilidad de actualización para despliegues que todavía no hayan preparado una rotación.

Cuando se configura un ID estable, las nuevas escrituras usan versión 2 y guardan únicamente el `keyId` junto al ciphertext AES-GCM. Las lecturas versión 2 seleccionan exactamente la clave actual o anterior por ID. Los valores legacy versión 1 prueban la clave actual y después el conjunto acotado de claves anteriores. La autenticación AES-GCM hace que una clave incorrecta falle de forma segura.

Versiones de ciphertext no soportadas, configuración malformada del keyring e IDs versión 2 sin clave disponible fallan explícitamente, sin hacer fallback a otro formato.

## Rotación de claves de pagos e integraciones

Para pagos e integraciones de manera independiente:

1. Guarda la clave maestra existente dentro del sistema aprobado de recuperación de secretos del despliegue.
2. Asigna a la clave existente un ID estable antes de rotaciones rutinarias si aún no lo tiene.
3. Genera una nueva clave de 32 bytes y un nuevo ID único.
4. Configura la nueva clave como `*_KEY` y su ID como `*_KEY_ID`.
5. Añade la antigua clave actual a `*_PREVIOUS_KEYS` bajo su ID anterior.
6. Despliega y verifica que los secretos antiguos sigan siendo legibles y los nuevos se escriban con el nuevo ID.
7. Vuelve a guardar o recifra los registros restantes con la clave actual mediante mantenimiento controlado.
8. Elimina una clave anterior únicamente cuando el inventario confirme que ningún ciphertext sigue referenciándola o dependiendo de ella.

No elimines una clave anterior solo porque la aplicación arranque. Algunos secretos de pago/integración pueden permanecer inactivos hasta un checkout, callback o entrega.

## Rotación y recifrado de Traveller Data

Los datos de viajeros se migran mediante el comando operativo acotado:

```text
npm run migrate:traveller-encryption -- --batch-size=25 --max-batches=20
```

`--batch-size` se limita a 1–100 registros. `--max-batches` se limita a 1–1000. El runner muestra únicamente el ID no secreto de la clave actual y contadores de migración; nunca muestra claves, plaintext ni ciphertext.

Procedimiento:

1. Guarda de forma segura la `TRAVELLER_DATA_KEY` actual.
2. Asigna un ID estable a la clave anterior si todavía no tiene uno.
3. Genera una nueva `TRAVELLER_DATA_KEY` de 32 bytes y un nuevo `TRAVELLER_DATA_KEY_ID`.
4. Añade la clave anterior a `TRAVELLER_DATA_PREVIOUS_KEYS` bajo su ID anterior. Si registros legacy versión 1 fueron cifrados con más de una clave histórica, conserva temporalmente cada clave necesaria bajo un ID único.
5. Despliega con la nueva clave actual y todas las claves anteriores necesarias.
6. Ejecuta `migrate:traveller-encryption` repetidamente hasta que la salida indique `remaining: 0`.
7. Verifica las lecturas de datos protegidos desde cliente/Operator y los checks operativos correspondientes.
8. Solo después de `remaining: 0`, elimina las claves anteriores de viajeros que ya no sean necesarias.

La migración selecciona únicamente registros todavía retenidos cuyo payload no esté cifrado con el ID actual. Es idempotente: una vez que todos los registros retenidos están actualizados, ejecuciones posteriores escanean/migran cero registros.

### Garantías de integridad de la migración

Cada batch se ejecuta dentro de una transacción MongoDB. Si cualquier registro no puede descifrarse, recifrarse o actualizarse de forma segura, todo el batch hace rollback.

El recifrado modifica únicamente el `payload` cifrado. Preserva deliberadamente:

- `createdAt`;
- el `updatedAt` funcional;
- `retentionUntil` y su semántica TTL;
- `completedFields`;
- identificadores de reserva, cliente y viajero.

La migración no genera eventos normales de auditoría Traveller Data `created`/`updated`, porque el mantenimiento criptográfico no constituye una modificación de datos realizada por cliente/operador. El historial existente queda intacto.

Las actualizaciones utilizan comparación del ciphertext original. Si un registro de viajero cambia concurrentemente mientras se ejecuta el batch, la migración falla de forma segura por conflicto en lugar de sobrescribir la actualización más reciente.

Los registros expirados no son objetivos de migración; el TTL de MongoDB continúa siendo responsable de su eliminación por retención.

## Procedimiento de recuperación

Si se pierde una clave actual pero existe un backup seguro aprobado, restaura exactamente esa clave y su ID asociado. Generar una nueva clave no permite descifrar ciphertext AES-GCM existente.

Si se elimina accidentalmente una clave anterior, restáurala bajo exactamente el mismo ID y completa el recifrado antes de intentar eliminarla de nuevo.

Para Traveller Data, no elimines ninguna clave anterior mientras la migración indique `remaining > 0`. Si una clave histórica necesaria se pierde de forma irreversible, el ciphertext afectado no puede recuperarse mediante la aplicación y debe gestionarse mediante el procedimiento de incidente/recuperación de datos de la organización.

Para secretos de pago/integración cuya clave se haya perdido de forma irreversible, sustituye las credenciales o secretos de firma desde el proveedor externo autoritativo y guárdalos de nuevo.

## Fronteras de seguridad

- AES-256-GCM sigue siendo el algoritmo de cifrado y usa IVs nuevos de 96 bits.
- Los IDs de clave son metadata, no material secreto.
- Claves y mapas de claves anteriores permanecen server-only.
- Cada keyring admite como máximo ocho claves anteriores.
- Versiones desconocidas e IDs versión 2 sin clave disponible fallan de forma segura.
- La rotación no modifica la autoridad de reservas, pagos, integraciones ni Traveller Data.
- Los logs de migración contienen solo contadores e IDs de clave.
- Las claves anteriores deben retirarse tras verificar la migración, pero nunca antes de que su dependencia llegue a cero (`remaining: 0`).
