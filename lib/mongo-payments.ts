import type { Collection, Db } from "mongodb";
import type { PaymentTransaction } from "@/domain/payment/types";

export const travelPaymentTransactionCollectionName = "travel_payment_transactions";
export type StoredPaymentTransaction = PaymentTransaction;

function mongoCode(error: unknown) {
  return error && typeof error === "object" && "code" in error
    ? Number((error as { code?: unknown }).code)
    : undefined;
}

async function removeLegacyProviderReferenceIndex(
  payments: Collection<StoredPaymentTransaction>
) {
  try {
    await payments.dropIndex("travel_payment_provider_reference");
  } catch (error) {
    // Fresh databases have no collection/index yet; concurrent bootstraps may
    // also race after another request has already removed the legacy index.
    if (mongoCode(error) === 26 || mongoCode(error) === 27) return;
    throw error;
  }
}

export async function ensureMongoPaymentIndexes(database: Db) {
  const payments = database.collection<StoredPaymentTransaction>(travelPaymentTransactionCollectionName);
  await removeLegacyProviderReferenceIndex(payments);

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
