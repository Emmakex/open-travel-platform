import type { ClientSession, Db } from "mongodb";
import type { Accommodation, AccommodationInventoryPeriod } from "@/domain/accommodation/types";
import type { Reservation, ReservationTraveller } from "@/domain/booking/types";
import type { TripAccommodationComponent } from "@/domain/travel/types";
import {
  accommodationBookingTotals,
  accommodationInventoryMovements,
  attachAccommodationInventory,
  buildAccommodationBookingPlan
} from "@/lib/accommodation-booking";
import { reallocateAccommodationBookingInventory } from "@/lib/accommodation-booking-inventory";
import {
  accommodationCollectionName,
  accommodationInventoryCollectionName
} from "@/lib/accommodations";

export async function reallocateReservationAccommodation(input: {
  database: Db;
  session: ClientSession;
  reservation: Reservation;
  newDepartureDate: string;
  travellers: ReservationTraveller[];
}) {
  const currentBookings = input.reservation.accommodationBookings ?? [];
  if (!currentBookings.length) return null;

  const accommodationIds = [...new Set(currentBookings.map((item) => item.accommodationId))];
  const [accommodations, inventoryDocuments] = await Promise.all([
    input.database
      .collection<Accommodation>(accommodationCollectionName)
      .find({ id: { $in: accommodationIds } }, { session: input.session })
      .toArray(),
    input.database
      .collection<AccommodationInventoryPeriod>(accommodationInventoryCollectionName)
      .find({ accommodationId: { $in: accommodationIds } }, { session: input.session })
      .toArray()
  ]);

  const components: TripAccommodationComponent[] = currentBookings.map((booking) => ({
    id: booking.componentId,
    accommodationId: booking.accommodationId,
    roomTypeId: booking.roomTypeId,
    checkInDay: booking.checkInDay,
    nights: booking.nights,
    mode: booking.mode
  }));
  const selectedOptionalComponentIds = currentBookings
    .filter((booking) => booking.mode === "optional")
    .map((booking) => booking.componentId);

  const pricingPlan = buildAccommodationBookingPlan({
    components,
    accommodations,
    departureDate: input.newDepartureDate,
    travellers: input.travellers,
    selectedOptionalComponentIds,
    reservationCurrency: input.reservation.currency,
    requirePublished: false
  });

  // During an amendment the reservation already owns its previous room blocks.
  // Credit those rooms while preflighting the replacement stay so a move within
  // the same inventory period does not require artificial duplicate capacity.
  const previousMovements = accommodationInventoryMovements(currentBookings);
  const inventoryByAccommodation = new Map<string, AccommodationInventoryPeriod[]>();
  for (const accommodationId of accommodationIds) {
    inventoryByAccommodation.set(
      accommodationId,
      inventoryDocuments
        .filter((period) => period.accommodationId === accommodationId)
        .map((period) => ({
          ...period,
          reserved: Math.max(0, period.reserved - (previousMovements.get(period.id) ?? 0))
        }))
    );
  }

  const bookings = attachAccommodationInventory(pricingPlan, inventoryByAccommodation);
  await reallocateAccommodationBookingInventory(
    input.database,
    input.session,
    currentBookings,
    bookings
  );

  return {
    bookings,
    ...accommodationBookingTotals(bookings)
  };
}
