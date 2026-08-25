import assert from "node:assert/strict";
import {
  buildPackageAddOnAmendment,
  PackageAddOnAmendmentError,
  packageAddOnSnapshotsEqual
} from "../lib/package-addon-amendment-rules.ts";

const travellers = [{ id: "trav-1" }, { id: "trav-2" }, { id: "trav-3" }];
const catalog = [
  {
    id: "addon-dinner",
    code: "dinner",
    title: "Special dinner",
    titleEs: "Cena especial",
    price: 40,
    pricingMode: "per-traveller",
    enabled: true
  },
  {
    id: "addon-upgrade",
    code: "upgrade",
    title: "Private upgrade",
    titleEs: "Upgrade privado",
    price: 75,
    pricingMode: "per-booking",
    enabled: true
  },
  {
    id: "addon-old",
    code: "old_extra",
    title: "Old extra",
    titleEs: "Extra antiguo",
    price: 60,
    pricingMode: "per-traveller",
    enabled: false
  }
];

const historicalDinner = {
  addOnId: "addon-dinner",
  code: "dinner",
  title: "Special dinner",
  titleEs: "Cena especial",
  pricingMode: "per-traveller",
  unitPrice: 30,
  quantity: 2,
  travellerIds: ["trav-1", "trav-2"],
  totalPrice: 60
};
const historicalOld = {
  addOnId: "addon-old",
  code: "old_extra",
  title: "Old extra",
  titleEs: "Extra antiguo",
  pricingMode: "per-traveller",
  unitPrice: 25,
  quantity: 2,
  travellerIds: ["trav-1", "trav-2"],
  totalPrice: 50
};

const amended = buildPackageAddOnAmendment({
  catalogAddOns: catalog,
  currentBookings: [historicalDinner, historicalOld],
  travellers,
  selectedBookingAddOnIds: ["addon-upgrade"],
  selectedTravellerIdsByAddOn: {
    "addon-dinner": ["trav-1", "trav-2", "trav-3"],
    "addon-old": ["trav-1"]
  }
});

const dinner = amended.bookings.find((item) => item.addOnId === "addon-dinner");
const old = amended.bookings.find((item) => item.addOnId === "addon-old");
const upgrade = amended.bookings.find((item) => item.addOnId === "addon-upgrade");
assert.equal(dinner?.unitPrice, 30, "Existing supplement must preserve its contracted unit price.");
assert.equal(dinner?.quantity, 3);
assert.equal(dinner?.totalPrice, 90);
assert.equal(old?.unitPrice, 25, "Disabled historical supplement must preserve stored price.");
assert.deepEqual(old?.travellerIds, ["trav-1"]);
assert.equal(old?.totalPrice, 25);
assert.equal(upgrade?.unitPrice, 75, "New supplement must use the current catalogue price.");
assert.equal(upgrade?.totalPrice, 75);
assert.equal(amended.packageAddOnTotal, 190);

const removed = buildPackageAddOnAmendment({
  catalogAddOns: catalog,
  currentBookings: [historicalDinner],
  travellers,
  selectedBookingAddOnIds: [],
  selectedTravellerIdsByAddOn: {}
});
assert.equal(removed.packageAddOnTotal, 0);
assert.deepEqual(removed.bookings, []);

assert.throws(
  () => buildPackageAddOnAmendment({
    catalogAddOns: catalog,
    currentBookings: [historicalOld],
    travellers,
    selectedBookingAddOnIds: [],
    selectedTravellerIdsByAddOn: { "addon-old": ["trav-1", "trav-3"] }
  }),
  (error) => error instanceof PackageAddOnAmendmentError && error.code === "ADDON_DISABLED_EXPANSION"
);

assert.throws(
  () => buildPackageAddOnAmendment({
    catalogAddOns: catalog,
    currentBookings: [],
    travellers,
    selectedBookingAddOnIds: [],
    selectedTravellerIdsByAddOn: { "addon-dinner": ["trav-missing"] }
  }),
  (error) => error instanceof PackageAddOnAmendmentError && error.code === "ADDON_SELECTION_INVALID"
);

assert.equal(
  packageAddOnSnapshotsEqual(
    [historicalDinner],
    [{ ...historicalDinner, travellerIds: ["trav-2", "trav-1"] }]
  ),
  true,
  "Snapshot equality must ignore traveller ordering."
);

console.log("Package supplement amendment invariants passed.");
