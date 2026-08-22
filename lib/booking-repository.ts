import { DemoBookingRepository } from "@/adapters/demo-booking-repository";
import { MongoBookingRepository } from "@/adapters/mongo-booking-repository";
import type { CreateReservationInput, Reservation } from "@/domain/booking/types";
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

  async createReservation(_input: CreateReservationInput): Promise<Reservation> {
    throw new Error("Booking is disabled in this deployment.");
  }

  async cancelReservation() {
    return null;
  }
}

export function getBookingRepository(): BookingRepository {
  if (bookingConfig.mode === "mongodb") {
    return new MongoBookingRepository();
  }

  if (bookingConfig.mode === "demo") {
    return new DemoBookingRepository();
  }

  return new DisabledBookingRepository();
}
