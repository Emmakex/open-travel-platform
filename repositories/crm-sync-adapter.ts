export type CrmContactSnapshot = {
  localId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  country?: string;
  preferredLocale?: string;
};

export type CrmReservationSnapshot = {
  reservationType: "trip" | "service";
  localId: string;
  contactLocalId: string;
  productId: string;
  productTitle?: string;
  status: string;
  partySize: number;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt?: string;
};

export type CrmSyncResult = {
  externalId: string;
  outcome: "upserted" | "unchanged";
  responseStatus?: number;
};

export type CrmSyncCommand<TSnapshot> = {
  snapshot: TSnapshot;
  requestId: string;
  idempotencyKey: string;
};

export interface CrmSyncAdapter {
  readonly id: string;
  upsertContact(command: CrmSyncCommand<CrmContactSnapshot>): Promise<CrmSyncResult>;
  upsertReservation(command: CrmSyncCommand<CrmReservationSnapshot>): Promise<CrmSyncResult>;
}
