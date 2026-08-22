import type {
  CurrencyCode,
  TravellerPricingBand,
  TravelLocale,
  TravelMedia,
  TravelPublicationStatus
} from "@/domain/travel/types";

export type TravelServiceType = "activity" | "transport" | "insurance";
export type TravelServicePricingMode = "per-person" | "per-booking" | "per-unit" | "per-age-band";

export type TravelServiceTranslation = {
  title?: string;
  summary?: string;
  highlights?: string[];
  included?: string[];
  notIncluded?: string[];
  location?: string;
  durationLabel?: string;
  activityCategory?: string;
  meetingPoint?: string;
  origin?: string;
  destination?: string;
  transportMode?: string;
  coverageType?: string;
};

type TravelServiceBase = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  serviceType: TravelServiceType;
  fromPrice: number;
  currency: CurrencyCode;
  pricingMode: TravelServicePricingMode;
  travellerPricing?: TravellerPricingBand[];
  highlights: string[];
  included?: string[];
  notIncluded?: string[];
  featured: boolean;
  publicationStatus?: TravelPublicationStatus;
  coverImage?: TravelMedia;
  gallery?: TravelMedia[];
  relatedTripIds?: string[];
  translations?: Partial<Record<TravelLocale, TravelServiceTranslation>>;
};

export type ActivityService = TravelServiceBase & {
  serviceType: "activity";
  location: string;
  durationLabel: string;
  activityCategory: string;
  meetingPoint?: string;
};

export type TransportService = TravelServiceBase & {
  serviceType: "transport";
  transportMode: string;
  origin: string;
  destination: string;
  capacity?: number;
};

export type InsuranceService = TravelServiceBase & {
  serviceType: "insurance";
  coverageType: string;
  maxTripDays?: number;
};

export type TravelService = ActivityService | TransportService | InsuranceService;
