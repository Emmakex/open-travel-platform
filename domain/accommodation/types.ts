import type { CurrencyCode, TravelLocale, TravelMedia, TravelPublicationStatus } from "@/domain/travel/types";

export type AccommodationOccupancyRule = {
  minAdults: number;
  maxAdults: number;
  maxChildren: number;
  maxOccupancy: number;
  childMaxAge?: number;
};

export type AccommodationRoomKind =
  | "single"
  | "double"
  | "twin"
  | "triple"
  | "family"
  | "suite"
  | "other";

export type AccommodationMealPlan =
  | "room-only"
  | "breakfast"
  | "half-board"
  | "full-board"
  | "all-inclusive";

export type AccommodationAdjustmentDirection = "surcharge" | "discount";
export type AccommodationAdjustmentMode =
  | "fixed-per-room-night"
  | "percent-of-room"
  | "fixed-per-child-night"
  | "percent-per-child";

export type AccommodationSeasonalPricingRule = {
  id: string;
  label: string;
  startDate: string;
  endDate: string;
  direction: AccommodationAdjustmentDirection;
  mode: "fixed-per-room-night" | "percent-of-room";
  value: number;
  /** Empty means every room type in the property. */
  roomTypeIds?: string[];
};

export type AccommodationOccupancyPricingKind =
  | "single-supplement"
  | "triple-discount"
  | "child-sharing-discount"
  | "custom";

export type AccommodationOccupancyPricingRule = {
  id: string;
  label: string;
  kind: AccommodationOccupancyPricingKind;
  /** Empty means every room type in the property. */
  roomTypeId?: string;
  direction: AccommodationAdjustmentDirection;
  mode: AccommodationAdjustmentMode;
  value: number;
  minAdults?: number;
  maxAdults?: number;
  minChildren?: number;
  maxChildren?: number;
  minChildAge?: number;
  maxChildAge?: number;
};

export type AccommodationRoomType = {
  id: string;
  code: string;
  name: string;
  description?: string;
  kind?: AccommodationRoomKind;
  occupancy: AccommodationOccupancyRule;
  /** Base public/reference price per room and night. */
  baseNightlyRate?: number;
  mealPlan?: AccommodationMealPlan;
  /** Reusable room-level media, independent from the property gallery. */
  gallery?: TravelMedia[];
};

export type AccommodationRoomTranslation = {
  name?: string;
  description?: string;
};

export type AccommodationTranslation = {
  name?: string;
  summary?: string;
  location?: string;
  roomTypes?: Record<string, AccommodationRoomTranslation>;
};

export type Accommodation = {
  id: string;
  slug: string;
  name: string;
  summary: string;
  location: string;
  country: string;
  currency: CurrencyCode;
  publicationStatus?: TravelPublicationStatus;
  featured: boolean;
  roomTypes: AccommodationRoomType[];
  coverImage?: TravelMedia;
  /** Property-level gallery. Room galleries remain on each room type. */
  gallery?: TravelMedia[];
  seasonalPricing?: AccommodationSeasonalPricingRule[];
  occupancyPricing?: AccommodationOccupancyPricingRule[];
  translations?: Partial<Record<TravelLocale, AccommodationTranslation>>;
};

export type AccommodationInventoryStatus = "open" | "closed";

export type AccommodationInventoryPeriod = {
  id: string;
  accommodationId: string;
  roomTypeId: string;
  startDate: string;
  endDate: string;
  capacity: number;
  reserved: number;
  status: AccommodationInventoryStatus;
};
