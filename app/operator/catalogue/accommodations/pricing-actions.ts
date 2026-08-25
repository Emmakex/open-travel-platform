"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type {
  AccommodationAdjustmentDirection,
  AccommodationAdjustmentMode,
  AccommodationOccupancyPricingKind,
  AccommodationOccupancyPricingRule,
  AccommodationSeasonalPricingRule
} from "@/domain/accommodation/types";
import {
  getAccommodationForAdmin,
  listAccommodationInventory,
  saveAccommodationWithInventory
} from "@/lib/accommodations";
import { requireStaffCapability } from "@/lib/require-staff-capability";

const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;
const directions = new Set<AccommodationAdjustmentDirection>(["surcharge", "discount"]);
const seasonalModes = new Set<AccommodationAdjustmentMode>(["fixed-per-room-night", "percent-of-room"]);
const occupancyModes = new Set<AccommodationAdjustmentMode>([
  "fixed-per-room-night",
  "percent-of-room",
  "fixed-per-child-night",
  "percent-per-child"
]);
const occupancyKinds = new Set<AccommodationOccupancyPricingKind>([
  "single-supplement",
  "triple-discount",
  "child-sharing-discount",
  "custom"
]);

function text(formData: FormData, name: string) {
  const value = formData.get(name) ?? formData.get(name.replaceAll(":", "__"));
  return typeof value === "string" ? value.trim() : "";
}

function texts(formData: FormData, name: string) {
  return formData.getAll(name).map((value) => typeof value === "string" ? value.trim() : "");
}

function optionalInteger(value: string, min = 0, max = Number.MAX_SAFE_INTEGER) {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= min && parsed <= max ? parsed : null;
}

function validAdjustmentValue(mode: AccommodationAdjustmentMode, value: number) {
  if (!Number.isFinite(value) || value < 0) return false;
  if ((mode === "percent-of-room" || mode === "percent-per-child") && value > 100) return false;
  return true;
}

export async function saveAccommodationPricingAction(formData: FormData) {
  await requireStaffCapability("catalogue");

  const accommodationId = text(formData, "accommodationId");
  const accommodation = accommodationId ? await getAccommodationForAdmin(accommodationId) : null;
  if (!accommodation) redirect("/operator/catalogue?error=not-found");

  const roomIds = new Set(accommodation.roomTypes.map((room) => room.id));
  const seasonalIds = texts(formData, "seasonalRuleId").filter(Boolean);
  const occupancyIds = texts(formData, "occupancyRuleId").filter(Boolean);
  if (new Set(seasonalIds).size !== seasonalIds.length || new Set(occupancyIds).size !== occupancyIds.length) {
    redirect(`/operator/catalogue/accommodations/${encodeURIComponent(accommodation.id)}?pricingError=validation`);
  }

  const seasonalPricing: AccommodationSeasonalPricingRule[] = [];
  for (const id of seasonalIds) {
    const label = text(formData, `seasonalLabel:${id}`);
    const startDate = text(formData, `seasonalStart:${id}`);
    const endDate = text(formData, `seasonalEnd:${id}`);
    const rawDirection = text(formData, `seasonalDirection:${id}`) as AccommodationAdjustmentDirection;
    const rawMode = text(formData, `seasonalMode:${id}`) as AccommodationAdjustmentMode;
    const value = Number(text(formData, `seasonalValue:${id}`));
    const roomTypeId = text(formData, `seasonalRoom:${id}`);

    if (
      !label ||
      !isoDatePattern.test(startDate) ||
      !isoDatePattern.test(endDate) ||
      endDate < startDate ||
      !directions.has(rawDirection) ||
      !seasonalModes.has(rawMode) ||
      !validAdjustmentValue(rawMode, value) ||
      (roomTypeId && roomTypeId !== "*" && !roomIds.has(roomTypeId))
    ) {
      redirect(`/operator/catalogue/accommodations/${encodeURIComponent(accommodation.id)}?pricingError=validation`);
    }

    seasonalPricing.push({
      id,
      label,
      startDate,
      endDate,
      direction: rawDirection,
      mode: rawMode as AccommodationSeasonalPricingRule["mode"],
      value,
      roomTypeIds: roomTypeId && roomTypeId !== "*" ? [roomTypeId] : undefined
    });
  }

  const occupancyPricing: AccommodationOccupancyPricingRule[] = [];
  for (const id of occupancyIds) {
    const label = text(formData, `occupancyLabel:${id}`);
    const rawKind = text(formData, `occupancyKind:${id}`) as AccommodationOccupancyPricingKind;
    const roomTypeId = text(formData, `occupancyRoom:${id}`);
    const rawDirection = text(formData, `occupancyDirection:${id}`) as AccommodationAdjustmentDirection;
    const rawMode = text(formData, `occupancyMode:${id}`) as AccommodationAdjustmentMode;
    const value = Number(text(formData, `occupancyValue:${id}`));
    const minAdults = optionalInteger(text(formData, `occupancyMinAdults:${id}`), 0, 20);
    const maxAdults = optionalInteger(text(formData, `occupancyMaxAdults:${id}`), 0, 20);
    const minChildren = optionalInteger(text(formData, `occupancyMinChildren:${id}`), 0, 20);
    const maxChildren = optionalInteger(text(formData, `occupancyMaxChildren:${id}`), 0, 20);
    const minChildAge = optionalInteger(text(formData, `occupancyMinChildAge:${id}`), 0, 17);
    const maxChildAge = optionalInteger(text(formData, `occupancyMaxChildAge:${id}`), 0, 17);

    if (
      !label ||
      !occupancyKinds.has(rawKind) ||
      (roomTypeId && roomTypeId !== "*" && !roomIds.has(roomTypeId)) ||
      !directions.has(rawDirection) ||
      !occupancyModes.has(rawMode) ||
      !validAdjustmentValue(rawMode, value) ||
      minAdults === null || maxAdults === null || minChildren === null || maxChildren === null || minChildAge === null || maxChildAge === null ||
      (minAdults !== undefined && maxAdults !== undefined && minAdults > maxAdults) ||
      (minChildren !== undefined && maxChildren !== undefined && minChildren > maxChildren) ||
      (minChildAge !== undefined && maxChildAge !== undefined && minChildAge > maxChildAge)
    ) {
      redirect(`/operator/catalogue/accommodations/${encodeURIComponent(accommodation.id)}?pricingError=validation`);
    }

    occupancyPricing.push({
      id,
      label,
      kind: rawKind,
      roomTypeId: roomTypeId && roomTypeId !== "*" ? roomTypeId : undefined,
      direction: rawDirection,
      mode: rawMode,
      value,
      minAdults,
      maxAdults,
      minChildren,
      maxChildren,
      minChildAge,
      maxChildAge
    });
  }

  const inventory = await listAccommodationInventory(accommodation.id);
  await saveAccommodationWithInventory({ ...accommodation, seasonalPricing, occupancyPricing }, inventory);

  revalidatePath("/accommodations");
  revalidatePath(`/accommodations/${accommodation.slug}`);
  revalidatePath(`/operator/catalogue/accommodations/${accommodation.id}`);
  redirect(`/operator/catalogue/accommodations/${encodeURIComponent(accommodation.id)}?pricingUpdated=1`);
}
