import type { CrmSyncResult } from "@/repositories/crm-sync-adapter";

export const crmContractVersion = "1";
export const crmContractHeader = "X-OTP-Contract-Version";

function contractError(code: string, message: string) {
  return Object.assign(new Error(message), { code });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function parseCrmSyncResult(value: unknown): CrmSyncResult {
  if (!isRecord(value)) throw contractError("CRM_SYNC_CONTRACT_INVALID", "The CRM API response must be a JSON object.");
  const externalId = typeof value.externalId === "string" ? value.externalId.trim() : "";
  const outcome = value.outcome;
  if (!externalId || externalId.length > 240) {
    throw contractError("CRM_SYNC_CONTRACT_INVALID", "The CRM API must return a valid externalId of up to 240 characters.");
  }
  if (outcome !== "upserted" && outcome !== "unchanged") {
    throw contractError("CRM_SYNC_CONTRACT_INVALID", "The CRM API outcome must be upserted or unchanged.");
  }
  return { externalId, outcome };
}
