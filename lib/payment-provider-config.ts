import type { Db } from "mongodb";
import type { UserRole } from "@/domain/identity/types";
import {
  decryptVersionedValue,
  encryptVersionedValue,
  isEncryptionKeyringConfigured,
  type VersionedEncryptedValue
} from "@/lib/encryption-keyring";
import { getMongoClient, getMongoDatabase, getMongoDatabaseName } from "@/lib/mongodb";

export type PaymentProviderId = "stripe" | "redsys";
export type PaymentEnvironment = "test" | "live";

type EncryptedSecret = VersionedEncryptedValue;

type StripeEnvironmentConfig = {
  publishableKey?: string;
  apiKey?: EncryptedSecret;
  webhookSecret?: EncryptedSecret;
};

type RedsysEnvironmentConfig = {
  merchantCode?: string;
  terminal?: string;
  signingKey?: EncryptedSecret;
};

type ProviderEnvironmentConfig = StripeEnvironmentConfig | RedsysEnvironmentConfig;

type StoredPaymentProviderSettings = {
  provider: PaymentProviderId;
  enabled: boolean;
  activeEnvironment: PaymentEnvironment;
  environments: {
    test?: ProviderEnvironmentConfig;
    live?: ProviderEnvironmentConfig;
  };
  updatedAt: string;
  updatedBy: string;
};

type PaymentProviderAuditEvent = {
  provider: PaymentProviderId;
  environment: PaymentEnvironment;
  action: "settings_updated";
  enabled: boolean;
  actorIdentityId: string;
  actorRole: UserRole;
  createdAt: string;
};

export type PaymentProviderEnvironmentSummary = {
  environment: PaymentEnvironment;
  configured: boolean;
  publicFields: Record<string, string>;
  secretFields: Record<string, boolean>;
};

export type PaymentProviderSummary = {
  provider: PaymentProviderId;
  label: string;
  enabled: boolean;
  activeEnvironment: PaymentEnvironment;
  encryptionReady: boolean;
  test: PaymentProviderEnvironmentSummary;
  live: PaymentProviderEnvironmentSummary;
};

export type StripeRuntimeCredentials = {
  provider: "stripe";
  environment: PaymentEnvironment;
  publishableKey: string;
  apiKey: string;
  webhookSecret: string;
};

export type RedsysRuntimeCredentials = {
  provider: "redsys";
  environment: PaymentEnvironment;
  merchantCode: string;
  terminal: string;
  signingKey: string;
  paymentUrl: string;
};

export type PaymentProviderRuntimeCredentials =
  | StripeRuntimeCredentials
  | RedsysRuntimeCredentials;

export const paymentProviderSettingsCollectionName = "travel_payment_provider_settings";
export const paymentProviderAuditCollectionName = "travel_payment_provider_audit";

export const paymentProviderDefinitions = [
  {
    id: "stripe" as const,
    label: "Stripe",
    description: "Hosted or embedded card and wallet payments with signed webhooks."
  },
  {
    id: "redsys" as const,
    label: "Redsys",
    description: "Spanish TPV Virtual redirect integration with signed notifications."
  }
] as const;

const REDSYS_PAYMENT_URLS: Record<PaymentEnvironment, string> = {
  test: "https://sis-t.redsys.es:25443/sis/realizarPago",
  live: "https://sis.redsys.es/sis/realizarPago"
};

const paymentKeyring = {
  keyVariable: "PAYMENT_SECRETS_KEY",
  keyIdVariable: "PAYMENT_SECRETS_KEY_ID",
  previousKeysVariable: "PAYMENT_SECRETS_PREVIOUS_KEYS"
} as const;

function paymentProviderLabel(provider: PaymentProviderId) {
  return paymentProviderDefinitions.find((item) => item.id === provider)?.label ?? provider;
}

export function isPaymentSecretEncryptionConfigured() {
  return isEncryptionKeyringConfigured(paymentKeyring);
}

function encryptSecret(value: string): EncryptedSecret {
  return encryptVersionedValue(value, paymentKeyring);
}

