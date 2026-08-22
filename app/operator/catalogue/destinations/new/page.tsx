import Link from "next/link";
import { DestinationForm } from "@/components/operator/catalogue-forms";
import styles from "@/app/operator/operator.module.css";
import { getLocale } from "@/lib/get-locale";
import { listMediaLibraryChoices } from "@/lib/media-library";
import { tr } from "@/lib/operator-i18n";
import { requireOperationsIdentity } from "@/lib/require-operations-identity";

export const metadata = { title: "Destination | Kairoseth Travel" };

export default async function NewDestinationPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const locale = await getLocale();
  await requireOperationsIdentity();
  const [params, mediaLibrary] = await Promise.all([searchParams, listMediaLibraryChoices(100)]);

  return (
    <main className="section">
      <div className={`container ${styles.shell}`}>
        <section className={styles.panel}>
          <div className="eyebrow">{tr(locale, "Catalogue · Destinations", "Catálogo · Destinos")}</div>
          <h1>{tr(locale, "New destination", "Nuevo destino")}</h1>
          <p className={styles.lead}>{tr(locale, "Create a persistent destination and select reusable images from the media library.", "Crea un destino persistente y selecciona imágenes reutilizables de la biblioteca multimedia.")}</p>
          <DestinationForm error={params.error} mediaLibrary={mediaLibrary} locale={locale} />
          <Link className="text-link" href="/operator/catalogue">{tr(locale, "← Catalogue manager", "← Gestor del catálogo")}</Link>
        </section>
      </div>
    </main>
  );
}
