import { randomUUID } from "node:crypto";
import type { Db } from "mongodb";
import type { ReservationTraveller } from "@/domain/booking/types";
import type { PaymentTargetType } from "@/domain/payment/types";
import type {
  MinorTravelAuthorizationStatus,
  TravellerDocumentType,
  TravellerPostPurchaseData,
  TravellerRequirementField,
  TravellerRequirementsProfile,
  TravellerSex
} from "@/domain/traveller/types";
import {
  currentEncryptionKeyId,
  decryptVersionedValue,
  encryptVersionedValue,
  isEncryptionKeyringConfigured,
  type VersionedEncryptedValue
} from "@/lib/encryption-keyring";
import { getMongoClient, getMongoDatabase, getMongoDatabaseName } from "@/lib/mongodb";
import { travellerFieldsForReservationTraveller } from "@/lib/traveller-requirements";

export const travellerDataCollectionName = "travel_traveller_details";
export const travellerDataAuditCollectionName = "travel_traveller_data_audit";

type EncryptedTravellerPayload = VersionedEncryptedValue;

type StoredTravellerDataRecord = {
  id: string;
  targetType: PaymentTargetType;
  reservationId: string;
  identityId: string;
  travellerId: string;
  payload: EncryptedTravellerPayload;
  completedFields: TravellerRequirementField[];
  createdAt: Date;
  updatedAt: Date;
  retentionUntil: Date;
};

type TravellerDataAuditEvent = {
  id: string;
  targetType: PaymentTargetType;
  reservationId: string;
  travellerId: string;
  actorIdentityId: string;
  actorType: "customer" | "staff";
  action: "created" | "updated";
  changedFields: TravellerRequirementField[];
  occurredAt: Date;
};

export type TravellerDataCompletion = {
  travellerId: string;
  requiredFields: TravellerRequirementField[];
  completedFields: TravellerRequirementField[];
  missingFields: TravellerRequirementField[];
  complete: boolean;
};

export type TravellerDataEncryptionMigrationResult = {
  currentKeyId: string;
  scanned: number;
  migrated: number;
  remaining: number;
};

const travellerDataKeyring = {
  keyVariable: "TRAVELLER_DATA_KEY",
  keyIdVariable: "TRAVELLER_DATA_KEY_ID",
  previousKeysVariable: "TRAVELLER_DATA_PREVIOUS_KEYS"
} as const;

export function isTravellerDataEncryptionConfigured() {
  return isEncryptionKeyringConfigured(travellerDataKeyring);
}

function encryptPayload(data: TravellerPostPurchaseData): EncryptedTravellerPayload {
  return encryptVersionedValue(JSON.stringify(data), travellerDataKeyring);
}

function decryptPayload(payload: EncryptedTravellerPayload): TravellerPostPurchaseData {
  return JSON.parse(decryptVersionedValue(payload, travellerDataKeyring)) as TravellerPostPurchaseData;
}

async function ensureIndexes(database: Db) {
  const data = database.collection<StoredTravellerDataRecord>(travellerDataCollectionName);
  const audit = database.collection<TravellerDataAuditEvent>(travellerDataAuditCollectionName);
  await Promise.all([
    data.createIndex(
      { targetType: 1, reservationId: 1, travellerId: 1 },
      { unique: true, name: "traveller_data_reservation_traveller_unique" }
    ),
    data.createIndex(
      { identityId: 1, targetType: 1, reservationId: 1 },
      { name: "traveller_data_customer_reservation" }
    ),
    data.createIndex(
      { retentionUntil: 1 },
      { expireAfterSeconds: 0, name: "traveller_data_retention_ttl" }
    ),
    data.createIndex(
      { retentionUntil: 1, "payload.version": 1, "payload.keyId": 1 },
      { name: "traveller_data_encryption_rotation" }
    ),
    audit.createIndex({ reservationId: 1, occurredAt: -1 }, { name: "traveller_data_audit_reservation" }),
    audit.createIndex({ occurredAt: -1 }, { name: "traveller_data_audit_occurred" })
  ]);
}

function retentionUntil(endDate: string | undefined, retentionDays: number) {
  const base = endDate && /^\d{4}-\d{2}-\d{2}$/.test(endDate)
    ? Date.parse(`${endDate}T23:59:59.999Z`)
    : Date.now();
  return new Date(base + Math.max(0, retentionDays) * 86400000);
}

function travellerPayloadNeedsRotation(currentKeyId: string) {
  return {
    retentionUntil: { $gt: new Date() },
    $or: [
      { "payload.version": { $ne: 2 } },
      { "payload.keyId": { $ne: currentKeyId } }
    ]
  };
}