function decryptSecret(secret?: EncryptedSecret) {
  return secret ? decryptVersionedValue(secret, paymentKeyring) : "";
}

async function ensurePaymentProviderIndexes(database: Db) {
  await Promise.all([
    database.collection<StoredPaymentProviderSettings>(paymentProviderSettingsCollectionName)
      .createIndex({ provider: 1 }, { unique: true, name: "payment_provider_unique" }),
    database.collection<PaymentProviderAuditEvent>(paymentProviderAuditCollectionName)
      .createIndex({ createdAt: -1 }, { name: "payment_provider_audit_created" }),
    database.collection<PaymentProviderAuditEvent>(paymentProviderAuditCollectionName)
      .createIndex({ provider: 1, createdAt: -1 }, { name: "payment_provider_audit_provider_created" })
  ]);
}

async function collection() {
  const database = await getMongoDatabase();
  await ensurePaymentProviderIndexes(database);
  return database.collection<StoredPaymentProviderSettings>(paymentProviderSettingsCollectionName);
}

function stripeConfigured(config?: StripeEnvironmentConfig) {
  return Boolean(config?.publishableKey && config.apiKey && config.webhookSecret);
}

function redsysConfigured(config?: RedsysEnvironmentConfig) {
  return Boolean(config?.merchantCode && config.terminal && config.signingKey);
}

function stripeSummary(environment: PaymentEnvironment, config?: StripeEnvironmentConfig): PaymentProviderEnvironmentSummary {
  return {
    environment,
    configured: stripeConfigured(config),
    publicFields: {
      publishableKey: config?.publishableKey ?? ""
    },
    secretFields: {
      apiKey: Boolean(config?.apiKey),
      webhookSecret: Boolean(config?.webhookSecret)
    }
  };
}

function redsysSummary(environment: PaymentEnvironment, config?: RedsysEnvironmentConfig): PaymentProviderEnvironmentSummary {
  return {
    environment,
    configured: redsysConfigured(config),
    publicFields: {
      merchantCode: config?.merchantCode ?? "",
      terminal: config?.terminal ?? "",
      paymentUrl: REDSYS_PAYMENT_URLS[environment]
    },
    secretFields: {
      signingKey: Boolean(config?.signingKey)
    }
  };
}

function environmentConfig<T extends ProviderEnvironmentConfig>(
  settings: StoredPaymentProviderSettings | null,
  environment: PaymentEnvironment
) {
  return settings?.environments[environment] as T | undefined;
}

export async function getPaymentProviderSummary(provider: PaymentProviderId): Promise<PaymentProviderSummary> {
  const settings = await (await collection()).findOne({ provider });
  const enabled = settings?.enabled ?? false;
  const activeEnvironment = settings?.activeEnvironment ?? "test";
  const encryptionReady = isPaymentSecretEncryptionConfigured();

  if (provider === "stripe") {
    return {
      provider,
      label: paymentProviderLabel(provider),
      enabled,
      activeEnvironment,
      encryptionReady,
      test: stripeSummary("test", environmentConfig<StripeEnvironmentConfig>(settings, "test")),
      live: stripeSummary("live", environmentConfig<StripeEnvironmentConfig>(settings, "live"))
    };
  }

  return {
    provider,
    label: paymentProviderLabel(provider),
    enabled,
    activeEnvironment,
    encryptionReady,
    test: redsysSummary("test", environmentConfig<RedsysEnvironmentConfig>(settings, "test")),
    live: redsysSummary("live", environmentConfig<RedsysEnvironmentConfig>(settings, "live"))
  };
}

export async function listPaymentProviderSummaries() {
  return Promise.all(paymentProviderDefinitions.map((definition) => getPaymentProviderSummary(definition.id)));
}

function validateStripeKey(value: string, environment: PaymentEnvironment, kind: "publishable" | "api") {
  const prefixes = kind === "publishable"
    ? [environment === "test" ? "pk_test_" : "pk_live_"]
    : environment === "test"
      ? ["rk_test_", "sk_test_"]
      : ["rk_live_", "sk_live_"];
  return prefixes.some((prefix) => value.startsWith(prefix));
}

