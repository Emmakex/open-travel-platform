import assert from "node:assert/strict";
import { priceTravellerComposition } from "../lib/traveller-pricing.ts";

const trip = {
  fromPrice: 1000,
  travellerPricing: [
    {
      id: "minor",
      code: "minor",
      label: "Minor",
      labelEs: "Menor",
      minAge: 0,
      maxAge: 17,
      price: 500,
      consumesInventory: false
    },
    {
      id: "adult",
      code: "adult",
      label: "Adult",
      labelEs: "Adulto",
      minAge: 18,
      price: 1000,
      consumesInventory: true
    }
  ]
};

const drafts = [
  {
    id: "lead",
    firstName: "Lead",
    lastName: "Traveller",
    dateOfBirth: "1980-01-01",
    nationality: "Spanish"
  },
  {
    id: "second",
    firstName: "Second",
    lastName: "Traveller",
    dateOfBirth: "2008-09-01",
    nationality: "Spanish",
    guardianTravellerId: "lead",
    guardianRelationship: "parent"
  }
];

const beforeBirthday = priceTravellerComposition({
  trip,
  availability: { departureDate: "2026-08-31" },
  drafts
});
assert.equal(beforeBirthday.travellers[1].ageAtDeparture, 17);
assert.equal(beforeBirthday.travellers[1].pricingCode, "minor");
assert.equal(beforeBirthday.totalPrice, 1500);
assert.equal(beforeBirthday.inventorySpaces, 1);

const afterBirthday = priceTravellerComposition({
  trip,
  availability: { departureDate: "2026-09-02" },
  drafts
});
assert.equal(afterBirthday.travellers[1].ageAtDeparture, 18);
assert.equal(afterBirthday.travellers[1].pricingCode, "adult");
assert.equal(afterBirthday.travellers[1].guardianTravellerId, undefined);
assert.equal(afterBirthday.totalPrice, 2000);
assert.equal(afterBirthday.inventorySpaces, 2);

console.log("Reservation departure repricing invariant check passed.");
