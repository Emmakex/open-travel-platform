import { RestErpAccountingAdapter } from "@/adapters/rest-erp-accounting-adapter";
import { erpAccountingMode } from "@/lib/erp-accounting-config";
import type { ErpAccountingAdapter } from "@/repositories/erp-accounting-adapter";

function accountingError(code: string, message: string) {
  return Object.assign(new Error(message), { code });
}

export function getErpAccountingAdapter(): ErpAccountingAdapter {
  if (erpAccountingMode === "rest") return new RestErpAccountingAdapter();
  throw accountingError("ERP_ACCOUNTING_DISABLED", "ERP/accounting synchronization is disabled in this deployment.");
}
