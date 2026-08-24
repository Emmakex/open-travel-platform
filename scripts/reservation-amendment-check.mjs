import assert from "node:assert/strict";
import { evaluateChangePolicy } from "../lib/change-policy.ts";
import { buildPaymentSummary } from "../lib/payment-summary.ts";
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

const successfulPayment = {
  id: "payment-1",
  reservationId: "reservation-1",
  targetType: "trip",
  type: "payment",
  status: "succeeded",
  amount: 1500,
  currency: "EUR",
  provider: "manual",
  createdAt: "2026-08-24T00:00:00.000Z"
};

const increasedTotal = buildPaymentSummary(
  { id: "reservation-1", totalPrice: 2000, currency: "EUR", targetType: "trip" },
  [successfulPayment]
);
assert.equal(increasedTotal.outstandingAmount, 500);
assert.equal(increasedTotal.overpaidAmount, 0);
assert.equal(increasedTotal.settlementStatus, "payment_due");
assert.equal(increasedTotal.settlementAmount, 500);

const reducedTotal = buildPaymentSummary(
  { id: "reservation-1", totalPrice: 1200, currency: "EUR", targetType: "trip" },
  [successfulPayment]
);
assert.equal(reducedTotal.outstandingAmount, 0);
assert.equal(reducedTotal.overpaidAmount, 300);
assert.equal(reducedTotal.settlementStatus, "refund_review");
assert.equal(reducedTotal.settlementAmount, 300);

const pendingRefund = buildPaymentSummary(
  { id: "reservation-1", totalPrice: 1200, currency: "EUR", targetType: "trip" },
  [
    successfulPayment,
    {
      id: "refund-pending",
      reservationId: "reservation-1",
      targetType: "trip",
      type: "refund",
      status: "pending",
      amount: 300,
      currency: "EUR",
      provider: "manual",
      createdAt: "2026-08-24T01:00:00.000Z"
    }
  ]
);
assert.equal(pendingRefund.settlementStatus, "pending");
assert.equal(pendingRefund.pendingRefundAmount, 300);

const settledRefund = buildPaymentSummary(
  { id: "reservation-1", totalPrice: 1200, currency: "EUR", targetType: "trip" },
  [
    successfulPayment,
    {
      id: "refund-1",
      reservationId: "reservation-1",
      targetType: "trip",
      type: "refund",
      status: "succeeded",
      amount: 300,
      currency: "EUR",
      provider: "manual",
      createdAt: "2026-08-24T02:00:00.000Z"
    }
  ]
);
assert.equal(settledRefund.netPaidAmount, 1200);
assert.equal(settledRefund.overpaidAmount, 0);
assert.equal(settledRefund.outstandingAmount, 0);
assert.equal(settledRefund.settlementStatus, "settled");

const policy = {
  customerCancellationAllowed: true,
  customerCancellationCutoffHours: 72,
  staffModificationCutoffHours: 48,
  staffCancellationCutoffHours: 24,
  notifyCustomerOnStaffChange: false
};
const policyStart = Date.parse("2026-09-10T00:00:00Z");

const allOpen = evaluateChangePolicy({
  policy,
  startTimestamp: policyStart,
  now: new Date("2026-09-06T12:00:00Z")
});
assert.equal(allOpen.customerCancellationAllowed, true);
assert.equal(allOpen.staffModificationAllowed, true);
assert.equal(allOpen.staffCancellationAllowed, true);
assert.equal(allOpen.notifyCustomerOnStaffChange, false);
assert.equal(allOpen.customerCancellationCutoffAt, "2026-09-07T00:00:00.000Z");

const customerClosed = evaluateChangePolicy({
  policy,
  startTimestamp: policyStart,
  now: new Date("2026-09-07T12:00:00Z")
});
assert.equal(customerClosed.customerCancellationAllowed, false);
assert.equal(customerClosed.staffModificationAllowed, true);
assert.equal(customerClosed.staffCancellationAllowed, true);

const allClosed = evaluateChangePolicy({
  policy,
  startTimestamp: policyStart,
  now: new Date("2026-09-09T12:00:00Z")
});
assert.equal(allClosed.customerCancellationAllowed, false);
assert.equal(allClosed.staffModificationAllowed, false);
assert.equal(allClosed.staffCancellationAllowed, false);

const legacyPolicy = evaluateChangePolicy({
  startTimestamp: policyStart,
  now: new Date("2026-09-09T23:00:00Z")
});
assert.equal(legacyPolicy.customerCancellationAllowed, true);
assert.equal(legacyPolicy.staffModificationAllowed, true);
assert.equal(legacyPolicy.staffCancellationAllowed, true);
assert.equal(legacyPolicy.notifyCustomerOnStaffChange, true);

console.log("Reservation amendment, financial adjustment and change-policy invariant checks passed.");