export async function reencryptTravellerDataBatch(input?: {
  limit?: number;
}): Promise<TravellerDataEncryptionMigrationResult> {
  const currentKeyId = currentEncryptionKeyId(travellerDataKeyring);
  if (!currentKeyId) {
    throw Object.assign(
      new Error("TRAVELLER_DATA_KEY_ID is required before traveller-data re-encryption can run."),
      { code: "TRAVELLER_DATA_KEY_ID_REQUIRED" }
    );
  }

  const limit = Math.max(1, Math.min(100, Math.floor(input?.limit ?? 25)));
  const client = await getMongoClient();
  const database = client.db(getMongoDatabaseName());
  await ensureIndexes(database);
  const collection = database.collection<StoredTravellerDataRecord>(travellerDataCollectionName);
  const session = client.startSession();
  let scanned = 0;
  let migrated = 0;

  try {
    await session.withTransaction(async () => {
      scanned = 0;
      migrated = 0;
      const records = await collection
        .find(travellerPayloadNeedsRotation(currentKeyId), { session })
        .sort({ id: 1 })
        .limit(limit)
        .toArray();
      scanned = records.length;

      for (const record of records) {
        const plaintext = decryptPayload(record.payload);
        const nextPayload = encryptPayload(plaintext);
        if (nextPayload.version !== 2 || nextPayload.keyId !== currentKeyId) {
          throw new Error("Traveller data re-encryption did not produce ciphertext for the current key ID.");
        }

        const result = await collection.updateOne(
          { id: record.id, payload: record.payload },
          { $set: { payload: nextPayload } },
          { session }
        );
        if (result.modifiedCount !== 1) {
          throw Object.assign(
            new Error("Traveller data changed while the encryption migration was running; retry the batch."),
            { code: "TRAVELLER_DATA_REENCRYPTION_CONFLICT" }
          );
        }
        migrated += 1;
      }
    });
  } finally {
    await session.endSession();
  }

  const remaining = await collection.countDocuments(travellerPayloadNeedsRotation(currentKeyId));
  return { currentKeyId, scanned, migrated, remaining };
}

const documentTypes = new Set<TravellerDocumentType>(["passport", "dni", "tie", "national-id", "other"]);
const sexes = new Set<TravellerSex>(["female", "male", "x", "not-stated"]);
const minorAuthorizationStates = new Set<MinorTravelAuthorizationStatus>(["not-required", "pending", "confirmed"]);

function cleanText(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function validIsoDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
}

function validEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;
}

function validPhone(value: string) {
  return /^[+()0-9 .-]{5,40}$/.test(value);
}

export function normalizeTravellerPostPurchaseData(
  raw: Record<string, unknown>,
  allowedFields: TravellerRequirementField[],
  startDate?: string
): TravellerPostPurchaseData | null {
  const allowed = new Set(allowedFields);
  const data: TravellerPostPurchaseData = {};

  const assign = <K extends keyof TravellerPostPurchaseData>(field: K, value: TravellerPostPurchaseData[K]) => {
    if (allowed.has(field as TravellerRequirementField) && value !== undefined && value !== "") data[field] = value;
  };

  const secondSurname = cleanText(raw.secondSurname, 100);
  assign("secondSurname", secondSurname || undefined);

  const sex = cleanText(raw.sex, 20) as TravellerSex;
  if (sex && !sexes.has(sex)) return null;
  assign("sex", sex || undefined);

  const documentType = cleanText(raw.documentType, 30) as TravellerDocumentType;
  if (documentType && !documentTypes.has(documentType)) return null;
  assign("documentType", documentType || undefined);

  assign("documentNumber", cleanText(raw.documentNumber, 64) || undefined);
  assign("documentSupportNumber", cleanText(raw.documentSupportNumber, 64) || undefined);
  assign("documentIssuingCountry", cleanText(raw.documentIssuingCountry, 80) || undefined);

  const documentExpiryDate = cleanText(raw.documentExpiryDate, 10);
  if (documentExpiryDate && (!validIsoDate(documentExpiryDate) || (startDate && documentExpiryDate < startDate))) return null;
  assign("documentExpiryDate", documentExpiryDate || undefined);

  assign("residenceAddress", cleanText(raw.residenceAddress, 240) || undefined);
  assign("residenceCity", cleanText(raw.residenceCity, 120) || undefined);
  assign("residenceCountry", cleanText(raw.residenceCountry, 80) || undefined);

  const phone = cleanText(raw.phone, 40);
  if (phone && !validPhone(phone)) return null;
  assign("phone", phone || undefined);

  const email = cleanText(raw.email, 254).toLowerCase();
  if (email && !validEmail(email)) return null;
  assign("email", email || undefined);

  assign("emergencyContactName", cleanText(raw.emergencyContactName, 120) || undefined);
  const emergencyContactPhone = cleanText(raw.emergencyContactPhone, 40);
  if (emergencyContactPhone && !validPhone(emergencyContactPhone)) return null;
  assign("emergencyContactPhone", emergencyContactPhone || undefined);

  const minorTravelAuthorization = cleanText(raw.minorTravelAuthorization, 20) as MinorTravelAuthorizationStatus;
  if (minorTravelAuthorization && !minorAuthorizationStates.has(minorTravelAuthorization)) return null;
  assign("minorTravelAuthorization", minorTravelAuthorization || undefined);

  return data;
}

function fieldComplete(field: TravellerRequirementField, data: TravellerPostPurchaseData) {
  const value = data[field as keyof TravellerPostPurchaseData];
  if (field === "minorTravelAuthorization") return value === "confirmed" || value === "not-required";
  return typeof value === "string" && value.trim().length > 0;
}

