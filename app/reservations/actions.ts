"use server";

import { redirect } from "next/navigation";
import { bookingConfig } from "@/lib/booking-config";
import { getBookingRepository } from "@/lib/booking-repository";
import { getIdentityRepository } from "@/lib/identity-repository";
import { getTravelRepository } from "@/lib/travel-repository";

function value(formData: FormData, key: string) {
  const item = formData.get(key);
  return typeof item === "string" ? item.trim() : "";
}

export async function createReservationAction(formData: FormData) {
  const identity = await getIdentityRepository().getCurrentIdentity();

  if (!identity) {
    redirect("/account/sign-in");
  }

  const tripSlug = value(formData, "tripSlug");
  const availabilityId = value(formData, "availabilityId");
  const requestedPartySize = Number(value(formData, "partySize"));
  const backToBooking = tripSlug ? `/trips/${encodeURIComponent(tripSlug)}/book` : "/trips";

  if (!bookingConfig.demoWritesEnabled) {
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

  const unitPrice = trip.fromPrice;
  const totalPrice = unitPrice * requestedPartySize;

  const reservation = await bookingRepository.createReservation({
    identityId: identity.id,
    tripId: trip.id,
    availabilityId: availability.id,
    partySize: requestedPartySize,
    unitPrice,
    totalPrice,
    currency: trip.currency
  });

  redirect(`/account/reservations/${encodeURIComponent(reservation.id)}`);
}
