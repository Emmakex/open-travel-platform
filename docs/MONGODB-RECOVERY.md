# MongoDB backup, restore and disaster recovery

This runbook defines the provider-neutral recovery baseline for Open Travel Platform. Production deployments may additionally use managed snapshot or point-in-time recovery from their MongoDB provider, but those provider capabilities must be verified separately for the selected plan and region.

## Recovery principles

- Never test a restore by overwriting the active production database.
- Restore into an isolated database name first.
- Treat backup archives as sensitive production data: encrypt them at rest/in transit, restrict access, retain them only as required, and keep them out of source control and ordinary logs.
- A backup is not considered usable until a restore drill has validated both data and indexes.
- Define deployment-specific RPO and RTO targets; the core cannot guarantee them without the surrounding infrastructure and backup schedule.

## Baseline logical backup

For a controlled logical backup, use MongoDB Database Tools from a trusted administrative environment. Example structure:

```text
mongodump --uri="$MONGODB_URI" --db="$MONGODB_DB_NAME" --archive=ktravel.archive.gz --gzip
sha256sum ktravel.archive.gz
```

Do not publish the URI or archive hash together with secret material. Store the archive in an approved encrypted backup location and record the backup time, source database, application release/schema version and checksum in the operational backup inventory.

For large/active production systems, prefer a provider-supported consistent snapshot/PITR capability when available and validated; logical dumps remain useful as an independent recovery/export layer but are not a substitute for a tested production RPO/RTO design.

## Restore procedure

1. Classify the incident and preserve evidence/logs.
2. Quiesce or isolate application writes at the deployment layer if continuing writes would worsen divergence.
3. Select a verified restore point that satisfies the incident and RPO decision.
4. Create a new isolated recovery database name, for example `ktravel_recovery_<timestamp>`.
5. Restore the archive into that new namespace. Do **not** use the active production database name for the initial restore.
6. Validate critical data: reservations, payment ledger movements, privileged/operations audit history, protected traveller records and integration state as applicable.
7. Validate indexes, especially unique business constraints and TTL retention indexes.
8. Start a staging/recovery application instance pointed at the recovered database and run readiness plus critical journey checks.
9. Record the selected recovery database and approval/cutover decision.
10. Perform a controlled cutover by changing `MONGODB_DB_NAME`/deployment configuration and restarting the application through the normal release process.
11. Closely monitor readiness, payments, booking mutations, integration delivery and error rates after cutover.

A namespace-remapped logical restore can use the Database Tools pattern:

```text
mongorestore --uri="$MONGODB_URI" --archive=ktravel.archive.gz --gzip \
  --nsFrom="ktravel_source.*" --nsTo="ktravel_recovery_20260827.*"
```

## Rollback after recovery cutover

Keep the pre-cutover database untouched until the recovery is accepted and retention/incident policy allows cleanup. If the recovered deployment fails before accepting new authoritative writes, the deployment can be pointed back to the previous database after verification.

If either database has accepted authoritative writes after cutover, do not blindly switch database names. That creates split history. Freeze writes and reconcile bookings, payment ledger movements, inventory, audit and integrations before another cutover.

## Automated drill in this repository

The blocking `MongoDB recovery drill` workflow:

1. starts a disposable MongoDB 8 replica set;
2. seeds reservation, payment, audit and protected-traveller canaries plus critical indexes;
3. creates a compressed `mongodump` archive and checksum;
4. deliberately deletes critical source data;
5. restores with `--nsFrom/--nsTo` into a different recovery database;
6. verifies recovered documents, reservation/payment unique indexes and traveller TTL index;
7. proves the damaged source remains untouched by the isolated restore;
8. runs TypeScript validation.

This drill validates restore mechanics and schema/index fidelity. It does not claim that a specific hosting/provider backup policy is enabled in production.

## Operational checklist

- Backup schedule and retention documented.
- Backup destination encrypted and access-controlled.
- Restore credentials stored separately from application runtime credentials where practical.
- RPO and RTO agreed for the deployment.
- Managed snapshot/PITR capability verified if relied upon.
- Latest restore drill date and result recorded.
- Recovery runbook accessible during a provider/application outage.
- Keyring recovery material backed up separately; a database backup alone cannot recover ciphertext if required encryption keys are lost.
