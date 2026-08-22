import type { TravelMedia } from "@/domain/travel/types";

const demoCredit = "Kairoseth demo artwork";

const journeyMap: TravelMedia = {
  src: "/media/journey-map.svg",
  alt: "Kairoseth Travel route illustration",
  width: 1600,
  height: 1000,
  focalPoint: "center",
  credit: demoCredit
};

export const demoMedia = {
  barcelona: {
    cover: {
      src: "/media/barcelona-cover.svg",
      alt: "Barcelona Mediterranean skyline",
      width: 1600,
      height: 1000,
      focalPoint: "center",
      credit: demoCredit
    },
    trip: {
      src: "/media/barcelona-trip.svg",
      alt: "Barcelona city break",
      width: 1600,
      height: 1000,
      focalPoint: "center",
      credit: demoCredit
    },
    gallery: [
      {
        src: "/media/barcelona-cover.svg",
        alt: "Barcelona Mediterranean skyline",
        width: 1600,
        height: 1000,
        focalPoint: "center",
        credit: demoCredit
      },
      {
        src: "/media/barcelona-trip.svg",
        alt: "Barcelona architecture and city atmosphere",
        width: 1600,
        height: 1000,
        focalPoint: "center",
        credit: demoCredit
      },
      journeyMap
    ]
  },
  peru: {
    cover: {
      src: "/media/peru-cover.svg",
      alt: "Peruvian Andes landscape",
      width: 1600,
      height: 1000,
      focalPoint: "center",
      credit: demoCredit
    },
    trip: {
      src: "/media/peru-trip.svg",
      alt: "Peru Andes discovery",
      width: 1600,
      height: 1000,
      focalPoint: "center",
      credit: demoCredit
    },
    gallery: [
      {
        src: "/media/peru-cover.svg",
        alt: "Peruvian Andes landscape",
        width: 1600,
        height: 1000,
        focalPoint: "center",
        credit: demoCredit
      },
      {
        src: "/media/peru-trip.svg",
        alt: "Andean heritage and mountain route",
        width: 1600,
        height: 1000,
        focalPoint: "center",
        credit: demoCredit
      },
      journeyMap
    ]
  },
  portugal: {
    cover: {
      src: "/media/portugal-cover.svg",
      alt: "Portugal Atlantic coast",
      width: 1600,
      height: 1000,
      focalPoint: "center",
      credit: demoCredit
    },
    trip: {
      src: "/media/portugal-trip.svg",
      alt: "Portugal Atlantic road trip",
      width: 1600,
      height: 1000,
      focalPoint: "center",
      credit: demoCredit
    },
    gallery: [
      {
        src: "/media/portugal-cover.svg",
        alt: "Portugal Atlantic coast",
        width: 1600,
        height: 1000,
        focalPoint: "center",
        credit: demoCredit
      },
      {
        src: "/media/portugal-trip.svg",
        alt: "Portugal coastal route and historic cities",
        width: 1600,
        height: 1000,
        focalPoint: "center",
        credit: demoCredit
      },
      journeyMap
    ]
  }
} as const;
