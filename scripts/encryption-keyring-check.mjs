import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const assert = (condition, message) => {
  if (!condition) throw new Error(`Encryption keyring invariant failed: ${message}`);
};

const keyring = read("lib/encryption-keyring.ts");
const payments = read("lib/payment-provider-config.ts");
const integrations = read("lib/integration-secrets.ts");
const traveller = read("lib/traveller-data.ts");
const test = read("tests/encryption-keyring.ts");
const docs = read("docs/KEY-ROTATION.md");
const docsEs = read("docs/KEY-ROTATION.es.md");
const packageJson = JSON.parse(read("package.json"));

assert(keyring.includes("version: 1") && keyring.includes("version: 2"), "keyring must support both legacy and keyed ciphertext formats");
assert(keyring.includes("keyId: string"), "v2 ciphertext must carry a non-secret key ID");
assert(keyring.includes("previousKeys: Map<string, Buffer>"), "keyring must keep explicitly configured previous keys separate from the current key");
assert(keyring.includes("entries.length > 8"), "previous-key trial must remain bounded");
assert(keyring.includes("createCipheriv(\"aes-256-gcm\""), "encryption must remain AES-256-GCM");
assert(keyring.includes("decipher.setAuthTag"), "decryption must verify the GCM authentication tag");

for (const variable of ["PAYMENT_SECRETS_KEY_ID", "PAYMENT_SECRETS_PREVIOUS_KEYS"]) {
  assert(payments.includes(`\"${variable}\"`), `payment keyring must reference ${variable}`);
}
assert(payments.includes("encryptVersionedValue") && payments.includes("decryptVersionedValue"), "payment credentials must use the shared versioned keyring");

for (const variable of ["INTEGRATION_SECRETS_KEY_ID", "INTEGRATION_SECRETS_PREVIOUS_KEYS"]) {
  assert(integrations.includes(`\"${variable}\"`), `integration keyring must reference ${variable}`);
}
assert(integrations.includes("encryptVersionedValue") && integrations.includes("decryptVersionedValue"), "integration secrets must use the shared versioned keyring");

assert(traveller.includes("TRAVELLER_DATA_KEY"), "traveller protected data must retain its existing explicit key boundary");
assert(!traveller.includes("TRAVELLER_DATA_KEY_ID"), "traveller data must not be silently migrated as part of the payment/integration keyring slice");

assert(test.includes("legacy v1 ciphertext must remain readable"), "dynamic test must prove legacy compatibility during staged rotation");
assert(test.includes("v2 ciphertext must select the previous key"), "dynamic test must prove keyed previous-key selection");
assert(test.includes("removing a previous key before re-encryption must fail closed"), "dynamic test must prove early key removal fails closed");

assert(packageJson.scripts?.["check:encryption-keyring"] === "node scripts/encryption-keyring-check.mjs", "keyring invariant must be registered");
assert(packageJson.scripts?.["test:encryption-keyring"] === "tsx tests/encryption-keyring.ts", "keyring test must be registered");
assert(packageJson.scripts?.verify?.includes("check:encryption-keyring"), "keyring invariant must be part of verify");

for (const [name, text] of [["English", docs], ["Spanish", docsEs]]) {
  const lower = text.toLowerCase();
  assert(lower.includes("previous") || lower.includes("anteriores"), `${name} docs must explain previous-key staging`);
  assert(lower.includes("keyid"), `${name} docs must explain stable key IDs`);
  assert(lower.includes("traveller_data_key"), `${name} docs must explicitly preserve the traveller-data limitation`);
  assert(lower.includes("server-only"), `${name} docs must keep key material server-only`);
}

console.log("Versioned encryption keyring invariants passed.");
