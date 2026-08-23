import type {
  AvailabilityWindow,
  GuardianRelationship,
  ReservationTraveller
} from "@/domain/booking/types";
import type { TravellerPricingBand, Trip } from "@/domain/travel/types";

const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;
const maxReasonableAge = 120;

export type TravellerBookingDraft = {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  nationality: string;
  guardianTravellerId?: string;
  guardianRelationship?: GuardianRelationship;
};

export type TravellerPricingResult = {
  travellers: ReservationTraveller[];
  totalPrice: number;
  inventorySpaces: number;
  leadUnitPrice: number;
};

export type TravellerPricingErrorCode =
  | "INVALID_TRAVELLERS"
  | "LEAD_MUST_BE_ADULT"
  | "MINOR_GUARDIAN_REQUIRED"
  | "NO_PRICING_BAND";

export class TravellerPricingError extends Error {
  code: TravellerPricingErrorCode;

  constructor(code: TravellerPricingErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

export function defaultTravellerPricingBands(fromPrice: number): TravellerPricingBand[] {
  const price = Number.isFinite(fromPrice) && fromPrice >= 0 ? fromPrice : 0;
  return [
    {
      id: "infant",
      code: "infant",
      label: "Infant",
      labelEs: "Bebé",
      minAge: 0,
      maxAge: 1,
      price,
      consumesInventory: true
    },
    {
      id: "child",
      code: "child",
      label: "Child",
      labelEs: "Menor",
      minAge: 2,
      maxAge: 17,
      price,
      consumesInventory: true
    },
    {
      id: "adult",
      code: "adult",
      label: "Adult",
      labelEs: "Adulto",
      minAge: 18,
      price,
      consumesInventory: true
    }
  ];
}

export function getTravellerPricingBands(trip: Pick<Trip, "fromPrice" | "travellerPricing">) {
  return trip.travellerPricing?.length
    ? [...trip.travellerPricing].sort((a, b) => a.minAge - b.minAge)
    : defaultTravellerPricingBands(trip.fromPrice);
}

function parseIsoDate(value: string) {
  if (!isoDatePattern.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day || month > 12 || day > 31) return null;
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return { year, month, day };
}

export function calculateAgeOnDate(dateOfBirth: string, referenceDate: string) {
  const birth = parseIsoDate(dateOfBirth);
  const reference = parseIsoDate(referenceDate);
  if (!birth || !reference) return null;

  let age = reference.year - birth.year;
  if (
    reference.month < birth.month ||
    (reference.month === birth.month && reference.day < birth.day)
  ) {
    age -= 1;
  }

  if (age < 0 || age > maxReasonableAge) return null;
  return age;
}

export function findTravellerPricingBand(
  bands: TravellerPricingBand[],
  age: number
): TravellerPricingBand | null {
  return bands.find((band) => {
    if (age < band.minAge) return false;
    // MongoDB/BSON may surface an omitted open-ended maxAge as null in older
    // documents. Treat both null and undefined as an open-ended band.
    return band.maxAge == null || age <= band.maxAge;
  }) ?? null;
}

export function getTravellerBandPrice({
  trip,
  availability,
  band
}: {
  trip: Pick<Trip, "fromPrice" | "travellerPricing">;
  availability: Pick<AvailabilityWindow, "unitPrice" | "travellerPrices">;
  band: TravellerPricingBand;
}) {
  const specificPrice = availability.travellerPrices?.[band.id];
  if (specificPrice !== undefined) return specificPrice;

  // Legacy trips used one departure price for every traveller. Preserve that
  // behaviour until the operator saves explicit age bands.
  if (!trip.travellerPricing?.length && availability.unitPrice !== undefined) {
    return availability.unitPrice;
  }

  // For explicit traveller pricing, the old departure unitPrice remains a
  // backward-compatible adult/base override only.
  if (band.code === "adult" && availability.unitPrice !== undefined) {
    return availability.unitPrice;
  }

  return band.price;
}

export function validateTravellerPricingBands(bands: TravellerPricingBand[]) {
  if (!bands.length) return false;
  const sorted = [...bands].sort((a, b) => a.minAge - b.minAge);
  const ids = new Set<string>();
  const codes = new Set<string>();

  for (let index = 0; index < sorted.length; index += 1) {
    const band = sorted[index];
    if (
      !band.id ||
      !band.code ||
      !band.label ||
      ids.has(band.id) ||
      codes.has(band.code) ||
      !Number.isInteger(band.minAge) ||
      band.minAge < 0 ||
      band.minAge > maxReasonableAge ||
      (band.maxAge != null &&
        (!Number.isInteger(band.maxAge) || band.maxAge < band.minAge || band.maxAge > maxReasonableAge)) ||
      !Number.isFinite(band.price) ||
      band.price < 0
    ) {
      return false;
    }

    if (index === 0 && band.minAge !== 0) return false;
    if (index > 0) {
      const previous = sorted[index - 1];
      if (previous.maxAge == null || band.minAge !== previous.maxAge + 1) return false;
    }

    ids.add(band.id);
    codes.add(band.code);
  }

  return sorted[sorted.length - 1].maxAge == null;
}

export function priceTravellerComposition({
  trip,
  availability,
  drafts
}: {
  trip: Pick<Trip, "fromPrice" | "travellerPricing">;
  availability: Pick<AvailabilityWindow, "departureDate" | "unitPrice" | "travellerPrices">;
  drafts: TravellerBookingDraft[];
}): TravellerPricingResult {
  if (!drafts.length || drafts.length > 8) {
    throw new TravellerPricingError("INVALID_TRAVELLERS", "A reservation must contain between 1 and 8 travellers.");
  }

  const ids = new Set<string>();
  const bands = getTravellerPricingBands(trip);
  const prepared = drafts.map((draft, index) => {
    const firstName = draft.firstName.trim();
    const lastName = draft.lastName.trim();
    const nationality = draft.nationality.trim();
    const id = draft.id.trim();
    const ageAtDeparture = calculateAgeOnDate(draft.dateOfBirth, availability.departureDate);

    if (!id || ids.has(id) || !firstName || !lastName || !nationality || ageAtDeparture === null) {
      throw new TravellerPricingError("INVALID_TRAVELLERS", "Traveller identity data is incomplete or invalid.");
    }
    ids.add(id);

    const band = findTravellerPricingBand(bands, ageAtDeparture);
    if (!band) {
      throw new TravellerPricingError("NO_PRICING_BAND", "No traveller pricing band covers this age.");
    }

    const unitPrice = getTravellerBandPrice({ trip, availability, band });
    if (!Number.isFinite(unitPrice) || unitPrice < 0) {
      throw new TravellerPricingError("NO_PRICING_BAND", "The traveller price is invalid.");
    }

    return {
      draft,
      index,
      ageAtDeparture,
      band,
      unitPrice
    };
  });

  const adults = new Set(prepared.filter((item) => item.ageAtDeparture >= 18).map((item) => item.draft.id));
  if (prepared[0].ageAtDeparture < 18) {
    throw new TravellerPricingError("LEAD_MUST_BE_ADULT", "The lead traveller must be at least 18 on departure.");
  }

  const travellers: ReservationTraveller[] = prepared.map(({ draft, index, ageAtDeparture, band, unitPrice }) => {
    const isMinor = ageAtDeparture < 18;
    const guardianTravellerId = draft.guardianTravellerId?.trim() || undefined;
    const guardianRelationship = draft.guardianRelationship;

    if (isMinor) {
      if (!guardianTravellerId || !adults.has(guardianTravellerId) || !guardianRelationship) {
        throw new TravellerPricingError(
          "MINOR_GUARDIAN_REQUIRED",
          "Every minor must be linked to an adult responsible for the booking."
        );
      }
    }

    return {
      id: draft.id,
      firstName: draft.firstName.trim(),
      lastName: draft.lastName.trim(),
      dateOfBirth: draft.dateOfBirth,
      nationality: draft.nationality.trim(),
      isLead: index === 0,
      guardianTravellerId: isMinor ? guardianTravellerId : undefined,
      guardianRelationship: isMinor ? guardianRelationship : undefined,
      ageAtDeparture,
      pricingBandId: band.id,
      pricingCode: band.code,
      pricingLabel: band.label,
      pricingLabelEs: band.labelEs,
      unitPrice,
      consumesInventory: band.consumesInventory
    };
  });

  const totalPrice = travellers.reduce((sum, traveller) => sum + traveller.unitPrice, 0);
  const inventorySpaces = travellers.reduce(
    (sum, traveller) => sum + (traveller.consumesInventory ? 1 : 0),
    0
  );

  return {
    travellers,
    totalPrice,
    inventorySpaces,
    leadUnitPrice: travellers[0].unitPrice
  };
}