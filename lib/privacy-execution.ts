import { createHash, randomBytes } from "node:crypto";
import type { ClientSession, Db } from "mongodb";
import type { ReservationTraveller, Reservation } from "@/domain/booking/types";
import type { ServiceReservation } from "@/domain/services/booking-types";
import {
  customerSessionCollectionName,
  customerUserCollectionName,
  type StoredCustomerUser
} from "@/lib/customer-auth";
import {
  travelReservationCollectionName,
  type StoredReservation
} from "@/lib/mongo-reservations";
import { travelPaymentTransactionCollectionName } from "@/lib/mongo-payments";
import { getMongoClient, getMongoDatabaseName } from "@/lib/mongodb";
import {
  privacyRequestCollectionName,
  type PrivacyRightType,
  type StoredPrivacyRequest
} from "@/lib/privacy-rights";
import { serviceReservationCollectionName } from "@/lib/service-reservations";
import {
  travellerDataAuditCollectionName,
  travellerDataCollectionName
} from "@/lib/traveller-data";

export const privacyExecutionCollectionName = "travel_privacy_execution";

export type PrivacyExecutionRecord = {
  requestId: string;
  identityId: string;
  rightType: PrivacyRightType;
  exportApprovedAt?: Date;
  exportApprovedBy?: string;
  restrictionAppliedAt?: Date;
  restrictionAppliedBy?: string;
  erasureAppliedAt?: Date;
  erasureAppliedBy?: string;
  erasurePseudonym?: string;
  createdAt: Date;
  updatedAt: Date;
};

export type PrivacyRestrictionExecutionResult = {
  identityId: string;
  appliedAt: Date;
};

export type PrivacyErasureExecutionResult = {
  identityId: string;
  pseudonym: string;
  appliedAt: Date;
  trips: number;
  services: number;
};

const terminalStatuses = new Set(["completed", "declined", "withdrawn"]);
const maxRecordsPerBusinessStore = 500;

function executionError(code: string, message: string) {
  return Object.assign(new Error(message), { code });
}

export async function ensurePrivacyExecutionIndexes(database: Db) {
  await Promise.all([
    database.collection<PrivacyExecutionRecord>(privacyExecutionCollectionName)
      .createIndex({ requestId: 1 }, { unique: true, name: "privacy_execution_request_unique" }),
    database.collection<PrivacyExecutionRecord>(privacyExecutionCollectionName)
      .createIndex({ identityId: 1, updatedAt: -1 }, { name: "privacy_execution_identity_updated" })
  ]);
}

async function requireExecutableRequest(database: Db, requestId: string, session?: ClientSession) {
  const request = await database.collection<StoredPrivacyRequest>(privacyRequestCollectionName)
    .findOne({ id: requestId }, { session });
  if (!request) throw executionError("PRIVACY_REQUEST_NOT_FOUND", "Privacy request not found.");
  if (terminalStatuses.has(request.status)) {
    throw executionError("PRIVACY_REQUEST_TERMINAL", "Closed privacy requests cannot execute new data operations.");
  }
  if (request.status !== "action-pending") {
    throw executionError("PRIVACY_EXECUTION_NOT_READY", "Privacy execution requires the request to be in action-pending status.");
  }
  return request;
}

export async function approvePrivacyExportByAdmin(input: { requestId: string; actorId: string }) {
  const client = await getMongoClient();
  const database = client.db(getMongoDatabaseName());
  await ensurePrivacyExecutionIndexes(database);
  const request = await requireExecutableRequest(database, input.requestId);
  if (request.type !== "access" && request.type !== "portability") {
    throw executionError("PRIVACY_EXPORT_NOT_APPLICABLE", "Only access and portability requests can approve an export package.");
  }
  const now = new Date();
  await database.collection<PrivacyExecutionRecord>(privacyExecutionCollectionName).updateOne(
    { requestId: request.id },
    {
      $setOnInsert: {
        requestId: request.id,
        identityId: request.identityId,
        rightType: request.type,
        createdAt: now
      },
      $set: {
        exportApprovedAt: now,
        exportApprovedBy: input.actorId,
        updatedAt: now
      }
    },
    { upsert: true }
  );
  return { requestId: request.id, approvedAt: now };
}

