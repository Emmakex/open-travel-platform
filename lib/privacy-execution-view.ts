import { getMongoClient, getMongoDatabaseName } from "@/lib/mongodb";
import {
  privacyExecutionCollectionName,
  type PrivacyExecutionRecord
} from "@/lib/privacy-execution";

export type CustomerPrivacyExecutionState = {
  requestId: string;
  exportApproved: boolean;
  exportApprovedAt?: Date;
};

export async function listPrivacyExecutionForCustomer(identityId: string) {
  const client = await getMongoClient();
  const database = client.db(getMongoDatabaseName());
  const records = await database.collection<PrivacyExecutionRecord>(privacyExecutionCollectionName)
    .find({ identityId })
    .project<Pick<PrivacyExecutionRecord, "requestId" | "exportApprovedAt">>({
      requestId: 1,
      exportApprovedAt: 1
    })
    .limit(200)
    .toArray();

  return records.map((record): CustomerPrivacyExecutionState => ({
    requestId: record.requestId,
    exportApproved: Boolean(record.exportApprovedAt),
    exportApprovedAt: record.exportApprovedAt
  }));
}
