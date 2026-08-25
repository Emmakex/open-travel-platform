import { NextResponse } from "next/server";
import { hasCustomerAccess } from "@/lib/access-control";
import {
  bookingConfirmationFilename,
  renderBookingConfirmationPdf
} from "@/lib/booking-confirmation-document";
import { getBookingRepository } from "@/lib/booking-repository";
import { getLocale } from "@/lib/get-locale";
import { getIdentityRepository } from "@/lib/identity-repository";
import { getPaymentRepository } from "@/lib/payment-repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const identityRepository = getIdentityRepository();
  const identity = await identityRepository.getCurrentIdentity();
  if (!hasCustomerAccess(identity)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const reservation = await getBookingRepository().getReservation(identity.id, id);
  if (!reservation) {
    return NextResponse.json({ error: "not-found" }, { status: 404 });
  }

  const [profile, payment, fallbackLocale] = await Promise.all([
    identityRepository.getCustomerProfile(identity.id),
    getPaymentRepository().getSummary(reservation),
    getLocale()
  ]);
  const locale = profile?.preferredLocale === "es" || profile?.preferredLocale === "en"
    ? profile.preferredLocale
    : fallbackLocale;

  const pdf = await renderBookingConfirmationPdf({
    reservation,
    locale,
    customer: profile,
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
