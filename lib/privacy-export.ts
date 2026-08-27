import type { ServiceReservation } from "@/domain/services/booking-types";
import type { PaymentTransaction } from "@/domain/payment/types";
import {
  customerUserCollectionName,
  type StoredCustomerUser
} from "@/lib/customer-auth";
import {
  travelOperationsAuditCollectionName,
  travelReservationCollectionName,
  type StoredOperationsAuditEvent,
  type StoredReservation
} from "@/lib/mongo-reservations";
import { travelPaymentTransactionCollectionName } from "@/lib/mongo-payments";
import { getMongoClient, getMongoDatabaseName } from "@/lib/mongodb";
import { getApprovedPrivacyExport } from "@/lib/privacy-execution";
import {
  privacyRequestCollectionName,
  type StoredPrivacyRequest
} from "@/lib/privacy-rights";
import { serviceReservationCollectionName } from "@/lib/service-reservations";
import {
  isTravellerDataEncryptionConfigured,
  listTravellerDataForCustomer,
  travellerDataCollectionName
} from "@/lib/traveller-data";

export type PrivacyExportPackage = {
  schemaVersion: 1;
  request: {
    id: string;
    type: "access" | "portability";
    receivedAt: string;
    generatedAt: string;
  };
  scope: {
    format: "application/json";
    machineReadable: true;
    notes: string[];
  };
  account: Record<string, unknown> | null;
  tripReservations: Record<string, unknown>[];
  serviceReservations: Record<string, unknown>[];
  protectedTravellerData: Array<{
    targetType: "trip" | "service";
    reservationId: string;
    travellers: Array<{ travellerId: string; data: Record<string, unknown> }>;
  }>;
  paymentMovements?: Record<string, unknown>[];
  privacyRequests?: Record<string, unknown>[];
  bookingStatusHistory?: Record<string, unknown>[];
};

function iso(value: Date | string | undefined) {
  if (!value) return undefined;
  return value instanceof Date ? value.toISOString() : value;
}

function safeAccount(user: StoredCustomerUser | null, portability: boolean): Record<string, unknown> | null {
  if (!user) return null;
  const base = {
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    displayName: user.displayName,
    phone: user.phone,
    country: user.country,
    preferredLocale: user.preferredLocale
  };
  if (portability) return base;
  return {
    ...base,
    customerId: user.id,
    role: user.role,
    status: user.status,
    createdAt: iso(user.createdAt),
    updatedAt: iso(user.updatedAt),
    lastSignedInAt: iso(user.lastSignedInAt),
    passwordChangedAt: iso(user.passwordChangedAt)
  };
}

function tripForAccess(record: StoredReservation) {
  const { _id: _ignoredId, identityId: _ignoredIdentity, ...rest } = record as StoredReservation & { _id?: unknown };
  return rest as Record<string, unknown>;
}

function tripForPortability(record: StoredReservation): Record<string, unknown> {
  return {
    id: record.id,
    tripId: record.tripId,
    availabilityId: record.availabilityId,
    partySize: record.partySize,
    inventorySpaces: record.inventorySpaces,
    travellers: record.travellers,
    accommodationBookings: record.accommodationBookings,
    packageAddOns: record.packageAddOns,
    tripTitle: record.tripTitle,
    departureDate: record.departureDate,
    returnDate: record.returnDate,
    createdAt: record.createdAt
  };
}

function safeStatusHistory(record: ServiceReservation) {
  return record.statusHistory?.map((event) => ({
    fromStatus: event.fromStatus,
    toStatus: event.toStatus,
    actorType: event.actorType,
    at: event.at
  }));
}

function serviceForAccess(record: ServiceReservation) {
  const { _id: _ignoredId, identityId: _ignoredIdentity, statusHistory: _ignoredHistory, ...rest } = record as ServiceReservation & { _id?: unknown };
  return { ...rest, statusHistory: safeStatusHistory(record) } as Record<string, unknown>;
}

function serviceForPortability(record: ServiceReservation): Record<string, unknown> {
  return {
    id: record.id,
    serviceId: record.serviceId,
    serviceType: record.serviceType,
    serviceSlug: record.serviceSlug,
    serviceTitle: record.serviceTitle,
    availabilityId: record.availabilityId,
    serviceDate: record.serviceDate,
    startTime: record.startTime,
    endTime: record.endTime,
    partySize: record.partySize,
    quantity: record.quantity,
    travellers: record.travellers,
    insuranceTrip: record.insuranceTrip,
    relatedReservationId: record.relatedReservationId,
    createdAt: record.createdAt
  };
}

function safePayment(record: PaymentTransaction): Record<string, unknown> {
  return {
    id: record.id,
    reservationId: record.reservationId,
    targetType: record.targetType,
    type: record.type,
    status: record.status,
    amount: record.amount,
    currency: record.currency,
    provider: record.provider,
    method: record.method,
    providerReference: record.providerReference,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt
  };
}

function safePrivacyRequest(record: StoredPrivacyRequest): Record<string, unknown> {
  return {
    id: record.id,
    type: record.type,
    status: record.status,
    receivedAt: iso(record.receivedAt),
    dueAt: iso(record.dueAt),
    extendedDueAt: iso(record.extendedDueAt),
    extensionReason: record.extensionReason,
    retentionState: record.retentionState,
    retentionReason: record.retentionReason,
    outcomeCode: record.outcomeCode,
    completedAt: iso(record.completedAt),
    updatedAt: iso(record.updatedAt)
  };
}

