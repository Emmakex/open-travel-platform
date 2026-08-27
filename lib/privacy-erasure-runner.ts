import { getMongoClient, getMongoDatabaseName } from "@/lib/mongodb";
import { eraseSecondaryIdentityLinks } from "@/lib/privacy-erasure-secondary";
import {
  executePrivacyErasureByAdmin,
  privacyExecutionCollectionName,
  type PrivacyExecutionRecord
} from "@/lib/privacy-execution";

/**
 * Runs the primary bounded erasure transaction, then removes secondary identity
 * links in a second idempotent transaction. If the second transaction fails,
 * the whole operation can be retried: primary erasure returns its persisted
 * pseudonym and secondary cleanup safely converges to the same result.
 */
export async function executePrivacyErasureWithSecondaryByAdmin(input: {
  requestId: string;
  actorId: string;
}) {
  const primary = await executePrivacyErasureByAdmin(input);
  if (!primary) {
    throw Object.assign(new Error("Privacy erasure did not produce an execution result."), {
      code: "PRIVACY_ERASURE_EXECUTION_FAILED"
    });
  }

  const client = await getMongoClient();
  const database = client.db(getMongoDatabaseName());
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
