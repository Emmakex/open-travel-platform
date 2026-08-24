import type { CurrencyCode, TravelLocale, TravelMedia, TravelPublicationStatus } from "@/domain/travel/types";

export type AccommodationOccupancyRule = {
  minAdults: number;
  maxAdults: number;
  maxChildren: number;
  maxOccupancy: number;
  childMaxAge?: number;
};

export type AccommodationRoomType = {
  id: string;
  code: string;
  name: string;
  description?: string;
  occupancy: AccommodationOccupancyRule;
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
