import { RestSupplierFulfilmentAdapter } from "@/adapters/rest-supplier-fulfilment-adapter";
import { supplierFulfilmentAdapterMode } from "@/lib/supplier-fulfilment-adapter-config";
import type { SupplierFulfilmentAdapter } from "@/repositories/supplier-fulfilment-adapter";

function adapterError(code: string, message: string) {
  return Object.assign(new Error(message), { code });
}

export function getSupplierFulfilmentAdapter(): SupplierFulfilmentAdapter {
  if (supplierFulfilmentAdapterMode === "rest") return new RestSupplierFulfilmentAdapter();
  throw adapterError("SUPPLIER_ADAPTER_DISABLED", "Supplier fulfilment external adapter is disabled in this deployment.");
}
