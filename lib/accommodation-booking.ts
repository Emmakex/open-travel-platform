import type {
  ReservationAccommodationBooking,
  ReservationAccommodationRoomAllocation,
  ReservationTraveller
} from "@/domain/booking/types";
import type {
  Accommodation,
  AccommodationInventoryPeriod,
  AccommodationRoomType
} from "@/domain/accommodation/types";
import type { TripAccommodationComponent } from "@/domain/travel/types";
import { addIsoDays, calculateAccommodationStayPrice } from "@/lib/accommodation-pricing";
import { calculateAgeOnDate } from "@/lib/traveller-pricing";

export type AccommodationBookingErrorCode =
  | "ACCOMMODATION_CONFIGURATION_INVALID"
  | "ACCOMMODATION_OCCUPANCY_UNAVAILABLE"
  | "ACCOMMODATION_PRICING_UNAVAILABLE"
  | "ACCOMMODATION_INVENTORY_UNAVAILABLE"
  | "ACCOMMODATION_CURRENCY_MISMATCH";

export class AccommodationBookingError extends Error {
  constructor(public code: AccommodationBookingErrorCode, message: string) {
    super(message);
    this.name = "AccommodationBookingError";
  }
}

type BookingTraveller = Pick<ReservationTraveller, "id" | "firstName" | "lastName" | "dateOfBirth">;

type RoomTraveller = BookingTraveller & {
  age: number;
  hotelChild: boolean;
};

export type AccommodationBookingPlanInput = {
  components: TripAccommodationComponent[];
  accommodations: Accommodation[];
  departureDate: string;
  travellers: BookingTraveller[];
  selectedOptionalComponentIds?: string[];
  reservationCurrency: string;
};

function classifyTravellers(room: AccommodationRoomType, travellers: BookingTraveller[], checkInDate: string) {
  const result: RoomTraveller[] = [];
  for (const traveller of travellers) {
    const age = calculateAgeOnDate(traveller.dateOfBirth, checkInDate);
    if (age === null) {
      throw new AccommodationBookingError(
        "ACCOMMODATION_OCCUPANCY_UNAVAILABLE",
        "A traveller age could not be calculated for the accommodation check-in date."
      );
    }
    const hotelChild = room.occupancy.childMaxAge !== undefined && age <= room.occupancy.childMaxAge;
    result.push({ ...traveller, age, hotelChild });
  }
  return result;
}

function findRoomCount(room: AccommodationRoomType, adults: number, children: number, total: number) {
  for (let count = 1; count <= total; count += 1) {
    if (adults < count * room.occupancy.minAdults) continue;
    if (adults > count * room.occupancy.maxAdults) continue;
    if (children > count * room.occupancy.maxChildren) continue;
    if (total > count * room.occupancy.maxOccupancy) continue;
    return count;
  }
  return null;
}

export function allocateTravellersToRooms(
  room: AccommodationRoomType,
  travellers: BookingTraveller[],
  checkInDate: string
): Array<{ travellerIds: string[]; adults: number; childAges: number[] }> {
  if (!travellers.length) {
    throw new AccommodationBookingError(
      "ACCOMMODATION_OCCUPANCY_UNAVAILABLE",
      "Accommodation cannot be allocated without travellers."
    );
  }

  const classified = classifyTravellers(room, travellers, checkInDate);
  const adults = classified.filter((traveller) => !traveller.hotelChild);
  const children = classified.filter((traveller) => traveller.hotelChild);
  const roomCount = findRoomCount(room, adults.length, children.length, classified.length);
  if (!roomCount) {
    throw new AccommodationBookingError(
      "ACCOMMODATION_OCCUPANCY_UNAVAILABLE",
      "The traveller composition cannot be distributed within the selected room occupancy rules."
    );
  }

  const allocations = Array.from({ length: roomCount }, () => ({
    travellers: [] as RoomTraveller[],
    adults: 0,
    children: 0
  }));

  let adultIndex = 0;
  for (const allocation of allocations) {
    for (let required = 0; required < room.occupancy.minAdults; required += 1) {
      const traveller = adults[adultIndex++];
      if (!traveller) {
        throw new AccommodationBookingError(
          "ACCOMMODATION_OCCUPANCY_UNAVAILABLE",
          "Not enough adult-occupancy travellers are available for the selected room type."
        );
      }
      allocation.travellers.push(traveller);
      allocation.adults += 1;
    }
  }

  for (; adultIndex < adults.length; adultIndex += 1) {
    const target = allocations.find((allocation) =>
      allocation.adults < room.occupancy.maxAdults &&
      allocation.travellers.length < room.occupancy.maxOccupancy
    );
    if (!target) {
      throw new AccommodationBookingError(
        "ACCOMMODATION_OCCUPANCY_UNAVAILABLE",
        "Adult occupancy exceeds the selected room limits."
      );
    }
    target.travellers.push(adults[adultIndex]);
    target.adults += 1;
  }

  for (const child of children) {
    const target = allocations.find((allocation) =>
      allocation.children < room.occupancy.maxChildren &&
      allocation.travellers.length < room.occupancy.maxOccupancy
    );
    if (!target) {
      throw new AccommodationBookingError(
        "ACCOMMODATION_OCCUPANCY_UNAVAILABLE",
        "Child occupancy exceeds the selected room limits."
      );
    }
    target.travellers.push(child);
    target.children += 1;
  }

  return allocations.map((allocation) => ({
    travellerIds: allocation.travellers.map((traveller) => traveller.id),
    adults: allocation.adults,
    childAges: allocation.travellers.filter((traveller) => traveller.hotelChild).map((traveller) => traveller.age)
  }));
}

