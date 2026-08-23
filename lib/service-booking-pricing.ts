import type { GuardianRelationship, ReservationTraveller } from "@/domain/booking/types";
import type { TravelService } from "@/domain/services/types";
import {
  calculateAgeOnDate,
  defaultTravellerPricingBands,
  findTravellerPricingBand,
  type TravellerBookingDraft,
  TravellerPricingError
} from "@/lib/traveller-pricing";

export type ServicePricingResult = {
  travellers: ReservationTraveller[];
  totalPrice: number;
  inventoryUnits: number;
  quantity: number;
  unitPrice: number;
};

function serviceBands(service: TravelService) {
  return service.travellerPricing?.length
    ? [...service.travellerPricing].sort((a, b) => a.minAge - b.minAge)
    : defaultTravellerPricingBands(service.fromPrice);
}

export function priceServiceComposition(input: {
  service: TravelService;
  referenceDate: string;
  basePrice: number;
  drafts: TravellerBookingDraft[];
}): ServicePricingResult {
  const { service, referenceDate, drafts } = input;
  const basePrice = Number(input.basePrice);
  if (!Number.isFinite(basePrice) || basePrice < 0 || !drafts.length || drafts.length > 8) {
    throw new TravellerPricingError("INVALID_TRAVELLERS", "Invalid service booking composition.");
  }

  const bands = serviceBands(service);
  const ids = new Set<string>();
  const prepared = drafts.map((draft, index) => {
    const id = draft.id.trim();
    const firstName = draft.firstName.trim();
    const lastName = draft.lastName.trim();
    const nationality = draft.nationality.trim();
    const age = calculateAgeOnDate(draft.dateOfBirth, referenceDate);
    if (!id || ids.has(id) || !firstName || !lastName || !nationality || age === null) {
      throw new TravellerPricingError("INVALID_TRAVELLERS", "Traveller identity data is incomplete or invalid.");
    }
    ids.add(id);
    const band = findTravellerPricingBand(bands, age);
    if (!band) throw new TravellerPricingError("NO_PRICING_BAND", "No service fare covers this traveller age.");
    return { draft, index, age, band };
  });

  if ((prepared[0]?.age ?? 0) < 18) {
    throw new TravellerPricingError("LEAD_MUST_BE_ADULT", "The lead traveller must be an adult.");
  }
  const adultIds = new Set(prepared.filter((item) => item.age >= 18).map((item) => item.draft.id));

  const transportCapacity = service.serviceType === "transport" && service.capacity && service.capacity > 0
    ? service.capacity
    : 1;
  const quantity = service.pricingMode === "per-unit"
    ? service.serviceType === "transport"
      ? Math.max(1, Math.ceil(prepared.length / transportCapacity))
      : 1
    : prepared.length;

  let totalPrice = 0;
  const travellers: ReservationTraveller[] = prepared.map(({ draft, index, age, band }) => {
    const isMinor = age < 18;
    const guardianTravellerId = draft.guardianTravellerId?.trim() || undefined;
    const guardianRelationship = draft.guardianRelationship as GuardianRelationship | undefined;
    if (isMinor && (!guardianTravellerId || !adultIds.has(guardianTravellerId) || !guardianRelationship)) {
      throw new TravellerPricingError("MINOR_GUARDIAN_REQUIRED", "Every minor must have a responsible adult.");
    }

    let unitPrice = 0;
    if (service.pricingMode === "per-age-band") unitPrice = band.price;
    if (service.pricingMode === "per-person") unitPrice = basePrice;
    if (service.pricingMode === "per-booking" && index === 0) unitPrice = basePrice;
    if (service.pricingMode === "per-unit" && index === 0) unitPrice = basePrice * quantity;
    totalPrice += unitPrice;

    return {
      id: draft.id,
      firstName: draft.firstName.trim(),
      lastName: draft.lastName.trim(),
      dateOfBirth: draft.dateOfBirth,
      nationality: draft.nationality.trim(),
      isLead: index === 0,
      guardianTravellerId: isMinor ? guardianTravellerId : undefined,
      guardianRelationship: isMinor ? guardianRelationship : undefined,
      ageAtDeparture: age,
      pricingBandId: band.id,
      pricingCode: band.code,
      pricingLabel: band.label,
      pricingLabelEs: band.labelEs,
      unitPrice,
      consumesInventory: service.pricingMode === "per-age-band" ? band.consumesInventory : true
    };
  });

  const inventoryUnits = service.serviceType === "insurance"
    ? 0
    : service.serviceType === "transport" && service.pricingMode === "per-unit"
      ? quantity
      : service.pricingMode === "per-age-band"
        ? travellers.reduce((sum, traveller) => sum + (traveller.consumesInventory ? 1 : 0), 0)
        : travellers.length;

  return {
    travellers,
    totalPrice,
    inventoryUnits,
    quantity: service.pricingMode === "per-unit" ? quantity : service.pricingMode === "per-booking" ? 1 : travellers.length,
    unitPrice: basePrice
  };
}
