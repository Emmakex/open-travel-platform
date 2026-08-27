"use server";

import { redirect } from "next/navigation";
import type { PaymentTargetType } from "@/domain/payment/types";
import type { TravellerPostPurchaseData } from "@/domain/traveller/types";
import {
  isTravellerDataEncryptionConfigured,
  normalizeTravellerPostPurchaseData,
  saveTravellerDataForCustomer
} from "@/lib/traveller-data";
import { requireCustomerIdentity } from "@/lib/require-customer-identity";
import { resolveTravellerReservationContextForCustomer } from "@/lib/traveller-reservation-context";
import {
  travellerFieldsForReservationTraveller,
  travellerRequirementsDeadline
} from "@/lib/traveller-requirements";

function value(formData: FormData, key: string) {
  const item = formData.get(key);
  return typeof item === "string" ? item.trim() : "";
}

function targetType(value: string): PaymentTargetType | null {
  return value === "trip" || value === "service" ? value : null;
}

function baseUrl(type: PaymentTargetType | null, reservationId: string) {
  return type && reservationId
    ? `/account/traveller-data/${type}/${encodeURIComponent(reservationId)}`
    : "/account";
}

function errorUrl(returnTo: string, error: string, travellerId?: string) {
  const params = new URLSearchParams({ error });
  if (travellerId) params.set("traveller", travellerId);
  return `${returnTo}?${params.toString()}`;
}

export async function savePostPurchaseTravellerDataAction(formData: FormData) {
  const identity = await requireCustomerIdentity();
  const type = targetType(value(formData, "targetType"));
  const reservationId = value(formData, "reservationId");
  const travellerId = value(formData, "travellerId");
  const returnTo = baseUrl(type, reservationId);

  if (!type || !reservationId || !travellerId) redirect(errorUrl(returnTo, "invalid-request"));
  if (!isTravellerDataEncryptionConfigured()) redirect(errorUrl(returnTo, "encryption-unavailable", travellerId));

  const context = await resolveTravellerReservationContextForCustomer(identity.id, type, reservationId);
  if (!context) redirect("/account");
  if (context.status === "cancelled") redirect(errorUrl(returnTo, "cancelled", travellerId));
  if (!context.requirements || context.requirements.preset === "none") redirect(errorUrl(returnTo, "not-required", travellerId));

  const deadline = travellerRequirementsDeadline(context.requirements, context.startDate);
  const today = new Date().toISOString().slice(0, 10);
  if (deadline && today > deadline) redirect(errorUrl(returnTo, "editing-closed", travellerId));

  const traveller = context.travellers.find((item) => item.id === travellerId);
  if (!traveller) redirect(errorUrl(returnTo, "invalid-traveller"));

  const requiredFields = travellerFieldsForReservationTraveller(context.requirements, traveller);
  const raw: Record<string, string> = {};
  for (const field of requiredFields) raw[field] = value(formData, field);
  const normalized = normalizeTravellerPostPurchaseData(raw, requiredFields, context.startDate);
  if (!normalized) redirect(errorUrl(returnTo, "validation", travellerId));

  try {
    await saveTravellerDataForCustomer({
      identityId: identity.id,
      targetType: type,
      reservationId,
      traveller,
      profile: context.requirements,
      data: normalized as TravellerPostPurchaseData,
      endDate: context.endDate
    });
  } catch (error) {
    console.error("Traveller data save failed", { reservationId, travellerId, error });
    redirect(errorUrl(returnTo, "save", travellerId));
  }

  redirect(`${returnTo}?saved=${encodeURIComponent(travellerId)}`);
}
