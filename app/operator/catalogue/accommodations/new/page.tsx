import Link from "next/link";
import styles from "@/app/operator/operator.module.css";
import { AccommodationForm } from "@/components/operator/accommodation-form";
import { getLocale } from "@/lib/get-locale";
import { listMediaLibraryChoices } from "@/lib/media-library";
import { tr } from "@/lib/operator-i18n";
import { requireOperationsIdentity } from "@/lib/require-operations-identity";

export const metadata = {
  title: "New accommodation | Kairoseth Travel",
  description: "Create a reusable accommodation product and room inventory."
};

export default async function NewAccommodationPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const [locale, query] = await Promise.all([getLocale(), searchParams]);
  await requireOperationsIdentity();
  const mediaLibrary = await listMediaLibraryChoices(100);

  return (
    <main className="section">
      <div className={`container ${styles.shell}`}>
        <section className={styles.panel}>
          <div className="eyebrow">{tr(locale, "Catalogue · Accommodation", "Catálogo · Alojamiento")}</div>
          <h1>{tr(locale, "Create accommodation", "Crear alojamiento")}</h1>
          <p className={styles.lead}>{tr(locale, "Define the property, its room types, occupancy limits and room inventory periods.", "Define el alojamiento, sus tipos de habitación, límites de ocupación y periodos de inventario.")}</p>
          <p><Link className="text-link" href="/operator/catalogue">{tr(locale, "← Catalogue", "← Catálogo")}</Link></p>
        </section>
        <AccommodationForm locale={locale} error={query.error} mediaLibrary={mediaLibrary} />
      </div>
    </main>
  );
}
