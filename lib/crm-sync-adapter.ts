import { RestCrmSyncAdapter } from "@/adapters/rest-crm-sync-adapter";
import { crmSyncMode } from "@/lib/crm-sync-config";
import type { CrmSyncAdapter } from "@/repositories/crm-sync-adapter";

function crmError(code: string, message: string) {
  return Object.assign(new Error(message), { code });
}

export function getCrmSyncAdapter(): CrmSyncAdapter {
  if (crmSyncMode === "rest") return new RestCrmSyncAdapter();
  throw crmError("CRM_SYNC_DISABLED", "CRM synchronization is disabled in this deployment.");
}
