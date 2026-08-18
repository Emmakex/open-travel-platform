import type {
  AvailabilityWindow,
  CreateReservationInput,
  Reservation
} from "@/domain/booking/types";

export interface BookingRepository {
  listAvailability(tripId: string): Promise<AvailabilityWindow[]>;
  listReservations(identityId: string): Promise<Reservation[]>;
  getReservation(identityId: string, reservationId: string): Promise<Reservation | null>;
  createReservation(input: CreateReservationInput): Promise<Reservation>;
}
