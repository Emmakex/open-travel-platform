"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { TripDeparture, TripDepartureStatus } from "@/domain/booking/types";
import type {
  CurrencyCode,
  TravellerPricingBand,
  TravelMedia,
  TravelMediaFocalPoint,
  TravelPublicationStatus,
  TripDay
} from "@/domain/travel/types";
import { replaceMongoTripDepartures } from "@/lib/mongo-departures";
import {
  getMongoDestinationForAdmin,
  getMongoTripForAdmin,
  saveMongoDestination,
  saveMongoTrip,
  seedDemoCatalogueToMongo
} from "@/lib/mongo-travel-admin";
import { requireOperationsIdentity } from "@/lib/require-operations-identity";
import { validateTravellerPricingBands } from "@/lib/traveller-pricing";

function text(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function texts(formData: FormData, name: string) {
  return formData
    .getAll(name)
    .map((value) => (typeof value === "string" ? value.trim() : ""));
}

function lines(formData: FormData, name: string) {
  return text(formData, name)
    .split("\n")
    .map((value) => value.trim())
    .filter(Boolean);
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

function safeReturnTo(formData: FormData, fallback: string) {
  const value = text(formData, "_returnTo");
  return value.startsWith("/operator/catalogue") ? value : fallback;
}

function publicationStatus(formData: FormData): TravelPublicationStatus {
  return text(formData, "publicationStatus") === "published" ? "published" : "draft";
}

function revalidateCatalogue() {
  revalidatePath("/");
  revalidatePath("/destinations");
  revalidatePath("/trips");
  revalidatePath("/operator");
  revalidatePath("/operator/catalogue");
}

const focalPoints = new Set<TravelMediaFocalPoint>(["center", "top", "bottom", "left", "right"]);
const departureStatuses = new Set<TripDepartureStatus>(["open", "closed", "sold-out"]);
const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;

function parseMediaSrc(value: string) {
  if (!value) return "";
  if (value.startsWith("/")) return value;

  try {
    const url = new URL(value);
    return url.protocol === "https:" ? value : null;
  } catch {
    return null;
  }
}

function mediaFromFields(
  src: string,
  alt: string,
  caption: string,
  credit: string,
  focalPoint: string
): TravelMedia | null | undefined {
  const parsedSrc = parseMediaSrc(src);
  if (parsedSrc === null) return null;
  if (!parsedSrc) return undefined;

  return {
    src: parsedSrc,
    alt: alt || undefined,
    caption: caption || undefined,
    credit: credit || undefined,
    focalPoint: focalPoints.has(focalPoint as TravelMediaFocalPoint)
      ? (focalPoint as TravelMediaFocalPoint)
      : "center"
  };
}

function parseCoverImage(formData: FormData): TravelMedia | null | undefined {
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

function parseItinerary(formData: FormData, suffix = ""): TripDay[] | null {
  const dayValues = texts(formData, `itineraryDay${suffix}`);
  const titles = texts(formData, `itineraryTitle${suffix}`);
  const summaries = texts(formData, `itinerarySummary${suffix}`);
  const length = Math.max(dayValues.length, titles.length, summaries.length);
  const itinerary: TripDay[] = [];

  for (let index = 0; index < length; index += 1) {
    const rawDay = dayValues[index] ?? "";
    const title = titles[index] ?? "";
    const summary = summaries[index] ?? "";

    if (!rawDay && !title && !summary) continue;

    const day = Number(rawDay);
    if (!Number.isInteger(day) || day < 1 || !title || !summary) return null;

    itinerary.push({ day, title, summary });
  }

  itinerary.sort((a, b) => a.day - b.day);
  return itinerary;
}

function parseTravellerPricing(formData: FormData): TravellerPricingBand[] | null {
  const ids = texts(formData, "pricingBandId").filter(Boolean);
  const bands: TravellerPricingBand[] = ids.map((id) => {
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
    };
  });

  bands.sort((a, b) => a.minAge - b.minAge);
  return validateTravellerPricingBands(bands) ? bands : null;
}

function parseDepartures(
  formData: FormData,
  tripId: string,
  pricingBands: TravellerPricingBand[]
): TripDeparture[] | null {
  const ids = texts(formData, "departureId").filter(Boolean);
  const departures: TripDeparture[] = [];

  for (const rawId of ids) {
    const id = rawId || randomUUID();
    const departureDate = text(formData, `departureDate:${id}`);
    const returnDate = text(formData, `returnDate:${id}`);
    const rawCapacity = text(formData, `departureCapacity:${id}`);
    const rawReserved = text(formData, `departureReserved:${id}`) || "0";
    const rawStatus = text(formData, `departureStatus:${id}`) || "open";

    if (!departureDate && !returnDate && !rawCapacity) continue;

    const capacity = Number(rawCapacity);
    const reservedSpaces = Number(rawReserved);
    const status = departureStatuses.has(rawStatus as TripDepartureStatus)
      ? (rawStatus as TripDepartureStatus)
      : "open";
    const travellerPrices: Record<string, number> = {};

    for (const band of pricingBands) {
      const rawPrice = text(formData, `departureTravellerPrice:${id}:${band.id}`);
      if (rawPrice === "") continue;
      const price = Number(rawPrice);
      if (!Number.isFinite(price) || price < 0) return null;
      travellerPrices[band.id] = price;
    }

    if (
      !isoDatePattern.test(departureDate) ||
      !isoDatePattern.test(returnDate) ||
      returnDate < departureDate ||
      !Number.isInteger(capacity) ||
      capacity < 1 ||
      !Number.isInteger(reservedSpaces) ||
      reservedSpaces < 0 ||
      reservedSpaces > capacity
    ) {
      return null;
    }

    const adultBand = pricingBands.find((band) => band.code === "adult");
    departures.push({
      id,
      tripId,
      departureDate,
      returnDate,
      capacity,
      reservedSpaces,
      status: remainingStatus(status, capacity, reservedSpaces),
      unitPrice: adultBand ? travellerPrices[adultBand.id] : undefined,
      travellerPrices: Object.keys(travellerPrices).length ? travellerPrices : undefined
    });
  }

  departures.sort((a, b) => a.departureDate.localeCompare(b.departureDate));
  return departures;
}

function remainingStatus(status: TripDepartureStatus, capacity: number, reservedSpaces: number): TripDepartureStatus {
  if (reservedSpaces >= capacity && status === "open") return "sold-out";
  if (reservedSpaces < capacity && status === "sold-out") return "open";
  return status;
}

export async function seedMongoCatalogueAction() {
  await requireOperationsIdentity();

  let result: Awaited<ReturnType<typeof seedDemoCatalogueToMongo>>;

  try {
    result = await seedDemoCatalogueToMongo();
  } catch (error) {
    console.error("Failed to seed MongoDB travel catalogue", error);
    redirect("/operator/catalogue?error=mongodb-seed");
  }

  revalidateCatalogue();

  const params = new URLSearchParams({
    seeded: "1",
    destinations: String(result.destinationsInserted),
    trips: String(result.tripsInserted)
  });

  redirect(`/operator/catalogue?${params.toString()}`);
}

export async function saveDestinationAction(formData: FormData) {
  await requireOperationsIdentity();

  const requestedId = text(formData, "id");
  const id = requestedId || randomUUID();
  const name = text(formData, "name");
  const slug = normalizeSlug(text(formData, "slug") || name);
  const country = text(formData, "country");
  const region = text(formData, "region");
  const summary = text(formData, "summary");
  const returnTo = safeReturnTo(formData, requestedId ? `/operator/catalogue/destinations/${id}` : "/operator/catalogue/destinations/new");
  const coverImage = parseCoverImage(formData);
  const gallery = parseGallery(formData);

  if (!name || !slug || !country || !region || !summary || coverImage === null || gallery === null) {
    redirect(`${returnTo}?error=validation`);
  }

  const existing = requestedId ? await getMongoDestinationForAdmin(id) : null;
  const es = {
    ...(existing?.translations?.es ?? {}),
    name: text(formData, "nameEs") || undefined,
    country: text(formData, "countryEs") || undefined,
    region: text(formData, "regionEs") || undefined,
    summary: text(formData, "summaryEs") || undefined
  };

  try {
    await saveMongoDestination({
      ...(existing ?? {}),
      id,
      name,
      slug,
      country,
      region,
      summary,
      featured: formData.get("featured") === "on",
      publicationStatus: publicationStatus(formData),
      coverImage,
      gallery,
      translations: {
        ...(existing?.translations ?? {}),
        es
      }
    });
  } catch (error) {
    console.error("Failed to save MongoDB destination", { id, error });
    redirect(`${returnTo}?error=save`);
  }

  revalidateCatalogue();
  revalidatePath(`/destinations/${slug}`);
  redirect("/operator/catalogue?updated=destination");
}

export async function saveTripAction(formData: FormData) {
  await requireOperationsIdentity();

  const requestedId = text(formData, "id");
  const id = requestedId || randomUUID();
  const title = text(formData, "title");
  const slug = normalizeSlug(text(formData, "slug") || title);
  const destinationId = text(formData, "destinationId");
  const summary = text(formData, "summary");
  const durationDays = Number(text(formData, "durationDays"));
  const fromPrice = Number(text(formData, "fromPrice"));
  const rawCurrency = text(formData, "currency");
  const currency: CurrencyCode = rawCurrency === "USD" || rawCurrency === "GBP" ? rawCurrency : "EUR";
  const returnTo = safeReturnTo(formData, requestedId ? `/operator/catalogue/trips/${id}` : "/operator/catalogue/trips/new");
  const coverImage = parseCoverImage(formData);
  const gallery = parseGallery(formData);
  const itinerary = parseItinerary(formData);
  const itineraryEs = parseItinerary(formData, "Es");
  const travellerPricing = parseTravellerPricing(formData);
  const departures = travellerPricing ? parseDepartures(formData, id, travellerPricing) : null;

  if (
    !title ||
    !slug ||
    !destinationId ||
    !summary ||
    !Number.isFinite(durationDays) ||
    durationDays < 1 ||
    !Number.isFinite(fromPrice) ||
    fromPrice < 0 ||
    coverImage === null ||
    gallery === null ||
    itinerary === null ||
    itineraryEs === null ||
    travellerPricing === null ||
    departures === null
  ) {
    redirect(`${returnTo}?error=validation`);
  }

  const existing = requestedId ? await getMongoTripForAdmin(id) : null;
  const highlights = lines(formData, "highlights");
  const included = lines(formData, "included");
  const notIncluded = lines(formData, "notIncluded");
  const es = {
    ...(existing?.translations?.es ?? {}),
    title: text(formData, "titleEs") || undefined,
    summary: text(formData, "summaryEs") || undefined,
    highlights: lines(formData, "highlightsEs"),
    itinerary: itineraryEs,
    included: lines(formData, "includedEs"),
    notIncluded: lines(formData, "notIncludedEs")
  };

  try {
    await saveMongoTrip({
      ...(existing ?? {}),
      id,
      title,
      slug,
      destinationId,
      summary,
      durationDays: Math.round(durationDays),
      fromPrice,
      currency,
      travellerPricing,
      highlights,
      itinerary,
      included,
      notIncluded,
      coverImage,
      gallery,
      featured: formData.get("featured") === "on",
      publicationStatus: publicationStatus(formData),
      translations: {
        ...(existing?.translations ?? {}),
        es
      }
    });
    await replaceMongoTripDepartures(id, departures);
  } catch (error) {
    console.error("Failed to save MongoDB trip", { id, error });
    redirect(`${returnTo}?error=save`);
  }

  revalidateCatalogue();
  revalidatePath(`/trips/${slug}`);
  revalidatePath(`/trips/${slug}/book`);
  redirect("/operator/catalogue?updated=trip");
}
