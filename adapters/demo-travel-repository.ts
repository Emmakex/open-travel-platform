import { demoCatalogue } from "@/data/demo-catalogue";
import type { TravelRepository } from "@/repositories/travel-repository";

export class DemoTravelRepository implements TravelRepository {
  async listDestinations() {
    return demoCatalogue.destinations;
  }

  async getDestinationBySlug(slug: string) {
    return demoCatalogue.destinations.find((destination) => destination.slug === slug) ?? null;
  }

  async listTrips() {
    return demoCatalogue.trips;
  }

  async getTripBySlug(slug: string) {
    return demoCatalogue.trips.find((trip) => trip.slug === slug) ?? null;
  }
}
