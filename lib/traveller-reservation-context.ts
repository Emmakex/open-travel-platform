import type { ReservationTraveller } from "@/domain/booking/types";
import type { PaymentTargetType } from "@/domain/payment/types";
import type { TravellerRequirementsProfile } from "@/domain/traveller/types";
import { getBookingRepository } from "@/lib/booking-repository";
import { getServiceReservationForCustomer } from "@/lib/service-reservations";

export type TravellerReservationContext = {
  targetType: PaymentTargetType;
  reservationId: string;
  label: string;
  status: string;
  travellers: ReservationTraveller[];
  requirements?: TravellerRequirementsProfile;
  startDate?: string;
  endDate?: string;
  detailUrl: string;
};

export async function resolveTravellerReservationContextForCustomer(
  identityId: string,
  targetType: PaymentTargetType,
  reservationId: string
): Promise<TravellerReservationContext | null> {
  if (targetType === "trip") {
    const reservation = await getBookingRepository().getReservation(identityId, reservationId);
    if (!reservation) return null;
    return {
      targetType,
      reservationId: reservation.id,
      label: reservation.tripTitle ?? reservation.tripId,
      status: reservation.status,
      travellers: reservation.travellers ?? [],
      requirements: reservation.travellerRequirements,
      startDate: reservation.departureDate,
      endDate: reservation.returnDate ?? reservation.departureDate,
      detailUrl: `/account/reservations/${encodeURIComponent(reservation.id)}`
    };
  }

  const reservation = await getServiceReservationForCustomer(identityId, reservationId);
  if (!reservation) return null;
  const startDate = reservation.serviceDate ?? reservation.insuranceTrip?.startDate;
  const endDate = reservation.insuranceTrip?.endDate ?? reservation.serviceDate;
  return {
    targetType,
    reservationId: reservation.id,
    label: reservation.serviceTitle,
    status: reservation.status,
    travellers: reservation.travellers,
    requirements: reservation.travellerRequirements,
    startDate,
    endDate,
    detailUrl: `/account/services/${encodeURIComponent(reservation.id)}`
  };
}
