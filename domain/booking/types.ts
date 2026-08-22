export type ReservationStatus = "pending" | "confirmed" | "cancelled";
export type TripDepartureStatus = "open" | "closed" | "sold-out";

export interface TripDeparture {
  id: string;
  tripId: string;
  departureDate: string;
  returnDate: string;
  capacity: number;
  reservedSpaces: number;
  status: TripDepartureStatus;
  unitPrice?: number;
}

export interface AvailabilityWindow {
  id: string;
  tripId: string;
  departureDate: string;
  returnDate: string;
  remainingSpaces: number;
  unitPrice?: number;
}

export interface Reservation {
  id: string;
  identityId: string;
  tripId: string;
  availabilityId: string;
  partySize: number;
  unitPrice: number;
  totalPrice: number;
  currency: string;
  status: ReservationStatus;
  createdAt: string;
  updatedAt?: string;
  tripTitle?: string;
  departureDate?: string;
  returnDate?: string;
}

export interface CreateReservationInput {
  identityId: string;
  tripId: string;
  availabilityId: string;
  partySize: number;
  unitPrice: number;
  totalPrice: number;
  currency: string;
  tripTitle?: string;
  departureDate?: string;
  returnDate?: string;
}
