import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale } from "@/lib/get-locale";
import {
  getPublishedAccommodation,
  listAccommodationInventory,
  localizeAccommodation
} from "@/lib/accommodations";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const locale = await getLocale();
  const accommodation = await getPublishedAccommodation(slug);
  if (!accommodation) return {};
  const localized = localizeAccommodation(accommodation, locale);
  return { title: localized.name, description: localized.summary };
}

export default async function AccommodationDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const [{ slug }, locale] = await Promise.all([params, getLocale()]);
  const accommodation = await getPublishedAccommodation(slug);
  if (!accommodation) notFound();
  const localized = localizeAccommodation(accommodation, locale);
  const inventory = await listAccommodationInventory(accommodation.id);
  const today = new Date().toISOString().slice(0, 10);
  const openInventory = inventory.filter((period) => period.status === "open" && period.endDate >= today && period.capacity > period.reserved);
  const t = (en: string, es: string) => locale === "es" ? es : en;

  return (
    <main className="section">
      <div className="container">
        <div className="section-heading">
          <div>
            <div className="eyebrow">{localized.location} · {localized.country}</div>
            <h1>{localized.name}</h1>
          </div>
          <p>{localized.summary}</p>
        </div>

        <section className="card">
          <div className="card-body">
            <div className="card-kicker">{t("Room types", "Tipos de habitación")}</div>
            <div className="grid-3">
              {localized.roomTypes.map((room) => {
                const roomInventory = openInventory.filter((period) => period.roomTypeId === room.id);
                return (
                  <article className="card" key={room.id}>
                    <div className="card-body">
                      <h2>{room.name}</h2>
                      {room.description ? <p>{room.description}</p> : null}
                      <p>
                        <strong>{t("Occupancy", "Ocupación")}:</strong>{" "}
                        {room.occupancy.minAdults}–{room.occupancy.maxAdults} {t("adults", "adultos")}
                        {room.occupancy.maxChildren > 0 ? ` · ${t("up to", "hasta")} ${room.occupancy.maxChildren} ${t("children", "niños")}` : ""}
                        {room.occupancy.childMaxAge !== undefined ? ` · ≤ ${room.occupancy.childMaxAge} ${t("years", "años")}` : ""}
                      </p>
                      <p><strong>{t("Maximum guests", "Huéspedes máximos")}:</strong> {room.occupancy.maxOccupancy}</p>
                      {roomInventory.length ? (
                        <div>
                          <strong>{t("Upcoming inventory", "Inventario próximo")}</strong>
                          <ul>
                            {roomInventory.slice(0, 5).map((period) => (
                              <li key={period.id}>{period.startDate} → {period.endDate} · {period.capacity - period.reserved} {t("rooms available", "habitaciones disponibles")}</li>
                            ))}
                          </ul>
                        </div>
                      ) : <p>{t("No open inventory periods are currently published for this room type.", "Actualmente no hay periodos de inventario abiertos para este tipo de habitación.")}</p>}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
