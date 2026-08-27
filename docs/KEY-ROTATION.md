# Encryption key rotation foundation

Phase 9C-5 introduces a versioned AES-256-GCM keyring for **payment-provider credentials** and **outbound integration signing secrets**. It is intentionally backwards compatible with existing version-1 ciphertext and supports staged rotation without making old records unreadable immediately after the current key changes.

Protected traveller post-purchase data is not migrated by this slice. `TRAVELLER_DATA_KEY` must remain stable until the dedicated traveller-data rotation/migration work is completed.

## Why a keyring is required

Before this phase, encrypted records stored only:

```text
version + iv + authentication tag + ciphertext
```

They did not identify the encryption key. Replacing a master key could therefore make existing data unreadable.

New payment/integration writes may now use ciphertext version 2 with a stable `keyId`. Existing version-1 ciphertext remains readable during migration by trying the current key followed by a bounded set of explicitly configured previous keys.

## Configuration model

### Payment credentials

- `PAYMENT_SECRETS_KEY` — current 32-byte AES key.
- `PAYMENT_SECRETS_KEY_ID` — optional stable ID for the current key, for example `pay-2026-08`.
- `PAYMENT_SECRETS_PREVIOUS_KEYS` — optional JSON object mapping prior key IDs to prior keys.

Example shape only; never commit real key material:

```text
PAYMENT_SECRETS_KEY_ID=pay-2026-09
PAYMENT_SECRETS_PREVIOUS_KEYS={"pay-2026-08":"<old-32-byte-key>"}
```

### Integration signing secrets

- `INTEGRATION_SECRETS_KEY`
- `INTEGRATION_SECRETS_KEY_ID`
- `INTEGRATION_SECRETS_PREVIOUS_KEYS`

Previous-key maps are bounded to eight entries. Key IDs are limited to 1–64 safe characters and the current key ID must not also appear in the previous-key map.

## Backwards compatibility

If no current key ID is configured, new writes preserve the legacy version-1 ciphertext format. This prevents an upgrade from silently changing storage semantics before the operator has prepared a rotation plan.

When a key ID is configured, new writes use version 2 and store only the non-secret key ID next to the ciphertext. The key value remains server-only environment configuration.

Version-1 values have no key ID. During a staged rotation they are decrypted by trying the current key and then the explicitly configured previous keys. AES-GCM authentication makes an incorrect key fail closed.

## Staged rotation procedure

For payment or integration keys independently:

1. Record the current master key in the deployment's secure secret backup process. Never copy it into source control, tickets, chat, logs or database audit records.
2. Give the current key a stable key ID before beginning routine rotations. Existing v1 records remain compatible.
3. Generate a new 32-byte key and a new unique key ID.
4. Set the new key as the current `*_KEY` and `*_KEY_ID`.
5. Put the prior key in the corresponding `*_PREVIOUS_KEYS` JSON map under its old ID.
6. Deploy and verify payment/integration secret reads and writes. New writes will use the new key ID; old records remain readable.
7. Re-save or re-encrypt remaining records to the current key before removing previous key material. A later migration slice will provide bounded bulk re-encryption for all protected stores.
8. Remove a previous key only after an inventory confirms that no stored ciphertext still depends on it.

Do **not** remove an old key merely because the deployment starts successfully. Some secrets may be read only during a webhook, provider checkout or integration delivery and can remain dormant for long periods.

## Recovery procedure

If the current key is lost but a secure backup exists, restore the exact key together with its associated key ID. Do not generate a replacement and expect existing ciphertext to decrypt.

If a previous key is accidentally removed from configuration, restore it under the exact same key ID. Version-2 ciphertext selects keys by ID and fails closed if the referenced ID is unavailable.

If all copies of a key required by existing ciphertext are lost, AES-GCM ciphertext cannot be recovered by the application. Provider credentials/signing secrets must then be replaced from the authoritative external provider and saved again.

## Security boundaries

- Master keys and previous-key JSON maps are server-only and must never use `NEXT_PUBLIC_*`.
- Key IDs are metadata, not secrets.
- The keyring never logs key material or ciphertext plaintext.
- At most eight previous keys are accepted to keep legacy-key trial bounded.
- Malformed keyring configuration fails closed.
- Payment/integration business authority remains unchanged by key selection.
- Privileged audit records continue to exclude secret values.

## Current scope limitation

`TRAVELLER_DATA_KEY` still uses the original single-key format in this slice. Do not rotate that key yet. Traveller data requires a separately validated migration because it can contain many retained records and must preserve TTL, audit and post-purchase privacy behavior while re-encrypting.