function safeBookingAudit(record: StoredOperationsAuditEvent): Record<string, unknown> {
  return {
    reservationId: record.reservationId,
    fromStatus: record.fromStatus,
    toStatus: record.toStatus,
    occurredAt: record.occurredAt
  };
}

async function protectedTravellerExport(input: {
  identityId: string;
  tripIds: string[];
  serviceIds: string[];
}) {
  const client = await getMongoClient();
  const database = client.db(getMongoDatabaseName());
  const activeProtectedCount = await database.collection(travellerDataCollectionName).countDocuments({
    identityId: input.identityId,
    retentionUntil: { $gt: new Date() }
  });
  if (activeProtectedCount > 0 && !isTravellerDataEncryptionConfigured()) {
    throw Object.assign(new Error("Protected traveller data exists but its encryption keyring is unavailable."), {
      code: "PRIVACY_EXPORT_PROTECTED_DATA_UNAVAILABLE"
    });
  }

  const output: PrivacyExportPackage["protectedTravellerData"] = [];
  for (const reservationId of input.tripIds) {
    const values = await listTravellerDataForCustomer({
      identityId: input.identityId,
      targetType: "trip",
      reservationId
    });
    if (values.size) {
      output.push({
        targetType: "trip",
        reservationId,
        travellers: [...values.entries()].map(([travellerId, data]) => ({
          travellerId,
          data: { ...data }
        }))
      });
    }
  }
  for (const reservationId of input.serviceIds) {
    const values = await listTravellerDataForCustomer({
      identityId: input.identityId,
      targetType: "service",
      reservationId
    });
    if (values.size) {
      output.push({
        targetType: "service",
        reservationId,
        travellers: [...values.entries()].map(([travellerId, data]) => ({
          travellerId,
          data: { ...data }
        }))
      });
    }
  }
  return output;
}

export async function buildApprovedPrivacyExport(input: {
  identityId: string;
  requestId: string;
}): Promise<PrivacyExportPackage> {
  const { request } = await getApprovedPrivacyExport(input);
  const portability = request.type === "portability";
  const exportType: "access" | "portability" = portability ? "portability" : "access";
  const client = await getMongoClient();
  const database = client.db(getMongoDatabaseName());

  const [user, trips, services, cases] = await Promise.all([
    database.collection<StoredCustomerUser>(customerUserCollectionName).findOne({ id: input.identityId }),
    database.collection<StoredReservation>(travelReservationCollectionName)
      .find({ identityId: input.identityId }).sort({ createdAt: 1 }).limit(500).toArray(),
    database.collection<ServiceReservation>(serviceReservationCollectionName)
      .find({ identityId: input.identityId }).sort({ createdAt: 1 }).limit(500).toArray(),
    portability
      ? Promise.resolve([] as StoredPrivacyRequest[])
      : database.collection<StoredPrivacyRequest>(privacyRequestCollectionName)
        .find({ identityId: input.identityId }).sort({ receivedAt: 1 }).limit(500).toArray()
  ]);

  const tripIds = trips.map((item) => item.id);
  const serviceIds = services.map((item) => item.id);
  const targetIds = [...tripIds, ...serviceIds];
  const [protectedTravellerData, payments, bookingAudit] = await Promise.all([
    protectedTravellerExport({ identityId: input.identityId, tripIds, serviceIds }),
    portability || targetIds.length === 0
      ? Promise.resolve([] as PaymentTransaction[])
      : database.collection<PaymentTransaction>(travelPaymentTransactionCollectionName)
        .find({ reservationId: { $in: targetIds } }).sort({ createdAt: 1 }).limit(2000).toArray(),
    portability || tripIds.length === 0
      ? Promise.resolve([] as StoredOperationsAuditEvent[])
      : database.collection<StoredOperationsAuditEvent>(travelOperationsAuditCollectionName)
        .find({ reservationId: { $in: tripIds } }).sort({ occurredAt: 1 }).limit(2000).toArray()
  ]);

  return {
    schemaVersion: 1,
    request: {
      id: request.id,
      type: exportType,
      receivedAt: request.receivedAt.toISOString(),
      generatedAt: new Date().toISOString()
    },
    scope: {
      format: "application/json",
      machineReadable: true,
      notes: portability
        ? [
            "Portability focuses on account, booking/service selections and traveller information supplied through the platform.",
            "Security credentials, session tokens/hashes, internal staff identifiers, audit/security internals and payment-accounting history are excluded from this portability package."
          ]
        : [
            "This access package excludes passwords, password salts/hashes, session tokens/hashes, provider credentials and unrelated staff/internal identifiers.",
            "Protected traveller values are decrypted only from active records owned by this customer identity after staff release approval."
          ]
    },
    account: safeAccount(user, portability),
    tripReservations: trips.map(portability ? tripForPortability : tripForAccess),
    serviceReservations: services.map(portability ? serviceForPortability : serviceForAccess),
    protectedTravellerData,
    ...(portability ? {} : {
      paymentMovements: payments.map(safePayment),
      privacyRequests: cases.map(safePrivacyRequest),
      bookingStatusHistory: bookingAudit.map(safeBookingAudit)
    })
  };
}
