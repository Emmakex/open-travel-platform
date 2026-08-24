import Link from "next/link";
import type { TravelLocale, Trip } from "@/domain/travel/types";
import { listPublishedAccommodations, localizeAccommodation } from "@/lib/accommodations";

export async function TripAccommodationSection({ trip, locale }: { trip: Trip; locale: TravelLocale }) {
  if (!trip.accommodations?.length) return null;

  const accommodations = await listPublishedAccommodations();
  const byId = new Map(accommodations.map((item) => [item.id, item]));
  const stays = trip.accommodations.flatMap((component) => {
    const accommodation = byId.get(component.accommodationId);
    if (!accommodation) return [];
    const localized = localizeAccommodation(accommodation, locale);
    const room = localized.roomTypes.find((item) => item.id === component.roomTypeId);
    if (!room) return [];
    return [{ component, accommodation, localized, room }];
  });

  if (!stays.length) return null;
  const t = (en: string, es: string) => locale === "es" ? es : en;

  return (
    <section className="trip-section">
      <div className="eyebrow">{t("Accommodation", "Alojamiento")}</div>
      <h2>{t("Your stay", "Tu estancia")}</h2>
      <div className="grid-3">
        {stays.map(({ component, accommodation, localized, room }) => (
          <article className="card" key={component.id}>
            <div className="card-body">
              <div className="card-kicker">{component.mode === "optional" ? t("Optional", "Opcional") : t("Included", "Incluido")}</div>
              <h3>{localized.name}</h3>
              <p>{localized.location}</p>
              <p><strong>{room.name}</strong></p>
              <p>{component.nights} {component.nights === 1 ? t("night", "noche") : t("nights", "noches")}</p>
              <Link className="text-link" href={`/accommodations/${accommodation.slug}`}>{t("View accommodation", "Ver alojamiento")} →</Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
