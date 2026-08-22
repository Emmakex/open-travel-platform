import { demoCatalogue } from "@/data/demo-catalogue";
import { demoMedia } from "@/data/demo-media";
import type { Destination, Trip } from "@/domain/travel/types";
import type { TravelRepository } from "@/repositories/travel-repository";

const destinationMediaBySlug: Record<string, (typeof demoMedia)[keyof typeof demoMedia]> = {
  barcelona: demoMedia.barcelona,
  peru: demoMedia.peru,
  portugal: demoMedia.portugal
};

const tripMediaBySlug: Record<string, (typeof demoMedia)[keyof typeof demoMedia]> = {
  "barcelona-city-break": demoMedia.barcelona,
  "peru-andes-discovery": demoMedia.peru,
  "portugal-atlantic-route": demoMedia.portugal
};

function withDestinationMedia(destination: Destination): Destination {
  const media = destinationMediaBySlug[destination.slug];
  if (!media) return destination;

  return {
    ...destination,
    coverImage: media.cover,
    gallery: [...media.gallery]
  };
}

function withTripMedia(trip: Trip): Trip {
  const media = tripMediaBySlug[trip.slug];
  if (!media) return trip;

  return {
    ...trip,
    coverImage: media.trip,
    gallery: [...media.gallery]
  };
}

export class DemoTravelRepository implements TravelRepository {
  async listDestinations() {
    return demoCatalogue.destinations.map(withDestinationMedia);
  }

  async getDestinationBySlug(slug: string) {
    const destination = demoCatalogue.destinations.find((item) => item.slug === slug);
    return destination ? withDestinationMedia(destination) : null;
  }

  async listTrips() {
    return demoCatalogue.trips.map(withTripMedia);
  }

  async getTripBySlug(slug: string) {
    const trip = demoCatalogue.trips.find((item) => item.slug === slug);
    return trip ? withTripMedia(trip) : null;
  }
}
