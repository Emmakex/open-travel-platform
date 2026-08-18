import { DemoBookingRepository } from "@/adapters/demo-booking-repository";
import type { CreateReservationInput } from "@/domain/booking/types";
import { bookingConfig } from "@/lib/booking-config";
import type { BookingRepository } from "@/repositories/booking-repository";

class DisabledBookingRepository implements BookingRepository {
  async listAvailability() {
    return [];
  }

  async listReservations() {
    return [];
  }

  async getReservation() {
    return null;
  }

  async createReservation(_input: CreateReservationInput) {
    throw new Error("Booking is disabled in this deployment.");
  }
}

export function getBookingRepository(): BookingRepository {
  if (bookingConfig.mode === "demo") {
    return new DemoBookingRepository();
  }

  return new DisabledBookingRepository();
}
