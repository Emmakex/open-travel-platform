import type { TravellerRequirementsProfile } from "@/domain/traveller/types";

export type ReservationStatus = "pending" | "confirmed" | "cancelled";
export type TripDepartureStatus = "open" | "closed" | "sold-out";
export type GuardianRelationship = "parent" | "legal-guardian" | "other";
export type PaymentTermsMode = "full" | "deposit" | "installments";
export type DepositCalculationType = "fixed" | "percentage";

export interface ReservationPaymentInstallment {
  id: string;
  label: string;
  labelEs?: string;
  amount: number;
  dueDate?: string;
}

export interface ReservationPaymentTerms {
  mode: PaymentTermsMode;
  totalAmount: number;
  currency: string;
  depositType?: DepositCalculationType;
  depositValue?: number;
  installments: ReservationPaymentInstallment[];
  configuredAt: string;
  configuredBy?: string;
}

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
  pricingLabelEs?: string;
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
  paymentTerms?: ReservationPaymentTerms;
  /** Snapshot of post-purchase traveller fields required when this reservation was created. */
  travellerRequirements?: TravellerRequirementsProfile;
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
  travellerRequirements?: TravellerRequirementsProfile;
}
