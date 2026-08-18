import type { Reservation } from "@/domain/booking/types";
import type {
  OperationsAuditEvent,
  OperationsSummary,
  ReservationStatusUpdate
} from "@/domain/operations/types";

export interface OperationsRepository {
  listReservations(): Promise<Reservation[]>;
  getReservation(reservationId: string): Promise<Reservation | null>;
  getSummary(): Promise<OperationsSummary>;
  listAuditEvents(): Promise<OperationsAuditEvent[]>;
  updateReservationStatus(input: ReservationStatusUpdate): Promise<Reservation | null>;
}
