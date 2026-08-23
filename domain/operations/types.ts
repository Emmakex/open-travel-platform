import type { ReservationStatus } from "@/domain/booking/types";
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

export type ReservationAmendmentType = "traveller-correction";
export type TravellerCorrectionField = "firstName" | "lastName" | "nationality";

export interface ReservationAmendmentChange {
  field: TravellerCorrectionField;
  before: string;
  after: string;
}

export interface ReservationAmendment {
  id: string;
  reservationId: string;
  type: ReservationAmendmentType;
  travellerId: string;
  actorIdentityId: string;
  actorRole: StaffRole;
  reason: string;
  changes: ReservationAmendmentChange[];
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

export interface OperationsSummary {
  total: number;
  pending: number;
  confirmed: number;
  cancelled: number;
}
