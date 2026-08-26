import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

export type EncryptedIntegrationSecret = {
  version: 1;
  iv: string;
  tag: string;
  value: string;
};

function parseIntegrationEncryptionKey() {
  const raw = process.env.INTEGRATION_SECRETS_KEY?.trim();
  if (!raw) return null;
  if (/^[a-f0-9]{64}$/i.test(raw)) return Buffer.from(raw, "hex");
  try {
    const decoded = Buffer.from(raw, "base64");
    return decoded.length === 32 ? decoded : null;
  } catch {
    return null;
  }
}

export function isIntegrationSecretEncryptionConfigured() {
  return Boolean(parseIntegrationEncryptionKey());
}

function integrationEncryptionKey() {
  const key = parseIntegrationEncryptionKey();
  if (!key) {
    throw new Error("INTEGRATION_SECRETS_KEY must be a 32-byte base64 value or a 64-character hexadecimal value.");
  }
  return key;
}

export function encryptIntegrationSecret(value: string): EncryptedIntegrationSecret {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", integrationEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return {
    version: 1,
    iv: iv.toString("base64"),
    tag: cipher.getAuthTag().toString("base64"),
    value: encrypted.toString("base64")
  };
}

export function decryptIntegrationSecret(secret: EncryptedIntegrationSecret) {
  const decipher = createDecipheriv(
    "aes-256-gcm",
    integrationEncryptionKey(),
    Buffer.from(secret.iv, "base64")
  );
  decipher.setAuthTag(Buffer.from(secret.tag, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(secret.value, "base64")),
    decipher.final()
  ]).toString("utf8");
}
