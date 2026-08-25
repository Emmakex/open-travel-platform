"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { TravelMedia, TravelMediaFocalPoint } from "@/domain/travel/types";
import {
  getAccommodationForAdmin,
  listAccommodationInventory,
  saveAccommodationWithInventory
} from "@/lib/accommodations";
import { requireStaffCapability } from "@/lib/require-staff-capability";

const focalPoints = new Set<TravelMediaFocalPoint>(["center", "top", "bottom", "left", "right"]);

function text(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function texts(formData: FormData, name: string) {
  return formData.getAll(name).map((value) => typeof value === "string" ? value.trim() : "");
}

function validMediaSrc(src: string) {
  if (!src) return true;
  if (src.startsWith("/")) return true;
  try {
    return new URL(src).protocol === "https:";
  } catch {
    return false;
  }
}

function parseGallery(formData: FormData, prefix: string): TravelMedia[] | null {
  const sources = texts(formData, `${prefix}Src`);
  const alts = texts(formData, `${prefix}Alt`);
  const captions = texts(formData, `${prefix}Caption`);
  const credits = texts(formData, `${prefix}Credit`);
  const focalPointInputs = texts(formData, `${prefix}FocalPoint`);
  const length = Math.max(sources.length, alts.length, captions.length, credits.length, focalPointInputs.length);
  const gallery: TravelMedia[] = [];

  for (let index = 0; index < length; index += 1) {
    const src = sources[index] ?? "";
    if (!src && !alts[index] && !captions[index] && !credits[index]) continue;
    if (!src || !validMediaSrc(src)) return null;
    const rawFocalPoint = (focalPointInputs[index] ?? "center") as TravelMediaFocalPoint;
    gallery.push({
      src,
      alt: alts[index] || undefined,
      caption: captions[index] || undefined,
      credit: credits[index] || undefined,
      focalPoint: focalPoints.has(rawFocalPoint) ? rawFocalPoint : "center"
    });
  }

  return gallery;
}

export async function saveAccommodationMediaAction(formData: FormData) {
  await requireStaffCapability("catalogue");

  const accommodationId = text(formData, "accommodationId");
  const accommodation = accommodationId ? await getAccommodationForAdmin(accommodationId) : null;
  if (!accommodation) redirect("/operator/catalogue?error=not-found");

  const gallery = parseGallery(formData, "propertyGallery");
  if (gallery === null) {
    redirect(`/operator/catalogue/accommodations/${encodeURIComponent(accommodation.id)}?mediaError=validation`);
  }

  const roomTypes = accommodation.roomTypes.map((room) => {
    const roomGallery = parseGallery(formData, `roomGallery__${room.id}`);
    if (roomGallery === null) {
      redirect(`/operator/catalogue/accommodations/${encodeURIComponent(accommodation.id)}?mediaError=validation`);
    }
    return { ...room, gallery: roomGallery };
  });

  const inventory = await listAccommodationInventory(accommodation.id);
  await saveAccommodationWithInventory({ ...accommodation, gallery, roomTypes }, inventory);

  revalidatePath("/accommodations");
  revalidatePath(`/accommodations/${accommodation.slug}`);
  revalidatePath(`/operator/catalogue/accommodations/${accommodation.id}`);
  redirect(`/operator/catalogue/accommodations/${encodeURIComponent(accommodation.id)}?mediaUpdated=1`);
}
