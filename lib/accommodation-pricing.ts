import type {
  Accommodation,
  AccommodationAdjustmentDirection,
  AccommodationAdjustmentMode,
  AccommodationOccupancyPricingRule,
  AccommodationRoomType,
  AccommodationSeasonalPricingRule
} from "@/domain/accommodation/types";

export type AccommodationPricingRequest = {
  accommodation: Accommodation;
  roomTypeId: string;
  checkInDate: string;
  nights: number;
  adults: number;
  childAges: number[];
};

export type AccommodationPricingAdjustment = {
  id: string;
  label: string;
  amount: number;
  source: "seasonal" | "occupancy";
};

export type AccommodationPricingResult = {
  currency: Accommodation["currency"];
  roomTypeId: string;
  nights: number;
  baseTotal: number;
  seasonalAdjustment: number;
  occupancyAdjustment: number;
  total: number;
  adjustments: AccommodationPricingAdjustment[];
};

const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;

export function addIsoDays(value: string, days: number) {
  if (!isoDatePattern.test(value) || !Number.isInteger(days)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return null;
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function isAccommodationOccupancyAllowed(room: AccommodationRoomType, adults: number, childAges: number[]) {
  if (!Number.isInteger(adults) || adults < room.occupancy.minAdults || adults > room.occupancy.maxAdults) return false;
  if (!childAges.every((age) => Number.isInteger(age) && age >= 0)) return false;
  if (childAges.length > room.occupancy.maxChildren) return false;
  if (adults + childAges.length > room.occupancy.maxOccupancy) return false;
  if (childAges.length) {
    if (room.occupancy.childMaxAge === undefined) return false;
    if (childAges.some((age) => age > room.occupancy.childMaxAge!)) return false;
  }
  return true;
}

function signed(direction: AccommodationAdjustmentDirection, value: number) {
  return direction === "discount" ? -value : value;
}

function seasonalRuleMatches(rule: AccommodationSeasonalPricingRule, roomTypeId: string, date: string) {
  return date >= rule.startDate && date <= rule.endDate &&
    (!rule.roomTypeIds?.length || rule.roomTypeIds.includes(roomTypeId));
}

function occupancyRuleMatches(
  rule: AccommodationOccupancyPricingRule,
  roomTypeId: string,
  adults: number,
  childAges: number[]
) {
  if (rule.roomTypeId && rule.roomTypeId !== roomTypeId) return false;
  if (rule.minAdults !== undefined && adults < rule.minAdults) return false;
  if (rule.maxAdults !== undefined && adults > rule.maxAdults) return false;
  if (rule.minChildren !== undefined && childAges.length < rule.minChildren) return false;
  if (rule.maxChildren !== undefined && childAges.length > rule.maxChildren) return false;
  if (rule.minChildAge !== undefined && !childAges.some((age) => age >= rule.minChildAge!)) return false;
  if (rule.maxChildAge !== undefined && !childAges.some((age) => age <= rule.maxChildAge!)) return false;
  return true;
}

function adjustmentAmount(
  mode: AccommodationAdjustmentMode,
  value: number,
  roomSubtotal: number,
  nights: number,
  qualifyingChildren: number,
  room: AccommodationRoomType
) {
  if (mode === "fixed-per-room-night") return value * nights;
  if (mode === "percent-of-room") return roomSubtotal * (value / 100);
  if (mode === "fixed-per-child-night") return value * nights * qualifyingChildren;
  const proportionalShare = roomSubtotal / Math.max(1, room.occupancy.maxOccupancy);
  return proportionalShare * (value / 100) * qualifyingChildren;
}

function qualifyingChildren(rule: AccommodationOccupancyPricingRule, childAges: number[]) {
  return childAges.filter((age) =>
    (rule.minChildAge === undefined || age >= rule.minChildAge) &&
    (rule.maxChildAge === undefined || age <= rule.maxChildAge)
  ).length;
}

export function calculateAccommodationStayPrice(request: AccommodationPricingRequest): AccommodationPricingResult | null {
  const { accommodation, roomTypeId, checkInDate, nights, adults, childAges } = request;
  const room = accommodation.roomTypes.find((item) => item.id === roomTypeId);
  if (!room || room.baseNightlyRate === undefined || room.baseNightlyRate < 0) return null;
  if (!isoDatePattern.test(checkInDate) || !Number.isInteger(nights) || nights < 1) return null;
  if (!isAccommodationOccupancyAllowed(room, adults, childAges)) return null;

  const adjustments: AccommodationPricingAdjustment[] = [];
  const baseTotal = room.baseNightlyRate * nights;
  let seasonalAdjustment = 0;

  for (let night = 0; night < nights; night += 1) {
    const date = addIsoDays(checkInDate, night);
    if (!date) return null;
    for (const rule of accommodation.seasonalPricing ?? []) {
      if (!seasonalRuleMatches(rule, roomTypeId, date)) continue;
      const raw = rule.mode === "fixed-per-room-night"
        ? rule.value
        : room.baseNightlyRate * (rule.value / 100);
      const amount = signed(rule.direction, raw);
      seasonalAdjustment += amount;
      const existing = adjustments.find((item) => item.id === rule.id && item.source === "seasonal");
      if (existing) existing.amount += amount;
      else adjustments.push({ id: rule.id, label: rule.label, amount, source: "seasonal" });
    }
  }

  const roomSubtotal = Math.max(0, baseTotal + seasonalAdjustment);
  let occupancyAdjustment = 0;
  for (const rule of accommodation.occupancyPricing ?? []) {
    if (!occupancyRuleMatches(rule, roomTypeId, adults, childAges)) continue;
    const children = qualifyingChildren(rule, childAges);
    if ((rule.mode === "fixed-per-child-night" || rule.mode === "percent-per-child") && children === 0) continue;
    const raw = adjustmentAmount(rule.mode, rule.value, roomSubtotal, nights, children, room);
    const amount = signed(rule.direction, raw);
    occupancyAdjustment += amount;
    adjustments.push({ id: rule.id, label: rule.label, amount, source: "occupancy" });
  }

  return {
    currency: accommodation.currency,
    roomTypeId,
    nights,
    baseTotal,
    seasonalAdjustment,
    occupancyAdjustment,
    total: Math.max(0, roomSubtotal + occupancyAdjustment),
    adjustments
  };
}
