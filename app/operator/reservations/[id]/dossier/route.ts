import { NextResponse } from "next/server";
import { getCustomerForOperations } from "@/lib/customer-auth";
import { getLocale } from "@/lib/get-locale";
import { getOperationsRepository } from "@/lib/operations-repository";
import { getPaymentRepository } from "@/lib/payment-repository";
import { requireStaffCapability } from "@/lib/require-staff-capability";
import { listServiceReservationsForRelatedTrip } from "@/lib/service-reservations";
import { hasStaffCapability } from "@/lib/staff-capabilities";
import { listSupplierFulfilmentForTarget } from "@/lib/supplier-fulfilment";
import {
  renderReservationDossierPdf,
  reservationDossierFilename,
  type DossierFulfilmentItem
} from "@/lib/voucher-dossier-document";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const identity = await requireStaffCapability("reservations");
  const { id } = await params;
  const reservation = await getOperationsRepository().getReservation(id);
  if (!reservation) return NextResponse.json({ error: "not-found" }, { status: 404 });

  const canFinance = hasStaffCapability(identity, "finance");
  const canSuppliers = hasStaffCapability(identity, "suppliers");
  const [locale, customer, linkedServices, payment, fulfilmentRows] = await Promise.all([
    getLocale(),
    getCustomerForOperations(reservation.identityId),
    listServiceReservationsForRelatedTrip(reservation.id),
    canFinance ? getPaymentRepository().getSummary(reservation) : Promise.resolve(null),
    canSuppliers ? listSupplierFulfilmentForTarget("trip-reservation", reservation.id) : Promise.resolve([])
  ]);
  const fulfilment: DossierFulfilmentItem[] = fulfilmentRows.map((item) => ({
    componentKey: item.componentKey,
    componentLabel: item.componentLabel,
    status: item.status,
    supplierName: item.supplierName,
    supplierReference: item.supplierReference,
    deadline: item.deadline
  }));
  const pdf = await renderReservationDossierPdf({
    reservation,
    locale,
    customer,
    payment,
    linkedServices,
    fulfilment
  });

  return new Response(Buffer.from(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${reservationDossierFilename(reservation.id, locale)}"`,
      "Cache-Control": "private, no-store, max-age=0",
      "X-Content-Type-Options": "nosniff"
    }
  });
}
