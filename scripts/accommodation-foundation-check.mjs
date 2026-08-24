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
import {
  AccommodationBookingError,
  accommodationBookingTotals,
  accommodationInventoryMovements,
  allocateTravellersToRooms,
  attachAccommodationInventory,
  buildAccommodationBookingPlan
} from "../lib/accommodation-booking.ts";

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
  publicationStatus: "published",
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

const familyTravellers = [
  { id: "adult-1", firstName: "A", lastName: "One", dateOfBirth: "1985-01-01" },
  { id: "adult-2", firstName: "B", lastName: "Two", dateOfBirth: "1988-01-01" },
  { id: "child-1", firstName: "C", lastName: "Three", dateOfBirth: "2018-01-01" }
];
const familyAllocation = allocateTravellersToRooms(room, familyTravellers, "2026-07-01");
assert.equal(familyAllocation.length, 1);
assert.equal(familyAllocation[0].adults, 2);
assert.deepEqual(familyAllocation[0].childAges, [8]);
assert.deepEqual(new Set(familyAllocation[0].travellerIds), new Set(["adult-1", "adult-2", "child-1"]));

const twoRoomTravellers = [
  ...familyTravellers,
  { id: "adult-3", firstName: "D", lastName: "Four", dateOfBirth: "1987-01-01" },
  { id: "adult-4", firstName: "E", lastName: "Five", dateOfBirth: "1990-01-01" },
  { id: "child-2", firstName: "F", lastName: "Six", dateOfBirth: "2019-01-01" }
];
const twoRoomAllocation = allocateTravellersToRooms(room, twoRoomTravellers, "2026-07-01");
assert.equal(twoRoomAllocation.length, 2);
assert.equal(twoRoomAllocation.reduce((sum, item) => sum + item.travellerIds.length, 0), 6);
assert.ok(twoRoomAllocation.every((item) => item.adults === 2 && item.childAges.length === 1));

const components = [
  {
    id: "included-stay",
    accommodationId: accommodation.id,
    roomTypeId: room.id,
    checkInDay: 1,
    nights: 2,
    mode: "included"
  },
  {
    id: "optional-stay",
    accommodationId: accommodation.id,
    roomTypeId: room.id,
    checkInDay: 1,
    nights: 2,
    mode: "optional"
  }
];
const plan = buildAccommodationBookingPlan({
  components,
  accommodations: [accommodation],
  departureDate: "2026-07-01",
  travellers: familyTravellers,
  selectedOptionalComponentIds: ["optional-stay"],
  reservationCurrency: "EUR"
});
assert.equal(plan.length, 2);
assert.equal(plan[0].mode, "included");
assert.equal(plan[0].amountAddedToReservation, 0);
assert.equal(plan[1].mode, "optional");
assert.equal(plan[1].amountAddedToReservation, 200);
assert.deepEqual(accommodationBookingTotals(plan), {
  accommodationTotal: 400,
  accommodationAdditionalTotal: 200
});

const inventory = [{
  id: "summer-double",
  accommodationId: accommodation.id,
  roomTypeId: room.id,
  startDate: "2026-07-01",
  endDate: "2026-07-31",
  capacity: 3,
  reserved: 0,
  status: "open"
}];
const planWithInventory = attachAccommodationInventory(plan, new Map([[accommodation.id, inventory]]));
assert.ok(planWithInventory.every((booking) => booking.inventory.length === 1));
assert.equal(accommodationInventoryMovements(planWithInventory).get("summer-double"), 2);

assert.throws(
  () => attachAccommodationInventory([plan[0]], new Map([[accommodation.id, [{ ...inventory[0], capacity: 1, reserved: 1 }]]])),
  (error) => error instanceof AccommodationBookingError && error.code === "ACCOMMODATION_INVENTORY_UNAVAILABLE"
);

console.log("Accommodation occupancy, inventory, package, pricing and booking invariant checks passed.");
