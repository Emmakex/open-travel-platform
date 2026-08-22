import Link from "next/link";
import { TravelImage } from "@/components/travel-image";
import type { TravelService } from "@/domain/services/types";
import type { TravelLocale } from "@/domain/travel/types";
import { formatCurrency } from "@/lib/i18n";
import {
  localizeTravelService,
  servicePublicPath,
  serviceTypeLabel
} from "@/lib/travel-services";

function meta(service: TravelService, locale: TravelLocale) {
  if (service.serviceType === "activity") {
    return `${service.activityCategory} · ${service.durationLabel}`;
  }
  if (service.serviceType === "transport") {
    return `${service.origin} → ${service.destination}`;
  }
  return service.coverageType;
}

export function ServiceCard({ service, locale }: { service: TravelService; locale: TravelLocale }) {
  const item = localizeTravelService(service, locale);
  const href = servicePublicPath(item);
  const price = formatCurrency(item.fromPrice, item.currency, locale);
  const from = locale === "es" ? "Desde" : "From";
  const view = locale === "es" ? "Ver detalles →" : "View details →";

  return (
    <article className="card trip-card">
      <Link className="card-media trip-card-media" data-visual={item.slug} href={href} aria-label={`${view} ${item.title}`}>
        {item.coverImage ? (
          <TravelImage
            className="card-media-image"
            media={item.coverImage}
            fallbackAlt={item.title}
            sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 33vw"
          />
        ) : null}
        <span className="card-media-shade" aria-hidden="true" />
        <span className="card-media-label">{serviceTypeLabel(item.serviceType, locale)}</span>
        <span className="card-media-title">{from} {price}</span>
      </Link>
      <div className="card-body">
        <div className="card-kicker">{meta(item, locale)}</div>
        <h3><Link href={href}>{item.title}</Link></h3>
        <p>{item.summary}</p>
        <ul className="highlight-list">
          {item.highlights.slice(0, 3).map((highlight) => <li key={highlight}>{highlight}</li>)}
        </ul>
        <div className="trip-meta">
          <Link className="text-link" href={href}>{view}</Link>
          <strong>{price}</strong>
        </div>
      </div>
    </article>
  );
}
