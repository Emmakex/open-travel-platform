import { NextResponse } from "next/server";
import { getCustomerSafeSupplierReferences } from "@/lib/customer-document-references";
import { getLocale } from "@/lib/get-locale";
import { getOperationsRepository } from "@/lib/operations-repository";
import { requireStaffCapability } from "@/lib/require-staff-capability";
import {
  accommodationVoucherFilename,
  renderAccommodationVoucherPdf
} from "@/lib/voucher-dossier-document";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireStaffCapability("reservations");
  const { id } = await params;
  const reservation = await getOperationsRepository().getReservation(id);
  if (!reservation) return NextResponse.json({ error: "not-found" }, { status: 404 });
  if (reservation.status !== "confirmed" || !reservation.accommodationBookings?.length) {
    return NextResponse.json({ error: "voucher-unavailable" }, { status: 409 });
  }

  const [locale, supplierReferences] = await Promise.all([
    getLocale(),
    getCustomerSafeSupplierReferences("trip-reservation", reservation.id)
  ]);
  const pdf = await renderAccommodationVoucherPdf({ reservation, locale, supplierReferences });

  return new Response(Buffer.from(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${accommodationVoucherFilename(reservation.id, locale)}"`,
      "Cache-Control": "private, no-store, max-age=0",
      "X-Content-Type-Options": "nosniff"
    }
  });
}
