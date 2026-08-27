import type { Db } from "mongodb";

const criticalPerformanceIndexes = [
  {
    collection: "travel_reservations",
    key: { createdAt: -1 as const },
    options: { name: "travel_reservation_created" }
  },
  {
    collection: "travel_reservations",
    key: { status: 1 as const },
    options: { name: "travel_reservation_status" }
  },
  {
    collection: "travel_traveller_details",
    key: { identityId: 1 as const, targetType: 1 as const, reservationId: 1 as const, retentionUntil: 1 as const },
    options: { name: "traveller_data_customer_active" }
  },
  {
    collection: "travel_traveller_details",
    key: { targetType: 1 as const, reservationId: 1 as const, retentionUntil: 1 as const },
    options: { name: "traveller_data_reservation_active" }
  },
  {
    collection: "travel_integration_deliveries",
    key: { status: 1 as const, nextAttemptAt: 1 as const, createdAt: 1 as const },
    options: { name: "integration_delivery_due_queue" }
  },
  {
    collection: "travel_integration_deliveries",
    key: { status: 1 as const, leaseUntil: 1 as const, createdAt: 1 as const },
    options: { name: "integration_delivery_lease_queue" }
  },
  {
    collection: "travel_integration_deliveries",
    key: { createdAt: -1 as const },
    options: { name: "integration_delivery_created" }
  }
] as const;

export async function ensureMongoPerformanceIndexes(database: Db) {
  await Promise.all(
    criticalPerformanceIndexes.map((definition) =>
      database.collection(definition.collection).createIndex(definition.key, definition.options)
    )
  );
}
