import { NextResponse } from "next/server";
import { listCustomersForOperations } from "@/lib/customer-auth";
import { getLocale } from "@/lib/get-locale";
import { getOperationsRepository } from "@/lib/operations-repository";
import { recordOperatorExportAudit, type OperatorExportType } from "@/lib/operator-export-audit";
import { operatorExportResponse, parseExportFormat } from "@/lib/operator-export-response";
import {
  buildFinancialRows,
  customerExport,
  filterCustomersByDate,
  filterReservationsByDate,
  filterServicesByDate,
  outstandingBalanceExport,
  reconciliationExport,
  reportDateFilters,
  reservationExport,
  revenueExport,
  serviceReservationExport
} from "@/lib/operator-reporting";
import { getPaymentRepository } from "@/lib/payment-repository";
import { requireStaffCapability } from "@/lib/require-staff-capability";
import { listServiceReservationsForOperator } from "@/lib/service-reservations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ordinaryTypes = new Set(["reservations", "services", "customers"]);
const financeTypes = new Set(["reconciliation", "outstanding-balances", "revenue"]);
const maxExportRows = 10000;

function filtersForAudit(filters: { from?: string; to?: string }) {
  return { from: filters.from, to: filters.to };
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ type: string }> }
) {
  const { type } = await params;
  if (!ordinaryTypes.has(type) && !financeTypes.has(type)) {
    return NextResponse.json({ error: "unknown-export" }, { status: 404 });
  }

  const capability = financeTypes.has(type) ? "finance" : "reservations";
  const staff = await requireStaffCapability(capability);
  const url = new URL(request.url);
  const format = parseExportFormat(url.searchParams.get("format"));
  if (!format) return NextResponse.json({ error: "invalid-format" }, { status: 400 });
  const filters = reportDateFilters(url.searchParams);
  const locale = await getLocale();
  const operations = getOperationsRepository();
  const payments = getPaymentRepository();

  let table;
  let exportType: OperatorExportType;
  let filename: string;

  if (type === "reservations") {
    const rows = filterReservationsByDate(await operations.listReservations(), filters);
    table = reservationExport(rows, locale);
    exportType = "reservations";
    filename = "reservations";
  } else if (type === "services") {
    const rows = filterServicesByDate(await listServiceReservationsForOperator(), filters);
    table = serviceReservationExport(rows, locale);
    exportType = "services";
    filename = "service-reservations";
  } else if (type === "customers") {
    const rows = filterCustomersByDate(await listCustomersForOperations(), filters);
    table = customerExport(rows, locale);
    exportType = "customers";
    filename = "customers";
  } else {
    const [allReservations, allServices] = await Promise.all([
      operations.listReservations(),
      listServiceReservationsForOperator()
    ]);
    const reservations = filterReservationsByDate(allReservations, filters);
    const services = filterServicesByDate(allServices, filters);
    const [reservationSummaries, serviceSummaryEntries] = await Promise.all([
      payments.getSummaries(reservations),
      Promise.all(services.map(async (service) => [
        service.id,
        await payments.getTargetSummary({
          id: service.id,
          totalPrice: service.totalPrice,
          currency: service.currency,
          targetType: "service"
        })
      ] as const))
    ]);
    const rows = buildFinancialRows({
      reservations,
      reservationSummaries,
      services,
      serviceSummaries: Object.fromEntries(serviceSummaryEntries)
    });
    if (type === "reconciliation") {
      table = reconciliationExport(rows, locale);
      exportType = "reconciliation";
      filename = "payment-reconciliation";
    } else if (type === "outstanding-balances") {
      table = outstandingBalanceExport(rows, locale);
      exportType = "outstanding-balances";
      filename = "outstanding-balances";
    } else {
      table = revenueExport(rows, locale);
      exportType = "revenue";
      filename = "revenue-by-product";
    }
  }

  if (table.rows.length > maxExportRows) {
    return NextResponse.json({ error: "export-too-large", maxRows: maxExportRows }, { status: 413 });
  }

  await recordOperatorExportAudit({
    exportType,
    format,
    actorIdentityId: staff.id,
    actorRole: staff.role,
    actorDisplayName: staff.displayName,
    rowCount: table.rows.length,
    columns: table.columns.map((column) => column.key),
    filters: filtersForAudit(filters)
  });

  return operatorExportResponse({ table, format, filename });
}
