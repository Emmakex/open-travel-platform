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

export interface OperationsSummary {
  total: number;
  pending: number;
  confirmed: number;
  cancelled: number;
}
