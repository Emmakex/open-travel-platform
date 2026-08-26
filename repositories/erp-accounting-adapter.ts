export type ErpAccountingMovementSnapshot = {
  localId: string;
  targetType: "trip" | "service";
  targetId: string;
  movementType: "payment" | "refund";
  amount: number;
  currency: string;
  provider: string;
  method?: string;
  providerReference?: string;
  occurredAt: string;
};

export type ErpAccountingSyncCommand = {
  snapshot: ErpAccountingMovementSnapshot;
  requestId: string;
  idempotencyKey: string;
};

export type ErpAccountingSyncResult = {
  externalId: string;
  outcome: "upserted" | "unchanged";
  responseStatus?: number;
};

export interface ErpAccountingAdapter {
  readonly id: string;
  upsertMovement(command: ErpAccountingSyncCommand): Promise<ErpAccountingSyncResult>;
}
