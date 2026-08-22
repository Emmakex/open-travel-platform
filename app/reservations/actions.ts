"use server";

import { redirect } from "next/navigation";
import type { GuardianRelationship } from "@/domain/booking/types";
import { bookingConfig } from "@/lib/booking-config";
import { getBookingRepository } from "@/lib/booking-repository";
import { notifyReservationEvent } from "@/lib/reservation-emails";
import { requireCustomerIdentity } from "@/lib/require-customer-identity";
import { getTravelRepository } from "@/lib/travel-repository";
import {
  priceTravellerComposition,
  TravellerPricingError,
  type TravellerBookingDraft
} from "@/lib/traveller-pricing";

function value(formData: FormData, key: string) {
  const item = formData.get(key);
  return typeof item === "string" ? item.trim() : "";
}

function values(formData: FormData, key: string) {
  return formData.getAll(key).map((item) => typeof item === "string" ? item.trim() : "");
}

const guardianRelationships = new Set<GuardianRelationship>(["parent", "legal-guardian", "other"]);

function parseTravellers(formData: FormData): TravellerBookingDraft[] | null {
  const ids = values(formData, "travellerId").filter(Boolean);
  if (!ids.length || ids.length > 8 || new Set(ids).size !== ids.length) return null;

  return ids.map((id) => {
    const rawRelationship = value(formData, `travellerGuardianRelationship:${id}`);
    return {
      id,
      firstName: value(formData, `travellerFirstName:${id}`),
      lastName: value(formData, `travellerLastName:${id}`),
      dateOfBirth: value(formData, `travellerDateOfBirth:${id}`),
      nationality: value(formData, `travellerNationality:${id}`),
      guardianTravellerId: value(formData, `travellerGuardian:${id}`) || undefined,
      guardianRelationship: guardianRelationships.has(rawRelationship as GuardianRelationship)
        ? (rawRelationship as GuardianRelationship)
        : undefined
    };
  });
}

export async function createReservationAction(formData: FormData) {
  const identity = await requireCustomerIdentity();
  const tripSlug = value(formData, "tripSlug");
  const availabilityId = value(formData, "availabilityId");
  const travellerDrafts = parseTravellers(formData);
  const backToBooking = tripSlug ? `/trips/${encodeURIComponent(tripSlug)}/book` : "/trips";

  if (!bookingConfig.writesEnabled) {
    redirect(`${backToBooking}?error=booking-disabled`);
  }

  if (!travellerDrafts) {
    redirect(`${backToBooking}?error=invalid-travellers`);
  }

  const travelRepository = getTravelRepository();
  const trip = await travelRepository.getTripBySlug(tripSlug);

  if (!trip) {
    redirect("/trips");
  }

  const bookingRepository = getBookingRepository();
  const availability = (await bookingRepository.listAvailability(trip.id)).find(
    (item) => item.id === availabilityId
  );

  if (!availability) {
    redirect(`${backToBooking}?error=invalid-availability`);
  }

  let priced;
  try {
    priced = priceTravellerComposition({
      trip,
      availability,
      drafts: travellerDrafts
    });
  } catch (error) {
    if (error instanceof TravellerPricingError) {
      const query = error.code === "LEAD_MUST_BE_ADULT"
        ? "lead-must-be-adult"
        : error.code === "MINOR_GUARDIAN_REQUIRED"
          ? "minor-guardian-required"
          : error.code === "NO_PRICING_BAND"
            ? "pricing-unavailable"
            : "invalid-travellers";
      redirect(`${backToBooking}?error=${query}`);
    }
    throw error;
  }

  if (priced.inventorySpaces > availability.remainingSpaces) {
    redirect(`${backToBooking}?error=insufficient-space`);
  }

  let reservation;
  try {
    reservation = await bookingRepository.createReservation({
      identityId: identity.id,
      tripId: trip.id,
      availabilityId: availability.id,
      partySize: priced.travellers.length,
      inventorySpaces: priced.inventorySpaces,
      travellers: priced.travellers,
      unitPrice: priced.leadUnitPrice,
      totalPrice: priced.totalPrice,
      currency: trip.currency,
      tripTitle: trip.title,
      departureDate: availability.departureDate,
      returnDate: availability.returnDate
    });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "DEPARTURE_UNAVAILABLE") {
      redirect(`${backToBooking}?error=insufficient-space`);
    }
    throw error;
  }

  await notifyReservationEvent(reservation, "created").catch(() => undefined);
  redirect(`/account/reservations/${encodeURIComponent(reservation.id)}`);
}

export async function cancelReservationAction(formData: FormData) {
  const identity = await requireCustomerIdentity();
  const reservationId = value(formData, "reservationId");

  if (!bookingConfig.writesEnabled || !reservationId) {
    redirect("/account/reservations");
  }

  const reservation = await getBookingRepository().cancelReservation(identity.id, reservationId);

  if (!reservation) {
    redirect("/account/reservations");
  }

  await notifyReservationEvent(reservation, "cancelled").catch(() => undefined);
  redirect(`/account/reservations/${encodeURIComponent(reservation.id)}?updated=cancelled`);
}
