import assert from "node:assert/strict";
import {
  decryptVersionedValue,
  encryptVersionedValue,
  isEncryptionKeyringConfigured
} from "../lib/encryption-keyring";

const config = {
  keyVariable: "OTP_TEST_KEY",
  keyIdVariable: "OTP_TEST_KEY_ID",
  previousKeysVariable: "OTP_TEST_PREVIOUS_KEYS"
} as const;

const variables = [config.keyVariable, config.keyIdVariable, config.previousKeysVariable];
const previousEnvironment = Object.fromEntries(variables.map((name) => [name, process.env[name]]));

function restore() {
  for (const [name, value] of Object.entries(previousEnvironment)) {
    if (value === undefined) delete process.env[name];
    else process.env[name] = value;
  }
}

async function main() {
  const legacyKey = "11".repeat(32);
  const firstKey = "22".repeat(32);
  const secondKey = "33".repeat(32);

  process.env[config.keyVariable] = legacyKey;
  delete process.env[config.keyIdVariable];
  delete process.env[config.previousKeysVariable];
  assert.equal(isEncryptionKeyringConfigured(config), true);

  const legacyCiphertext = encryptVersionedValue("legacy-secret", config);
  assert.equal(legacyCiphertext.version, 1, "deployments without a key ID must preserve the v1 write format");
  assert.equal(decryptVersionedValue(legacyCiphertext, config), "legacy-secret");

  assert.throws(
    () => decryptVersionedValue({ ...legacyCiphertext, version: 3 } as never, config),
    /unsupported encrypted value version/i,
    "unknown ciphertext versions must fail closed at runtime"
  );

  process.env[config.keyVariable] = firstKey;
  process.env[config.keyIdVariable] = "key-2026-a";
  process.env[config.previousKeysVariable] = JSON.stringify({ legacy: legacyKey });
  assert.equal(
    decryptVersionedValue(legacyCiphertext, config),
    "legacy-secret",
    "legacy v1 ciphertext must remain readable by trying bounded previous keys during migration"
  );

  const keyedCiphertext = encryptVersionedValue("keyed-secret", config);
  assert.equal(keyedCiphertext.version, 2);
  if (keyedCiphertext.version !== 2) throw new Error("Expected a keyed v2 ciphertext.");
  assert.equal(keyedCiphertext.keyId, "key-2026-a");

  process.env[config.keyVariable] = secondKey;
  process.env[config.keyIdVariable] = "key-2026-b";
  process.env[config.previousKeysVariable] = JSON.stringify({ "key-2026-a": firstKey, legacy: legacyKey });
  assert.equal(
    decryptVersionedValue(keyedCiphertext, config),
    "keyed-secret",
    "v2 ciphertext must select the previous key by its stable key ID after rotation"
  );

  process.env[config.previousKeysVariable] = JSON.stringify({ legacy: legacyKey });
  assert.throws(
    () => decryptVersionedValue(keyedCiphertext, config),
    /key ID key-2026-a is not available/i,
    "removing a previous key before re-encryption must fail closed rather than guessing"
  );

  process.env[config.keyIdVariable] = "bad key id";
  assert.equal(isEncryptionKeyringConfigured(config), false, "invalid key IDs must make the keyring unavailable");

  process.env[config.keyIdVariable] = "key-2026-b";
  process.env[config.previousKeysVariable] = "not-json";
  assert.equal(isEncryptionKeyringConfigured(config), false, "malformed previous-key configuration must fail closed");

  console.info("Encryption keyring validation passed: legacy compatibility, keyed writes and staged previous-key rotation are safe.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(restore);
