import assert from "node:assert/strict";
import {
  buildTripPackageAddOns,
  TripPackageAddOnError,
  validateTripAddOns
} from "../lib/trip-package-addons.ts";

const addOns = [
  {
    id: "priority-bag",
    code: "priority_bag",
    title: "Priority luggage handling",
    titleEs: "Gestión prioritaria de equipaje",
    description: "Optional luggage handling supplement.",
    descriptionEs: "Suplemento opcional de gestión de equipaje.",
    price: 35,
    pricingMode: "per-booking",
    enabled: true
  },
  {
    id: "special-dinner",
    code: "special_dinner",
    title: "Special dinner",
    titleEs: "Cena especial",
    price: 42.5,
    pricingMode: "per-traveller",
    enabled: true
  },
  {
    id: "old-option",
    code: "old_option",
    title: "Unavailable option",
    titleEs: "Opción no disponible",
    price: 10,
    pricingMode: "per-booking",
    enabled: false
  }
];

const travellers = [
  { id: "traveller-1" },
  { id: "traveller-2" },
  { id: "traveller-3" }
];

assert.equal(validateTripAddOns(addOns), true);
assert.equal(validateTripAddOns([{ ...addOns[0], titleEs: "" }]), false);
assert.equal(validateTripAddOns([
  addOns[0],
  { ...addOns[1], id: "duplicate-code", code: addOns[0].code }
]), false);
assert.equal(validateTripAddOns([{ ...addOns[0], descriptionEs: undefined }]), false);

const emptySelection = buildTripPackageAddOns({ addOns, travellers });
assert.equal(emptySelection.packageAddOnTotal, 0);
assert.deepEqual(emptySelection.bookings, []);

const selection = buildTripPackageAddOns({
  addOns,
  travellers,
  selectedBookingAddOnIds: ["priority-bag", "priority-bag"],
  selectedTravellerIdsByAddOn: {
    "special-dinner": ["traveller-1", "traveller-3", "traveller-3"]
  }
});

assert.equal(selection.bookings.length, 2);
const luggage = selection.bookings.find((item) => item.addOnId === "priority-bag");
const dinner = selection.bookings.find((item) => item.addOnId === "special-dinner");
assert.ok(luggage);
assert.ok(dinner);
assert.equal(luggage.quantity, 1);
assert.equal(luggage.totalPrice, 35);
assert.equal(dinner.quantity, 2);
assert.deepEqual(dinner.travellerIds, ["traveller-1", "traveller-3"]);
assert.equal(dinner.totalPrice, 85);
assert.equal(selection.packageAddOnTotal, 120);

// The returned reservation values are snapshots, not live references to catalogue pricing.
addOns[0].price = 999;
addOns[0].title = "Changed catalogue title";
assert.equal(luggage.unitPrice, 35);
assert.equal(luggage.title, "Priority luggage handling");

assert.throws(
  () => buildTripPackageAddOns({
    addOns,
    travellers,
    selectedBookingAddOnIds: ["old-option"]
  }),
  (error) => error instanceof TripPackageAddOnError && error.code === "ADDON_SELECTION_INVALID"
);

assert.throws(
  () => buildTripPackageAddOns({
    addOns,
    travellers,
    selectedTravellerIdsByAddOn: { "special-dinner": ["traveller-999"] }
  }),
  (error) => error instanceof TripPackageAddOnError && error.code === "ADDON_SELECTION_INVALID"
);

assert.throws(
  () => buildTripPackageAddOns({
    addOns,
    travellers,
    selectedBookingAddOnIds: ["unknown-option"]
  }),
  (error) => error instanceof TripPackageAddOnError && error.code === "ADDON_SELECTION_INVALID"
);

console.log("Trip package supplement pricing and snapshot invariant checks passed.");
