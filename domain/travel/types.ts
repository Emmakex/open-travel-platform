export type CurrencyCode = "EUR" | "USD" | "GBP";

export type Destination = {
  id: string;
  slug: string;
  name: string;
  country: string;
  region: string;
  summary: string;
  featured: boolean;
};

export type Trip = {
  id: string;
  slug: string;
  destinationId: string;
  title: string;
  summary: string;
  durationDays: number;
  fromPrice: number;
  currency: CurrencyCode;
  highlights: string[];
  featured: boolean;
};

export type TravelCatalogue = {
  destinations: Destination[];
  trips: Trip[];
};
