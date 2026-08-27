# Encryption key rotation and recovery

Open Travel Platform uses versioned AES-256-GCM keyrings for protected operational secrets and retained traveller post-purchase data. Ciphertext version 2 stores a stable, non-secret `keyId`; key material remains server-only environment configuration.

The keyring preserves backwards compatibility with existing version-1 ciphertext while allowing controlled rotation. Previous keys are temporary read dependencies and must not be removed until every retained ciphertext that depends on them has been migrated.

## Keyring configuration

### Payment-provider credentials

- `PAYMENT_SECRETS_KEY` — current 32-byte AES key.
- `PAYMENT_SECRETS_KEY_ID` — stable ID for the current key, for example `pay-2026-09`.
- `PAYMENT_SECRETS_PREVIOUS_KEYS` — optional JSON object mapping previous key IDs to previous keys.

### Outbound integration signing secrets

- `INTEGRATION_SECRETS_KEY`
- `INTEGRATION_SECRETS_KEY_ID`
- `INTEGRATION_SECRETS_PREVIOUS_KEYS`

### Protected traveller data

- `TRAVELLER_DATA_KEY`
- `TRAVELLER_DATA_KEY_ID`
- `TRAVELLER_DATA_PREVIOUS_KEYS`

All key material is server-only. Never place these values in `NEXT_PUBLIC_*`, source control, tickets, chat, logs or database audit records. Previous-key maps are bounded to eight entries and current key IDs must not be duplicated inside their previous-key map.

## Ciphertext compatibility

If a key ID is not configured, new writes retain ciphertext version 1. This preserves upgrade compatibility for deployments that have not yet prepared a rotation.

Once a stable current key ID is configured, new writes use version 2 and record only the `keyId` next to the AES-GCM ciphertext. Version-2 reads select the exact current or previous key by ID. Legacy version-1 reads try the current key and then the bounded explicit previous-key set. AES-GCM authentication makes incorrect keys fail closed.

Unsupported ciphertext versions, malformed keyring configuration and unavailable version-2 key IDs fail explicitly rather than falling back to another format.

## Payment and integration key rotation

For payments and integrations independently:

1. Back up the existing master key in the deployment's approved secret-recovery system.
2. Assign the existing key a stable ID before routine rotation if it does not already have one.
3. Generate a new 32-byte key and a new unique key ID.
4. Move the new key into the current `*_KEY` and its ID into `*_KEY_ID`.
5. Put the former current key into `*_PREVIOUS_KEYS` under its former ID.
6. Deploy and verify that old secrets can still be read and new secrets are written with the new key ID.
7. Re-save/re-encrypt remaining provider or integration records with the current key as part of controlled maintenance.
8. Remove a previous key only after inventory confirms no stored ciphertext still references or depends on it.

Do not remove an old key merely because the application starts successfully. Some payment and integration secrets may remain dormant until a checkout, callback or delivery occurs.

## Traveller-data rotation and re-encryption

Traveller data is migrated with the bounded operator command:

```text
npm run migrate:traveller-encryption -- --batch-size=25 --max-batches=20
```

`--batch-size` is clamped to 1–100 records. `--max-batches` is clamped to 1–1000. The runner outputs only the current non-secret key ID and migration counts; it does not output keys, plaintext or ciphertext.

Use this procedure:

1. Securely back up the current `TRAVELLER_DATA_KEY`.
2. Give the old key a stable ID if it does not already have one.
3. Generate a new 32-byte `TRAVELLER_DATA_KEY` and new `TRAVELLER_DATA_KEY_ID`.
4. Put the old key in `TRAVELLER_DATA_PREVIOUS_KEYS` under its old ID. If legacy version-1 records were encrypted by more than one historic key, retain each required old key temporarily under a unique ID.
5. Deploy with the new current key plus all required previous keys.
6. Run `migrate:traveller-encryption` repeatedly until the output reports `remaining: 0`.
7. Verify customer/operator protected-data reads and the relevant health/operational checks.
8. Only after `remaining: 0`, remove previous traveller keys that are no longer required.

The migration selects only retained records whose payload is not already encrypted with the current key ID. It is idempotent: once every retained record is current, subsequent runs scan/migrate zero records.

### Traveller migration integrity guarantees

Each batch runs inside a MongoDB transaction. If any record cannot be decrypted, re-encrypted or safely updated, the entire batch rolls back.

Re-encryption changes only the encrypted `payload`. It deliberately preserves:

- `createdAt`;
- business `updatedAt`;
- `retentionUntil` and its TTL semantics;
- `completedFields`;
- reservation/customer/traveller identifiers.

The migration does not create ordinary traveller-data `created`/`updated` audit events because cryptographic maintenance is not a customer-data change. Existing audit history remains untouched.

Updates use ciphertext compare-and-set. If a traveller record changes concurrently while a batch is running, the batch fails closed with a migration conflict instead of overwriting the newer business update.

Expired records are not migration targets; MongoDB TTL remains responsible for their retention deletion.

## Recovery procedure

If a current key is lost but an approved secure backup exists, restore the exact key together with its associated key ID. Generating a replacement key cannot decrypt existing AES-GCM ciphertext.

If a previous key is accidentally removed, restore the exact old key under the exact same key ID and complete re-encryption before trying to remove it again.

For traveller data, do not remove any previous key while the migration reports `remaining > 0`. If a required historical key has been irretrievably lost, the affected ciphertext cannot be recovered by the application and must be handled through the organization’s incident/data-recovery procedure.

For payment/integration secrets whose encryption key is irretrievably lost, replace the credentials or signing secrets from their authoritative external provider and save them again.

## Security boundaries

- AES-256-GCM remains the encryption primitive and uses fresh 96-bit IVs.
- Key IDs are metadata, never secret material.
- Keys and previous-key maps remain server-only.
- At most eight previous keys are accepted per keyring.
- Unknown ciphertext versions and unknown version-2 key IDs fail closed.
- Rotation does not change booking, payment, integration or traveller-data authority.
- Migration logs contain counts and key IDs only.
- Previous keys should be removed promptly after verified migration, but never before their dependency count reaches zero.
