"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type {
  Accommodation,
  AccommodationInventoryPeriod,
  AccommodationInventoryStatus,
  AccommodationRoomType
} from "@/domain/accommodation/types";
import type {
  CurrencyCode,
  TravelMedia,
  TravelMediaFocalPoint,
  TravelPublicationStatus
} from "@/domain/travel/types";
import {
  getAccommodationForAdmin,
  saveAccommodationWithInventory
} from "@/lib/accommodations";
import { requireStaffCapability } from "@/lib/require-staff-capability";

function text(formData: FormData, name: string) {
  const value = formData.get(name) ?? (name.includes(":") ? formData.get(name.replaceAll(":", "__")) : null);
  return typeof value === "string" ? value.trim() : "";
}

function texts(formData: FormData, name: string) {
  return formData.getAll(name).map((value) => typeof value === "string" ? value.trim() : "");
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

function publicationStatus(formData: FormData): TravelPublicationStatus {
  return text(formData, "publicationStatus") === "published" ? "published" : "draft";
}

function parseOptionalNonNegativeInteger(value: string) {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : null;
}

function parseRoomTypes(formData: FormData, existing?: Accommodation | null): AccommodationRoomType[] | null {
  const ids = texts(formData, "roomId").filter(Boolean);
  if (!ids.length || new Set(ids).size !== ids.length) return null;

  const rooms: AccommodationRoomType[] = [];
  const codes = new Set<string>();
  for (const id of ids) {
    const code = normalizeCode(text(formData, `roomCode:${id}`));
    const name = text(formData, `roomName:${id}`);
    const description = text(formData, `roomDescription:${id}`);
    const minAdults = Number(text(formData, `roomMinAdults:${id}`));
    const maxAdults = Number(text(formData, `roomMaxAdults:${id}`));
    const maxChildren = Number(text(formData, `roomMaxChildren:${id}`));
    const maxOccupancy = Number(text(formData, `roomMaxOccupancy:${id}`));
    const childMaxAge = parseOptionalNonNegativeInteger(text(formData, `roomChildMaxAge:${id}`));

    if (
      !code ||
      !name ||
      codes.has(code) ||
      !Number.isInteger(minAdults) || minAdults < 1 ||
      !Number.isInteger(maxAdults) || maxAdults < minAdults ||
      !Number.isInteger(maxChildren) || maxChildren < 0 ||
      !Number.isInteger(maxOccupancy) || maxOccupancy < maxAdults || maxOccupancy > maxAdults + maxChildren ||
      childMaxAge === null ||
      (maxChildren > 0 && (childMaxAge === undefined || childMaxAge > 17)) ||
      (maxChildren === 0 && childMaxAge !== undefined)
    ) {
      return null;
    }

    const previous = existing?.roomTypes.find((room) => room.id === id);
    codes.add(code);
    rooms.push({
      ...(previous ?? {}),
      id,
      code,
      name,
      description: description || undefined,
      occupancy: {
        minAdults,
        maxAdults,
        maxChildren,
        maxOccupancy,
        childMaxAge
      }
    });
  }
  return rooms;
}

const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;

function parseInventory(
  formData: FormData,
  accommodationId: string,
  roomTypes: AccommodationRoomType[]
): AccommodationInventoryPeriod[] | null {
  const ids = texts(formData, "inventoryId").filter(Boolean);
  if (new Set(ids).size !== ids.length) return null;
  const roomIds = new Set(roomTypes.map((room) => room.id));
  const periods: AccommodationInventoryPeriod[] = [];

  for (const id of ids) {
    const roomTypeId = text(formData, `inventoryRoomType:${id}`);
    const startDate = text(formData, `inventoryStartDate:${id}`);
    const endDate = text(formData, `inventoryEndDate:${id}`);
    const capacity = Number(text(formData, `inventoryCapacity:${id}`));
    const rawStatus = text(formData, `inventoryStatus:${id}`);
    const status: AccommodationInventoryStatus = rawStatus === "closed" ? "closed" : "open";

    if (
      !roomIds.has(roomTypeId) ||
      !isoDatePattern.test(startDate) ||
      !isoDatePattern.test(endDate) ||
      endDate < startDate ||
      !Number.isInteger(capacity) ||
      capacity < 0
    ) {
      return null;
    }

    periods.push({
      id,
      accommodationId,
      roomTypeId,
      startDate,
      endDate,
      capacity,
      reserved: 0,
      status
    });
  }

  for (const roomType of roomTypes) {
    const roomPeriods = periods
      .filter((period) => period.roomTypeId === roomType.id)
      .sort((a, b) => a.startDate.localeCompare(b.startDate));
    for (let index = 1; index < roomPeriods.length; index += 1) {
      if (roomPeriods[index].startDate <= roomPeriods[index - 1].endDate) return null;
    }
  }

  return periods.sort((a, b) => a.startDate.localeCompare(b.startDate));
}

const focalPoints = new Set<TravelMediaFocalPoint>(["center", "top", "bottom", "left", "right"]);

function parseCoverImage(formData: FormData): TravelMedia | null | undefined {
  const src = text(formData, "coverSrc");
  if (!src) return undefined;
  if (!src.startsWith("/")) {
    try {
      if (new URL(src).protocol !== "https:") return null;
    } catch {
      return null;
    }
  }
  const rawFocalPoint = text(formData, "coverFocalPoint") as TravelMediaFocalPoint;
  return {
    src,
    alt: text(formData, "coverAlt") || undefined,
    caption: text(formData, "coverCaption") || undefined,
    credit: text(formData, "coverCredit") || undefined,
    focalPoint: focalPoints.has(rawFocalPoint) ? rawFocalPoint : "center"
  };
}

export async function saveAccommodationAction(formData: FormData) {
  await requireStaffCapability("catalogue");

  const requestedId = text(formData, "id");
  const id = requestedId || randomUUID();
  const existing = requestedId ? await getAccommodationForAdmin(id) : null;
  const name = text(formData, "name");
  const slug = normalizeSlug(text(formData, "slug") || name);
  const summary = text(formData, "summary");
  const location = text(formData, "location");
  const country = text(formData, "country");
  const rawCurrency = text(formData, "currency");
  const currency: CurrencyCode = rawCurrency === "USD" || rawCurrency === "GBP" ? rawCurrency : "EUR";
  const roomTypes = parseRoomTypes(formData, existing);
  const inventory = roomTypes ? parseInventory(formData, id, roomTypes) : null;
  const coverImage = parseCoverImage(formData);
  const returnTo = requestedId
    ? `/operator/catalogue/accommodations/${encodeURIComponent(id)}`
    : "/operator/catalogue/accommodations/new";

  if (!name || !slug || !summary || !location || !country || !roomTypes || inventory === null || coverImage === null) {
    redirect(`${returnTo}?error=validation`);
  }

  const roomTranslations = Object.fromEntries(roomTypes.map((room) => [
    room.id,
    {
      name: text(formData, `roomNameEs:${room.id}`) || undefined,
      description: text(formData, `roomDescriptionEs:${room.id}`) || undefined
    }
  ]));

  const accommodation: Accommodation = {
    ...(existing ?? {}),
    id,
    slug,
    name,
    summary,
    location,
    country,
    currency,
    publicationStatus: publicationStatus(formData),
    featured: formData.get("featured") === "on",
    roomTypes,
    coverImage,
    translations: {
      ...(existing?.translations ?? {}),
      es: {
        ...(existing?.translations?.es ?? {}),
        name: text(formData, "nameEs") || undefined,
        summary: text(formData, "summaryEs") || undefined,
        location: text(formData, "locationEs") || undefined,
        roomTypes: roomTranslations
      }
    }
  };

  try {
    await saveAccommodationWithInventory(accommodation, inventory);
  } catch (error) {
    const code = error && typeof error === "object" && "code" in error ? String(error.code) : "";
    if (code === "ACCOMMODATION_CAPACITY_CONFLICT") {
      redirect(`${returnTo}?error=capacity-conflict`);
    }
    console.error("Failed to save accommodation", { id, error });
    redirect(`${returnTo}?error=save`);
  }

  revalidatePath("/accommodations");
  revalidatePath(`/accommodations/${slug}`);
  revalidatePath("/operator/catalogue");
  redirect("/operator/catalogue?updated=accommodation");
}