export type SaveStripeProviderInput = {
  enabled: boolean;
  activeEnvironment: PaymentEnvironment;
  environment: PaymentEnvironment;
  publishableKey: string;
  apiKey?: string;
  webhookSecret?: string;
  clearApiKey?: boolean;
  clearWebhookSecret?: boolean;
  actorIdentityId: string;
  actorRole: UserRole;
};

export async function saveStripeProvider(input: SaveStripeProviderInput) {
  if (!isPaymentSecretEncryptionConfigured()) {
    throw new Error("Payment secret encryption is not configured on the server.");
  }

  const publishableKey = input.publishableKey.trim();
  const apiKey = input.apiKey?.trim() ?? "";
  const webhookSecret = input.webhookSecret?.trim() ?? "";

  if (publishableKey && !validateStripeKey(publishableKey, input.environment, "publishable")) {
    throw new Error(`The Stripe publishable key does not match the ${input.environment} environment.`);
  }
  if (apiKey && !validateStripeKey(apiKey, input.environment, "api")) {
    throw new Error(`The Stripe server API key does not match the ${input.environment} environment.`);
  }
  if (webhookSecret && !webhookSecret.startsWith("whsec_")) {
    throw new Error("The Stripe webhook signing secret must start with whsec_.");
  }

  const client = await getMongoClient();
  const database = client.db(getMongoDatabaseName());
  await ensurePaymentProviderIndexes(database);
  const providers = database.collection<StoredPaymentProviderSettings>(paymentProviderSettingsCollectionName);
  const audit = database.collection<PaymentProviderAuditEvent>(paymentProviderAuditCollectionName);
  const session = client.startSession();

  try {
    await session.withTransaction(async () => {
      const current = await providers.findOne({ provider: "stripe" }, { session });
      const existing = environmentConfig<StripeEnvironmentConfig>(current, input.environment) ?? {};
      const environmentConfigValue: StripeEnvironmentConfig = {
        ...(publishableKey ? { publishableKey } : {}),
        ...(!input.clearApiKey && existing.apiKey ? { apiKey: existing.apiKey } : {}),
        ...(!input.clearWebhookSecret && existing.webhookSecret ? { webhookSecret: existing.webhookSecret } : {}),
        ...(apiKey ? { apiKey: encryptSecret(apiKey) } : {}),
        ...(webhookSecret ? { webhookSecret: encryptSecret(webhookSecret) } : {})
      };

      const next: StoredPaymentProviderSettings = {
        provider: "stripe",
        enabled: input.enabled,
        activeEnvironment: input.activeEnvironment,
        environments: {
          ...(current?.environments ?? {}),
          [input.environment]: environmentConfigValue
        },
        updatedAt: new Date().toISOString(),
        updatedBy: input.actorIdentityId
      };

      const activeConfig = next.environments[next.activeEnvironment] as StripeEnvironmentConfig | undefined;
      if (next.enabled && !stripeConfigured(activeConfig)) {
        throw new Error(`Configure all required Stripe ${next.activeEnvironment} credentials before enabling the provider.`);
      }

      await providers.replaceOne({ provider: "stripe" }, next, { upsert: true, session });
      await audit.insertOne(
        {
          provider: next.provider,
          environment: input.environment,
          action: "settings_updated",
          enabled: next.enabled,
          actorIdentityId: input.actorIdentityId,
          actorRole: input.actorRole,
          createdAt: new Date().toISOString()
        },
        { session }
      );
    });
  } finally {
    await session.endSession();
  }

  return getPaymentProviderSummary("stripe");
}

export type SaveRedsysProviderInput = {
  enabled: boolean;
  activeEnvironment: PaymentEnvironment;
  environment: PaymentEnvironment;
  merchantCode: string;
  terminal: string;
  signingKey?: string;
  clearSigningKey?: boolean;
  actorIdentityId: string;
  actorRole: UserRole;
};

