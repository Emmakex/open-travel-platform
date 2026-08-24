import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TravelImage } from "@/components/travel-image";
import { TravelMediaGallery } from "@/components/travel-media-gallery";
import type { AccommodationMealPlan, AccommodationRoomKind } from "@/domain/accommodation/types";
import { getLocale } from "@/lib/get-locale";
import {
  getPublishedAccommodation,
  listAccommodationInventory,
  localizeAccommodation
} from "@/lib/accommodations";

function roomKindLabel(kind: AccommodationRoomKind | undefined, locale: "en" | "es") {
  const labels: Record<AccommodationRoomKind, [string, string]> = {
    single: ["Single", "Individual"],
    double: ["Double", "Doble"],
    twin: ["Twin", "Twin"],
    triple: ["Triple", "Triple"],
    family: ["Family", "Familiar"],
    suite: ["Suite", "Suite"],
    other: ["Other", "Otro"]
  };
  if (!kind) return null;
  return locale === "es" ? labels[kind][1] : labels[kind][0];
}

function mealPlanLabel(plan: AccommodationMealPlan | undefined, locale: "en" | "es") {
  const labels: Record<AccommodationMealPlan, [string, string]> = {
    "room-only": ["Room only", "Solo alojamiento"],
    breakfast: ["Breakfast", "Desayuno"],
    "half-board": ["Half board", "Media pensión"],
    "full-board": ["Full board", "Pensión completa"],
    "all-inclusive": ["All inclusive", "Todo incluido"]
  };
  if (!plan) return null;
  return locale === "es" ? labels[plan][1] : labels[plan][0];
}

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
  const formatter = new Intl.NumberFormat(locale === "es" ? "es-ES" : "en-GB", { style: "currency", currency: accommodation.currency });

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

        {accommodation.coverImage ? (
          <section className="detail-cover">
            <TravelImage
              media={accommodation.coverImage}
              fallbackAlt={localized.name}
              priority
              sizes="(max-width: 880px) 100vw, 80vw"
              quality={88}
            />
          </section>
        ) : null}

        {accommodation.gallery?.length ? (
          <section className="media-gallery-section">
            <div className="card-kicker">{t("Accommodation gallery", "Galería del alojamiento")}</div>
            <TravelMediaGallery items={accommodation.gallery} title={localized.name} />
          </section>
        ) : null}

        <section className="card">
          <div className="card-body">
            <div className="card-kicker">{t("Room types", "Tipos de habitación")}</div>
            <div className="grid-3">
              {localized.roomTypes.map((room) => {
                const roomInventory = openInventory.filter((period) => period.roomTypeId === room.id);
                const kind = roomKindLabel(room.kind, locale);
                const mealPlan = mealPlanLabel(room.mealPlan, locale);
                return (
                  <article className="card" key={room.id}>
                    {room.gallery?.[0] ? (
                      <div className="detail-cover">
                        <TravelImage
                          media={room.gallery[0]}
                          fallbackAlt={room.name}
                          sizes="(max-width: 880px) 100vw, 30vw"
                          quality={84}
                        />
                      </div>
                    ) : null}
                    <div className="card-body">
                      <h2>{room.name}</h2>
                      {kind || mealPlan ? <p>{[kind, mealPlan].filter(Boolean).join(" · ")}</p> : null}
                      {room.description ? <p>{room.description}</p> : null}
                      {room.baseNightlyRate !== undefined ? (
                        <p><strong>{t("From", "Desde")} {formatter.format(room.baseNightlyRate)}</strong> {t("per room/night", "por habitación/noche")}</p>
                      ) : null}
                      <p>
                        <strong>{t("Occupancy", "Ocupación")}:</strong>{" "}
                        {room.occupancy.minAdults}–{room.occupancy.maxAdults} {t("adults", "adultos")}
                        {room.occupancy.maxChildren > 0 ? ` · ${t("up to", "hasta")} ${room.occupancy.maxChildren} ${t("children", "niños")}` : ""}
                        {room.occupancy.childMaxAge !== undefined ? ` · ≤ ${room.occupancy.childMaxAge} ${t("years", "años")}` : ""}
                      </p>
                      <p><strong>{t("Maximum guests", "Huéspedes máximos")}:</strong> {room.occupancy.maxOccupancy}</p>
                      {room.gallery && room.gallery.length > 1 ? (
                        <div>
                          <div className="card-kicker">{t("Room gallery", "Galería de la habitación")}</div>
                          <TravelMediaGallery items={room.gallery} title={room.name} />
                        </div>
                      ) : null}
                      {roomInventory.length ? (
                        <div>
                          <strong>{t("Upcoming availability", "Próxima disponibilidad")}</strong>
                          <ul>
                            {roomInventory.slice(0, 5).map((period) => (
                              <li key={period.id}>{period.startDate} → {period.endDate} · {period.capacity - period.reserved} {t("rooms available", "habitaciones disponibles")}</li>
                            ))}
                          </ul>
                        </div>
                      ) : <p>{t("No open availability periods are currently published for this room type.", "Actualmente no hay periodos de disponibilidad abiertos para este tipo de habitación.")}</p>}
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
