import type { TravelMedia } from "@/domain/travel/types";

const journeyMap: TravelMedia = {
  src: "/media/journey-map.svg",
  alt: "Kairoseth Travel route illustration"
};

export const demoMedia = {
  barcelona: {
    cover: { src: "/media/barcelona-cover.svg", alt: "Barcelona Mediterranean skyline" },
    trip: { src: "/media/barcelona-trip.svg", alt: "Barcelona city break" },
    gallery: [
      { src: "/media/barcelona-cover.svg", alt: "Barcelona Mediterranean skyline" },
      { src: "/media/barcelona-trip.svg", alt: "Barcelona architecture and city atmosphere" },
      journeyMap
    ]
  },
  peru: {
    cover: { src: "/media/peru-cover.svg", alt: "Peruvian Andes landscape" },
    trip: { src: "/media/peru-trip.svg", alt: "Peru Andes discovery" },
    gallery: [
      { src: "/media/peru-cover.svg", alt: "Peruvian Andes landscape" },
      { src: "/media/peru-trip.svg", alt: "Andean heritage and mountain route" },
      journeyMap
    ]
  },
  portugal: {
    cover: { src: "/media/portugal-cover.svg", alt: "Portugal Atlantic coast" },
    trip: { src: "/media/portugal-trip.svg", alt: "Portugal Atlantic road trip" },
    gallery: [
      { src: "/media/portugal-cover.svg", alt: "Portugal Atlantic coast" },
      { src: "/media/portugal-trip.svg", alt: "Portugal coastal route and historic cities" },
      journeyMap
    ]
  }
} as const;
