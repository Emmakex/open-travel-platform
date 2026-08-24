import type { Metadata } from "next";
import Link from "next/link";
import { getLocale } from "@/lib/get-locale";
import { listPublishedAccommodations, localizeAccommodation } from "@/lib/accommodations";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return locale === "es"
    ? { title: "Alojamientos", description: "Explora alojamientos y tipos de habitación disponibles dentro del catálogo de viaje." }
    : { title: "Accommodation", description: "Explore accommodation products and room types available in the travel catalogue." };
}

export default async function AccommodationsPage() {
  const locale = await getLocale();
  const accommodations = (await listPublishedAccommodations()).map((item) => localizeAccommodation(item, locale));
  const t = (en: string, es: string) => locale === "es" ? es : en;

  return (
    <main className="section">
      <div className="container">
        <div className="section-heading">
          <div><div className="eyebrow">{t("Accommodation", "Alojamiento")}</div><h1>{t("Places to stay", "Dónde alojarse")}</h1></div>
          <p>{t("Reusable accommodation products with clear room and occupancy information.", "Alojamientos reutilizables con información clara de habitaciones y ocupación.")}</p>
        </div>

        {accommodations.length ? (
          <div className="grid-3">
            {accommodations.map((accommodation) => (
              <article className="card" key={accommodation.id}>
                <div className="card-body">
                  <div className="card-kicker">{accommodation.location} · {accommodation.country}</div>
                  <h2><Link href={`/accommodations/${accommodation.slug}`}>{accommodation.name}</Link></h2>
                  <p>{accommodation.summary}</p>
                  <p><strong>{accommodation.roomTypes.length}</strong> {t("room types", "tipos de habitación")}</p>
                  <Link className="text-link" href={`/accommodations/${accommodation.slug}`}>{t("View accommodation →", "Ver alojamiento →")}</Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="card"><div className="card-body">{t("No accommodation products are published yet.", "Todavía no hay alojamientos publicados.")}</div></div>
        )}
      </div>
    </main>
  );
}