export async function getApprovedPrivacyExport(input: { identityId: string; requestId: string }) {
  const client = await getMongoClient();
  const database = client.db(getMongoDatabaseName());
  await ensurePrivacyExecutionIndexes(database);
  const request = await database.collection<StoredPrivacyRequest>(privacyRequestCollectionName)
    .findOne({ id: input.requestId, identityId: input.identityId });
  if (!request) throw executionError("PRIVACY_REQUEST_NOT_FOUND", "Privacy request not found.");
  if (request.type !== "access" && request.type !== "portability") {
    throw executionError("PRIVACY_EXPORT_NOT_APPLICABLE", "This privacy request does not support an export package.");
  }
  const execution = await database.collection<PrivacyExecutionRecord>(privacyExecutionCollectionName)
    .findOne({ requestId: request.id, identityId: input.identityId });
  if (!execution?.exportApprovedAt) {
    throw executionError("PRIVACY_EXPORT_NOT_APPROVED", "The privacy export has not yet been approved for release.");
  }
  return { request, execution };
}

function erasedPseudonym(requestId: string, identityId: string) {
  return `privacy-erased-${createHash("sha256").update(`${requestId}:${identityId}`).digest("hex").slice(0, 24)}`;
}

function erasedEmail(identityId: string) {
  return `erased+${createHash("sha256").update(identityId).digest("hex").slice(0, 24)}@privacy.invalid`;
}

function eraseTraveller(traveller: ReservationTraveller): ReservationTraveller {
  return {
    ...traveller,
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    nationality: ""
  };
}

function eraseTripReservation(reservation: StoredReservation, pseudonym: string): Partial<Reservation> {
  return {
    identityId: pseudonym,
    ...(reservation.travellers ? { travellers: reservation.travellers.map(eraseTraveller) } : {})
  };
}

function eraseServiceReservation(reservation: ServiceReservation, pseudonym: string): Partial<ServiceReservation> {
  return {
    identityId: pseudonym,
    travellers: reservation.travellers.map(eraseTraveller),
    statusHistory: reservation.statusHistory?.map((event) => ({
      ...event,
      actorId: event.actorType === "customer" ? pseudonym : event.actorId
    }))
  };
}

async function loadOwnedBusinessRecords(database: Db, identityId: string, session: ClientSession) {
  const trips = await database.collection<StoredReservation>(travelReservationCollectionName)
    .find({ identityId }, { session }).limit(maxRecordsPerBusinessStore + 1).toArray();
  const services = await database.collection<ServiceReservation>(serviceReservationCollectionName)
    .find({ identityId }, { session }).limit(maxRecordsPerBusinessStore + 1).toArray();
  if (trips.length > maxRecordsPerBusinessStore || services.length > maxRecordsPerBusinessStore) {
    throw executionError(
      "PRIVACY_EXECUTION_REQUIRES_OFFLINE_MIGRATION",
      "This account exceeds the bounded online privacy-execution limit and requires the documented offline migration procedure."
    );
  }
  return { trips, services };
}

export async function executePrivacyRestrictionByAdmin(
  input: { requestId: string; actorId: string }
): Promise<PrivacyRestrictionExecutionResult | null> {
  const client = await getMongoClient();
  const database = client.db(getMongoDatabaseName());
  await ensurePrivacyExecutionIndexes(database);
  const session = client.startSession();
  let result: PrivacyRestrictionExecutionResult | null = null;

  try {
    await session.withTransaction(async () => {
      const request = await requireExecutableRequest(database, input.requestId, session);
      if (request.type !== "restriction") {
        throw executionError("PRIVACY_RESTRICTION_NOT_APPLICABLE", "Only restriction requests can apply processing restriction.");
      }
      const now = new Date();
      const users = database.collection<StoredCustomerUser>(customerUserCollectionName);
      const user = await users.findOne({ id: request.identityId }, { session });
      if (!user) throw executionError("PRIVACY_IDENTITY_NOT_FOUND", "Customer identity not found.");

      await users.updateOne(
        { id: request.identityId },
        { $set: { status: "disabled", updatedAt: now } },
        { session }
      );
      await database.collection(customerSessionCollectionName).deleteMany({ userId: request.identityId }, { session });
      await database.collection<PrivacyExecutionRecord>(privacyExecutionCollectionName).updateOne(
        { requestId: request.id },
        {
          $setOnInsert: {
            requestId: request.id,
            identityId: request.identityId,
            rightType: request.type,
            createdAt: now
          },
          $set: {
            restrictionAppliedAt: now,
            restrictionAppliedBy: input.actorId,
            updatedAt: now
          }
        },
        { upsert: true, session }
      );
      result = { identityId: request.identityId, appliedAt: now };
    });
  } finally {
    await session.endSession();
  }
  return result;
}

