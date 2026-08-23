import { createCipheriv, createDecipheriv, randomBytes, randomUUID } from "node:crypto";
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
import { getMongoDatabase } from "@/lib/mongodb";
import { travellerFieldsForReservationTraveller } from "@/lib/traveller-requirements";

export const travellerDataCollectionName = "travel_traveller_details";
export const travellerDataAuditCollectionName = "travel_traveller_data_audit";

type EncryptedTravellerPayload = {
  version: 1;
  iv: string;
  tag: string;
  value: string;
};

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

function parseEncryptionKey() {
  const raw = process.env.TRAVELLER_DATA_KEY?.trim();
  if (!raw) return null;
  if (/^[a-f0-9]{64}$/i.test(raw)) return Buffer.from(raw, "hex");
  try {
    const value = Buffer.from(raw, "base64");
    return value.length === 32 ? value : null;
  } catch {
    return null;
  }
}

export function isTravellerDataEncryptionConfigured() {
  return Boolean(parseEncryptionKey());
}

function encryptionKey() {
  const key = parseEncryptionKey();
  if (!key) {
    throw new Error("TRAVELLER_DATA_KEY must be a 32-byte base64 value or a 64-character hexadecimal value.");
  }
  return key;
}

function encryptPayload(data: TravellerPostPurchaseData): EncryptedTravellerPayload {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(data), "utf8"),
    cipher.final()
  ]);
  return {
    version: 1,
    iv: iv.toString("base64"),
    tag: cipher.getAuthTag().toString("base64"),
    value: encrypted.toString("base64")
  };
}

function decryptPayload(payload: EncryptedTravellerPayload): TravellerPostPurchaseData {
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(payload.iv, "base64"));
  decipher.setAuthTag(Buffer.from(payload.tag, "base64"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(payload.value, "base64")),
    decipher.final()
  ]);
  return JSON.parse(decrypted.toString("utf8")) as TravellerPostPurchaseData;
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
