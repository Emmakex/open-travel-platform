import type {
  SupplierFulfilmentComponent,
  SupplierFulfilmentItem,
  SupplierFulfilmentStatus
} from "@/domain/operations/types";

export type SupplierAdapterOperation = "request" | "status" | "cancel";

export interface SupplierAdapterCommand {
  operation: SupplierAdapterOperation;
  component: SupplierFulfilmentComponent;
  item: SupplierFulfilmentItem;
  requestId: string;
  idempotencyKey?: string;
}

export interface SupplierAdapterResult {
  status: Exclude<SupplierFulfilmentStatus, "not-requested">;
  supplierReference?: string;
  providerMessage?: string;
}

export interface SupplierFulfilmentAdapter {
  readonly id: string;
  execute(command: SupplierAdapterCommand): Promise<SupplierAdapterResult>;
}
