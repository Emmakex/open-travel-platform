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

export async function savePostPurchaseTravellerDataAction(formData: FormData) {
  const identity = await requireCustomerIdentity();
  const type = targetType(value(formData, "targetType"));
  const reservationId = value(formData, "reservationId");
  const travellerId = value(formData, "travellerId");
  const returnTo = baseUrl(type, reservationId);

  if (!type || !reservationId || !travellerId) redirect(`${returnTo}?error=invalid-request`);
  if (!isTravellerDataEncryptionConfigured()) redirect(`${returnTo}?error=encryption-unavailable`);

  const context = await resolveTravellerReservationContextForCustomer(identity.id, type, reservationId);
  if (!context) redirect("/account");
  if (context.status === "cancelled") redirect(`${returnTo}?error=cancelled`);
  if (!context.requirements || context.requirements.preset === "none") redirect(`${returnTo}?error=not-required`);

  const deadline = travellerRequirementsDeadline(context.requirements, context.startDate);
  const today = new Date().toISOString().slice(0, 10);
  if (deadline && today > deadline) redirect(`${returnTo}?error=editing-closed`);

  const traveller = context.travellers.find((item) => item.id === travellerId);
  if (!traveller) redirect(`${returnTo}?error=invalid-traveller`);

  const requiredFields = travellerFieldsForReservationTraveller(context.requirements, traveller);
  const raw: Record<string, string> = {};
  for (const field of requiredFields) raw[field] = value(formData, field);
  const normalized = normalizeTravellerPostPurchaseData(raw, requiredFields, context.startDate);
  if (!normalized) redirect(`${returnTo}?error=validation`);

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
    redirect(`${returnTo}?error=save`);
  }

  redirect(`${returnTo}?saved=${encodeURIComponent(travellerId)}`);
}
