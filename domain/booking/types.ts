export type ReservationStatus = "pending" | "confirmed" | "cancelled";
export type TripDepartureStatus = "open" | "closed" | "sold-out";
export type GuardianRelationship = "parent" | "legal-guardian" | "other";

export interface TripDeparture {
  id: string;
  tripId: string;
  departureDate: string;
  returnDate: string;
  capacity: number;
  reservedSpaces: number;
  status: TripDepartureStatus;
  unitPrice?: number;
  travellerPrices?: Record<string, number>;
}

export interface AvailabilityWindow {
  id: string;
  tripId: string;
  departureDate: string;
  returnDate: string;
  remainingSpaces: number;
  unitPrice?: number;
  travellerPrices?: Record<string, number>;
}

export interface ReservationTraveller {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  nationality: string;
  isLead: boolean;
  guardianTravellerId?: string;
  guardianRelationship?: GuardianRelationship;
  ageAtDeparture: number;
  pricingBandId: string;
  pricingCode: string;
  pricingLabel: string;
  unitPrice: number;
  consumesInventory: boolean;
}

export interface Reservation {
  id: string;
  identityId: string;
  tripId: string;
  availabilityId: string;
  partySize: number;
  inventorySpaces?: number;
  travellers?: ReservationTraveller[];
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
  inventorySpaces?: number;
  travellers?: ReservationTraveller[];
  unitPrice: number;
  totalPrice: number;
  currency: string;
  tripTitle?: string;
  departureDate?: string;
  returnDate?: string;
}
