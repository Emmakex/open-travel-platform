import type {
  AccommodationInventoryPeriod,
  AccommodationOccupancyRule,
  AccommodationRoomType
} from "@/domain/accommodation/types";
import type { TripAccommodationComponent } from "@/domain/travel/types";

export function isValidAccommodationOccupancy(rule: AccommodationOccupancyRule) {
  return Number.isInteger(rule.minAdults) && rule.minAdults >= 1 &&
    Number.isInteger(rule.maxAdults) && rule.maxAdults >= rule.minAdults &&
    Number.isInteger(rule.maxChildren) && rule.maxChildren >= 0 &&
    Number.isInteger(rule.maxOccupancy) && rule.maxOccupancy >= rule.maxAdults &&
    rule.maxOccupancy <= rule.maxAdults + rule.maxChildren &&
    (rule.maxChildren === 0
      ? rule.childMaxAge === undefined
      : Number.isInteger(rule.childMaxAge) && rule.childMaxAge! >= 0 && rule.childMaxAge! <= 17);
}

export function accommodationInventoryOverlaps(periods: AccommodationInventoryPeriod[]) {
  const groups = new Map<string, AccommodationInventoryPeriod[]>();
  for (const period of periods) {
    groups.set(period.roomTypeId, [...(groups.get(period.roomTypeId) ?? []), period]);
  }
  for (const group of groups.values()) {
    group.sort((a, b) => a.startDate.localeCompare(b.startDate));
    for (let index = 1; index < group.length; index += 1) {
      if (group[index].startDate <= group[index - 1].endDate) return true;
    }
  }
  return false;
}

export function remainingRoomInventory(period: Pick<AccommodationInventoryPeriod, "capacity" | "reserved">) {
  return Math.max(0, period.capacity - period.reserved);
}

export function isValidTripAccommodationPlacement(
  component: Pick<TripAccommodationComponent, "checkInDay" | "nights">,
  tripDurationDays: number
) {
  return Number.isInteger(tripDurationDays) && tripDurationDays >= 1 &&
    Number.isInteger(component.checkInDay) && component.checkInDay >= 1 &&
    Number.isInteger(component.nights) && component.nights >= 1 &&
    component.checkInDay + component.nights <= tripDurationDays;
}

export function accommodationReferenceValue(
  room: Pick<AccommodationRoomType, "baseNightlyRate">,
  nights: number
) {
  if (room.baseNightlyRate === undefined || !Number.isFinite(room.baseNightlyRate) || room.baseNightlyRate < 0) return undefined;
  if (!Number.isInteger(nights) || nights < 1) return undefined;
  return Math.round((room.baseNightlyRate * nights + Number.EPSILON) * 100) / 100;
}
