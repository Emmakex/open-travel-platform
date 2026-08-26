import type { Db } from "mongodb";
import type { PaymentTransaction } from "@/domain/payment/types";

export const travelPaymentTransactionCollectionName = "travel_payment_transactions";
export type StoredPaymentTransaction = PaymentTransaction;

export async function ensureMongoPaymentIndexes(database: Db) {
  const payments = database.collection<StoredPaymentTransaction>(travelPaymentTransactionCollectionName);

  await Promise.all([
    payments.createIndex({ id: 1 }, { unique: true, name: "travel_payment_id_unique" }),
    payments.createIndex(
      { reservationId: 1, createdAt: -1 },
      { name: "travel_payment_reservation_created" }
    ),
    payments.createIndex(
      { status: 1, type: 1, createdAt: -1 },
      { name: "travel_payment_status_type_created" }
    ),
    payments.createIndex(
      { provider: 1, providerReference: 1 },
      {
        name: "travel_payment_provider_reference_unique",
        unique: true,
        partialFilterExpression: { providerReference: { $type: "string" } }
      }
    )
  ]);
}
