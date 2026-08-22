import { TripForm } from "@/components/operator/catalogue-forms";
import styles from "@/app/operator/operator.module.css";
import { getLocale } from "@/lib/get-locale";
import { listMongoDestinationsForAdmin } from "@/lib/mongo-travel-admin";
import { listMediaLibraryChoices } from "@/lib/media-library";
import { tr } from "@/lib/operator-i18n";
import { requireOperationsIdentity } from "@/lib/require-operations-identity";

export const metadata = { title: "Trip | Kairoseth Travel" };

export default async function NewTripPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const locale = await getLocale();
  await requireOperationsIdentity();
  const [destinations, mediaLibrary, params] = await Promise.all([listMongoDestinationsForAdmin(), listMediaLibraryChoices(100), searchParams]);

  return (
    <main className="section">
      <div className={`container ${styles.shell}`}>
        <section className={styles.panel}>
          <div className="eyebrow">{tr(locale, "Catalogue · Trips", "Catálogo · Viajes")}</div>
          <h1>{tr(locale, "New trip", "Nuevo viaje")}</h1>
          <p className={styles.lead}>{tr(locale, "Create a persistent travel product and select reusable media from the library.", "Crea un producto de viaje persistente y selecciona imágenes reutilizables de la biblioteca.")}</p>
          {destinations.length ? (
            <TripForm destinations={destinations} error={params.error} mediaLibrary={mediaLibrary} locale={locale} />
          ) : (
            <div className={styles.notice}>{tr(locale, "Create at least one destination before adding a trip.", "Crea al menos un destino antes de añadir un viaje.")}</div>
          )}
        </section>
      </div>
    </main>
  );
}