export async function saveRedsysProvider(input: SaveRedsysProviderInput) {
  if (!isPaymentSecretEncryptionConfigured()) {
    throw new Error("Payment secret encryption is not configured on the server.");
  }

  const merchantCode = input.merchantCode.trim();
  const terminal = input.terminal.trim();
  const signingKey = input.signingKey?.trim() ?? "";

  if (merchantCode && !/^\d{9}$/.test(merchantCode)) {
    throw new Error("Redsys merchant code (FUC) must contain 9 digits.");
  }
  if (terminal && !/^\d{1,3}$/.test(terminal)) {
    throw new Error("Redsys terminal must contain between 1 and 3 digits.");
  }

  const client = await getMongoClient();
  const database = client.db(getMongoDatabaseName());
  await ensurePaymentProviderIndexes(database);
  const providers = database.collection<StoredPaymentProviderSettings>(paymentProviderSettingsCollectionName);
  const audit = database.collection<PaymentProviderAuditEvent>(paymentProviderAuditCollectionName);
  const session = client.startSession();

  try {
    await session.withTransaction(async () => {
      const current = await providers.findOne({ provider: "redsys" }, { session });
      const existing = environmentConfig<RedsysEnvironmentConfig>(current, input.environment) ?? {};
      const environmentConfigValue: RedsysEnvironmentConfig = {
        ...(merchantCode ? { merchantCode } : {}),
        ...(terminal ? { terminal: terminal.padStart(3, "0") } : {}),
        ...(!input.clearSigningKey && existing.signingKey ? { signingKey: existing.signingKey } : {}),
        ...(signingKey ? { signingKey: encryptSecret(signingKey) } : {})
      };

      const next: StoredPaymentProviderSettings = {
        provider: "redsys",
        enabled: input.enabled,
        activeEnvironment: input.activeEnvironment,
        environments: {
          ...(current?.environments ?? {}),
          [input.environment]: environmentConfigValue
        },
        updatedAt: new Date().toISOString(),
        updatedBy: input.actorIdentityId
      };

      const activeConfig = next.environments[next.activeEnvironment] as RedsysEnvironmentConfig | undefined;
      if (next.enabled && !redsysConfigured(activeConfig)) {
        throw new Error(`Configure all required Redsys ${next.activeEnvironment} credentials before enabling the provider.`);
      }

      await providers.replaceOne({ provider: "redsys" }, next, { upsert: true, session });
      await audit.insertOne(
        {
          provider: next.provider,
          environment: input.environment,
          action: "settings_updated",
          enabled: next.enabled,
          actorIdentityId: input.actorIdentityId,
          actorRole: input.actorRole,
          createdAt: new Date().toISOString()
        },
        { session }
      );
    });
  } finally {
    await session.endSession();
  }

  return getPaymentProviderSummary("redsys");
}

export async function getActivePaymentProviderCredentials(
  provider: PaymentProviderId
): Promise<PaymentProviderRuntimeCredentials | null> {
  const settings = await (await collection()).findOne({ provider });
  if (!settings?.enabled) return null;
  const environment = settings.activeEnvironment;

  if (provider === "stripe") {
    const config = environmentConfig<StripeEnvironmentConfig>(settings, environment);
    if (!stripeConfigured(config)) return null;
    return {
      provider,
      environment,
      publishableKey: config?.publishableKey ?? "",
      apiKey: decryptSecret(config?.apiKey),
      webhookSecret: decryptSecret(config?.webhookSecret)
    };
  }

  const config = environmentConfig<RedsysEnvironmentConfig>(settings, environment);
  if (!redsysConfigured(config)) return null;
  return {
    provider,
    environment,
    merchantCode: config?.merchantCode ?? "",
    terminal: config?.terminal ?? "",
    signingKey: decryptSecret(config?.signingKey),
    paymentUrl: REDSYS_PAYMENT_URLS[environment]
  };
}

export async function listEnabledPaymentProviders() {
  const summaries = await listPaymentProviderSummaries();
  return summaries.filter((summary) => {
    const active = summary.activeEnvironment === "test" ? summary.test : summary.live;
    return summary.enabled && active.configured;
  });
}