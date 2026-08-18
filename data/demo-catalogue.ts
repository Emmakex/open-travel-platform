import type { TravelCatalogue } from "@/domain/travel/types";

export const demoCatalogue: TravelCatalogue = {
  destinations: [
    {
      id: "dest-barcelona",
      slug: "barcelona",
      name: "Barcelona",
      country: "Spain",
      region: "Catalonia",
      summary: "Architecture, Mediterranean culture and urban experiences in one compact destination.",
      featured: true
    },
    {
      id: "dest-peru",
      slug: "peru",
      name: "Peru",
      country: "Peru",
      region: "Andes & Pacific",
      summary: "High-altitude landscapes, living culture and routes connecting cities, mountains and heritage.",
      featured: true
    },
    {
      id: "dest-portugal",
      slug: "portugal",
      name: "Portugal",
      country: "Portugal",
      region: "Atlantic Europe",
      summary: "Coastal cities, gastronomy and flexible road-trip itineraries across a compact country.",
      featured: true
    }
  ],
  trips: [
    {
      id: "trip-barcelona-city",
      slug: "barcelona-city-break",
      destinationId: "dest-barcelona",
      title: "Barcelona City Break",
      summary: "A flexible four-day urban itinerary designed as reusable demo content for the starter.",
      durationDays: 4,
      fromPrice: 540,
      currency: "EUR",
      highlights: ["Modernist architecture", "Local neighbourhoods", "Mediterranean food"],
      featured: true
    },
    {
      id: "trip-peru-andes",
      slug: "peru-andes-discovery",
      destinationId: "dest-peru",
      title: "Peru Andes Discovery",
      summary: "A modular mountain and culture itinerary demonstrating longer multi-stop travel products.",
      durationDays: 10,
      fromPrice: 1640,
      currency: "EUR",
      highlights: ["Andean landscapes", "Cultural heritage", "Multi-stop itinerary"],
      featured: true
    },
    {
      id: "trip-portugal-road",
      slug: "portugal-atlantic-route",
      destinationId: "dest-portugal",
      title: "Portugal Atlantic Route",
      summary: "A seven-day sample route for demonstrating catalogue, pricing and itinerary presentation.",
      durationDays: 7,
      fromPrice: 890,
      currency: "EUR",
      highlights: ["Atlantic coast", "Historic cities", "Self-guided flexibility"],
      featured: true
    }
  ]
};
