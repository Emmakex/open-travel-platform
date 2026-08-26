import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { strFromU8, unzipSync } from "fflate";
import {
  renderCsv,
  renderXlsx,
  safeExportFilename,
  safeSpreadsheetText
} from "../lib/tabular-export.ts";
import {
  buildFinancialRows,
  filterReservationsByDate,
  outstandingBalanceExport,
  reconciliationExport,
  reportDateFilters,
  reservationExport,
  revenueExport
} from "../lib/operator-reporting.ts";

assert.equal(safeSpreadsheetText("=2+2"), "'=2+2");
assert.equal(safeSpreadsheetText("+SUM(A1:A2)"), "'+SUM(A1:A2)");
assert.equal(safeSpreadsheetText("-1+2"), "'-1+2");
assert.equal(safeSpreadsheetText("@cmd"), "'@cmd");
assert.equal(safeSpreadsheetText("normal text"), "normal text");
assert.equal(safeExportFilename("../../Payment reconciliation", "xlsx"), "payment-reconciliation.xlsx");

const simpleTable = {
  sheetName: "Export / test",
  columns: [
    { key: "name", label: "Name", value: (row) => row.name },
    { key: "amount", label: "Amount", value: (row) => row.amount }
  ],
  rows: [{ name: "=HYPERLINK(\"https://example.invalid\")", amount: 12.5 }]
};
const csv = renderCsv(simpleTable).toString("utf8");
assert.ok(csv.startsWith("\uFEFF"), "CSV must include UTF-8 BOM for spreadsheet interoperability");
assert.ok(csv.includes("'=HYPERLINK"), "CSV formula-like user data must be forced to text");

const xlsx = renderXlsx(simpleTable);
assert.equal(xlsx.subarray(0, 2).toString("ascii"), "PK", "XLSX must be a ZIP/OOXML package");
const xlsxFiles = unzipSync(xlsx);
for (const required of [
  "[Content_Types].xml",
  "xl/workbook.xml",
  "xl/worksheets/sheet1.xml",
  "xl/styles.xml"
]) {
  assert.ok(xlsxFiles[required], `XLSX must contain ${required}`);
}
const worksheet = strFromU8(xlsxFiles["xl/worksheets/sheet1.xml"]);
assert.ok(worksheet.includes("autoFilter"), "XLSX worksheet should expose a header filter");
assert.ok(worksheet.includes("&apos;=HYPERLINK"), "XLSX formula-like user data must remain literal text");

const filters = reportDateFilters(new URLSearchParams("from=2026-09-30&to=2026-09-01"));
assert.deepEqual(filters, { from: "2026-09-01", to: "2026-09-30" });

const reservation = {
  id: "res-report-1",
  identityId: "usr-1",
  tripId: "trip-1",
  availabilityId: "dep-1",
  partySize: 2,
  travellers: [{
    id: "trav-1",
    firstName: "=Maria",
    lastName: "Example",
    dateOfBirth: "1990-01-01",
    nationality: "ES",
    isLead: true,
    ageAtDeparture: 36,
    pricingBandId: "adult",
    pricingCode: "ADT",
    pricingLabel: "Adult",
    unitPrice: 500,
    consumesInventory: true
  }],
  unitPrice: 500,
  totalPrice: 1000,
  currency: "EUR",
  status: "confirmed",
  createdAt: "2026-09-10T10:00:00.000Z",
  departureDate: "2026-10-10",
  returnDate: "2026-10-12",
  tripTitle: "Reporting trip"
};
const payment = {
  reservationId: reservation.id,
  targetId: reservation.id,
  targetType: "trip",
  status: "partially_paid",
  settlementStatus: "payment_due",
  currency: "EUR",
  totalAmount: 1000,
  paidAmount: 400,
  refundedAmount: 0,
  netPaidAmount: 400,
  outstandingAmount: 600,
  overpaidAmount: 0,
  settlementAmount: 600,
  refundableAmount: 400,
  pendingPaymentAmount: 0,
  pendingRefundAmount: 0
};
assert.equal(filterReservationsByDate([reservation], { from: "2026-09-01", to: "2026-09-30" }).length, 1);
assert.equal(filterReservationsByDate([reservation], { from: "2026-10-01" }).length, 0);
assert.equal(reservationExport([reservation], "en").rows.length, 1);

const financialRows = buildFinancialRows({
  reservations: [reservation],
  reservationSummaries: { [reservation.id]: payment },
  services: [],
  serviceSummaries: {}
});
assert.equal(financialRows.length, 1);
assert.equal(reconciliationExport(financialRows, "en").rows.length, 1);
assert.equal(outstandingBalanceExport(financialRows, "en").rows.length, 1);
assert.equal(revenueExport(financialRows, "en").rows[0].netCollected, 400);

const ordinaryRoute = await readFile(new URL("../app/operator/reports/export/[type]/route.ts", import.meta.url), "utf8");
assert.ok(ordinaryRoute.includes('const financeTypes = new Set(["reconciliation", "outstanding-balances", "revenue"])'));
assert.ok(ordinaryRoute.includes('const capability = financeTypes.has(type) ? "finance" : "reservations"'));
assert.ok(ordinaryRoute.includes('"Cache-Control"') === false, "response security headers belong to the shared response helper");
assert.equal(ordinaryRoute.includes("readProtectedTravellerExportRows"), false, "ordinary exports must not load protected traveller values");

const responseSource = await readFile(new URL("../lib/operator-export-response.ts", import.meta.url), "utf8");
assert.ok(responseSource.includes('"Cache-Control": "private, no-store, max-age=0"'));
assert.ok(responseSource.includes('"X-Content-Type-Options": "nosniff"'));

const sensitiveRoute = await readFile(new URL("../app/operator/reports/protected-travellers/export/route.ts", import.meta.url), "utf8");
assert.ok(sensitiveRoute.includes("export async function POST"), "protected traveller export must use POST");
assert.equal(sensitiveRoute.includes("export async function GET"), false, "protected traveller export must not expose a GET endpoint");
assert.ok(sensitiveRoute.includes('requireStaffCapability("traveller-data")'));
assert.ok(sensitiveRoute.includes('hasStaffCapability(staff, "reservations")'));
assert.ok(sensitiveRoute.includes("reason.length < 10"), "protected export must require a concrete operational reason");
assert.ok(
  sensitiveRoute.indexOf("await recordOperatorExportAudit") < sensitiveRoute.indexOf("return operatorExportResponse"),
  "sensitive export audit must persist before decrypted values are returned"
);

const auditSource = await readFile(new URL("../lib/operator-export-audit.ts", import.meta.url), "utf8");
assert.ok(auditSource.includes("Sensitive exports require persistent audit storage."));
assert.equal(auditSource.includes("TravellerPostPurchaseData"), false, "export audit storage must not contain protected traveller values");
assert.equal(auditSource.includes("documentNumber"), false, "export audit must never define protected traveller fields");

const reportsPage = await readFile(new URL("../app/operator/reports/page.tsx", import.meta.url), "utf8");
assert.ok(reportsPage.includes('action="/operator/reports/protected-travellers/export"'));
assert.ok(reportsPage.includes('method="post"'));
assert.ok(reportsPage.includes('hasStaffCapability(identity, "finance")'));
assert.ok(reportsPage.includes('hasStaffCapability(identity, "traveller-data")'));
assert.ok(reportsPage.includes("Financial totals are kept separate by currency"));

console.log("Reporting, CSV/XLSX and sensitive-export invariants passed.");
