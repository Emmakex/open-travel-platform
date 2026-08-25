"use server";

import { redirect } from "next/navigation";
import type { GuardianRelationship } from "@/domain/booking/types";
import {
  AccommodationBookingError,
  accommodationBookingTotals,
  attachAccommodationInventory,
  buildAccommodationBookingPlan
} from "@/lib/accommodation-booking";
import { listAccommodationInventory, listPublishedAccommodations } from "@/lib/accommodations";
import { bookingConfig } from "@/lib/booking-config";
import { getBookingRepository } from "@/lib/booking-repository";
import { evaluateTripReservationPolicy } from "@/lib/change-policy";
import { getPaymentRepository } from "@/lib/payment-repository";
import { notifyReservationEvent } from "@/lib/reservation-emails";
import { requireCustomerIdentity } from "@/lib/require-customer-identity";
import { getTravelRepository } from "@/lib/travel-repository";
import { buildTripPackageAddOns, TripPackageAddOnError } from "@/lib/trip-package-addons";
import {
  priceTravellerComposition,
  TravellerPricingError,
  type TravellerBookingDraft
} from "@/lib/traveller-pricing";

function value(formData: FormData, key: string) {
  const item = formData.get(key) ?? (key.includes(":") ? formData.get(key.replaceAll(":", "__")) : null);
  return typeof item === "string" ? item.trim() : "";
}

function values(formData: FormData, key: string) {
  const direct = formData.getAll(key);
  const source = direct.length ? direct : (key.includes(":") ? formData.getAll(key.replaceAll(":", "__")) : []);
  return source.map((item) => typeof item === "string" ? item.trim() : "");
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

function accommodationBookingQuery(error: AccommodationBookingError) {
  if (error.code === "ACCOMMODATION_OCCUPANCY_UNAVAILABLE") return "accommodation-occupancy";
  if (error.code === "ACCOMMODATION_PRICING_UNAVAILABLE") return "accommodation-pricing";
  if (error.code === "ACCOMMODATION_INVENTORY_UNAVAILABLE") return "accommodation-inventory";
  if (error.code === "ACCOMMODATION_CURRENCY_MISMATCH") return "accommodation-currency";
  return "accommodation-configuration";
}

export async function createReservationAction(formData: FormData) {
  const identity = await requireCustomerIdentity();
  const tripSlug = value(formData, "tripSlug");
  const availabilityId = value(formData, "availabilityId");
  const travellerDrafts = parseTravellers(formData);
  const selectedOptionalAccommodationIds = values(formData, "optionalAccommodationComponentId").filter(Boolean);
  const selectedBookingAddOnIds = values(formData, "packageAddOnBookingId").filter(Boolean);
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

  let accommodationBookings = [] as NonNullable<Parameters<typeof attachAccommodationInventory>[0]>;
  let accommodationTotal = 0;
  let accommodationAdditionalTotal = 0;
  try {
    if (trip.accommodations?.length) {
      const validOptionalIds = new Set(
        trip.accommodations.filter((component) => component.mode === "optional").map((component) => component.id)
      );
      if (selectedOptionalAccommodationIds.some((id) => !validOptionalIds.has(id))) {
        throw new AccommodationBookingError(
          "ACCOMMODATION_CONFIGURATION_INVALID",
          "The selected optional accommodation is not part of this trip."
        );
      }

      const publishedAccommodations = await listPublishedAccommodations();
      const pricingPlan = buildAccommodationBookingPlan({
        components: trip.accommodations,
        accommodations: publishedAccommodations,
        departureDate: availability.departureDate,
        travellers: priced.travellers,
        selectedOptionalComponentIds: selectedOptionalAccommodationIds,
        reservationCurrency: trip.currency
      });
      const uniqueAccommodationIds = [...new Set(pricingPlan.map((item) => item.accommodationId))];
      const inventoryLists = await Promise.all(
        uniqueAccommodationIds.map(async (accommodationId) => [
          accommodationId,
          await listAccommodationInventory(accommodationId)
        ] as const)
      );
      accommodationBookings = attachAccommodationInventory(pricingPlan, new Map(inventoryLists));
      ({ accommodationTotal, accommodationAdditionalTotal } = accommodationBookingTotals(accommodationBookings));
    }
  } catch (error) {
    if (error instanceof AccommodationBookingError) {
      redirect(`${backToBooking}?error=${accommodationBookingQuery(error)}`);
    }
    throw error;
  }

  let packageAddOns = [] as ReturnType<typeof buildTripPackageAddOns>["bookings"];
  let packageAddOnTotal = 0;
  try {
    const selectedTravellerIdsByAddOn = Object.fromEntries(
      (trip.addOns ?? [])
        .filter((addOn) => addOn.pricingMode === "per-traveller")
        .map((addOn) => [addOn.id, values(formData, `packageAddOnTraveller:${addOn.id}`).filter(Boolean)])
    );
    const addOnResult = buildTripPackageAddOns({
      addOns: trip.addOns ?? [],
      travellers: priced.travellers,
      selectedBookingAddOnIds,
      selectedTravellerIdsByAddOn
    });
    packageAddOns = addOnResult.bookings;
    packageAddOnTotal = addOnResult.packageAddOnTotal;
  } catch (error) {
    if (error instanceof TripPackageAddOnError) {
      redirect(`${backToBooking}?error=package-addon`);
    }
    throw error;
  }

  const totalPrice = Number((priced.totalPrice + accommodationAdditionalTotal + packageAddOnTotal).toFixed(2));
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
      tripPriceTotal: priced.totalPrice,
      accommodationTotal,
      accommodationAdditionalTotal,
      accommodationBookings,
      packageAddOns,
      packageAddOnTotal,
      totalPrice,
      currency: trip.currency,
      tripTitle: trip.title,
      departureDate: availability.departureDate,
      returnDate: availability.returnDate,
      travellerRequirements: trip.travellerRequirements,
      changePolicy: trip.changePolicy
    });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error) {
      if (error.code === "DEPARTURE_UNAVAILABLE") {
        redirect(`${backToBooking}?error=insufficient-space`);
      }
      if (error.code === "ACCOMMODATION_INVENTORY_UNAVAILABLE") {
        redirect(`${backToBooking}?error=accommodation-inventory`);
      }
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

  const bookingRepository = getBookingRepository();
  const current = await bookingRepository.getReservation(identity.id, reservationId);
  if (!current) redirect("/account/reservations");

  const policy = evaluateTripReservationPolicy(current);
  if (!policy.customerCancellationAllowed) {
    redirect(`/account/reservations/${encodeURIComponent(reservationId)}?error=cancellation-policy`);
  }

  const payment = await getPaymentRepository().getSummary(current);
  if (payment.netPaidAmount > 0 || payment.pendingPaymentAmount > 0) {
    redirect(`/account/reservations/${encodeURIComponent(reservationId)}?error=payment-active`);
  }

  const reservation = await bookingRepository.cancelReservation(identity.id, reservationId);

  if (!reservation) {
    redirect("/account/reservations");
  }

  await notifyReservationEvent(reservation, "cancelled").catch(() => undefined);
  redirect(`/account/reservations/${encodeURIComponent(reservation.id)}?updated=cancelled`);
}