export function buildAccommodationBookingPlan(input: AccommodationBookingPlanInput) {
  const accommodationById = new Map(input.accommodations.map((item) => [item.id, item]));
  const selectedOptional = new Set(input.selectedOptionalComponentIds ?? []);
  const selectedComponents = input.components.filter((component) =>
    component.mode === "included" || selectedOptional.has(component.id)
  );
  const bookings: ReservationAccommodationBooking[] = [];

  for (const component of selectedComponents) {
    const accommodation = accommodationById.get(component.accommodationId);
    const room = accommodation?.roomTypes.find((item) => item.id === component.roomTypeId);
    if (!accommodation || !room || accommodation.publicationStatus !== "published") {
      throw new AccommodationBookingError(
        "ACCOMMODATION_CONFIGURATION_INVALID",
        "A selected trip accommodation is no longer available for booking."
      );
    }
    if (accommodation.currency !== input.reservationCurrency) {
      throw new AccommodationBookingError(
        "ACCOMMODATION_CURRENCY_MISMATCH",
        "Accommodation and trip currencies must match before the accommodation can be booked."
      );
    }

    const checkInDate = addIsoDays(input.departureDate, component.checkInDay - 1);
    const checkOutDate = checkInDate ? addIsoDays(checkInDate, component.nights) : null;
    if (!checkInDate || !checkOutDate) {
      throw new AccommodationBookingError(
        "ACCOMMODATION_CONFIGURATION_INVALID",
        "Accommodation stay dates could not be calculated."
      );
    }

    const roomAllocations = allocateTravellersToRooms(room, input.travellers, checkInDate);
    const pricedRooms: ReservationAccommodationRoomAllocation[] = roomAllocations.map((allocation, index) => {
      const price = calculateAccommodationStayPrice({
        accommodation,
        roomTypeId: room.id,
        checkInDate,
        nights: component.nights,
        adults: allocation.adults,
        childAges: allocation.childAges
      });
      if (!price) {
        throw new AccommodationBookingError(
          "ACCOMMODATION_PRICING_UNAVAILABLE",
          "Accommodation pricing could not be calculated for the selected room distribution."
        );
      }
      return {
        id: `${component.id}-room-${index + 1}`,
        travellerIds: allocation.travellerIds,
        adults: allocation.adults,
        childAges: allocation.childAges,
        basePrice: price.baseTotal,
        seasonalAdjustment: price.seasonalAdjustment,
        occupancyAdjustment: price.occupancyAdjustment,
        totalPrice: price.total
      };
    });
    const totalPrice = Number(pricedRooms.reduce((sum, item) => sum + item.totalPrice, 0).toFixed(2));

    bookings.push({
      componentId: component.id,
      accommodationId: accommodation.id,
      accommodationSlug: accommodation.slug,
      accommodationName: accommodation.name,
      roomTypeId: room.id,
      roomTypeName: room.name,
      mealPlan: room.mealPlan,
      mode: component.mode,
      checkInDay: component.checkInDay,
      nights: component.nights,
      checkInDate,
      checkOutDate,
      currency: accommodation.currency,
      rooms: pricedRooms,
      totalPrice,
      amountAddedToReservation: component.mode === "optional" ? totalPrice : 0,
      inventory: []
    });
  }

  return bookings;
}

function stayNightDates(checkInDate: string, nights: number) {
  return Array.from({ length: nights }, (_, index) => addIsoDays(checkInDate, index)).filter(
    (value): value is string => Boolean(value)
  );
}

export function attachAccommodationInventory(
  bookings: ReservationAccommodationBooking[],
  inventoryByAccommodation: Map<string, AccommodationInventoryPeriod[]>
) {
  return bookings.map((booking) => {
    const periods = inventoryByAccommodation.get(booking.accommodationId) ?? [];
    const matchingPeriods = periods.filter((period) =>
      period.roomTypeId === booking.roomTypeId && period.status === "open"
    );
    const usedPeriodIds = new Set<string>();
    for (const nightDate of stayNightDates(booking.checkInDate, booking.nights)) {
      const period = matchingPeriods.find((item) => nightDate >= item.startDate && nightDate <= item.endDate);
      if (!period) {
        throw new AccommodationBookingError(
          "ACCOMMODATION_INVENTORY_UNAVAILABLE",
          "Accommodation inventory does not cover every night of the selected stay."
        );
      }
      if (period.capacity - period.reserved < booking.rooms.length) {
        throw new AccommodationBookingError(
          "ACCOMMODATION_INVENTORY_UNAVAILABLE",
          "The selected accommodation no longer has enough rooms available."
        );
      }
      usedPeriodIds.add(period.id);
    }
    return {
      ...booking,
      inventory: [...usedPeriodIds].map((periodId) => ({ periodId, rooms: booking.rooms.length }))
    };
  });
}

export function accommodationInventoryMovements(bookings: ReservationAccommodationBooking[]) {
  const movements = new Map<string, number>();
  for (const booking of bookings) {
    for (const item of booking.inventory) {
      movements.set(item.periodId, (movements.get(item.periodId) ?? 0) + item.rooms);
    }
  }
  return movements;
}

export function accommodationBookingTotals(bookings: ReservationAccommodationBooking[]) {
  return {
    accommodationTotal: Number(bookings.reduce((sum, item) => sum + item.totalPrice, 0).toFixed(2)),
    accommodationAdditionalTotal: Number(bookings.reduce((sum, item) => sum + item.amountAddedToReservation, 0).toFixed(2))
  };
}