export function buildTravellerDataCompletion(
  profile: TravellerRequirementsProfile | undefined,
  traveller: ReservationTraveller,
  data: TravellerPostPurchaseData | undefined
): TravellerDataCompletion {
  const requiredFields = travellerFieldsForReservationTraveller(profile, traveller);
  const completedFields = requiredFields.filter((field) => data ? fieldComplete(field, data) : false);
  const missingFields = requiredFields.filter((field) => !completedFields.includes(field));
  return {
    travellerId: traveller.id,
    requiredFields,
    completedFields,
    missingFields,
    complete: missingFields.length === 0
  };
}

export async function listTravellerDataForCustomer(input: {
  identityId: string;
  targetType: PaymentTargetType;
  reservationId: string;
}) {
  if (!isTravellerDataEncryptionConfigured()) return new Map<string, TravellerPostPurchaseData>();
  const database = await getMongoDatabase();
  await ensureIndexes(database);
  const records = await database.collection<StoredTravellerDataRecord>(travellerDataCollectionName)
    .find({
      identityId: input.identityId,
      targetType: input.targetType,
      reservationId: input.reservationId,
      retentionUntil: { $gt: new Date() }
    })
    .toArray();

  const result = new Map<string, TravellerPostPurchaseData>();
  for (const record of records) result.set(record.travellerId, decryptPayload(record.payload));
  return result;
}

export async function listTravellerCompletionForOperator(input: {
  targetType: PaymentTargetType;
  reservationId: string;
  profile?: TravellerRequirementsProfile;
  travellers: ReservationTraveller[];
}) {
  const database = await getMongoDatabase();
  await ensureIndexes(database);
  const records = await database.collection<StoredTravellerDataRecord>(travellerDataCollectionName)
    .find({ targetType: input.targetType, reservationId: input.reservationId, retentionUntil: { $gt: new Date() } })
    .project<{ travellerId: string; completedFields: TravellerRequirementField[] }>({ travellerId: 1, completedFields: 1 })
    .toArray();
  const byTraveller = new Map(records.map((record) => [record.travellerId, record.completedFields]));

  return input.travellers.map((traveller) => {
    const requiredFields = travellerFieldsForReservationTraveller(input.profile, traveller);
    const completedFields = byTraveller.get(traveller.id) ?? [];
    const missingFields = requiredFields.filter((field) => !completedFields.includes(field));
    return {
      travellerId: traveller.id,
      requiredFields,
      completedFields: requiredFields.filter((field) => completedFields.includes(field)),
      missingFields,
      complete: missingFields.length === 0
    } satisfies TravellerDataCompletion;
  });
}

export async function saveTravellerDataForCustomer(input: {
  identityId: string;
  targetType: PaymentTargetType;
  reservationId: string;
  traveller: ReservationTraveller;
  profile: TravellerRequirementsProfile;
  data: TravellerPostPurchaseData;
  endDate?: string;
}) {
  const requiredFields = travellerFieldsForReservationTraveller(input.profile, input.traveller);
  const normalized = normalizeTravellerPostPurchaseData(
    input.data as Record<string, unknown>,
    requiredFields
  );
  if (!normalized) throw Object.assign(new Error("Invalid traveller data."), { code: "TRAVELLER_DATA_INVALID" });

  const completion = buildTravellerDataCompletion(input.profile, input.traveller, normalized);
  const now = new Date();
  const database = await getMongoDatabase();
  await ensureIndexes(database);
  const collection = database.collection<StoredTravellerDataRecord>(travellerDataCollectionName);
  const current = await collection.findOne({
    identityId: input.identityId,
    targetType: input.targetType,
    reservationId: input.reservationId,
    travellerId: input.traveller.id
  });
  const record = {
    payload: encryptPayload(normalized),
    completedFields: completion.completedFields,
    updatedAt: now,
    retentionUntil: retentionUntil(input.endDate, input.profile.retentionDaysAfterEnd)
  };

  if (current) {
    await collection.updateOne({ id: current.id, identityId: input.identityId }, { $set: record });
  } else {
    await collection.insertOne({
      id: `td-${randomUUID()}`,
      identityId: input.identityId,
      targetType: input.targetType,
      reservationId: input.reservationId,
      travellerId: input.traveller.id,
      ...record,
      createdAt: now
    });
  }

  const changedFields = requiredFields.filter((field) => {
    const next = normalized[field as keyof TravellerPostPurchaseData];
    if (!current) return next !== undefined;
    const previous = decryptPayload(current.payload)[field as keyof TravellerPostPurchaseData];
    return previous !== next;
  });
  await database.collection<TravellerDataAuditEvent>(travellerDataAuditCollectionName).insertOne({
    id: `tda-${randomUUID()}`,
    targetType: input.targetType,
    reservationId: input.reservationId,
    travellerId: input.traveller.id,
    actorIdentityId: input.identityId,
    actorType: "customer",
    action: current ? "updated" : "created",
    changedFields,
    occurredAt: now
  });

  return completion;
}
