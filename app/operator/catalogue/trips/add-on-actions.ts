"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { TripAddOn } from "@/domain/travel/types";
import { getMongoTripForAdmin, saveMongoTrip } from "@/lib/mongo-travel-admin";
import { requireStaffCapability } from "@/lib/require-staff-capability";
import { validateTripAddOns } from "@/lib/trip-package-addons";

function text(formData: FormData, name: string) {
  const item = formData.get(name) ?? (name.includes(":") ? formData.get(name.replaceAll(":", "__")) : null);
  return typeof item === "string" ? item.trim() : "";
}

function texts(formData: FormData, name: string) {
  return formData.getAll(name).map((item) => typeof item === "string" ? item.trim() : "");
}

function normalizeCode(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80);
}

export async function saveTripAddOnsAction(formData: FormData) {
  await requireStaffCapability("catalogue");
  const tripId = text(formData, "tripId");
  const returnTo = tripId ? `/operator/catalogue/trips/${encodeURIComponent(tripId)}` : "/operator/catalogue";
  if (!tripId) redirect("/operator/catalogue");

  const trip = await getMongoTripForAdmin(tripId);
  if (!trip) redirect("/operator/catalogue");

  const ids = texts(formData, "tripAddOnId").filter(Boolean);
  if (ids.length > 20 || new Set(ids).size !== ids.length) {
    redirect(`${returnTo}?addOnError=validation#package-addons`);
  }

  const addOns: TripAddOn[] = ids.map((id) => ({
    id,
    code: normalizeCode(text(formData, `tripAddOnCode:${id}`)),
    title: text(formData, `tripAddOnTitle:${id}`),
    titleEs: text(formData, `tripAddOnTitleEs:${id}`),
    description: text(formData, `tripAddOnDescription:${id}`) || undefined,
    descriptionEs: text(formData, `tripAddOnDescriptionEs:${id}`) || undefined,
    price: Number(text(formData, `tripAddOnPrice:${id}`)),
    pricingMode: text(formData, `tripAddOnPricingMode:${id}`) === "per-traveller" ? "per-traveller" : "per-booking",
    enabled: text(formData, `tripAddOnEnabled:${id}`) === "on"
  }));

  if (!validateTripAddOns(addOns)) {
    redirect(`${returnTo}?addOnError=validation#package-addons`);
  }

  try {
    await saveMongoTrip({ ...trip, addOns });
  } catch (error) {
    console.error("Failed to save trip package supplements", { tripId, error });
    redirect(`${returnTo}?addOnError=save#package-addons`);
  }

  revalidatePath(`/trips/${trip.slug}`);
  revalidatePath(`/trips/${trip.slug}/book`);
  revalidatePath(returnTo);
  redirect(`${returnTo}?addOnsUpdated=1#package-addons`);
}
