import type { Db } from "mongodb";
import { getMongoDatabase } from "@/lib/mongodb";

export const integrationWorkerStateCollectionName = "travel_integration_worker_state";
const workerStateId = "outbound-delivery";

type IntegrationWorkerState = {
  id: string;
  lastStartedAt?: string;
  nextAllowedAt: string;
};

function duplicateKey(error: unknown) {
  return Boolean(error && typeof error === "object" && "code" in error && error.code === 11000);
}

export function integrationWorkerMinIntervalSeconds() {
  const configured = Number.parseInt(process.env.INTEGRATION_WORKER_MIN_INTERVAL_SECONDS ?? "30", 10);
  if (!Number.isFinite(configured)) return 30;
  return Math.max(10, Math.min(configured, 3600));
}

async function ensureIntegrationWorkerState(database: Db) {
  const collection = database.collection<IntegrationWorkerState>(integrationWorkerStateCollectionName);
  await collection.createIndex({ id: 1 }, { unique: true, name: "integration_worker_state_id_unique" });
  try {
    await collection.updateOne(
      { id: workerStateId },
      { $setOnInsert: { id: workerStateId, nextAllowedAt: "1970-01-01T00:00:00.000Z" } },
      { upsert: true }
    );
  } catch (error) {
    if (!duplicateKey(error)) throw error;
  }
  return collection;
}

export async function tryAcquireIntegrationWorkerRun() {
  const database = await getMongoDatabase();
  const collection = await ensureIntegrationWorkerState(database);
  const nowMs = Date.now();
  const now = new Date(nowMs).toISOString();
  const intervalSeconds = integrationWorkerMinIntervalSeconds();
  const nextAllowedAt = new Date(nowMs + intervalSeconds * 1000).toISOString();
  const acquired = await collection.findOneAndUpdate(
    { id: workerStateId, nextAllowedAt: { $lte: now } },
    { $set: { lastStartedAt: now, nextAllowedAt } },
    { returnDocument: "after" }
  );

  if (acquired) {
    return {
      acquired: true as const,
      startedAt: now,
      nextAllowedAt,
      intervalSeconds
    };
  }

  const current = await collection.findOne({ id: workerStateId });
  const remainingSeconds = current?.nextAllowedAt
    ? Math.max(1, Math.ceil((Date.parse(current.nextAllowedAt) - nowMs) / 1000))
    : intervalSeconds;
  return {
    acquired: false as const,
    nextAllowedAt: current?.nextAllowedAt ?? nextAllowedAt,
    retryAfterSeconds: remainingSeconds,
    intervalSeconds
  };
}
