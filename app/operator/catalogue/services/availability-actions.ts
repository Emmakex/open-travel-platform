"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type {
  ServiceInventoryMode,
  TravelServiceType
} from "@/domain/services/types";
import type { ServiceAvailabilityDraft } from "@/lib/service-availability";
import { requireStaffCapability } from "@/lib/require-staff-capability";
import {
  saveServiceAvailabilitySlots,
  validateServiceAvailabilityDraft
} from "@/lib/service-availability";
import {
  getTravelServiceForAdmin,
  serviceBasePath
} from "@/lib/travel-services";

function text(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function texts(formData: FormData, name: string) {
  return formData.getAll(name).map((value) => typeof value === "string" ? value.trim() : "");
}

export async function saveServiceAvailabilityAction(formData: FormData) {
  await requireStaffCapability("catalogue");

  const serviceId = text(formData, "serviceId");
  const rawType = text(formData, "serviceType") as TravelServiceType;
  const serviceType = rawType === "activity" || rawType === "transport" ? rawType : null;
  const rawInventoryMode = text(formData, "inventoryMode");
  const inventoryMode: ServiceInventoryMode = rawInventoryMode === "units" ? "units" : "people";
  const returnTo = serviceId ? `/operator/catalogue/services/${serviceId}` : "/operator/catalogue";

  if (!serviceId || !serviceType) redirect(`${returnTo}?error=availability-validation`);

  const service = await getTravelServiceForAdmin(serviceId);
  if (!service || service.serviceType !== serviceType) redirect(`${returnTo}?error=availability-validation`);

  const ids = texts(formData, "slotId").filter(Boolean);
  const slots: ServiceAvailabilityDraft[] = ids.map((id) => {
    const rawPrice = text(formData, `slotPriceOverride__${id}`);
    return {
      id,
      serviceId,
      serviceType,
      date: text(formData, `slotDate__${id}`),
      startTime: text(formData, `slotStartTime__${id}`),
      endTime: text(formData, `slotEndTime__${id}`) || undefined,
      inventoryMode,
      capacity: Number(text(formData, `slotCapacity__${id}`)),
      status: text(formData, `slotStatus__${id}`) === "closed" ? "closed" : "open",
      priceOverride: rawPrice === "" ? undefined : Number(rawPrice)
    };
  });

  if (slots.some((slot) => !validateServiceAvailabilityDraft(slot))) {
    redirect(`${returnTo}?error=availability-validation`);
  }

  try {
    await saveServiceAvailabilitySlots(serviceId, serviceType, slots);
  } catch (error) {
    console.error("Failed to save service availability", { serviceId, serviceType, error });
    redirect(`${returnTo}?error=availability-save`);
  }

  revalidatePath(returnTo);
  revalidatePath(serviceBasePath(serviceType));
  revalidatePath(`${serviceBasePath(serviceType)}/${service.slug}`);
  revalidatePath("/services");
  redirect(`${returnTo}?availabilityUpdated=1`);
}
