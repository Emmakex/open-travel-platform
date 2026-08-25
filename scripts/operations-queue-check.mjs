import assert from "node:assert/strict";
import {
  filterOperationsQueue,
  normalizeQueueDate,
  normalizeQueueSearch,
  normalizeQueueTag,
  paginateOperationsQueue,
  sortOperationsQueue
} from "../lib/operations-queue.ts";

const baseReservation = {
  identityId: "usr-1",
  tripId: "trip-1",
  availabilityId: "dep-1",
  partySize: 2,
  unitPrice: 100,
  totalPrice: 200,
  currency: "EUR",
  status: "confirmed",
  createdAt: "2026-08-01T10:00:00.000Z",
  departureDate: "2026-10-10"
};

const rows = [
  {
    reservation: {
      ...baseReservation,
      id: "res-vip",
      travellers: [{ firstName: "Ana", lastName: "García" }]
    },
    tripTitle: "Barcelona Premium",
    customerName: "Ana García",
    customerEmail: "ana@example.com",
    workflow: { reservationId: "res-vip", ownerStaffId: "staff-1", ownerDisplayName: "Eva", priority: "urgent", tags: ["VIP", "hotel"] },
    payment: { status: "partially_paid", outstandingAmount: 80 },
    paymentOverdue: true,
    overdueTaskCount: 2,
    supplierAttentionCount: 1
  },
  {
    reservation: {
      ...baseReservation,
      id: "res-normal",
      identityId: "usr-2",
      status: "pending",
      departureDate: "2026-09-01",
      createdAt: "2026-08-20T10:00:00.000Z"
    },
    tripTitle: "Madrid Weekend",
    customerName: "Luis Pérez",
    customerEmail: "luis@example.com",
    workflow: { reservationId: "res-normal", priority: "normal", tags: ["familia"] },
    payment: { status: "unpaid", outstandingAmount: 200 },
    paymentOverdue: false,
    overdueTaskCount: 0,
    supplierAttentionCount: 0
  }
];

assert.equal(normalizeQueueSearch("  Ana   García  "), "Ana García");
assert.equal(normalizeQueueTag("  VIP  "), "VIP");
assert.equal(normalizeQueueDate("2026-02-29"), undefined);
assert.equal(normalizeQueueDate("2028-02-29"), "2028-02-29");

assert.deepEqual(filterOperationsQueue(rows, { q: "ana@example.com" }).map((row) => row.reservation.id), ["res-vip"]);
assert.deepEqual(filterOperationsQueue(rows, { q: "Ana García" }).map((row) => row.reservation.id), ["res-vip"]);
assert.deepEqual(filterOperationsQueue(rows, { status: "pending" }).map((row) => row.reservation.id), ["res-normal"]);
assert.deepEqual(filterOperationsQueue(rows, { owner: "unassigned" }).map((row) => row.reservation.id), ["res-normal"]);
assert.deepEqual(filterOperationsQueue(rows, { priority: "urgent", tag: "vip" }).map((row) => row.reservation.id), ["res-vip"]);
assert.deepEqual(filterOperationsQueue(rows, { payment: "outstanding" }).map((row) => row.reservation.id), ["res-vip", "res-normal"]);
assert.deepEqual(filterOperationsQueue(rows, { payment: "overdue" }).map((row) => row.reservation.id), ["res-vip"]);
assert.deepEqual(filterOperationsQueue(rows, { attention: "any" }).map((row) => row.reservation.id), ["res-vip", "res-normal"]);
assert.deepEqual(filterOperationsQueue(rows, { attention: "overdue-tasks" }).map((row) => row.reservation.id), ["res-vip"]);
assert.deepEqual(filterOperationsQueue(rows, { attention: "supplier" }).map((row) => row.reservation.id), ["res-vip"]);
assert.deepEqual(filterOperationsQueue(rows, { departureFrom: "2026-10-01", departureTo: "2026-10-31" }).map((row) => row.reservation.id), ["res-vip"]);

assert.deepEqual(sortOperationsQueue(rows, "departure-asc").map((row) => row.reservation.id), ["res-normal", "res-vip"]);
assert.deepEqual(sortOperationsQueue(rows, "priority").map((row) => row.reservation.id), ["res-vip", "res-normal"]);
assert.deepEqual(sortOperationsQueue(rows, "newest").map((row) => row.reservation.id), ["res-normal", "res-vip"]);

const paged = paginateOperationsQueue(Array.from({ length: 45 }, (_, index) => index + 1), 3, 20);
assert.equal(paged.page, 3);
assert.equal(paged.totalPages, 3);
assert.deepEqual(paged.rows, [41, 42, 43, 44, 45]);
assert.equal(paginateOperationsQueue([1, 2], 99, 20).page, 1);

console.log("Operations queue search, filter, sorting and pagination invariants passed.");
