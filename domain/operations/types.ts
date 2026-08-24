import type { ReservationAccommodationBooking, ReservationStatus } from "@/domain/booking/types";
import type { UserRole } from "@/domain/identity/types";

export type StaffRole = Extract<UserRole, "operator" | "admin">;

export interface ReservationStatusUpdate {
  reservationId: string;
  actorIdentityId: string;
  actorRole: StaffRole;
  status: ReservationStatus;
}

export interface OperationsAuditEvent {
  id: string;
  reservationId: string;
  actorIdentityId: string;
  actorRole: StaffRole;
  fromStatus: ReservationStatus;
  toStatus: ReservationStatus;
  occurredAt: string;
}

export type ReservationAmendmentType = "traveller-correction" | "departure-change";
export type TravellerCorrectionField = "firstName" | "lastName" | "nationality";
export type DepartureChangeField =
  | "availabilityId"
  | "departureDate"
  | "returnDate"
  | "unitPrice"
  | "totalPrice"
  | "inventorySpaces"
  | "accommodationTotal"
  | "accommodationAdditionalTotal";
export type ReservationAmendmentField = TravellerCorrectionField | DepartureChangeField;

export interface ReservationAmendmentChange {
  field: ReservationAmendmentField;
  before: string;
  after: string;
}

export interface ReservationInventoryMovement {
  fromAvailabilityId: string;
  toAvailabilityId: string;
  releasedSpaces: number;
  reservedSpaces: number;
}

export interface ReservationAmendment {
  id: string;
  reservationId: string;
  type: ReservationAmendmentType;
  travellerId?: string;
  actorIdentityId: string;
  actorRole: StaffRole;
  reason: string;
  changes: ReservationAmendmentChange[];
  priceDelta?: number;
  currency?: string;
  inventoryMovement?: ReservationInventoryMovement;
  /** Exact accommodation snapshots preserve the room allocation before and after a departure change. */
  accommodationBefore?: ReservationAccommodationBooking[];
  accommodationAfter?: ReservationAccommodationBooking[];
  occurredAt: string;
}

export interface TravellerCorrectionInput {
  reservationId: string;
  travellerId: string;
  actorIdentityId: string;
  actorRole: StaffRole;
  reason: string;
  firstName: string;
  lastName: string;
  nationality: string;
}

export interface DepartureChangeInput {
  reservationId: string;
  newAvailabilityId: string;
  actorIdentityId: string;
  actorRole: StaffRole;
  reason: string;
}

export interface OperationsSummary {
  total: number;
  pending: number;
  confirmed: number;
  cancelled: number;
}
