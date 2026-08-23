"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type {
  TravelService,
  TravelServicePricingMode,
  TravelServiceType
} from "@/domain/services/types";
import type {
  CurrencyCode,
  TravellerPricingBand,
  TravelMedia,
  TravelMediaFocalPoint,
  TravelPublicationStatus
} from "@/domain/travel/types";
import { requireOperationsIdentity } from "@/lib/require-operations-identity";
import {
  getTravelServiceForAdmin,
  saveTravelService,
  serviceBasePath
} from "@/lib/travel-services";
import { validateTravellerPricingBands } from "@/lib/traveller-pricing";
import { parseTravellerRequirementsForm } from "@/lib/traveller-requirements-form";

function text(formData: FormData, name: string) {
  const value = formData.get(name) ?? (name.includes(":") ? formData.get(name.replaceAll(":", "__")) : null);
  return typeof value === "string" ? value.trim() : "";
}

function texts(formData: FormData, name: string) {
  return formData.getAll(name).map((value) => typeof value === "string" ? value.trim() : "");
}

function lines(formData: FormData, name: string) {
  return text(formData, name).split("\n").map((value) => value.trim()).filter(Boolean);
}

function normalizeSlug(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeCode(value: string) {
  return normalizeSlug(value).replace(/-/g, "_");
}

const focalPoints = new Set<TravelMediaFocalPoint>(["center", "top", "bottom", "left", "right"]);
const serviceTypes = new Set<TravelServiceType>(["activity", "transport", "insurance"]);
const pricingModes = new Set<TravelServicePricingMode>(["per-person", "per-booking", "per-unit", "per-age-band"]);

function mediaFromFields(src: string, alt: string, caption: string, credit: string, focalPoint: string): TravelMedia | null | undefined {
  if (!src) return undefined;
  if (!src.startsWith("/")) {
    try {
      const url = new URL(src);
      if (url.protocol !== "https:") return null;
    } catch {
      return null;
    }
  }
  return {
    src,
    alt: alt || undefined,
    caption: caption || undefined,
    credit: credit || undefined,
    focalPoint: focalPoints.has(focalPoint as TravelMediaFocalPoint) ? (focalPoint as TravelMediaFocalPoint) : "center"
  };
}

function parseCoverImage(formData: FormData) {
  return mediaFromFields(
    text(formData, "coverSrc"),
    text(formData, "coverAlt"),
    text(formData, "coverCaption"),
    text(formData, "coverCredit"),
    text(formData, "coverFocalPoint")
  );
}

function parseGallery(formData: FormData): TravelMedia[] | null {
  const sources = texts(formData, "gallerySrc");
  const alts = texts(formData, "galleryAlt");
  const captions = texts(formData, "galleryCaption");
  const credits = texts(formData, "galleryCredit");
  const focalPointsInput = texts(formData, "galleryFocalPoint");
  const length = Math.max(sources.length, alts.length, captions.length, credits.length, focalPointsInput.length);
  const gallery: TravelMedia[] = [];
  for (let index = 0; index < length; index += 1) {
    const media = mediaFromFields(
      sources[index] ?? "",
      alts[index] ?? "",
      captions[index] ?? "",
      credits[index] ?? "",
      focalPointsInput[index] ?? "center"
    );
    if (media === null) return null;
    if (media) gallery.push(media);
  }
  return gallery;
}

function parseTravellerPricing(formData: FormData): TravellerPricingBand[] | null {
  const ids = texts(formData, "pricingBandId").filter(Boolean);
  const bands = ids.map((id) => {
    const rawMaxAge = text(formData, `pricingMaxAge:${id}`);
    return {
      id,
      code: normalizeCode(text(formData, `pricingCode:${id}`)),
      label: text(formData, `pricingLabel:${id}`),
      labelEs: text(formData, `pricingLabelEs:${id}`) || undefined,
      minAge: Number(text(formData, `pricingMinAge:${id}`)),
      maxAge: rawMaxAge === "" ? undefined : Number(rawMaxAge),
      price: Number(text(formData, `pricingPrice:${id}`)),
      consumesInventory: text(formData, `pricingConsumesInventory:${id}`) === "1"
    } satisfies TravellerPricingBand;
  });
  bands.sort((a, b) => a.minAge - b.minAge);
  return validateTravellerPricingBands(bands) ? bands : null;
}

function publicationStatus(formData: FormData): TravelPublicationStatus {
  return text(formData, "publicationStatus") === "published" ? "published" : "draft";
}

export async function saveTravelServiceAction(formData: FormData) {
  await requireOperationsIdentity();

  const requestedId = text(formData, "id");
  const id = requestedId || randomUUID();
  const rawType = text(formData, "serviceType") as TravelServiceType;
  const serviceType = serviceTypes.has(rawType) ? rawType : null;
  const title = text(formData, "title");
  const slug = normalizeSlug(text(formData, "slug") || title);
  const summary = text(formData, "summary");
  const fromPrice = Number(text(formData, "fromPrice"));
  const rawCurrency = text(formData, "currency");
  const currency: CurrencyCode = rawCurrency === "USD" || rawCurrency === "GBP" ? rawCurrency : "EUR";
  const rawPricingMode = text(formData, "pricingMode") as TravelServicePricingMode;
  const pricingMode = pricingModes.has(rawPricingMode) ? rawPricingMode : "per-person";
  const coverImage = parseCoverImage(formData);
  const gallery = parseGallery(formData);
  const travellerPricing = pricingMode === "per-age-band" ? parseTravellerPricing(formData) : undefined;
  const travellerRequirements = parseTravellerRequirementsForm(formData);
  const returnTo = requestedId ? `/operator/catalogue/services/${id}` : `/operator/catalogue/services/new?type=${rawType || "activity"}`;

  if (!serviceType || !title || !slug || !summary || !Number.isFinite(fromPrice) || fromPrice < 0 || coverImage === null || gallery === null || travellerPricing === null || travellerRequirements === null) {
    redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}error=validation`);
  }

  const existing = requestedId ? await getTravelServiceForAdmin(id) : null;
  if (existing && existing.serviceType !== serviceType) {
    redirect(`${returnTo}?error=validation`);
  }

  const common = {
    ...(existing ?? {}),
    id,
    slug,
    title,
    summary,
    serviceType,
    fromPrice,
    currency,
    pricingMode,
    travellerPricing,
    travellerRequirements: travellerRequirements.preset === "none" ? undefined : travellerRequirements,
    highlights: lines(formData, "highlights"),
    included: lines(formData, "included"),
    notIncluded: lines(formData, "notIncluded"),
    featured: formData.get("featured") === "on",
    publicationStatus: publicationStatus(formData),
    coverImage,
    gallery,
    translations: {
      ...(existing?.translations ?? {}),
      es: {
        ...(existing?.translations?.es ?? {}),
        title: text(formData, "titleEs") || undefined,
        summary: text(formData, "summaryEs") || undefined,
        highlights: lines(formData, "highlightsEs"),
        included: lines(formData, "includedEs"),
        notIncluded: lines(formData, "notIncludedEs"),
        location: text(formData, "locationEs") || undefined,
        durationLabel: text(formData, "durationLabelEs") || undefined,
        activityCategory: text(formData, "activityCategoryEs") || undefined,
        meetingPoint: text(formData, "meetingPointEs") || undefined,
        origin: text(formData, "originEs") || undefined,
        destination: text(formData, "destinationEs") || undefined,
        transportMode: text(formData, "transportModeEs") || undefined,
        coverageType: text(formData, "coverageTypeEs") || undefined
      }
    }
  };

  let service: TravelService;
  if (serviceType === "activity") {
    const location = text(formData, "location");
    const durationLabel = text(formData, "durationLabel");
    const activityCategory = text(formData, "activityCategory");
    if (!location || !durationLabel || !activityCategory) redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}error=validation`);
    service = { ...common, serviceType, location, durationLabel, activityCategory, meetingPoint: text(formData, "meetingPoint") || undefined } as TravelService;
  } else if (serviceType === "transport") {
    const transportMode = text(formData, "transportMode");
    const origin = text(formData, "origin");
    const destination = text(formData, "destination");
    const rawCapacity = text(formData, "capacity");
    const capacity = rawCapacity ? Number(rawCapacity) : undefined;
    if (!transportMode || !origin || !destination || (capacity !== undefined && (!Number.isInteger(capacity) || capacity < 1))) redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}error=validation`);
    service = { ...common, serviceType, transportMode, origin, destination, capacity } as TravelService;
  } else {
    const coverageType = text(formData, "coverageType");
    const rawMaxTripDays = text(formData, "maxTripDays");
    const maxTripDays = rawMaxTripDays ? Number(rawMaxTripDays) : undefined;
    if (!coverageType || (maxTripDays !== undefined && (!Number.isInteger(maxTripDays) || maxTripDays < 1))) redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}error=validation`);
    service = { ...common, serviceType, coverageType, maxTripDays } as TravelService;
  }

  try {
    await saveTravelService(service);
  } catch (error) {
    console.error("Failed to save travel service", { id, serviceType, error });
    redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}error=save`);
  }

  revalidatePath("/services");
  revalidatePath(serviceBasePath(serviceType));
  revalidatePath(`${serviceBasePath(serviceType)}/${slug}`);
  revalidatePath("/operator/catalogue");
  redirect("/operator/catalogue?updated=service");
}
