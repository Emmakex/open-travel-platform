import type { Metadata } from "next";
import Link from "next/link";
import { getLocale } from "@/lib/get-locale";
import { listPublishedTravelServices } from "@/lib/travel-services";

export const metadata: Metadata = {
  title: "Services | Kairoseth Travel",
  description: "Explore activities, transport and travel insurance independently from any trip package."
};

export default async function ServicesPage() {
  const locale = await getLocale();
  const [activities, transport, insurance] = await Promise.all([
    listPublishedTravelServices("activity"),
    listPublishedTravelServices("transport"),
    listPublishedTravelServices("insurance")
  ]);

  const cards = [
    {
      href: "/activities",
      title: locale === "es" ? "Actividades" : "Activities",
      copy: locale === "es" ? "Experiencias, excursiones y actividades que puedes contratar con o sin un viaje de Kairoseth." : "Experiences, excursions and activities you can book with or without a Kairoseth trip.",
      count: activities.length
    },
    {
      href: "/transport",
      title: locale === "es" ? "Transporte" : "Transport",
      copy: locale === "es" ? "Transfers y servicios de movilidad vendidos de forma independiente o vinculados a una reserva." : "Transfers and mobility services sold independently or linked to a reservation.",
      count: transport.length
    },
    {
      href: "/insurance",
      title: locale === "es" ? "Seguros" : "Insurance",
      copy: locale === "es" ? "Productos de protección para viajes contratados en Kairoseth o en cualquier otra plataforma." : "Protection products for trips booked with Kairoseth or on any other platform.",
      count: insurance.length
    }
  ];

  return (
    <main className="section">
      <div className="container">
        <div className="section-heading">
          <div>
            <div className="eyebrow">Kairoseth Travel</div>
            <h1>{locale === "es" ? "Servicios para completar cualquier viaje" : "Services for any journey"}</h1>
          </div>
          <p>{locale === "es" ? "Explora actividades, transporte y seguros sin necesidad de haber comprado un paquete de viaje con nosotros." : "Explore activities, transport and insurance without needing to have purchased a trip package from us."}</p>
        </div>

        <div className="grid-3">
          {cards.map((card) => (
            <article className="card" key={card.href}>
              <div className="card-body">
                <div className="card-kicker">{card.count} {locale === "es" ? "publicados" : "published"}</div>
                <h3><Link href={card.href}>{card.title}</Link></h3>
                <p>{card.copy}</p>
                <Link className="text-link" href={card.href}>{locale === "es" ? "Explorar →" : "Explore →"}</Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
