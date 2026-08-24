import assert from "node:assert/strict";
import {
  accommodationInventoryOverlaps,
  accommodationReferenceValue,
  isValidAccommodationOccupancy,
  isValidTripAccommodationPlacement,
  remainingRoomInventory
} from "../lib/accommodation-rules.ts";
import {
  calculateAccommodationStayPrice,
  isAccommodationOccupancyAllowed
} from "../lib/accommodation-pricing.ts";

assert.equal(isValidAccommodationOccupancy({
  minAdults: 1,
  maxAdults: 2,
  maxChildren: 1,
  maxOccupancy: 3,
  childMaxAge: 12
}), true);

assert.equal(isValidAccommodationOccupancy({
  minAdults: 1,
  maxAdults: 2,
  maxChildren: 0,
  maxOccupancy: 3
}), false);

assert.equal(isValidAccommodationOccupancy({
  minAdults: 1,
  maxAdults: 2,
  maxChildren: 1,
  maxOccupancy: 2
}), false);

const basePeriod = {
  accommodationId: "hotel-1",
  roomTypeId: "double",
  capacity: 10,
  reserved: 4,
  status: "open"
};

assert.equal(accommodationInventoryOverlaps([
  { ...basePeriod, id: "a", startDate: "2026-09-01", endDate: "2026-09-10" },
  { ...basePeriod, id: "b", startDate: "2026-09-11", endDate: "2026-09-20" }
]), false);

assert.equal(accommodationInventoryOverlaps([
  { ...basePeriod, id: "a", startDate: "2026-09-01", endDate: "2026-09-10" },
  { ...basePeriod, id: "b", startDate: "2026-09-10", endDate: "2026-09-20" }
]), true);

assert.equal(accommodationInventoryOverlaps([
  { ...basePeriod, id: "a", roomTypeId: "double", startDate: "2026-09-01", endDate: "2026-09-10" },
  { ...basePeriod, id: "b", roomTypeId: "suite", startDate: "2026-09-05", endDate: "2026-09-08" }
]), false);

assert.equal(remainingRoomInventory({ capacity: 10, reserved: 4 }), 6);
assert.equal(remainingRoomInventory({ capacity: 3, reserved: 5 }), 0);

assert.equal(isValidTripAccommodationPlacement({ checkInDay: 1, nights: 6 }, 7), true);
assert.equal(isValidTripAccommodationPlacement({ checkInDay: 2, nights: 6 }, 7), false);
assert.equal(isValidTripAccommodationPlacement({ checkInDay: 1, nights: 0 }, 7), false);

assert.equal(accommodationReferenceValue({ baseNightlyRate: 125.5 }, 3), 376.5);
assert.equal(accommodationReferenceValue({ baseNightlyRate: undefined }, 3), undefined);
assert.equal(accommodationReferenceValue({ baseNightlyRate: 125.5 }, 0), undefined);

const room = {
  id: "double",
  code: "double",
  name: "Double room",
  baseNightlyRate: 100,
  occupancy: {
    minAdults: 1,
    maxAdults: 2,
    maxChildren: 1,
    maxOccupancy: 3,
    childMaxAge: 12
  }
};

const accommodation = {
  id: "hotel-1",
  slug: "hotel-1",
  name: "Hotel 1",
  summary: "Test hotel",
  location: "Barcelona",
  country: "Spain",
  currency: "EUR",
  featured: false,
  roomTypes: [room],
  seasonalPricing: [{
    id: "summer",
    label: "Summer",
    startDate: "2026-07-01",
    endDate: "2026-07-31",
    direction: "surcharge",
    mode: "percent-of-room",
    value: 20
  }],
  occupancyPricing: [
    {
      id: "single",
      label: "Single supplement",
      kind: "single-supplement",
      direction: "surcharge",
      mode: "fixed-per-room-night",
      value: 30,
      minAdults: 1,
      maxAdults: 1,
      maxChildren: 0
    },
    {
      id: "child",
      label: "Child sharing",
      kind: "child-sharing-discount",
      direction: "discount",
      mode: "percent-per-child",
      value: 50,
      minAdults: 2,
      minChildren: 1,
      maxChildren: 1,
      minChildAge: 2,
      maxChildAge: 11
    }
  ]
};

assert.equal(isAccommodationOccupancyAllowed(room, 2, [8]), true);
assert.equal(isAccommodationOccupancyAllowed(room, 2, [13]), false);
assert.equal(isAccommodationOccupancyAllowed(room, 3, []), false);

const summerDouble = calculateAccommodationStayPrice({
  accommodation,
  roomTypeId: "double",
  checkInDate: "2026-07-01",
  nights: 2,
  adults: 2,
  childAges: []
});
assert.ok(summerDouble);
assert.equal(summerDouble.baseTotal, 200);
assert.equal(summerDouble.seasonalAdjustment, 40);
assert.equal(summerDouble.occupancyAdjustment, 0);
assert.equal(summerDouble.total, 240);

const singleStay = calculateAccommodationStayPrice({
  accommodation,
  roomTypeId: "double",
  checkInDate: "2026-08-01",
  nights: 2,
  adults: 1,
  childAges: []
});
assert.ok(singleStay);
assert.equal(singleStay.baseTotal, 200);
assert.equal(singleStay.seasonalAdjustment, 0);
assert.equal(singleStay.occupancyAdjustment, 60);
assert.equal(singleStay.total, 260);

const childSharing = calculateAccommodationStayPrice({
  accommodation,
  roomTypeId: "double",
  checkInDate: "2026-07-01",
  nights: 2,
  adults: 2,
  childAges: [8]
});
assert.ok(childSharing);
assert.equal(childSharing.baseTotal, 200);
assert.equal(childSharing.seasonalAdjustment, 40);
assert.equal(childSharing.occupancyAdjustment, -40);
assert.equal(childSharing.total, 200);

console.log("Accommodation occupancy, inventory, package and pricing invariant checks passed.");
