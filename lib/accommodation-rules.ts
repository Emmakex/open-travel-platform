import type {
  AccommodationInventoryPeriod,
  AccommodationOccupancyRule
} from "@/domain/accommodation/types";

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
