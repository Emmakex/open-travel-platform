import type { Destination, Trip } from "@/domain/travel/types";
import type { TravelRepository } from "@/repositories/travel-repository";

export class HttpTravelRepository implements TravelRepository {
  constructor(private readonly baseUrl: string) {}

  private async request<T>(path: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 60 }
    });

    if (response.status === 404) {
      return null as T;
    }

    if (!response.ok) {
      throw new Error(`Travel API request failed with status ${response.status}`);
    }

    return response.json() as Promise<T>;
  }

  listDestinations() {
    return this.request<Destination[]>("/destinations");
  }

  getDestinationBySlug(slug: string) {
    return this.request<Destination | null>(`/destinations/${encodeURIComponent(slug)}`);
  }

  listTrips() {
    return this.request<Trip[]>("/trips");
  }

  getTripBySlug(slug: string) {
    return this.request<Trip | null>(`/trips/${encodeURIComponent(slug)}`);
  }
}
