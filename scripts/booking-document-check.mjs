import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  bookingConfirmationFilename,
  renderBookingConfirmationPdf
} from "../lib/booking-confirmation-document.ts";

const reservation = {
  id: "res-BC-001",
  identityId: "usr-1",
  tripId: "trip-barcelona",
  availabilityId: "dep-1",
  partySize: 2,
  travellers: [
    {
      id: "trav-1",
      firstName: "María",
      lastName: "García",
      dateOfBirth: "1987-03-14",
      nationality: "ES",
      isLead: true,
      ageAtDeparture: 39,
      pricingBandId: "adult",
      pricingCode: "ADT",
      pricingLabel: "Adult",
      pricingLabelEs: "Adulto",
      unitPrice: 620,
      consumesInventory: true
    },
    {
      id: "trav-2",
      firstName: "José",
      lastName: "Muñoz",
      dateOfBirth: "1989-08-20",
      nationality: "ES",
      isLead: false,
      ageAtDeparture: 37,
      pricingBandId: "adult",
      pricingCode: "ADT",
      pricingLabel: "Adult",
      pricingLabelEs: "Adulto",
      unitPrice: 620,
      consumesInventory: true
    }
  ],
  unitPrice: 620,
  tripPriceTotal: 1240,
  accommodationTotal: 380,
  accommodationAdditionalTotal: 380,
  accommodationBookings: [
    {
      componentId: "stay-1",
      accommodationId: "hotel-1",
      accommodationSlug: "hotel-central",
      accommodationName: "Hotel Central",
      roomTypeId: "double",
      roomTypeName: "Habitación doble",
      mealPlan: "breakfast",
      mode: "optional",
      checkInDay: 1,
      nights: 2,
      checkInDate: "2026-10-10",
      checkOutDate: "2026-10-12",
      currency: "EUR",
      rooms: [
        {
          id: "room-1",
          travellerIds: ["trav-1", "trav-2"],
          adults: 2,
          childAges: [],
          basePrice: 380,
          seasonalAdjustment: 0,
          occupancyAdjustment: 0,
          totalPrice: 380
        }
      ],
      totalPrice: 380,
      amountAddedToReservation: 380,
      inventory: [{ periodId: "period-1", rooms: 1 }]
    }
  ],
  packageAddOns: [
    {
      addOnId: "addon-1",
      code: "LATE-CHECKOUT",
      title: "Late checkout",
      titleEs: "Salida tardía",
      pricingMode: "per-booking",
      unitPrice: 45,
      quantity: 1,
      totalPrice: 45
    }
  ],
  packageAddOnTotal: 45,
  totalPrice: 1665,
  currency: "EUR",
  status: "confirmed",
  createdAt: "2026-08-25T10:00:00.000Z",
  tripTitle: "Barcelona cultural escape",
  departureDate: "2026-10-10",
  returnDate: "2026-10-13"
};

const payment = {
  reservationId: reservation.id,
  targetId: reservation.id,
  targetType: "trip",
  status: "partially_paid",
  settlementStatus: "payment_due",
  currency: "EUR",
  totalAmount: 1665,
  paidAmount: 500,
  refundedAmount: 0,
  netPaidAmount: 500,
  outstandingAmount: 1165,
  overpaidAmount: 0,
  settlementAmount: 1165,
  refundableAmount: 500,
  pendingPaymentAmount: 0,
  pendingRefundAmount: 0
};

const customer = {
  firstName: "María",
  lastName: "García",
  email: "maria@example.com",
  phone: "+34 600 000 000",
  country: "ES"
};

for (const locale of ["en", "es"]) {
  const pdf = await renderBookingConfirmationPdf({ reservation, locale, customer, payment });
  const signature = Buffer.from(pdf.slice(0, 5)).toString("ascii");
  assert.equal(signature, "%PDF-");
  assert.ok(pdf.length > 2500, `${locale} booking confirmation PDF should contain rendered document content`);
}

assert.equal(bookingConfirmationFilename("res-BC-001", "en"), "booking-confirmation-res-BC-001.pdf");
assert.equal(bookingConfirmationFilename("res-BC-001", "es"), "confirmacion-reserva-res-BC-001.pdf");
assert.equal(bookingConfirmationFilename("../unsafe id", "en"), "booking-confirmation-unsafe-id.pdf");

const sourceChecks = [
  ["app/account/reservations/[id]/confirmation/route.ts", "getReservation(identity.id, id)"],
  ["app/account/reservations/[id]/confirmation/route.ts", '"Cache-Control": "private, no-store, max-age=0"'],
  ["app/operator/reservations/[id]/confirmation/route.ts", 'hasStaffCapability(identity, "reservations")'],
  ["app/operator/reservations/[id]/confirmation/route.ts", 'hasStaffCapability(identity, "finance")'],
  ["app/operator/documents/page.tsx", 'requireStaffCapability("reservations")'],
  ["app/account/reservations/page.tsx", "Download confirmation PDF"],
  ["app/operator/page.tsx", 'href="/operator/documents"'],
  ["lib/booking-confirmation-document.ts", "does not replace a fiscal invoice"]
];

for (const [path, expected] of sourceChecks) {
  const source = await readFile(new URL(`../${path}`, import.meta.url), "utf8");
  assert.ok(source.includes(expected), `${path} must contain ${expected}`);
}

const rendererSource = await readFile(new URL("../lib/booking-confirmation-document.ts", import.meta.url), "utf8");
assert.equal(rendererSource.includes("traveller-data"), false, "booking confirmation renderer must not import protected post-purchase traveller data");
assert.equal(rendererSource.includes("supplier"), false, "booking confirmation renderer must not expose internal supplier data");

console.log("Booking confirmation PDF, access and privacy invariants passed.");
