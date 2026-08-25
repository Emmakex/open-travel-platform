import { NextResponse } from "next/server";
import { getLocale } from "@/lib/get-locale";
import { getOperationsRepository } from "@/lib/operations-repository";
import { requireStaffCapability } from "@/lib/require-staff-capability";
import { reservationsForDeparture } from "@/lib/departure-manifests";
import { renderRoomingListPdf, roomingListFilename } from "@/lib/departure-document-pdf";
import { getTravelRepository } from "@/lib/travel-repository";
import { localizeTrip } from "@/lib/i18n";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ tripId: string; availabilityId: string }> }
) {
  await requireStaffCapability("reservations");
  const locale = await getLocale();
  const { tripId, availabilityId } = await params;
  const [reservations, trips] = await Promise.all([
    getOperationsRepository().listReservations(),
    getTravelRepository().listTrips()
  ]);
  const departureReservations = reservationsForDeparture(reservations, tripId, availabilityId);
  if (!departureReservations.length) return NextResponse.json({ error: "not-found" }, { status: 404 });

  const trip = trips.find((item) => item.id === tripId);
  const tripTitle = trip
    ? localizeTrip(trip, locale).title
    : departureReservations[0].tripTitle ?? tripId;
  const input = {
    reservations: departureReservations,
    tripTitle,
    departureDate: departureReservations[0].departureDate,
    returnDate: departureReservations[0].returnDate,
    locale
  } as const;
  const pdf = await renderRoomingListPdf(input);

  return new NextResponse(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${roomingListFilename(input)}"`,
      "Cache-Control": "private, no-store, max-age=0"
    }
  });
}
