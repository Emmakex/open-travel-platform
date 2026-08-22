import type { TravelCatalogue } from "@/domain/travel/types";

export const demoCatalogue: TravelCatalogue = {
  destinations: [
    {
      id: "dest-barcelona",
      slug: "barcelona",
      name: "Barcelona",
      country: "Spain",
      region: "Catalonia",
      summary: "Mediterranean energy, modernist architecture, neighbourhood life and a food scene made for slow discovery.",
      featured: true
    },
    {
      id: "dest-peru",
      slug: "peru",
      name: "Peru",
      country: "Peru",
      region: "Andes & Pacific",
      summary: "Ancient heritage, dramatic Andean landscapes and living traditions across one of South America's most diverse journeys.",
      featured: true
    },
    {
      id: "dest-portugal",
      slug: "portugal",
      name: "Portugal",
      country: "Portugal",
      region: "Atlantic Europe",
      summary: "Atlantic coastlines, historic cities, local gastronomy and relaxed routes through a compact and varied country.",
      featured: true
    }
  ],
  trips: [
    {
      id: "trip-barcelona-city",
      slug: "barcelona-city-break",
      destinationId: "dest-barcelona",
      title: "Barcelona City Break",
      summary: "Four flexible days combining Barcelona's architecture, neighbourhood character and Mediterranean flavours.",
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
      summary: "Ten days through Andean landscapes, cultural heritage and memorable multi-stop experiences across Peru.",
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
      summary: "A seven-day journey pairing Atlantic scenery, historic cities and the freedom of a flexible road-trip rhythm.",
      durationDays: 7,
      fromPrice: 890,
      currency: "EUR",
      highlights: ["Atlantic coast", "Historic cities", "Self-guided flexibility"],
      featured: true
    }
  ]
};
