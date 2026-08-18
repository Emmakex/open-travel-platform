import { DemoOperationsRepository } from "@/adapters/demo-operations-repository";
import type { Reservation } from "@/domain/booking/types";
import type { ReservationStatusUpdate } from "@/domain/operations/types";
import { operationsConfig } from "@/lib/operations-config";
import type { OperationsRepository } from "@/repositories/operations-repository";

class DisabledOperationsRepository implements OperationsRepository {
  async listReservations() {
    return [];
  }

  async getReservation() {
    return null;
  }

  async getSummary() {
    return { total: 0, pending: 0, confirmed: 0, cancelled: 0 };
  }

  async listAuditEvents() {
    return [];
  }

  async updateReservationStatus(_input: ReservationStatusUpdate): Promise<Reservation | null> {
    throw new Error("Operations are disabled in this deployment.");
  }
}

export function getOperationsRepository(): OperationsRepository {
  if (operationsConfig.mode === "demo") {
    return new DemoOperationsRepository();
  }

  return new DisabledOperationsRepository();
}
