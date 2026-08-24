"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { TripAccommodationComponent, TripAccommodationMode } from "@/domain/travel/types";
import { isAccommodationOccupancyAllowed } from "@/lib/accommodation-pricing";
import { listAccommodationsForAdmin } from "@/lib/accommodations";
import { getMongoTripForAdmin, saveMongoTrip } from "@/lib/mongo-travel-admin";
import { requireOperationsIdentity } from "@/lib/require-operations-identity";

function text(formData: FormData, name: string) {
  const value = formData.get(name) ?? formData.get(name.replaceAll(":", "__"));
  return typeof value === "string" ? value.trim() : "";
}

function texts(formData: FormData, name: string) {
  return formData.getAll(name).map((value) => typeof value === "string" ? value.trim() : "");
}

function parseChildAges(value: string) {
  if (!value) return [];
  const ages = value.split(",").map((item) => Number(item.trim()));
  return ages.every((age) => Number.isInteger(age) && age >= 0 && age <= 17) ? ages : null;
}

export async function saveTripAccommodationsAction(formData: FormData) {
  await requireOperationsIdentity();

  const tripId = text(formData, "tripId");
  const trip = tripId ? await getMongoTripForAdmin(tripId) : null;
  if (!trip) redirect("/operator/catalogue?error=not-found");

  const accommodations = await listAccommodationsForAdmin();
  const accommodationById = new Map(accommodations.map((item) => [item.id, item]));
  const componentIds = texts(formData, "tripAccommodationId").filter(Boolean);
  if (new Set(componentIds).size !== componentIds.length) {
    redirect(`/operator/catalogue/trips/${encodeURIComponent(trip.id)}?accommodationError=validation`);
  }

  const components: TripAccommodationComponent[] = [];
  for (const id of componentIds) {
    const accommodationId = text(formData, `tripAccommodationProperty:${id}`);
    const roomTypeId = text(formData, `tripAccommodationRoom:${id}`);
    const checkInDay = Number(text(formData, `tripAccommodationCheckInDay:${id}`));
    const nights = Number(text(formData, `tripAccommodationNights:${id}`));
    const rawMode = text(formData, `tripAccommodationMode:${id}`);
    const mode: TripAccommodationMode = rawMode === "optional" ? "optional" : "included";
    const pricingAdults = Number(text(formData, `tripAccommodationPricingAdults:${id}`));
    const pricingChildAges = parseChildAges(text(formData, `tripAccommodationPricingChildAges:${id}`));
    const accommodation = accommodationById.get(accommodationId);
    const room = accommodation?.roomTypes.find((item) => item.id === roomTypeId);

    if (
      !accommodation ||
      !room ||
      !Number.isInteger(checkInDay) || checkInDay < 1 ||
      !Number.isInteger(nights) || nights < 1 ||
      checkInDay + nights > trip.durationDays ||
      !Number.isInteger(pricingAdults) || pricingAdults < 1 ||
      pricingChildAges === null ||
      !isAccommodationOccupancyAllowed(room, pricingAdults, pricingChildAges)
    ) {
      redirect(`/operator/catalogue/trips/${encodeURIComponent(trip.id)}?accommodationError=validation`);
    }

    components.push({
      id,
      accommodationId,
      roomTypeId,
      checkInDay,
      nights,
      mode,
      pricingAdults,
      pricingChildAges
    });
  }

  await saveMongoTrip({ ...trip, accommodations: components });
  revalidatePath(`/operator/catalogue/trips/${trip.id}`);
  revalidatePath(`/trips/${trip.slug}`);
  revalidatePath(`/trips/${trip.slug}/book`);
  redirect(`/operator/catalogue/trips/${encodeURIComponent(trip.id)}?accommodationsUpdated=1`);
}
