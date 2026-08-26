import type { SupplierAdapterResult } from "@/repositories/supplier-fulfilment-adapter";

export const supplierFulfilmentContractHeader = "X-OTP-Contract-Version";
export const supplierFulfilmentContractVersion = "1";

function contractError(message: string) {
  return Object.assign(new Error(message), { code: "SUPPLIER_ADAPTER_CONTRACT_INVALID" });
}

function asRecord(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function optionalText(value: unknown, maximum: number) {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "string") throw contractError("Supplier adapter text field is invalid.");
  const normalized = value.trim().replace(/\s+/g, " ");
  if (!normalized || normalized.length > maximum) throw contractError("Supplier adapter text field is invalid.");
  return normalized;
}

export function parseSupplierAdapterResult(value: unknown): SupplierAdapterResult {
  const root = asRecord(value);
  const fulfilment = root ? asRecord(root.fulfilment) : null;
  if (!fulfilment) throw contractError("Supplier adapter response must contain a fulfilment object.");

  const status = fulfilment.status;
  if (status !== "requested" && status !== "confirmed" && status !== "rejected" && status !== "cancelled") {
    throw contractError("Supplier adapter response contains an unsupported status.");
  }

  return {
    status,
    supplierReference: optionalText(fulfilment.reference, 160),
    providerMessage: optionalText(fulfilment.message, 1000)
  };
}
