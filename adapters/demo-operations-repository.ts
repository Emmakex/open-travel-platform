import { randomUUID } from "node:crypto";
import type { Reservation, ReservationStatus } from "@/domain/booking/types";
import type { ReservationStatusUpdate } from "@/domain/operations/types";
import {
  readDemoOperationsAudit,
  writeDemoOperationsAudit
} from "@/lib/demo-operations-store";
import {
  readDemoReservations,
  writeDemoReservations
} from "@/lib/demo-reservation-store";
import type { OperationsRepository } from "@/repositories/operations-repository";

function canTransition(from: ReservationStatus, to: ReservationStatus) {
  if (from === "pending") return to === "confirmed" || to === "cancelled";
  if (from === "confirmed") return to === "cancelled";
  return false;
}

export class DemoOperationsRepository implements OperationsRepository {
  async listReservations() {
    return readDemoReservations();
  }

  async getReservation(reservationId: string) {
    const reservations = await readDemoReservations();
    return reservations.find((item) => item.id === reservationId) ?? null;
  }

  async getSummary() {
    const reservations = await readDemoReservations();

    return reservations.reduce(
      (summary, reservation) => {
        summary.total += 1;
        summary[reservation.status] += 1;
        return summary;
      },
      { total: 0, pending: 0, confirmed: 0, cancelled: 0 }
    );
  }

  async listAuditEvents() {
    const events = await readDemoOperationsAudit();
    return [...events].reverse();
  }

  async updateReservationStatus(input: ReservationStatusUpdate) {
    const reservations = await readDemoReservations();
    const index = reservations.findIndex((item) => item.id === input.reservationId);

    if (index < 0) return null;

    const current = reservations[index];
    if (current.status === input.status) return current;

    if (!canTransition(current.status, input.status)) {
      throw new Error(`Invalid reservation status transition: ${current.status} -> ${input.status}`);
    }

    const occurredAt = new Date().toISOString();
    const updated: Reservation = {
      ...current,
      status: input.status,
      updatedAt: occurredAt
    };

    const next = [...reservations];
    next[index] = updated;
    await writeDemoReservations(next);

    const audit = await readDemoOperationsAudit();
    await writeDemoOperationsAudit([
      ...audit,
      {
        id: `audit-${randomUUID()}`,
        reservationId: current.id,
        actorIdentityId: input.actorIdentityId,
        actorRole: input.actorRole,
        fromStatus: current.status,
        toStatus: input.status,
        occurredAt
      }
    ]);

    return updated;
  }
}
