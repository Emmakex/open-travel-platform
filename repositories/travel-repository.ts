import type { Destination, Trip } from "@/domain/travel/types";

export interface TravelRepository {
  listDestinations(): Promise<Destination[]>;
  getDestinationBySlug(slug: string): Promise<Destination | null>;
  listTrips(): Promise<Trip[]>;
  getTripBySlug(slug: string): Promise<Trip | null>;
}
