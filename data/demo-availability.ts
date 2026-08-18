import type { AvailabilityWindow } from "@/domain/booking/types";

export const demoAvailability: AvailabilityWindow[] = [
  {
    id: "avail-barcelona-2026-10-08",
    tripId: "trip-barcelona-city",
    departureDate: "2026-10-08",
    returnDate: "2026-10-12",
    remainingSpaces: 8
  },
  {
    id: "avail-barcelona-2026-11-12",
    tripId: "trip-barcelona-city",
    departureDate: "2026-11-12",
    returnDate: "2026-11-16",
    remainingSpaces: 6
  },
  {
    id: "avail-peru-2027-04-05",
    tripId: "trip-peru-andes",
    departureDate: "2027-04-05",
    returnDate: "2027-04-15",
    remainingSpaces: 10
  },
  {
    id: "avail-peru-2027-06-07",
    tripId: "trip-peru-andes",
    departureDate: "2027-06-07",
    returnDate: "2027-06-17",
    remainingSpaces: 7
  },
  {
    id: "avail-portugal-2026-09-19",
    tripId: "trip-portugal-road",
    departureDate: "2026-09-19",
    returnDate: "2026-09-26",
    remainingSpaces: 5
  },
  {
    id: "avail-portugal-2026-10-17",
    tripId: "trip-portugal-road",
    departureDate: "2026-10-17",
    returnDate: "2026-10-24",
    remainingSpaces: 8
  }
];
