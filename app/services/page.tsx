import type { Metadata } from "next";
import Link from "next/link";
import { getLocale } from "@/lib/get-locale";
import { getPublicCopy } from "@/lib/public-copy";
import { listPublishedTravelServices } from "@/lib/travel-services";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return locale === "es"
    ? { title: "Servicios de viaje", description: "Actividades, traslados y otros servicios para completar tu viaje con información clara antes de reservar." }
    : { title: "Travel services", description: "Activities, transfers and other services to complete your journey with clear information before booking." };
}

export default async function ServicesPage() {
  const locale = await getLocale();
  const copy = getPublicCopy(locale).services;
  const [activities, transport, insurance] = await Promise.all([
    listPublishedTravelServices("activity"),
    listPublishedTravelServices("transport"),
    listPublishedTravelServices("insurance")
  ]);

  const cards = [
    { href: "/activities", title: copy.activityTitle, copy: copy.activityCopy, count: activities.length },
    { href: "/transport", title: copy.transportTitle, copy: copy.transportCopy, count: transport.length },
    { href: "/insurance", title: copy.insuranceTitle, copy: copy.insuranceCopy, count: insurance.length }
  ];

  return (
    <main className="section">
      <div className="container">
        <div className="section-heading">
          <div>
            <div className="eyebrow">{copy.eyebrow}</div>
            <h1>{copy.title}</h1>
          </div>
          <p>{copy.intro}</p>
        </div>

        <div className="grid-3">
          {cards.map((card) => (
            <article className="card" key={card.href}>
              <div className="card-body">
                <div className="card-kicker">{card.count} {copy.available}</div>
                <h2><Link href={card.href}>{card.title}</Link></h2>
                <p>{card.copy}</p>
                <Link className="text-link" href={card.href}>{copy.explore}</Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
