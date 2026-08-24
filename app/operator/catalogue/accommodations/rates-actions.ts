"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type {
  AccommodationMealPlan,
  AccommodationRoomKind
} from "@/domain/accommodation/types";
import {
  getAccommodationForAdmin,
  listAccommodationInventory,
  saveAccommodationWithInventory
} from "@/lib/accommodations";
import { requireOperationsIdentity } from "@/lib/require-operations-identity";

const roomKinds = new Set<AccommodationRoomKind>([
  "single",
  "double",
  "twin",
  "triple",
  "family",
  "suite",
  "other"
]);

const mealPlans = new Set<AccommodationMealPlan>([
  "room-only",
  "breakfast",
  "half-board",
  "full-board",
  "all-inclusive"
]);

function text(formData: FormData, name: string) {
  const value = formData.get(name) ?? formData.get(name.replaceAll(":", "__"));
  return typeof value === "string" ? value.trim() : "";
}

export async function saveAccommodationRoomRatesAction(formData: FormData) {
  await requireOperationsIdentity();

  const accommodationId = text(formData, "accommodationId");
  if (!accommodationId) redirect("/operator/catalogue?error=validation");

  const accommodation = await getAccommodationForAdmin(accommodationId);
  if (!accommodation) redirect("/operator/catalogue?error=not-found");

  const roomTypes = accommodation.roomTypes.map((room) => {
    const rawKind = text(formData, `roomKind:${room.id}`) as AccommodationRoomKind;
    const rawMealPlan = text(formData, `roomMealPlan:${room.id}`) as AccommodationMealPlan;
    const rawRate = text(formData, `roomBaseNightlyRate:${room.id}`);
    const baseNightlyRate = rawRate === "" ? undefined : Number(rawRate);

    if (
      !roomKinds.has(rawKind) ||
      !mealPlans.has(rawMealPlan) ||
      (baseNightlyRate !== undefined && (!Number.isFinite(baseNightlyRate) || baseNightlyRate < 0))
    ) {
      redirect(`/operator/catalogue/accommodations/${encodeURIComponent(accommodationId)}?ratesError=validation`);
    }

    return {
      ...room,
      kind: rawKind,
      mealPlan: rawMealPlan,
      baseNightlyRate
    };
  });

  const inventory = await listAccommodationInventory(accommodationId);
  await saveAccommodationWithInventory({ ...accommodation, roomTypes }, inventory);

  revalidatePath("/accommodations");
  revalidatePath(`/accommodations/${accommodation.slug}`);
  revalidatePath(`/operator/catalogue/accommodations/${accommodationId}`);
  redirect(`/operator/catalogue/accommodations/${encodeURIComponent(accommodationId)}?ratesUpdated=1`);
}
