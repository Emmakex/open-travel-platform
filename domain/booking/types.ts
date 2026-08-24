import type { ReservationChangePolicy } from "@/domain/operations/change-policy";
import type { TravellerRequirementsProfile } from "@/domain/traveller/types";
import type { AccommodationMealPlan } from "@/domain/accommodation/types";
import type { TripAccommodationMode } from "@/domain/travel/types";

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

export interface ReservationAccommodationInventoryAllocation {
  periodId: string;
  rooms: number;
}

export interface ReservationAccommodationRoomAllocation {
  id: string;
  travellerIds: string[];
  adults: number;
  childAges: number[];
  basePrice: number;
  seasonalAdjustment: number;
  occupancyAdjustment: number;
  totalPrice: number;
}

export interface ReservationAccommodationBooking {
  componentId: string;
  accommodationId: string;
  accommodationSlug?: string;
  accommodationName: string;
  roomTypeId: string;
  roomTypeName: string;
  mealPlan?: AccommodationMealPlan;
  mode: TripAccommodationMode;
  checkInDay: number;
  nights: number;
  checkInDate: string;
  checkOutDate: string;
  currency: string;
  rooms: ReservationAccommodationRoomAllocation[];
  totalPrice: number;
  /** Included stays are priced/snapshotted but not added again to the trip fare. */
  amountAddedToReservation: number;
  inventory: ReservationAccommodationInventoryAllocation[];
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
  /** Traveller/package fare before optional accommodation additions. */
  tripPriceTotal?: number;
  /** Sum of all selected accommodation values, including included stays. */
  accommodationTotal?: number;
  /** Only optional accommodation amounts added on top of the trip fare. */
  accommodationAdditionalTotal?: number;
  accommodationBookings?: ReservationAccommodationBooking[];
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
  /** Snapshot of amendment/cancellation rules that applied when this reservation was created. */
  changePolicy?: ReservationChangePolicy;
}

export interface CreateReservationInput {
  identityId: string;
  tripId: string;
  availabilityId: string;
  partySize: number;
  inventorySpaces?: number;
  travellers?: ReservationTraveller[];
  unitPrice: number;
  tripPriceTotal?: number;
  accommodationTotal?: number;
  accommodationAdditionalTotal?: number;
  accommodationBookings?: ReservationAccommodationBooking[];
  totalPrice: number;
  currency: string;
  tripTitle?: string;
  departureDate?: string;
  returnDate?: string;
  travellerRequirements?: TravellerRequirementsProfile;
  changePolicy?: ReservationChangePolicy;
}
