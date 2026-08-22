import { notFound } from "next/navigation";
import { DestinationForm } from "@/components/operator/catalogue-forms";
import styles from "@/app/operator/operator.module.css";
import { getLocale } from "@/lib/get-locale";
import { getMongoDestinationForAdmin } from "@/lib/mongo-travel-admin";
import { listMediaLibraryChoices } from "@/lib/media-library";
import { tr } from "@/lib/operator-i18n";
import { requireOperationsIdentity } from "@/lib/require-operations-identity";

type PageProps = { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> };
export const metadata = { title: "Destination | Kairoseth Travel" };

export default async function EditDestinationPage({ params, searchParams }: PageProps) {
  const locale = await getLocale();
  await requireOperationsIdentity();
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const [destination, mediaLibrary] = await Promise.all([getMongoDestinationForAdmin(id), listMediaLibraryChoices(100)]);
  if (!destination) notFound();

  return (
    <main className="section">
      <div className={`container ${styles.shell}`}>
        <section className={styles.panel}>
          <div className="eyebrow">{tr(locale, "Catalogue · Destinations", "Catálogo · Destinos")}</div>
          <h1>{tr(locale, "Edit", "Editar")} {destination.name}</h1>
          <p className={styles.lead}>{tr(locale, "Update catalogue content, media and translations stored in MongoDB.", "Actualiza el contenido, las imágenes y las traducciones almacenadas en MongoDB.")}</p>
          <DestinationForm destination={destination} error={query.error} mediaLibrary={mediaLibrary} locale={locale} />
        </section>
      </div>
    </main>
  );
}
