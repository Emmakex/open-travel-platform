"use server";

import { redirect } from "next/navigation";
import type { GuardianRelationship } from "@/domain/booking/types";
import type { TravelServiceType } from "@/domain/services/types";
import { getBookingRepository } from "@/lib/booking-repository";
import { getPaymentRepository } from "@/lib/payment-repository";
import { requireCustomerIdentity } from "@/lib/require-customer-identity";
import {
  cancelServiceReservationForCustomer,
  createServiceReservation,
  getServiceReservationForCustomer
} from "@/lib/service-reservations";
import { listPublishedServiceAvailability } from "@/lib/service-availability";
import { priceServiceComposition } from "@/lib/service-booking-pricing";
import { getPublishedTravelService } from "@/lib/travel-services";
import {
  TravellerPricingError,
  type TravellerBookingDraft
} from "@/lib/traveller-pricing";

export type ServiceReservationActionState = {
  error?: string;
};

function value(formData: FormData, key: string) {
  const item = formData.get(key) ?? (key.includes(":") ? formData.get(key.replaceAll(":", "__")) : null);
  return typeof item === "string" ? item.trim() : "";
}

function values(formData: FormData, key: string) {
  return formData.getAll(key).map((item) => typeof item === "string" ? item.trim() : "");
}

const relationships = new Set<GuardianRelationship>(["parent", "legal-guardian", "other"]);

function parseTravellers(formData: FormData): TravellerBookingDraft[] | null {
  const ids = values(formData, "travellerId").filter(Boolean);
  if (!ids.length || ids.length > 8 || new Set(ids).size !== ids.length) return null;
  return ids.map((id) => {
    const relationship = value(formData, `travellerGuardianRelationship:${id}`);
    return {
      id,
      firstName: value(formData, `travellerFirstName:${id}`),
      lastName: value(formData, `travellerLastName:${id}`),
      dateOfBirth: value(formData, `travellerDateOfBirth:${id}`),
      nationality: value(formData, `travellerNationality:${id}`),
      guardianTravellerId: value(formData, `travellerGuardian:${id}`) || undefined,
      guardianRelationship: relationships.has(relationship as GuardianRelationship)
        ? relationship as GuardianRelationship
        : undefined
    };
  });
}

function serviceType(value: string): TravelServiceType | null {
  return value === "activity" || value === "transport" || value === "insurance" ? value : null;
}

function validIsoDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
}

function insuranceDuration(start: string, end: string) {
  const startMs = Date.parse(`${start}T00:00:00Z`);
  const endMs = Date.parse(`${end}T00:00:00Z`);
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs < startMs) return null;
  return Math.floor((endMs - startMs) / 86400000) + 1;
}

function pricingErrorCode(error: TravellerPricingError) {
  return error.code === "LEAD_MUST_BE_ADULT"
    ? "lead-must-be-adult"
    : error.code === "MINOR_GUARDIAN_REQUIRED"
      ? "minor-guardian-required"
      : error.code === "NO_PRICING_BAND"
        ? "pricing-unavailable"
        : "invalid-travellers";
}

