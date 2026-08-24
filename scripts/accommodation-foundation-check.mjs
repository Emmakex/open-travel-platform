import assert from "node:assert/strict";
import {
  accommodationInventoryOverlaps,
  accommodationReferenceValue,
  isValidAccommodationOccupancy,
  isValidTripAccommodationPlacement,
  remainingRoomInventory
} from "../lib/accommodation-rules.ts";

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

console.log("Accommodation occupancy, inventory and trip-package invariant checks passed.");