export async function executePrivacyErasureByAdmin(
  input: { requestId: string; actorId: string }
): Promise<PrivacyErasureExecutionResult | null> {
  const client = await getMongoClient();
  const database = client.db(getMongoDatabaseName());
  await ensurePrivacyExecutionIndexes(database);
  const session = client.startSession();
  let result: PrivacyErasureExecutionResult | null = null;

  try {
    await session.withTransaction(async () => {
      const request = await requireExecutableRequest(database, input.requestId, session);
      if (request.type !== "erasure") {
        throw executionError("PRIVACY_ERASURE_NOT_APPLICABLE", "Only erasure requests can run the erasure executor.");
      }
      if (request.retentionState !== "clear") {
        throw executionError("PRIVACY_ERASURE_RETENTION_BLOCK", "Erasure execution requires a completed retention review with state clear.");
      }

      const users = database.collection<StoredCustomerUser>(customerUserCollectionName);
      const user = await users.findOne({ id: request.identityId }, { session });
      if (!user) throw executionError("PRIVACY_IDENTITY_NOT_FOUND", "Customer identity not found.");
      const existingExecution = await database.collection<PrivacyExecutionRecord>(privacyExecutionCollectionName)
        .findOne({ requestId: request.id }, { session });
      if (existingExecution?.erasureAppliedAt && existingExecution.erasurePseudonym) {
        result = {
          identityId: request.identityId,
          pseudonym: existingExecution.erasurePseudonym,
          appliedAt: existingExecution.erasureAppliedAt,
          trips: 0,
          services: 0
        };
        return;
      }

      const { trips, services } = await loadOwnedBusinessRecords(database, request.identityId, session);
      const pseudonym = erasedPseudonym(request.id, request.identityId);
      const email = erasedEmail(request.identityId);
      const now = new Date();
      const replacementSalt = randomBytes(16).toString("hex");
      const replacementHash = randomBytes(64).toString("hex");

      await users.updateOne(
        { id: request.identityId },
        {
          $set: {
            email,
            emailNormalized: email,
            displayName: "Erased customer",
            firstName: "Erased",
            lastName: "Customer",
            passwordHash: replacementHash,
            passwordSalt: replacementSalt,
            status: "disabled",
            updatedAt: now
          },
          $unset: {
            phone: "",
            country: "",
            preferredLocale: "",
            failedSignInAttempts: "",
            lockedUntil: "",
            lastSignedInAt: "",
            passwordChangedAt: ""
          }
        },
        { session }
      );
      await database.collection(customerSessionCollectionName).deleteMany({ userId: request.identityId }, { session });

      const tripCollection = database.collection<StoredReservation>(travelReservationCollectionName);
      for (const reservation of trips) {
        await tripCollection.updateOne(
          { id: reservation.id, identityId: request.identityId },
          { $set: eraseTripReservation(reservation, pseudonym) },
          { session }
        );
      }

      const serviceCollection = database.collection<ServiceReservation>(serviceReservationCollectionName);
      for (const reservation of services) {
        await serviceCollection.updateOne(
          { id: reservation.id, identityId: request.identityId },
          { $set: eraseServiceReservation(reservation, pseudonym) },
          { session }
        );
      }

      const targetIds = [...trips.map((item) => item.id), ...services.map((item) => item.id)];
      if (targetIds.length) {
        await database.collection(travelPaymentTransactionCollectionName).updateMany(
          { reservationId: { $in: targetIds } },
          { $unset: { actorIdentityId: "", note: "" } },
          { session }
        );
      }

      await database.collection(travellerDataCollectionName).deleteMany({ identityId: request.identityId }, { session });
      await database.collection(travellerDataAuditCollectionName).deleteMany({ actorIdentityId: request.identityId }, { session });

      await database.collection<PrivacyExecutionRecord>(privacyExecutionCollectionName).updateOne(
        { requestId: request.id },
        {
          $setOnInsert: {
            requestId: request.id,
            identityId: request.identityId,
            rightType: request.type,
            createdAt: now
          },
          $set: {
            erasureAppliedAt: now,
            erasureAppliedBy: input.actorId,
            erasurePseudonym: pseudonym,
            updatedAt: now
          }
        },
        { upsert: true, session }
      );

      result = {
        identityId: request.identityId,
        pseudonym,
        appliedAt: now,
        trips: trips.length,
        services: services.length
      };
    });
  } finally {
    await session.endSession();
  }
  return result;
}
