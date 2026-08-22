"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { CurrencyCode, TravelPublicationStatus } from "@/domain/travel/types";
import {
  getMongoDestinationForAdmin,
  getMongoTripForAdmin,
  saveMongoDestination,
  saveMongoTrip,
  seedDemoCatalogueToMongo
} from "@/lib/mongo-travel-admin";
import { requireOperationsIdentity } from "@/lib/require-operations-identity";

function text(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
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

  if (!name || !slug || !country || !region || !summary) {
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

  if (!title || !slug || !destinationId || !summary || !Number.isFinite(durationDays) || durationDays < 1 || !Number.isFinite(fromPrice) || fromPrice < 0) {
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
    highlights: lines(formData, "highlightsEs")
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
      highlights,
      included,
      notIncluded,
      featured: formData.get("featured") === "on",
      publicationStatus: publicationStatus(formData),
      translations: {
        ...(existing?.translations ?? {}),
        es
      }
    });
  } catch (error) {
    console.error("Failed to save MongoDB trip", { id, error });
    redirect(`${returnTo}?error=save`);
  }

  revalidateCatalogue();
  revalidatePath(`/trips/${slug}`);
  redirect("/operator/catalogue?updated=trip");
}
