import { getMongoClient, getMongoDatabaseName } from "@/lib/mongodb";
import { eraseSecondaryIdentityLinks } from "@/lib/privacy-erasure-secondary";
import {
  executePrivacyErasureByAdmin,
  privacyExecutionCollectionName,
  type PrivacyExecutionRecord
} from "@/lib/privacy-execution";

/**
 * Runs the primary bounded erasure transaction, then removes secondary identity
 * links in a second idempotent transaction. A retry first checks the persisted
 * primary execution record, so it never needs to resolve an already-erased
 * account again before converging the secondary cleanup.
 */
export async function executePrivacyErasureWithSecondaryByAdmin(input: {
  requestId: string;
  actorId: string;
}) {
  const client = await getMongoClient();
  const database = client.db(getMongoDatabaseName());
  const existing = await database.collection<PrivacyExecutionRecord>(privacyExecutionCollectionName)
    .findOne({ requestId: input.requestId });

  const primary = existing?.erasureAppliedAt && existing.erasurePseudonym
    ? {
        identityId: existing.identityId,
        pseudonym: existing.erasurePseudonym,
        appliedAt: existing.erasureAppliedAt,
        trips: 0,
        services: 0
      }
    : await executePrivacyErasureByAdmin(input);

  if (!primary) {
    throw Object.assign(new Error("Privacy erasure did not produce an execution result."), {
      code: "PRIVACY_ERASURE_EXECUTION_FAILED"
    });
  }

  const session = client.startSession();
  try {
    await session.withTransaction(async () => {
      await eraseSecondaryIdentityLinks({
        database,
        session,
        identityId: primary.identityId,
        pseudonym: primary.pseudonym
      });
      await database.collection<PrivacyExecutionRecord>(privacyExecutionCollectionName).updateMany(
        { identityId: primary.identityId },
        { $set: { identityId: primary.pseudonym, updatedAt: new Date() } },
        { session }
      );
    });
  } finally {
    await session.endSession();
  }

  return primary;
}
