import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

export type LegacyEncryptedValue = {
  version: 1;
  iv: string;
  tag: string;
  value: string;
};

export type KeyedEncryptedValue = {
  version: 2;
  keyId: string;
  iv: string;
  tag: string;
  value: string;
};

export type VersionedEncryptedValue = LegacyEncryptedValue | KeyedEncryptedValue;

export type EncryptionKeyringConfig = {
  keyVariable: string;
  keyIdVariable: string;
  previousKeysVariable: string;
};

type EncryptionKeyring = {
  currentKey: Buffer;
  currentKeyId?: string;
  previousKeys: Map<string, Buffer>;
};

const keyIdPattern = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/;

export function parseAes256Key(raw: string | undefined) {
  const value = raw?.trim();
  if (!value) return null;
  if (/^[a-f0-9]{64}$/i.test(value)) return Buffer.from(value, "hex");
  try {
    const decoded = Buffer.from(value, "base64");
    return decoded.length === 32 ? decoded : null;
  } catch {
    return null;
  }
}

function parseKeyId(raw: string | undefined) {
  const value = raw?.trim();
  return value && keyIdPattern.test(value) ? value : undefined;
}

function parsePreviousKeys(variable: string) {
  const raw = process.env[variable]?.trim();
  if (!raw) return new Map<string, Buffer>();

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`${variable} must be a JSON object mapping key IDs to 32-byte base64 or 64-character hexadecimal keys.`);
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error(`${variable} must be a JSON object.`);
  }

  const entries = Object.entries(parsed as Record<string, unknown>);
  if (entries.length > 8) throw new Error(`${variable} may contain at most 8 previous keys.`);

  const output = new Map<string, Buffer>();
  for (const [keyId, rawKey] of entries) {
    if (!keyIdPattern.test(keyId) || typeof rawKey !== "string") {
      throw new Error(`${variable} contains an invalid key ID or key value.`);
    }
    const key = parseAes256Key(rawKey);
    if (!key) throw new Error(`${variable}.${keyId} must be a valid 32-byte encryption key.`);
    output.set(keyId, key);
  }
  return output;
}

export function loadEncryptionKeyring(config: EncryptionKeyringConfig): EncryptionKeyring {
  const currentKey = parseAes256Key(process.env[config.keyVariable]);
  if (!currentKey) {
    throw new Error(`${config.keyVariable} must be a 32-byte base64 value or a 64-character hexadecimal value.`);
  }
  const rawKeyId = process.env[config.keyIdVariable]?.trim();
  const currentKeyId = parseKeyId(rawKeyId);
  if (rawKeyId && !currentKeyId) {
    throw new Error(`${config.keyIdVariable} must contain 1-64 letters, digits, dots, underscores or hyphens and must start with a letter or digit.`);
  }
  const previousKeys = parsePreviousKeys(config.previousKeysVariable);
  if (currentKeyId && previousKeys.has(currentKeyId)) {
    throw new Error(`${config.previousKeysVariable} must not repeat the current key ID ${currentKeyId}.`);
  }
  return { currentKey, currentKeyId, previousKeys };
}

export function isEncryptionKeyringConfigured(config: EncryptionKeyringConfig) {
  try {
    loadEncryptionKeyring(config);
    return true;
  } catch {
    return false;
  }
}

function encryptWithKey(value: string, key: Buffer) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return {
    iv: iv.toString("base64"),
    tag: cipher.getAuthTag().toString("base64"),
    value: encrypted.toString("base64")
  };
}

export function encryptVersionedValue(value: string, config: EncryptionKeyringConfig): VersionedEncryptedValue {
  const keyring = loadEncryptionKeyring(config);
  const encrypted = encryptWithKey(value, keyring.currentKey);
  return keyring.currentKeyId
    ? { version: 2, keyId: keyring.currentKeyId, ...encrypted }
    : { version: 1, ...encrypted };
}

function decryptWithKey(secret: VersionedEncryptedValue, key: Buffer) {
  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(secret.iv, "base64"));
  decipher.setAuthTag(Buffer.from(secret.tag, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(secret.value, "base64")),
    decipher.final()
  ]).toString("utf8");
}

export function decryptVersionedValue(secret: VersionedEncryptedValue, config: EncryptionKeyringConfig) {
  const keyring = loadEncryptionKeyring(config);

  if (secret.version === 2) {
    const key = secret.keyId === keyring.currentKeyId
      ? keyring.currentKey
      : keyring.previousKeys.get(secret.keyId);
    if (!key) throw new Error(`Encryption key ID ${secret.keyId} is not available in the configured keyring.`);
    return decryptWithKey(secret, key);
  }

  if (secret.version !== 1) {
    throw new Error(`Unsupported encrypted value version: ${String((secret as { version?: unknown }).version)}.`);
  }

  const candidates = [keyring.currentKey, ...keyring.previousKeys.values()];
  let lastError: unknown;
  for (const key of candidates) {
    try {
      return decryptWithKey(secret, key);
    } catch (error) {
      lastError = error;
    }
  }
  throw Object.assign(new Error("Legacy encrypted value could not be decrypted with the current or previous keys."), {
    cause: lastError
  });
}
