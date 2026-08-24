import Link from "next/link";
import { notFound } from "next/navigation";
import styles from "@/app/operator/operator.module.css";
import { AccommodationForm } from "@/components/operator/accommodation-form";
import { getAccommodationForAdmin, listAccommodationInventory } from "@/lib/accommodations";
import { getLocale } from "@/lib/get-locale";
import { listMediaLibraryChoices } from "@/lib/media-library";
import { tr } from "@/lib/operator-i18n";
import { requireOperationsIdentity } from "@/lib/require-operations-identity";

export const metadata = {
  title: "Edit accommodation | Kairoseth Travel",
  description: "Manage accommodation room types, occupancy and inventory."
};

export default async function EditAccommodationPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ id }, query, locale] = await Promise.all([params, searchParams, getLocale()]);
  await requireOperationsIdentity();
  const [accommodation, inventory, mediaLibrary] = await Promise.all([
    getAccommodationForAdmin(id),
    listAccommodationInventory(id),
    listMediaLibraryChoices(100)
  ]);
  if (!accommodation) notFound();

  return (
    <main className="section">
      <div className={`container ${styles.shell}`}>
        <section className={styles.panel}>
          <div className="eyebrow">{tr(locale, "Catalogue · Accommodation", "Catálogo · Alojamiento")}</div>
          <h1>{accommodation.name}</h1>
          <p className={styles.lead}>{tr(locale, "Manage room definitions and inventory without changing reservations that may exist later.", "Gestiona definiciones e inventario de habitaciones sin alterar reservas que puedan existir más adelante.")}</p>
          <p><Link className="text-link" href="/operator/catalogue">{tr(locale, "← Catalogue", "← Catálogo")}</Link></p>
        </section>
        <AccommodationForm accommodation={accommodation} inventory={inventory} mediaLibrary={mediaLibrary} locale={locale} error={query.error} />
      </div>
    </main>
  );
}
