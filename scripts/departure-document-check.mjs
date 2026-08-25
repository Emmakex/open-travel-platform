import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PDFDocument } from "pdf-lib";
import {
  buildRoomingListRows,
  buildTravellerManifestRows,
  groupReservationsByDeparture,
  reservationsForDeparture
} from "../lib/departure-manifests.ts";
import {
  renderRoomingListPdf,
  renderTravellerListPdf
} from "../lib/departure-document-pdf.ts";

const travellersA = [
  {
    id: "trav-1",
    firstName: "Ana",
    lastName: "Garcia",
    dateOfBirth: "1985-04-02",
    nationality: "ES",
    isLead: true,
    ageAtDeparture: 41,
    pricingBandId: "adult",
    pricingCode: "ADULT",
    pricingLabel: "Adult",
    unitPrice: 700,
    consumesInventory: true
  },
  {
    id: "trav-2",
    firstName: "Luis",
    lastName: "Garcia",
    dateOfBirth: "2017-05-05",
    nationality: "ES",
    isLead: false,
    guardianTravellerId: "trav-1",
    guardianRelationship: "parent",
    ageAtDeparture: 9,
    pricingBandId: "child",
    pricingCode: "CHILD",
    pricingLabel: "Child",
    unitPrice: 400,
    consumesInventory: true
  }
];

const travellersB = [
  {
    id: "trav-3",
    firstName: "Marta",
    lastName: "Ruiz",
    dateOfBirth: "1990-11-09",
    nationality: "ES",
    isLead: true,
    ageAtDeparture: 35,
    pricingBandId: "adult",
    pricingCode: "ADULT",
    pricingLabel: "Adult",
    unitPrice: 700,
    consumesInventory: true
  }
];

function reservation(id, status, travellers, roomId) {
  return {
    id,
    identityId: `user-${id}`,
    tripId: "trip-1",
    availabilityId: "dep-1",
    partySize: travellers.length,
    travellers,
    unitPrice: 700,
    totalPrice: 1400,
    currency: "EUR",
    status,
    createdAt: "2026-08-25T10:00:00.000Z",
    tripTitle: "Andalusia Explorer",
    departureDate: "2026-10-10",
    returnDate: "2026-10-17",
    accommodationBookings: status === "cancelled" ? [] : [
      {
        componentId: "stay-1",
        accommodationId: "hotel-1",
        accommodationName: "Hotel Central",
        roomTypeId: "double",
        roomTypeName: "Double room",
        mealPlan: "breakfast",
        mode: "included",
        checkInDay: 1,
        nights: 7,
        checkInDate: "2026-10-10",
        checkOutDate: "2026-10-17",
        currency: "EUR",
        rooms: [
          {
            id: roomId,
            travellerIds: travellers.map((traveller) => traveller.id),
            adults: travellers.filter((traveller) => traveller.ageAtDeparture >= 18).length,
            childAges: travellers.filter((traveller) => traveller.ageAtDeparture < 18).map((traveller) => traveller.ageAtDeparture),
            basePrice: 700,
            seasonalAdjustment: 0,
            occupancyAdjustment: 0,
            totalPrice: 700
          }
        ],
        totalPrice: 700,
        amountAddedToReservation: 0,
        inventory: [{ periodId: "period-1", rooms: 1 }]
      }
    ]
  };
}

const activeA = reservation("res-a", "confirmed", travellersA, "room-a");
const activeB = reservation("res-b", "pending", travellersB, "room-b");
const cancelled = reservation("res-c", "cancelled", travellersB, "room-c");
const reservations = [activeA, cancelled, activeB];

const groups = groupReservationsByDeparture(reservations);
assert.equal(groups.length, 1);
assert.equal(groups[0].reservationCount, 2);
assert.equal(groups[0].travellerCount, 3);
assert.deepEqual(groups[0].reservations.map((item) => item.id), ["res-a", "res-b"]);

const selected = reservationsForDeparture(reservations, "trip-1", "dep-1");
assert.equal(selected.length, 2);
assert.equal(reservationsForDeparture(reservations, "trip-x", "dep-1").length, 0);

const travellerRows = buildTravellerManifestRows(selected);
assert.equal(travellerRows.length, 3);
assert.equal(travellerRows.filter((row) => row.isLead).length, 2);
assert.equal(travellerRows.some((row) => row.reservationId === "res-c"), false);

const roomRows = buildRoomingListRows(selected);
assert.equal(roomRows.length, 2);
assert.deepEqual(roomRows.map((row) => row.roomAllocationId), ["room-a", "room-b"]);
assert.equal(roomRows[0].accommodationName, "Hotel Central");

for (const locale of ["en", "es"]) {
  const input = {
    reservations: selected,
    tripTitle: "Andalusia Explorer",
    departureDate: "2026-10-10",
    returnDate: "2026-10-17",
    locale
  };
  const travellerPdf = await renderTravellerListPdf(input);
  const roomingPdf = await renderRoomingListPdf(input);
  assert.equal(Buffer.from(travellerPdf).subarray(0, 4).toString("ascii"), "%PDF");
  assert.equal(Buffer.from(roomingPdf).subarray(0, 4).toString("ascii"), "%PDF");
  assert.ok((await PDFDocument.load(travellerPdf)).getPageCount() >= 1);
  assert.ok((await PDFDocument.load(roomingPdf)).getPageCount() >= 1);
}

const travellerRoute = await readFile(new URL("../app/operator/documents/departures/[tripId]/[availabilityId]/travellers/route.ts", import.meta.url), "utf8");
const roomingRoute = await readFile(new URL("../app/operator/documents/departures/[tripId]/[availabilityId]/rooming-list/route.ts", import.meta.url), "utf8");
const documentPage = await readFile(new URL("../app/operator/documents/page.tsx", import.meta.url), "utf8");

for (const route of [travellerRoute, roomingRoute]) {
  assert.ok(route.includes('requireStaffCapability("reservations")'));
  assert.ok(route.includes('"Cache-Control": "private, no-store, max-age=0"'));
  assert.equal(route.includes("traveller-data"), false);
  assert.equal(route.includes("supplier-fulfilment"), false);
  assert.equal(route.includes("internal-notes"), false);
}
assert.ok(documentPage.includes("groupReservationsByDeparture"));
assert.ok(documentPage.includes("rooming-list"));
assert.ok(documentPage.includes("/travellers"));

console.log("Departure traveller-list and rooming-list invariants passed.");
