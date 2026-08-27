# Backup, restore y disaster recovery de MongoDB

Este runbook define la base neutral de recuperación para Open Travel Platform. Los despliegues de producción pueden utilizar además snapshots administrados o recuperación point-in-time del proveedor MongoDB, pero esas capacidades deben verificarse por separado para el plan y región contratados.

## Principios de recuperación

- Nunca pruebes un restore sobrescribiendo directamente la base de producción activa.
- Restaura primero con un nombre de base aislado.
- Trata los archivos de backup como datos sensibles de producción: cifrado en reposo/tránsito, acceso restringido, retención limitada y nunca en código fuente ni logs ordinarios.
- Un backup no se considera utilizable hasta que un drill de restore haya validado datos e índices.
- Define objetivos RPO y RTO para cada despliegue; el core no puede garantizarlos sin la infraestructura y frecuencia de backups externa.

## Backup lógico base

Para un backup lógico controlado utiliza MongoDB Database Tools desde un entorno administrativo confiable. Estructura de ejemplo:

```text
mongodump --uri="$MONGODB_URI" --db="$MONGODB_DB_NAME" --archive=ktravel.archive.gz --gzip
sha256sum ktravel.archive.gz
```

No publiques la URI ni mezcles el hash del archivo con material secreto. Guarda el archivo en un destino de backup cifrado y registra fecha/hora, base origen, versión de aplicación/esquema y checksum dentro del inventario operativo.

En sistemas de producción grandes o con mucha escritura, prioriza snapshot/PITR administrado cuando esté disponible y validado. Los dumps lógicos siguen siendo una capa independiente útil de recuperación/exportación, pero no sustituyen un diseño de RPO/RTO probado.

## Procedimiento de restore

1. Clasifica el incidente y conserva evidencias/logs.
2. Detén o aísla temporalmente las escrituras desde la capa de despliegue si continuar escribiendo aumentaría la divergencia.
3. Selecciona un punto de recuperación verificado de acuerdo con el incidente y la decisión RPO.
4. Crea un nombre de base nuevo y aislado, por ejemplo `ktravel_recovery_<timestamp>`.
5. Restaura el archivo en ese namespace. **No** utilices el nombre de la base activa para el primer restore.
6. Valida datos críticos: reservas, movimientos del ledger de pagos, auditoría privilegiada/operativa, datos protegidos de viajeros y estado de integraciones cuando aplique.
7. Valida índices, especialmente restricciones únicas de negocio e índices TTL de retención.
8. Arranca una instancia staging/recovery apuntando a la base recuperada y ejecuta readiness más journeys críticos.
9. Registra la base seleccionada y la decisión/aprobación de cutover.
10. Realiza el cutover controlado cambiando `MONGODB_DB_NAME`/configuración de despliegue y reiniciando mediante el proceso normal de release.
11. Monitoriza readiness, pagos, mutaciones de reservas, entregas de integraciones y errores después del cutover.

Un restore lógico con remapeo de namespace puede seguir este patrón:

```text
mongorestore --uri="$MONGODB_URI" --archive=ktravel.archive.gz --gzip \
  --nsFrom="ktravel_source.*" --nsTo="ktravel_recovery_20260827.*"
```

## Rollback después del cutover

Conserva la base anterior sin modificar hasta aceptar la recuperación y hasta que la política de incidente/retención permita limpiarla. Si el despliegue recuperado falla antes de aceptar nuevas escrituras autoritativas, puede volver a apuntarse a la base anterior después de verificarla.

Si cualquiera de las dos bases ha aceptado escrituras autoritativas después del cutover, no cambies de base a ciegas. Eso produciría historiales divergentes. Congela escrituras y reconcilia reservas, movimientos de pago, inventario, auditoría e integraciones antes de otro cutover.

## Drill automatizado del repositorio

El workflow bloqueante `MongoDB recovery drill`:

1. inicia un replica set desechable de MongoDB 8;
2. crea canarios de reservas, pagos, auditoría y Traveller Data, además de índices críticos;
3. genera un archivo comprimido con `mongodump` y checksum;
4. elimina deliberadamente datos críticos de la base fuente;
5. restaura mediante `--nsFrom/--nsTo` en una base de recuperación diferente;
6. valida documentos recuperados, índices únicos de reservas/pagos e índice TTL de viajeros;
7. demuestra que la base fuente dañada permanece intacta durante el restore aislado;
8. ejecuta validación TypeScript.

Este drill valida la mecánica del restore y la fidelidad de datos/esquema/índices. No afirma que una política concreta de backup del hosting/proveedor esté habilitada en producción.

## Checklist operativo

- Frecuencia y retención de backups documentadas.
- Destino cifrado y con control de acceso.
- Credenciales de restore separadas de las credenciales normales de runtime cuando sea viable.
- RPO y RTO acordados para el despliegue.
- Snapshot/PITR administrado verificado si se depende de él.
- Fecha y resultado del último drill registrados.
- Runbook disponible incluso durante una caída del proveedor/aplicación.
- Material de recuperación del keyring respaldado por separado; el backup de MongoDB no recupera ciphertext si se pierden las claves de cifrado necesarias.
