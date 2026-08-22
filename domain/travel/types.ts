export type CurrencyCode = "EUR" | "USD" | "GBP";
export type TravelLocale = "en" | "es";

export type TripDay = {
  day: number;
  title: string;
  summary: string;
};

export type DestinationTranslation = {
  name?: string;
  country?: string;
  region?: string;
  summary?: string;
};

export type TripTranslation = {
  title?: string;
  summary?: string;
  highlights?: string[];
  itinerary?: TripDay[];
  included?: string[];
  notIncluded?: string[];
};

export type Destination = {
  id: string;
  slug: string;
  name: string;
  country: string;
  region: string;
  summary: string;
  featured: boolean;
  translations?: Partial<Record<TravelLocale, DestinationTranslation>>;
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
  itinerary?: TripDay[];
  included?: string[];
  notIncluded?: string[];
  featured: boolean;
  translations?: Partial<Record<TravelLocale, TripTranslation>>;
};

export type TravelCatalogue = {
  destinations: Destination[];
  trips: Trip[];
};
