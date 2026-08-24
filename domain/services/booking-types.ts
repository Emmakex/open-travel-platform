import type { ReservationTraveller } from "@/domain/booking/types";
import type { ReservationChangePolicy } from "@/domain/operations/change-policy";
import type { TravelServicePricingMode, TravelServiceType } from "@/domain/services/types";
import type { TravellerRequirementsProfile } from "@/domain/traveller/types";
import type { CurrencyCode } from "@/domain/travel/types";

export type ServiceReservationStatus = "pending" | "confirmed" | "cancelled";

export type InsuranceTripDetails = {
  destination: string;
  startDate: string;
  endDate: string;
  insuredAmount?: number;
};

export type ServiceReservationStatusEvent = {
  id: string;
  fromStatus: ServiceReservationStatus;
  toStatus: ServiceReservationStatus;
  actorType: "customer" | "staff";
  actorId: string;
  at: string;
};

export type ServiceReservation = {
  id: string;
  identityId: string;
  serviceId: string;
  serviceType: TravelServiceType;
  serviceSlug: string;
  serviceTitle: string;
  pricingMode: TravelServicePricingMode;
  currency: CurrencyCode;
  status: ServiceReservationStatus;
  availabilityId?: string;
  serviceDate?: string;
  startTime?: string;
  endTime?: string;
  partySize: number;
  inventoryUnits: number;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  travellers: ReservationTraveller[];
  insuranceTrip?: InsuranceTripDetails;
  relatedReservationId?: string;
  statusHistory?: ServiceReservationStatusEvent[];
  /** Snapshot of post-purchase traveller fields required when this reservation was created. */
  travellerRequirements?: TravellerRequirementsProfile;
  /** Snapshot of amendment/cancellation rules that applied when this service reservation was created. */
  changePolicy?: ReservationChangePolicy;
  createdAt: string;
  updatedAt?: string;
};

export type CreateServiceReservationInput = Omit<
  ServiceReservation,
  "id" | "status" | "statusHistory" | "createdAt" | "updatedAt"
>;
