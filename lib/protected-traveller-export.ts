import { createDecipheriv } from "node:crypto";
import type { ReservationTraveller } from "@/domain/booking/types";
import type { PaymentTargetType } from "@/domain/payment/types";
import type { TravellerPostPurchaseData } from "@/domain/traveller/types";
import type { TravelLocale } from "@/domain/travel/types";
import { getMongoDatabase } from "@/lib/mongodb";
import type { TabularExport } from "@/lib/tabular-export";
import { travellerDataCollectionName } from "@/lib/traveller-data";

type EncryptedTravellerPayload = {
  version: 1;
  iv: string;
  tag: string;
  value: string;
};

type StoredTravellerExportRecord = {
  targetType: PaymentTargetType;
  reservationId: string;
  travellerId: string;
  payload: EncryptedTravellerPayload;
  retentionUntil: Date;
};

export type ProtectedTravellerExportRow = ReservationTraveller & TravellerPostPurchaseData;

function encryptionKey() {
  const raw = process.env.TRAVELLER_DATA_KEY?.trim();
  if (!raw) throw Object.assign(new Error("Traveller data encryption is not configured."), { code: "TRAVELLER_DATA_KEY_MISSING" });
  if (/^[a-f0-9]{64}$/i.test(raw)) return Buffer.from(raw, "hex");
  const value = Buffer.from(raw, "base64");
  if (value.length !== 32) throw Object.assign(new Error("Traveller data encryption key is invalid."), { code: "TRAVELLER_DATA_KEY_INVALID" });
  return value;
}

function decryptPayload(payload: EncryptedTravellerPayload): TravellerPostPurchaseData {
  if (payload.version !== 1) throw Object.assign(new Error("Unsupported traveller data payload version."), { code: "TRAVELLER_DATA_VERSION_UNSUPPORTED" });
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(payload.iv, "base64"));
  decipher.setAuthTag(Buffer.from(payload.tag, "base64"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(payload.value, "base64")),
    decipher.final()
  ]);
  return JSON.parse(decrypted.toString("utf8")) as TravellerPostPurchaseData;
}

export async function readProtectedTravellerExportRows(input: {
  targetType: PaymentTargetType;
  reservationId: string;
  travellers: ReservationTraveller[];
}) {
  // Resolve the key before touching records so a sensitive export cannot
  // partially succeed when encryption configuration is unavailable.
  encryptionKey();
  const database = await getMongoDatabase();
  const records = await database.collection<StoredTravellerExportRecord>(travellerDataCollectionName)
    .find({
      targetType: input.targetType,
      reservationId: input.reservationId,
      retentionUntil: { $gt: new Date() }
    })
    .project<StoredTravellerExportRecord>({
      _id: 0,
      targetType: 1,
      reservationId: 1,
      travellerId: 1,
      payload: 1,
      retentionUntil: 1
    })
    .toArray();
  const byTraveller = new Map(records.map((record) => [record.travellerId, decryptPayload(record.payload)]));
  return input.travellers.map((traveller) => ({
    ...traveller,
    ...(byTraveller.get(traveller.id) ?? {})
  } satisfies ProtectedTravellerExportRow));
}

function t(locale: TravelLocale, en: string, es: string) {
  return locale === "es" ? es : en;
}

export function protectedTravellerTabularExport(
  rows: ProtectedTravellerExportRow[],
  locale: TravelLocale
): TabularExport<ProtectedTravellerExportRow> {
  return {
    sheetName: t(locale, "Protected travellers", "Viajeros protegidos"),
    rows,
    columns: [
      { key: "travellerId", label: t(locale, "Traveller ID", "ID viajero"), width: 28, value: (row) => row.id },
      { key: "firstName", label: t(locale, "First name", "Nombre"), width: 20, value: (row) => row.firstName },
      { key: "lastName", label: t(locale, "Last name", "Apellidos"), width: 24, value: (row) => row.lastName },
      { key: "secondSurname", label: t(locale, "Second surname", "Segundo apellido"), width: 20, value: (row) => row.secondSurname },
      { key: "dateOfBirth", label: t(locale, "Date of birth", "Fecha nacimiento"), width: 16, value: (row) => row.dateOfBirth },
      { key: "nationality", label: t(locale, "Nationality", "Nacionalidad"), width: 14, value: (row) => row.nationality },
      { key: "sex", label: t(locale, "Sex", "Sexo"), width: 14, value: (row) => row.sex },
      { key: "documentType", label: t(locale, "Document type", "Tipo documento"), width: 18, value: (row) => row.documentType },
      { key: "documentNumber", label: t(locale, "Document number", "Número documento"), width: 22, value: (row) => row.documentNumber },
      { key: "documentSupportNumber", label: t(locale, "Support number", "Número soporte"), width: 20, value: (row) => row.documentSupportNumber },
      { key: "documentIssuingCountry", label: t(locale, "Issuing country", "País expedición"), width: 18, value: (row) => row.documentIssuingCountry },
      { key: "documentExpiryDate", label: t(locale, "Document expiry", "Caducidad documento"), width: 18, value: (row) => row.documentExpiryDate },
      { key: "residenceAddress", label: t(locale, "Residence address", "Domicilio"), width: 38, value: (row) => row.residenceAddress },
      { key: "residenceCity", label: t(locale, "Residence city", "Municipio residencia"), width: 22, value: (row) => row.residenceCity },
      { key: "residenceCountry", label: t(locale, "Residence country", "País residencia"), width: 18, value: (row) => row.residenceCountry },
      { key: "phone", label: t(locale, "Phone", "Teléfono"), width: 20, value: (row) => row.phone },
      { key: "email", label: "Email", width: 34, value: (row) => row.email },
      { key: "emergencyContactName", label: t(locale, "Emergency contact", "Contacto emergencia"), width: 28, value: (row) => row.emergencyContactName },
      { key: "emergencyContactPhone", label: t(locale, "Emergency phone", "Teléfono emergencia"), width: 22, value: (row) => row.emergencyContactPhone },
      { key: "minorTravelAuthorization", label: t(locale, "Minor authorization", "Autorización menor"), width: 20, value: (row) => row.minorTravelAuthorization }
    ]
  };
}
