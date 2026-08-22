import Link from "next/link";
import { getLocale } from "@/lib/get-locale";
import { tr } from "@/lib/operator-i18n";

export default async function NotFound() {
  const locale = await getLocale();
  return (
    <main className="section">
      <div className="container">
        <div className="empty-state not-found-state">
          <div className="eyebrow">404</div>
          <h1>{tr(locale, "That travel page is not in the catalogue.", "Esa página de viaje no está en el catálogo.")}</h1>
          <p>{tr(locale, "The destination or trip may have been removed, renamed or never existed.", "El destino o viaje puede haberse eliminado, renombrado o no haber existido.")}</p>
          <div className="actions not-found-actions">
            <Link className="button button-primary" href="/trips">{tr(locale, "Browse trips", "Ver viajes")}</Link>
            <Link className="button button-secondary" href="/destinations">{tr(locale, "Browse destinations", "Ver destinos")}</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