export async function createServiceReservationAction(
  _previousState: ServiceReservationActionState,
  formData: FormData
): Promise<ServiceReservationActionState> {
  const identity = await requireCustomerIdentity();
  const type = serviceType(value(formData, "serviceType"));
  const slug = value(formData, "serviceSlug");
  const drafts = parseTravellers(formData);

  if (!type || !slug) return { error: "invalid-service" };
  if (!drafts) return { error: "invalid-travellers" };

  const service = await getPublishedTravelService(type, slug);
  if (!service) return { error: "invalid-service" };

  let referenceDate = "";
  let basePrice = service.fromPrice;
  let availabilityId: string | undefined;
  let serviceDate: string | undefined;
  let startTime: string | undefined;
  let endTime: string | undefined;
  let insuranceTrip: { destination: string; startDate: string; endDate: string; insuredAmount?: number } | undefined;

  if (service.serviceType === "insurance") {
    const destination = value(formData, "destination");
    const startDate = value(formData, "tripStartDate");
    const endDate = value(formData, "tripEndDate");
    const rawInsuredAmount = value(formData, "insuredAmount");
    const insuredAmount = rawInsuredAmount ? Number(rawInsuredAmount) : undefined;
    const today = new Date().toISOString().slice(0, 10);

    if (!destination || destination.length > 120) return { error: "insurance-destination" };
    if (!validIsoDate(startDate) || !validIsoDate(endDate) || endDate < startDate) {
      return { error: "insurance-dates" };
    }
    if (startDate < today) return { error: "insurance-start-past" };

    const duration = insuranceDuration(startDate, endDate);
    if (duration === null) return { error: "insurance-dates" };
    if (service.maxTripDays && duration > service.maxTripDays) {
      return { error: "insurance-duration" };
    }
    if (insuredAmount !== undefined && (!Number.isFinite(insuredAmount) || insuredAmount < 0)) {
      return { error: "insurance-amount" };
    }

    referenceDate = startDate;
    insuranceTrip = { destination, startDate, endDate, insuredAmount };
  } else {
    const requestedSlot = value(formData, "availabilityId");
    const slot = (await listPublishedServiceAvailability(service.id)).find((item) => item.id === requestedSlot);
    if (!slot) return { error: "invalid-availability" };
    availabilityId = slot.id;
    serviceDate = slot.date;
    startTime = slot.startTime;
    endTime = slot.endTime;
    referenceDate = slot.date;
    basePrice = slot.priceOverride ?? service.fromPrice;
  }

  let priced;
  try {
    priced = priceServiceComposition({ service, referenceDate, basePrice, drafts });
  } catch (error) {
    if (error instanceof TravellerPricingError) {
      return { error: pricingErrorCode(error) };
    }
    console.error("Service pricing failed", error);
    return { error: "server-error" };
  }

  const relatedReservationId = value(formData, "relatedReservationId") || undefined;
  if (relatedReservationId) {
    const owned = await getBookingRepository().getReservation(identity.id, relatedReservationId);
    if (!owned) return { error: "invalid-related-reservation" };
  }

  let reservation;
  try {
    reservation = await createServiceReservation({
      identityId: identity.id,
      serviceId: service.id,
      serviceType: service.serviceType,
      serviceSlug: service.slug,
      serviceTitle: service.title,
      pricingMode: service.pricingMode,
      currency: service.currency,
      availabilityId,
      serviceDate,
      startTime,
      endTime,
      partySize: priced.travellers.length,
      inventoryUnits: priced.inventoryUnits,
      quantity: priced.quantity,
      unitPrice: priced.unitPrice,
      totalPrice: priced.totalPrice,
      travellers: priced.travellers,
      insuranceTrip,
      relatedReservationId
    });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "SERVICE_UNAVAILABLE") {
      return { error: "insufficient-space" };
    }
    console.error("Service reservation creation failed", error);
    return { error: "server-error" };
  }

  redirect(`/account/services/${encodeURIComponent(reservation.id)}?created=1`);
}

export async function cancelServiceReservationAction(formData: FormData) {
  const identity = await requireCustomerIdentity();
  const reservationId = value(formData, "reservationId");
  if (!reservationId) redirect("/account/services");

  const current = await getServiceReservationForCustomer(identity.id, reservationId);
  if (!current) redirect("/account/services");
  const payment = await getPaymentRepository().getTargetSummary({
    id: current.id,
    totalPrice: current.totalPrice,
    currency: current.currency,
    targetType: "service"
  });
  if (payment.netPaidAmount > 0 || payment.pendingPaymentAmount > 0) {
    redirect(`/account/services/${encodeURIComponent(reservationId)}?error=payment-active`);
  }

  const changed = await cancelServiceReservationForCustomer(identity.id, reservationId);
  if (!changed) redirect(`/account/services/${encodeURIComponent(reservationId)}?error=not-cancellable`);
  redirect(`/account/services/${encodeURIComponent(reservationId)}?updated=cancelled`);
}
