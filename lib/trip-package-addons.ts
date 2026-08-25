import type { ReservationTripAddOnBooking, ReservationTraveller } from "../domain/booking/types.ts";
import type { TripAddOn } from "../domain/travel/types.ts";

export type TripPackageAddOnErrorCode =
  | "ADDON_CONFIGURATION_INVALID"
  | "ADDON_SELECTION_INVALID";

export class TripPackageAddOnError extends Error {
  code: TripPackageAddOnErrorCode;

  constructor(code: TripPackageAddOnErrorCode, message: string) {
    super(message);
    this.code = code;
    this.name = "TripPackageAddOnError";
  }
}

type AddOnTraveller = Pick<ReservationTraveller, "id">;

export type BuildTripPackageAddOnsInput = {
  addOns: TripAddOn[];
  travellers: AddOnTraveller[];
  selectedBookingAddOnIds?: string[];
  selectedTravellerIdsByAddOn?: Record<string, string[]>;
};

const codePattern = /^[a-z0-9][a-z0-9_]{0,79}$/;
const pricingModes = new Set(["per-booking", "per-traveller"]);

export function validateTripAddOns(addOns: TripAddOn[]) {
  if (addOns.length > 20) return false;
  const ids = new Set<string>();
  const codes = new Set<string>();

  for (const addOn of addOns) {
    const id = addOn.id.trim();
    const code = addOn.code.trim();
    const title = addOn.title.trim();
    const titleEs = addOn.titleEs.trim();
    const description = addOn.description?.trim() ?? "";
    const descriptionEs = addOn.descriptionEs?.trim() ?? "";

    if (!id || ids.has(id) || !codePattern.test(code) || codes.has(code)) return false;
    if (!title || title.length > 120 || !titleEs || titleEs.length > 120) return false;
    if (description.length > 500 || descriptionEs.length > 500) return false;
    if ((description && !descriptionEs) || (!description && descriptionEs)) return false;
    if (!Number.isFinite(addOn.price) || addOn.price < 0 || addOn.price > 1_000_000) return false;
    if (!pricingModes.has(addOn.pricingMode)) return false;
    if (typeof addOn.enabled !== "boolean") return false;

    ids.add(id);
    codes.add(code);
  }

  return true;
}

export function buildTripPackageAddOns(input: BuildTripPackageAddOnsInput) {
  if (!validateTripAddOns(input.addOns)) {
    throw new TripPackageAddOnError(
      "ADDON_CONFIGURATION_INVALID",
      "Trip package add-on configuration is invalid."
    );
  }

  const enabledById = new Map(input.addOns.filter((item) => item.enabled).map((item) => [item.id, item]));
  const travellerIds = new Set(input.travellers.map((traveller) => traveller.id));
  if (travellerIds.size !== input.travellers.length) {
    throw new TripPackageAddOnError("ADDON_SELECTION_INVALID", "Traveller selection contains duplicate IDs.");
  }

  const bookingSelections = [...new Set(input.selectedBookingAddOnIds ?? [])].filter(Boolean);
  const travellerSelections = input.selectedTravellerIdsByAddOn ?? {};
  const bookings: ReservationTripAddOnBooking[] = [];

  for (const addOnId of bookingSelections) {
    const addOn = enabledById.get(addOnId);
    if (!addOn || addOn.pricingMode !== "per-booking") {
      throw new TripPackageAddOnError(
        "ADDON_SELECTION_INVALID",
        "A selected booking supplement is not available for this trip."
      );
    }

    bookings.push({
      addOnId: addOn.id,
      code: addOn.code,
      title: addOn.title,
      titleEs: addOn.titleEs,
      description: addOn.description,
      descriptionEs: addOn.descriptionEs,
      pricingMode: addOn.pricingMode,
      unitPrice: addOn.price,
      quantity: 1,
      totalPrice: Number(addOn.price.toFixed(2))
    });
  }

  for (const [addOnId, rawSelectedTravellerIds] of Object.entries(travellerSelections)) {
    const selectedTravellerIds = [...new Set(rawSelectedTravellerIds.filter(Boolean))];
    if (!selectedTravellerIds.length) continue;

    const addOn = enabledById.get(addOnId);
    if (!addOn || addOn.pricingMode !== "per-traveller") {
      throw new TripPackageAddOnError(
        "ADDON_SELECTION_INVALID",
        "A selected traveller supplement is not available for this trip."
      );
    }
    if (selectedTravellerIds.some((id) => !travellerIds.has(id))) {
      throw new TripPackageAddOnError(
        "ADDON_SELECTION_INVALID",
        "A package supplement references a traveller outside this reservation."
      );
    }

    const quantity = selectedTravellerIds.length;
    bookings.push({
      addOnId: addOn.id,
      code: addOn.code,
      title: addOn.title,
      titleEs: addOn.titleEs,
      description: addOn.description,
      descriptionEs: addOn.descriptionEs,
      pricingMode: addOn.pricingMode,
      unitPrice: addOn.price,
      quantity,
      travellerIds: selectedTravellerIds,
      totalPrice: Number((addOn.price * quantity).toFixed(2))
    });
  }

  const packageAddOnTotal = Number(bookings.reduce((sum, item) => sum + item.totalPrice, 0).toFixed(2));
  return { bookings, packageAddOnTotal };
}
