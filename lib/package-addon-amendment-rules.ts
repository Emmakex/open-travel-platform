import type { ReservationTripAddOnBooking, ReservationTraveller } from "../domain/booking/types.ts";
import type { TripAddOn } from "../domain/travel/types.ts";
import { validateTripAddOns } from "./trip-package-addons.ts";

export type PackageAddOnAmendmentErrorCode =
  | "ADDON_CONFIGURATION_INVALID"
  | "ADDON_SELECTION_INVALID"
  | "ADDON_DISABLED_EXPANSION";

export class PackageAddOnAmendmentError extends Error {
  code: PackageAddOnAmendmentErrorCode;

  constructor(code: PackageAddOnAmendmentErrorCode, message: string) {
    super(message);
    this.code = code;
    this.name = "PackageAddOnAmendmentError";
  }
}

export type BuildPackageAddOnAmendmentInput = {
  catalogAddOns: TripAddOn[];
  currentBookings: ReservationTripAddOnBooking[];
  travellers: Array<Pick<ReservationTraveller, "id">>;
  selectedBookingAddOnIds: string[];
  selectedTravellerIdsByAddOn: Record<string, string[]>;
};

function money(value: number) {
  return Number(value.toFixed(2));
}

function unique(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

function currentById(bookings: ReservationTripAddOnBooking[]) {
  const map = new Map<string, ReservationTripAddOnBooking>();
  for (const booking of bookings) {
    if (!booking.addOnId || map.has(booking.addOnId)) {
      throw new PackageAddOnAmendmentError(
        "ADDON_SELECTION_INVALID",
        "The stored supplement snapshot cannot be amended safely."
      );
    }
    map.set(booking.addOnId, booking);
  }
  return map;
}

function snapshotFromCatalog(addOn: TripAddOn, travellerIds?: string[]): ReservationTripAddOnBooking {
  const selectedTravellerIds = travellerIds ? unique(travellerIds) : undefined;
  const quantity = addOn.pricingMode === "per-booking" ? 1 : selectedTravellerIds?.length ?? 0;
  return {
    addOnId: addOn.id,
    code: addOn.code,
    title: addOn.title,
    titleEs: addOn.titleEs,
    description: addOn.description,
    descriptionEs: addOn.descriptionEs,
    pricingMode: addOn.pricingMode,
    unitPrice: addOn.price,
    quantity,
    ...(selectedTravellerIds?.length ? { travellerIds: selectedTravellerIds } : {}),
    totalPrice: money(addOn.price * quantity)
  };
}

function snapshotFromExisting(
  booking: ReservationTripAddOnBooking,
  travellerIds?: string[]
): ReservationTripAddOnBooking {
  if (booking.pricingMode === "per-booking") {
    return { ...booking, quantity: 1, totalPrice: money(booking.unitPrice) };
  }
  const selectedTravellerIds = unique(travellerIds ?? []);
  return {
    ...booking,
    quantity: selectedTravellerIds.length,
    travellerIds: selectedTravellerIds,
    totalPrice: money(booking.unitPrice * selectedTravellerIds.length)
  };
}

export function canonicalPackageAddOnSnapshot(bookings: ReservationTripAddOnBooking[]) {
  return bookings
    .map((booking) => ({
      ...booking,
      travellerIds: booking.travellerIds ? [...booking.travellerIds].sort() : undefined
    }))
    .sort((a, b) => a.addOnId.localeCompare(b.addOnId));
}

export function packageAddOnSnapshotsEqual(
  left: ReservationTripAddOnBooking[],
  right: ReservationTripAddOnBooking[]
) {
  return JSON.stringify(canonicalPackageAddOnSnapshot(left)) === JSON.stringify(canonicalPackageAddOnSnapshot(right));
}

export function buildPackageAddOnAmendment(input: BuildPackageAddOnAmendmentInput) {
  if (!validateTripAddOns(input.catalogAddOns)) {
    throw new PackageAddOnAmendmentError(
      "ADDON_CONFIGURATION_INVALID",
      "Trip package supplement configuration is invalid."
    );
  }

  const catalogById = new Map(input.catalogAddOns.map((item) => [item.id, item]));
  const existingById = currentById(input.currentBookings);
  const travellerIds = new Set(input.travellers.map((traveller) => traveller.id));
  if (travellerIds.size !== input.travellers.length) {
    throw new PackageAddOnAmendmentError(
      "ADDON_SELECTION_INVALID",
      "Reservation travellers contain duplicate identifiers."
    );
  }

  const result: ReservationTripAddOnBooking[] = [];
  const bookingSelections = unique(input.selectedBookingAddOnIds);
  for (const addOnId of bookingSelections) {
    const existing = existingById.get(addOnId);
    if (existing) {
      if (existing.pricingMode !== "per-booking") {
        throw new PackageAddOnAmendmentError("ADDON_SELECTION_INVALID", "Supplement pricing mode is inconsistent.");
      }
      result.push(snapshotFromExisting(existing));
      continue;
    }

    const catalog = catalogById.get(addOnId);
    if (!catalog?.enabled || catalog.pricingMode !== "per-booking") {
      throw new PackageAddOnAmendmentError(
        "ADDON_SELECTION_INVALID",
        "A selected booking supplement is not currently available."
      );
    }
    result.push(snapshotFromCatalog(catalog));
  }

  for (const [addOnId, rawSelectedTravellerIds] of Object.entries(input.selectedTravellerIdsByAddOn)) {
    const selectedTravellerIds = unique(rawSelectedTravellerIds);
    if (!selectedTravellerIds.length) continue;
    if (selectedTravellerIds.some((id) => !travellerIds.has(id))) {
      throw new PackageAddOnAmendmentError(
        "ADDON_SELECTION_INVALID",
        "A supplement references a traveller outside this reservation."
      );
    }

    const existing = existingById.get(addOnId);
    if (existing) {
      if (existing.pricingMode !== "per-traveller") {
        throw new PackageAddOnAmendmentError("ADDON_SELECTION_INVALID", "Supplement pricing mode is inconsistent.");
      }
      const catalog = catalogById.get(addOnId);
      if (!catalog?.enabled) {
        const previousIds = new Set(existing.travellerIds ?? []);
        if (selectedTravellerIds.some((id) => !previousIds.has(id))) {
          throw new PackageAddOnAmendmentError(
            "ADDON_DISABLED_EXPANSION",
            "A disabled historical supplement cannot be assigned to additional travellers."
          );
        }
      }
      result.push(snapshotFromExisting(existing, selectedTravellerIds));
      continue;
    }

    const catalog = catalogById.get(addOnId);
    if (!catalog?.enabled || catalog.pricingMode !== "per-traveller") {
      throw new PackageAddOnAmendmentError(
        "ADDON_SELECTION_INVALID",
        "A selected traveller supplement is not currently available."
      );
    }
    result.push(snapshotFromCatalog(catalog, selectedTravellerIds));
  }

  const bookings = canonicalPackageAddOnSnapshot(result);
  const packageAddOnTotal = money(bookings.reduce((sum, booking) => sum + booking.totalPrice, 0));
  return { bookings, packageAddOnTotal };
}
