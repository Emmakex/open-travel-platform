import { NextResponse } from "next/server";
import { hasOperationsAccess } from "@/lib/access-control";
import {
  bookingConfirmationFilename,
  renderBookingConfirmationPdf
} from "@/lib/booking-confirmation-document";
import { getCustomerForOperations } from "@/lib/customer-auth";
import { getLocale } from "@/lib/get-locale";
import { getIdentityRepository } from "@/lib/identity-repository";
import { getOperationsRepository } from "@/lib/operations-repository";
import { getPaymentRepository } from "@/lib/payment-repository";
import { hasStaffCapability } from "@/lib/staff-capabilities";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const identity = await getIdentityRepository().getCurrentIdentity();
  if (!hasOperationsAccess(identity) || !hasStaffCapability(identity, "reservations")) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const reservation = await getOperationsRepository().getReservation(id);
  if (!reservation) {
    return NextResponse.json({ error: "not-found" }, { status: 404 });
  }

  const canFinance = hasStaffCapability(identity, "finance");
  const [customer, payment, locale] = await Promise.all([
    getCustomerForOperations(reservation.identityId),
    canFinance ? getPaymentRepository().getSummary(reservation) : Promise.resolve(null),
    getLocale()
  ]);

  const pdf = await renderBookingConfirmationPdf({
    reservation,
    locale,
    customer,
    payment
  });

  return new Response(Buffer.from(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${bookingConfirmationFilename(reservation.id, locale)}"`,
      "Cache-Control": "private, no-store, max-age=0",
      "X-Content-Type-Options": "nosniff"
    }
  });
}
