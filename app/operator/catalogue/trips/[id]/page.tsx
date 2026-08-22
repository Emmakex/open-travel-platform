import { notFound } from "next/navigation";
import { TripForm } from "@/components/operator/catalogue-forms";
import styles from "@/app/operator/operator.module.css";
import { getLocale } from "@/lib/get-locale";
import { listMediaLibraryChoices } from "@/lib/media-library";
import { listMongoTripDepartures } from "@/lib/mongo-departures";
import { getMongoTripForAdmin, listMongoDestinationsForAdmin } from "@/lib/mongo-travel-admin";
import { tr } from "@/lib/operator-i18n";
import { requireOperationsIdentity } from "@/lib/require-operations-identity";

type PageProps = { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> };
export const metadata = { title: "Trip | Kairoseth Travel" };

export default async function EditTripPage({ params, searchParams }: PageProps) {
  const locale = await getLocale();
  await requireOperationsIdentity();
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const [trip, destinations, mediaLibrary, departures] = await Promise.all([
    getMongoTripForAdmin(id),
    listMongoDestinationsForAdmin(),
    listMediaLibraryChoices(100),
    listMongoTripDepartures(id)
  ]);
  if (!trip) notFound();

  return (
    <main className="section">
      <div className={`container ${styles.shell}`}>
        <section className={styles.panel}>
          <div className="eyebrow">{tr(locale, "Catalogue · Trips", "Catálogo · Viajes")}</div>
          <h1>{tr(locale, "Edit", "Editar")} {trip.title}</h1>
          <p className={styles.lead}>{tr(locale, "Manage product content, departures, inventory, itinerary, media, publication and translations in MongoDB.", "Gestiona contenido, salidas, inventario, itinerario, multimedia, publicación y traducciones en MongoDB.")}</p>
          <TripForm trip={trip} destinations={destinations} departures={departures} error={query.error} mediaLibrary={mediaLibrary} locale={locale} />
        </section>
      </div>
    </main>
  );
}
