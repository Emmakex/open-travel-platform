import type { ReservationChangePolicy } from "@/domain/operations/change-policy";
import type { TravellerRequirementsProfile } from "@/domain/traveller/types";
import type {
  CurrencyCode,
  TravellerPricingBand,
  TravelLocale,
  TravelMedia,
  TravelPublicationStatus
} from "@/domain/travel/types";

export type TravelServiceType = "activity" | "transport" | "insurance";
export type TravelServicePricingMode = "per-person" | "per-booking" | "per-unit" | "per-age-band";
export type ServiceInventoryMode = "people" | "units";
export type ServiceAvailabilityStatus = "open" | "closed";

export type ServiceAvailabilitySlot = {
  id: string;
  serviceId: string;
  serviceType: "activity" | "transport";
  date: string;
  startTime: string;
  endTime?: string;
  inventoryMode: ServiceInventoryMode;
  capacity: number;
  reserved: number;
  status: ServiceAvailabilityStatus;
  priceOverride?: number;
};

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
  /** Advanced data requested after booking, snapshotted onto each service reservation. */
  travellerRequirements?: TravellerRequirementsProfile;
  /** Amendment/cancellation rules snapshotted onto new service reservations. */
  changePolicy?: ReservationChangePolicy;
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
  inventoryMode?: ServiceInventoryMode;
};

export type InsuranceService = TravelServiceBase & {
  serviceType: "insurance";
  coverageType: string;
  maxTripDays?: number;
  /** Provider responsible for the insurance/protection product. Required before publishing a real policy. */
  providerName?: string;
  /** Optional provider policy/product reference shown to staff and customers when available. */
  policyReference?: string;
  /** HTTPS link to the provider's policy wording, terms or equivalent pre-contract information. */
  termsUrl?: string;
};

export type TravelService = ActivityService | TransportService | InsuranceService;
