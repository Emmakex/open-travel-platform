import type {
  Reservation,
  ReservationAccommodationBooking,
  ReservationTraveller
} from "@/domain/booking/types";

export type DepartureManifestGroup = {
  key: string;
  tripId: string;
  availabilityId: string;
  tripTitle: string;
  departureDate?: string;
  returnDate?: string;
  reservations: Reservation[];
  reservationCount: number;
  travellerCount: number;
};

export type TravellerManifestRow = {
  reservationId: string;
  reservationStatus: Reservation["status"];
  travellerId: string;
  firstName: string;
  lastName: string;
  isLead: boolean;
  dateOfBirth: string;
  ageAtDeparture: number;
  nationality: string;
  pricingLabel: string;
};

export type RoomingListRow = {
  reservationId: string;
  reservationStatus: Reservation["status"];
  componentId: string;
  accommodationId: string;
  accommodationName: string;
  roomTypeId: string;
  roomTypeName: string;
  mealPlan?: ReservationAccommodationBooking["mealPlan"];
  checkInDate: string;
  checkOutDate: string;
  nights: number;
  roomIndex: number;
  roomAllocationId: string;
  travellers: Array<{
    travellerId: string;
    firstName: string;
    lastName: string;
    isLead: boolean;
    ageAtDeparture: number;
    nationality: string;
  }>;
};

function activeReservation(reservation: Reservation) {
  return reservation.status !== "cancelled";
}

function groupKey(reservation: Reservation) {
  return `${reservation.tripId}::${reservation.availabilityId}`;
}

export function groupReservationsByDeparture(reservations: Reservation[]) {
  const grouped = new Map<string, Reservation[]>();

  for (const reservation of reservations) {
    if (!activeReservation(reservation)) continue;
    const key = groupKey(reservation);
    const current = grouped.get(key) ?? [];
    current.push(reservation);
    grouped.set(key, current);
  }

  return Array.from(grouped.entries())
    .map(([key, items]): DepartureManifestGroup => {
      const sorted = [...items].sort((a, b) => {
        const dateOrder = (a.createdAt ?? "").localeCompare(b.createdAt ?? "");
        return dateOrder || a.id.localeCompare(b.id);
      });
      const first = sorted[0];
      return {
        key,
        tripId: first.tripId,
        availabilityId: first.availabilityId,
        tripTitle: first.tripTitle ?? first.tripId,
        departureDate: first.departureDate,
        returnDate: first.returnDate,
        reservations: sorted,
        reservationCount: sorted.length,
        travellerCount: sorted.reduce((sum, reservation) => sum + (reservation.travellers?.length ?? reservation.partySize), 0)
      };
    })
    .sort((a, b) => {
      const dateOrder = (a.departureDate ?? "9999-12-31").localeCompare(b.departureDate ?? "9999-12-31");
      return dateOrder || a.tripTitle.localeCompare(b.tripTitle) || a.availabilityId.localeCompare(b.availabilityId);
    });
}

export function reservationsForDeparture(
  reservations: Reservation[],
  tripId: string,
  availabilityId: string
) {
  return reservations
    .filter((reservation) =>
      activeReservation(reservation) &&
      reservation.tripId === tripId &&
      reservation.availabilityId === availabilityId
    )
    .sort((a, b) => {
      const dateOrder = (a.createdAt ?? "").localeCompare(b.createdAt ?? "");
      return dateOrder || a.id.localeCompare(b.id);
    });
}

function travellerSort(a: ReservationTraveller, b: ReservationTraveller) {
  if (a.isLead !== b.isLead) return a.isLead ? -1 : 1;
  const last = a.lastName.localeCompare(b.lastName);
  return last || a.firstName.localeCompare(b.firstName) || a.id.localeCompare(b.id);
}

export function buildTravellerManifestRows(reservations: Reservation[]): TravellerManifestRow[] {
  const rows: TravellerManifestRow[] = [];

  for (const reservation of reservations.filter(activeReservation)) {
    for (const traveller of [...(reservation.travellers ?? [])].sort(travellerSort)) {
      rows.push({
        reservationId: reservation.id,
        reservationStatus: reservation.status,
        travellerId: traveller.id,
        firstName: traveller.firstName,
        lastName: traveller.lastName,
        isLead: traveller.isLead,
        dateOfBirth: traveller.dateOfBirth,
        ageAtDeparture: traveller.ageAtDeparture,
        nationality: traveller.nationality,
        pricingLabel: traveller.pricingLabel
      });
    }
  }

  return rows;
}

function travellerById(reservation: Reservation) {
  return new Map((reservation.travellers ?? []).map((traveller) => [traveller.id, traveller]));
}

export function buildRoomingListRows(reservations: Reservation[]): RoomingListRow[] {
  const rows: RoomingListRow[] = [];

  for (const reservation of reservations.filter(activeReservation)) {
    const travellers = travellerById(reservation);
    for (const booking of reservation.accommodationBookings ?? []) {
      booking.rooms.forEach((room, index) => {
        rows.push({
          reservationId: reservation.id,
          reservationStatus: reservation.status,
          componentId: booking.componentId,
          accommodationId: booking.accommodationId,
          accommodationName: booking.accommodationName,
          roomTypeId: booking.roomTypeId,
          roomTypeName: booking.roomTypeName,
          mealPlan: booking.mealPlan,
          checkInDate: booking.checkInDate,
          checkOutDate: booking.checkOutDate,
          nights: booking.nights,
          roomIndex: index + 1,
          roomAllocationId: room.id,
          travellers: room.travellerIds
            .map((travellerId) => travellers.get(travellerId))
            .filter((traveller): traveller is ReservationTraveller => Boolean(traveller))
            .sort(travellerSort)
            .map((traveller) => ({
              travellerId: traveller.id,
              firstName: traveller.firstName,
              lastName: traveller.lastName,
              isLead: traveller.isLead,
              ageAtDeparture: traveller.ageAtDeparture,
              nationality: traveller.nationality
            }))
        });
      });
    }
  }

  return rows.sort((a, b) =>
    a.accommodationName.localeCompare(b.accommodationName) ||
    a.checkInDate.localeCompare(b.checkInDate) ||
    a.roomTypeName.localeCompare(b.roomTypeName) ||
    a.reservationId.localeCompare(b.reservationId) ||
    a.roomIndex - b.roomIndex
  );
}
