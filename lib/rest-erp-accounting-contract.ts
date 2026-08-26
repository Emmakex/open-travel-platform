import type { ErpAccountingSyncResult } from "@/repositories/erp-accounting-adapter";

export const erpAccountingContractHeader = "X-OTP-Accounting-Contract-Version";
export const erpAccountingContractVersion = "1";

function contractError(message: string) {
  return Object.assign(new Error(message), { code: "ERP_ACCOUNTING_CONTRACT_INVALID" });
}

export function parseErpAccountingSyncResult(value: unknown): ErpAccountingSyncResult {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw contractError("ERP/accounting API response must be a JSON object.");
  }
  const input = value as Record<string, unknown>;
  const externalId = typeof input.externalId === "string" ? input.externalId.trim() : "";
  const outcome = input.outcome;
  if (!externalId || externalId.length > 240) {
    throw contractError("ERP/accounting API response must contain a valid externalId.");
  }
  if (outcome !== "upserted" && outcome !== "unchanged") {
    throw contractError("ERP/accounting API response outcome must be upserted or unchanged.");
  }
  return { externalId, outcome };
}
