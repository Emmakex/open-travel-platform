import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  accommodationVoucherFilename,
  renderAccommodationVoucherPdf,
  renderReservationDossierPdf,
  renderServiceVoucherPdf,
  reservationDossierFilename,
  serviceVoucherFilename
} from "../lib/voucher-dossier-document.ts";

const travellers = [
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
];

const reservation = {
  id: "res-VOU-001",
  identityId: "usr-1",
  tripId: "trip-barcelona",
  availabilityId: "dep-1",
  partySize: 2,
  travellers,
  unitPrice: 620,
  accommodationBookings: [
    {
      componentId: "stay-1",
      accommodationId: "hotel-1",
      accommodationName: "Hotel Central",
      roomTypeId: "double",
      roomTypeName: "Habitación doble",
      mealPlan: "breakfast",
      mode: "included",
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
      amountAddedToReservation: 0,
      inventory: [{ periodId: "period-1", rooms: 1 }]
    }
  ],
  packageAddOns: [],
  totalPrice: 1240,
  currency: "EUR",
  status: "confirmed",
  createdAt: "2026-08-26T08:00:00.000Z",
  tripTitle: "Barcelona cultural escape",
  departureDate: "2026-10-10",
  returnDate: "2026-10-13"
};

const serviceReservation = {
  id: "srv-VOU-001",
  identityId: "usr-1",
  serviceId: "service-1",
  serviceType: "activity",
  serviceSlug: "museum-tour",
  serviceTitle: "Museum tour",
  pricingMode: "per-person",
  currency: "EUR",
  status: "confirmed",
  availabilityId: "slot-1",
  serviceDate: "2026-10-11",
  startTime: "10:00",
  endTime: "12:00",
  partySize: 2,
  inventoryUnits: 2,
  quantity: 2,
  unitPrice: 35,
  totalPrice: 70,
  travellers,
  relatedReservationId: reservation.id,
  createdAt: "2026-08-26T08:10:00.000Z"
};

const payment = {
  reservationId: reservation.id,
  targetId: reservation.id,
  targetType: "trip",
  status: "partially_paid",
  settlementStatus: "payment_due",
  currency: "EUR",
  totalAmount: 1240,
  paidAmount: 500,
  refundedAmount: 0,
  netPaidAmount: 500,
  outstandingAmount: 740,
  overpaidAmount: 0,
  settlementAmount: 740,
  refundableAmount: 500,
  pendingPaymentAmount: 0,
  pendingRefundAmount: 0
};

const generatedAt = "2026-08-26T09:00:00.000Z";
for (const locale of ["en", "es"]) {
  const supplierReferences = new Map([["accommodation:stay-1", "HOTEL-ABC-123"], ["service", "ACT-XYZ-456"]]);
  const accommodation = await renderAccommodationVoucherPdf({ reservation, locale, supplierReferences, generatedAt });
  const service = await renderServiceVoucherPdf({ reservation: serviceReservation, locale, supplierReferences, generatedAt });
  const dossier = await renderReservationDossierPdf({
    reservation,
    locale,
    customer: { firstName: "María", lastName: "García", email: "maria@example.com", phone: "+34 600 000 000", country: "ES" },
    payment,
    linkedServices: [serviceReservation],
    fulfilment: [{ componentKey: "trip", componentLabel: "Barcelona cultural escape", status: "confirmed", supplierName: "Partner", supplierReference: "INT-123", deadline: "2026-09-01" }],
    generatedAt
  });
  for (const [name, pdf] of [["accommodation", accommodation], ["service", service], ["dossier", dossier]]) {
    assert.equal(Buffer.from(pdf.slice(0, 5)).toString("ascii"), "%PDF-", `${name} ${locale} must be a real PDF`);
    assert.ok(pdf.length > 2200, `${name} ${locale} PDF should contain rendered document content`);
  }
}

assert.equal(accommodationVoucherFilename("../unsafe id", "en"), "accommodation-voucher-unsafe-id.pdf");
assert.equal(serviceVoucherFilename("srv-1", "es"), "voucher-servicio-srv-1.pdf");
assert.equal(reservationDossierFilename("res-1", "es"), "expediente-reserva-res-1.pdf");

const sourceChecks = [
  ["app/account/reservations/[id]/accommodation-voucher/route.ts", "getReservation(identity.id, id)"],
  ["app/account/reservations/[id]/accommodation-voucher/route.ts", 'reservation.status !== "confirmed"'],
  ["app/account/services/[id]/voucher/route.ts", "getServiceReservationForCustomer(identity.id, id)"],
  ["app/account/services/[id]/voucher/route.ts", 'reservation.status !== "confirmed"'],
  ["app/operator/reservations/[id]/dossier/route.ts", 'requireStaffCapability("reservations")'],
  ["app/operator/reservations/[id]/dossier/route.ts", 'hasStaffCapability(identity, "finance")'],
  ["app/operator/reservations/[id]/dossier/route.ts", 'hasStaffCapability(identity, "suppliers")'],
  ["app/operator/documents/page.tsx", "Operator dossier"],
  ["app/operator/documents/page.tsx", "Accommodation voucher"],
  ["app/operator/documents/page.tsx", "Service voucher"],
  ["components/operator/supplier-fulfilment-panel.tsx", "Approve for customer vouchers"],
  ["app/operator/fulfilment/reference-actions.ts", 'requireStaffCapability("suppliers")'],
  ["lib/customer-document-references.ts", "disclosure.approvedReference === currentReference"],
  ["lib/customer-document-references.ts", "supplierReferenceDisclosureAuditCollectionName"],
  ["app/account/reservations/page.tsx", "Download accommodation voucher"],
  ["app/account/services/page.tsx", "Download service voucher"]
];

for (const [path, expected] of sourceChecks) {
  const source = await readFile(new URL(`../${path}`, import.meta.url), "utf8");
  assert.ok(source.includes(expected), `${path} must contain ${expected}`);
}

for (const path of [
  "app/account/reservations/[id]/accommodation-voucher/route.ts",
  "app/account/services/[id]/voucher/route.ts",
  "app/operator/reservations/[id]/accommodation-voucher/route.ts",
  "app/operator/service-reservations/[id]/voucher/route.ts",
  "app/operator/reservations/[id]/dossier/route.ts"
]) {
  const source = await readFile(new URL(`../${path}`, import.meta.url), "utf8");
  assert.ok(source.includes('"Cache-Control": "private, no-store, max-age=0"'), `${path} must be private no-store`);
  assert.ok(source.includes('"X-Content-Type-Options": "nosniff"'), `${path} must set nosniff`);
}

const rendererSource = await readFile(new URL("../lib/voucher-dossier-document.ts", import.meta.url), "utf8");
assert.equal(rendererSource.includes("traveller-data"), false, "voucher/dossier renderer must not import protected traveller-data storage");
assert.equal(rendererSource.includes("supplierCost"), false, "voucher/dossier renderer must not accept supplier costs");
assert.equal(rendererSource.includes("InternalNote"), false, "voucher/dossier renderer must not accept internal reservation notes");

const customerReferenceSource = await readFile(new URL("../lib/customer-document-references.ts", import.meta.url), "utf8");
assert.ok(customerReferenceSource.includes("approvedReference === currentReference"), "customer supplier reference projection must invalidate changed references");
assert.ok(customerReferenceSource.includes("visible: true"), "customer supplier reference projection must require explicit visibility");

console.log("Voucher, dossier, supplier-reference disclosure, access and privacy invariants passed.");
