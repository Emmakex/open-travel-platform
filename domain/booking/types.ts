export type ReservationStatus = "pending" | "confirmed" | "cancelled";

export interface AvailabilityWindow {
  id: string;
  tripId: string;
  departureDate: string;
  returnDate: string;
  remainingSpaces: number;
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
}

export interface CreateReservationInput {
  identityId: string;
  tripId: string;
  availabilityId: string;
  partySize: number;
  unitPrice: number;
  totalPrice: number;
  currency: string;
}
