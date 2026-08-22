"use server";

import { redirect } from "next/navigation";
import { bookingConfig } from "@/lib/booking-config";
import { getBookingRepository } from "@/lib/booking-repository";
import { requireCustomerIdentity } from "@/lib/require-customer-identity";
import { getTravelRepository } from "@/lib/travel-repository";

function value(formData: FormData, key: string) {
  const item = formData.get(key);
  return typeof item === "string" ? item.trim() : "";
}

export async function createReservationAction(formData: FormData) {
  const identity = await requireCustomerIdentity();
  const tripSlug = value(formData, "tripSlug");
  const availabilityId = value(formData, "availabilityId");
  const requestedPartySize = Number(value(formData, "partySize"));
  const backToBooking = tripSlug ? `/trips/${encodeURIComponent(tripSlug)}/book` : "/trips";

  if (!bookingConfig.writesEnabled) {
    redirect(`${backToBooking}?error=booking-disabled`);
  }

  if (!Number.isInteger(requestedPartySize) || requestedPartySize < 1 || requestedPartySize > 8) {
    redirect(`${backToBooking}?error=invalid-party-size`);
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

  if (requestedPartySize > availability.remainingSpaces) {
    redirect(`${backToBooking}?error=insufficient-space`);
  }

  const unitPrice = availability.unitPrice ?? trip.fromPrice;
  const totalPrice = unitPrice * requestedPartySize;

  let reservation;
  try {
    reservation = await bookingRepository.createReservation({
      identityId: identity.id,
      tripId: trip.id,
      availabilityId: availability.id,
      partySize: requestedPartySize,
      unitPrice,
      totalPrice,
      currency: trip.currency
    });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "DEPARTURE_UNAVAILABLE") {
      redirect(`${backToBooking}?error=insufficient-space`);
    }
    throw error;
  }

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

  redirect(`/account/reservations/${encodeURIComponent(reservation.id)}?updated=cancelled`);
}
