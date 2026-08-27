import {
  decryptVersionedValue,
  encryptVersionedValue,
  isEncryptionKeyringConfigured,
  type VersionedEncryptedValue
} from "@/lib/encryption-keyring";

export type EncryptedIntegrationSecret = VersionedEncryptedValue;

const integrationKeyring = {
  keyVariable: "INTEGRATION_SECRETS_KEY",
  keyIdVariable: "INTEGRATION_SECRETS_KEY_ID",
  previousKeysVariable: "INTEGRATION_SECRETS_PREVIOUS_KEYS"
} as const;

export function isIntegrationSecretEncryptionConfigured() {
  return isEncryptionKeyringConfigured(integrationKeyring);
}

export function encryptIntegrationSecret(value: string): EncryptedIntegrationSecret {
  return encryptVersionedValue(value, integrationKeyring);
}

export function decryptIntegrationSecret(secret: EncryptedIntegrationSecret) {
  return decryptVersionedValue(secret, integrationKeyring);
}
