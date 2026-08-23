import type { WithId } from "mongodb";
import type {
  TravelService,
  TravelServiceType,
  TravelServiceTranslation
} from "@/domain/services/types";
import type { TravelLocale } from "@/domain/travel/types";
import { getMongoDatabase } from "@/lib/mongodb";

export const travelServiceCollectionNames: Record<TravelServiceType, string> = {
  activity: "travel_activities",
  transport: "travel_transport",
  insurance: "travel_insurance"
};

type StoredTravelService = TravelService & {
  createdAt?: Date;
  updatedAt?: Date;
};

function collectionName(type: TravelServiceType) {
  return travelServiceCollectionNames[type];
}

async function ensureServiceIndexes(type: TravelServiceType) {
  const database = await getMongoDatabase();
  const collection = database.collection<StoredTravelService>(collectionName(type));
  await Promise.all([
    collection.createIndex({ id: 1 }, { unique: true, name: `${type}_service_id_unique` }),
    collection.createIndex({ slug: 1 }, { unique: true, name: `${type}_service_slug_unique` }),
    collection.createIndex(
      { publicationStatus: 1, featured: -1, title: 1 },
      { name: `${type}_service_public_catalogue` }
    )
  ]);
}

function normalizeStoredService(service: TravelService): TravelService {
  if (!service.travellerPricing?.length) return service;

  return {
    ...service,
    travellerPricing: service.travellerPricing.map((band) => ({
      ...band,
      // Older BSON documents may contain null for optional fields. The domain
      // contract uses undefined, so normalize them before pricing/rendering.
      maxAge: band.maxAge == null ? undefined : band.maxAge,
      labelEs: band.labelEs ?? undefined
    }))
  } as TravelService;
}

function stripStoredMetadata(document: WithId<StoredTravelService>): TravelService {
  const { _id: _ignored, createdAt: _createdAt, updatedAt: _updatedAt, ...service } = document;
  return normalizeStoredService(service as TravelService);
}

export function serviceBasePath(type: TravelServiceType) {
  if (type === "activity") return "/activities";
  if (type === "transport") return "/transport";
  return "/insurance";
}

export function servicePublicPath(service: Pick<TravelService, "serviceType" | "slug">) {
  return `${serviceBasePath(service.serviceType)}/${service.slug}`;
}

export function serviceTypeLabel(type: TravelServiceType, locale: TravelLocale) {
  const labels: Record<TravelServiceType, [string, string]> = {
    activity: ["Activity", "Actividad"],
    transport: ["Transport", "Transporte"],
    insurance: ["Insurance", "Seguro"]
  };
  return locale === "es" ? labels[type][1] : labels[type][0];
}

export function serviceTypePluralLabel(type: TravelServiceType, locale: TravelLocale) {
  const labels: Record<TravelServiceType, [string, string]> = {
    activity: ["Activities", "Actividades"],
    transport: ["Transport", "Transporte"],
    insurance: ["Insurance", "Seguros"]
  };
  return locale === "es" ? labels[type][1] : labels[type][0];
}

export function localizeTravelService(service: TravelService, locale: TravelLocale): TravelService {
  const translation = service.translations?.[locale] as TravelServiceTranslation | undefined;
  return translation ? ({ ...service, ...translation } as TravelService) : service;
}

export async function listPublishedTravelServices(type: TravelServiceType): Promise<TravelService[]> {
  await ensureServiceIndexes(type);
  const database = await getMongoDatabase();
  const documents = await database
    .collection<StoredTravelService>(collectionName(type))
    .find({ publicationStatus: "published" })
    .sort({ featured: -1, title: 1 })
    .toArray();
  return documents.map(stripStoredMetadata);
}

export async function getPublishedTravelService(type: TravelServiceType, slug: string) {
  await ensureServiceIndexes(type);
  const database = await getMongoDatabase();
  const document = await database
    .collection<StoredTravelService>(collectionName(type))
    .findOne({ slug, publicationStatus: "published" });
  return document ? stripStoredMetadata(document) : null;
}

export async function listTravelServicesForAdmin(): Promise<TravelService[]> {
  const types: TravelServiceType[] = ["activity", "transport", "insurance"];
  const database = await getMongoDatabase();
  const groups = await Promise.all(types.map(async (type) => {
    await ensureServiceIndexes(type);
    const documents = await database
      .collection<StoredTravelService>(collectionName(type))
      .find({})
      .sort({ featured: -1, title: 1 })
      .toArray();
    return documents.map(stripStoredMetadata);
  }));
  return groups.flat();
}

export async function getTravelServiceForAdmin(id: string) {
  const types: TravelServiceType[] = ["activity", "transport", "insurance"];
  const database = await getMongoDatabase();
  for (const type of types) {
    await ensureServiceIndexes(type);
    const document = await database
      .collection<StoredTravelService>(collectionName(type))
      .findOne({ id });
    if (document) return stripStoredMetadata(document);
  }
  return null;
}

export async function saveTravelService(service: TravelService) {
  await ensureServiceIndexes(service.serviceType);
  const database = await getMongoDatabase();
  const now = new Date();
  await database.collection<StoredTravelService>(collectionName(service.serviceType)).updateOne(
    { id: service.id },
    {
      $set: { ...service, updatedAt: now },
      $setOnInsert: { createdAt: now }
    },
    { upsert: true }
  );
}