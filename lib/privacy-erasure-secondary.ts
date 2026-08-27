import type { ClientSession, Db } from "mongodb";
import { authAuditCollectionName } from "@/lib/auth-security";
import {
  integrationDeliveryAttemptCollectionName,
  integrationDeliveryCollectionName,
  integrationEventCollectionName
} from "@/lib/integration-outbox";
import {
  travelOperationsTaskCollectionName,
  travelOperationsTaskEventCollectionName
} from "@/lib/operations-tasks";
import {
  privacyRequestAuditCollectionName,
  privacyRequestCollectionName,
  type StoredPrivacyRequest
} from "@/lib/privacy-rights";

/**
 * Removes or pseudonymises secondary links to a customer identity after an
 * erasure request has passed retention review. Business/accounting records are
 * handled by the primary executor; this helper covers security, privacy-case,
 * task and integration metadata that could otherwise retain the old ID.
 */
export async function eraseSecondaryIdentityLinks(input: {
  database: Db;
  session: ClientSession;
  identityId: string;
  pseudonym: string;
}) {
  const { database, session, identityId, pseudonym } = input;

  await database.collection(authAuditCollectionName).updateMany(
    { scope: "customer", subjectId: identityId },
    { $set: { subjectId: pseudonym }, $unset: { emailHash: "" } },
    { session }
  );

  const privacyRequests = await database.collection<StoredPrivacyRequest>(privacyRequestCollectionName)
    .find({ identityId }, { session })
    .project<Pick<StoredPrivacyRequest, "id" | "type" | "openKey">>({ id: 1, type: 1, openKey: 1 })
    .toArray();
  for (const request of privacyRequests) {
    await database.collection<StoredPrivacyRequest>(privacyRequestCollectionName).updateOne(
      { id: request.id, identityId },
      {
        $set: {
          identityId: pseudonym,
          ...(request.openKey ? { openKey: `${pseudonym}:${request.type}` } : {})
        }
      },
      { session }
    );
  }

  await database.collection(privacyRequestAuditCollectionName).updateMany(
    { identityId },
    { $set: { identityId: pseudonym } },
    { session }
  );
  await database.collection(privacyRequestAuditCollectionName).updateMany(
    { actorType: "customer", actorId: identityId },
    { $set: { actorId: pseudonym } },
    { session }
  );

  await database.collection(travelOperationsTaskCollectionName).updateMany(
    { targetType: "customer", targetId: identityId },
    { $set: { targetId: pseudonym } },
    { session }
  );
  await database.collection(travelOperationsTaskEventCollectionName).updateMany(
    { targetType: "customer", targetId: identityId },
    { $set: { targetId: pseudonym } },
    { session }
  );

  const customerEvents = await database.collection(integrationEventCollectionName)
    .find({ aggregateType: "customer", aggregateId: identityId }, { session })
    .project<{ id: string }>({ id: 1 })
    .toArray();
  const eventIds = customerEvents.map((event) => event.id);
  if (eventIds.length) {
    const deliveries = await database.collection(integrationDeliveryCollectionName)
      .find({ eventId: { $in: eventIds } }, { session })
      .project<{ id: string }>({ id: 1 })
      .toArray();
    const deliveryIds = deliveries.map((delivery) => delivery.id);
    await database.collection(integrationDeliveryAttemptCollectionName).deleteMany(
      {
        $or: [
          { eventId: { $in: eventIds } },
          ...(deliveryIds.length ? [{ deliveryId: { $in: deliveryIds } }] : [])
        ]
      },
      { session }
    );
    await database.collection(integrationDeliveryCollectionName).deleteMany(
      { eventId: { $in: eventIds } },
      { session }
    );
    await database.collection(integrationEventCollectionName).deleteMany(
      { id: { $in: eventIds } },
      { session }
    );
  }

  return {
    privacyRequests: privacyRequests.length,
    integrationEventsRemoved: eventIds.length
  };
}
