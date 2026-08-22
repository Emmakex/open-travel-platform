export type CurrencyCode = "EUR" | "USD" | "GBP";
export type TravelLocale = "en" | "es";
export type TravelPublicationStatus = "draft" | "published";
export type TravelMediaFocalPoint = "center" | "top" | "bottom" | "left" | "right";

export type TravelMedia = {
  src: string;
  alt?: string;
  caption?: string;
  width?: number;
  height?: number;
  focalPoint?: TravelMediaFocalPoint;
  credit?: string;
};

export type TripDay = {
  day: number;
  title: string;
  summary: string;
};

export type TravellerPricingBand = {
  id: string;
  code: string;
  label: string;
  labelEs?: string;
  minAge: number;
  maxAge?: number;
  price: number;
  consumesInventory: boolean;
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
  publicationStatus?: TravelPublicationStatus;
  coverImage?: TravelMedia;
  gallery?: TravelMedia[];
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
  travellerPricing?: TravellerPricingBand[];
  highlights: string[];
  itinerary?: TripDay[];
  included?: string[];
  notIncluded?: string[];
  coverImage?: TravelMedia;
  gallery?: TravelMedia[];
  featured: boolean;
  publicationStatus?: TravelPublicationStatus;
  translations?: Partial<Record<TravelLocale, TripTranslation>>;
};

export type TravelCatalogue = {
  destinations: Destination[];
  trips: Trip[];
};
