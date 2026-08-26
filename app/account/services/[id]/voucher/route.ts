import { NextResponse } from "next/server";
import { hasCustomerAccess } from "@/lib/access-control";
import { getCustomerSafeSupplierReferences } from "@/lib/customer-document-references";
import { getLocale } from "@/lib/get-locale";
import { getIdentityRepository } from "@/lib/identity-repository";
import { getServiceReservationForCustomer } from "@/lib/service-reservations";
import {
  renderServiceVoucherPdf,
  serviceVoucherFilename
} from "@/lib/voucher-dossier-document";

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
  const reservation = await getServiceReservationForCustomer(identity.id, id);
  if (!reservation) return NextResponse.json({ error: "not-found" }, { status: 404 });
  if (reservation.status !== "confirmed") {
    return NextResponse.json({ error: "voucher-unavailable" }, { status: 409 });
  }

  const [profile, fallbackLocale, supplierReferences] = await Promise.all([
    identityRepository.getCustomerProfile(identity.id),
    getLocale(),
    getCustomerSafeSupplierReferences("service-reservation", reservation.id)
  ]);
  const locale = profile?.preferredLocale === "en" || profile?.preferredLocale === "es"
    ? profile.preferredLocale
    : fallbackLocale;
  const pdf = await renderServiceVoucherPdf({ reservation, locale, supplierReferences });

  return new Response(Buffer.from(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${serviceVoucherFilename(reservation.id, locale)}"`,
      "Cache-Control": "private, no-store, max-age=0",
      "X-Content-Type-Options": "nosniff"
    }
  });
}
