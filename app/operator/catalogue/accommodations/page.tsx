import Link from "next/link";
import styles from "@/app/operator/operator.module.css";
import { listAccommodationsForAdmin, listAccommodationInventory } from "@/lib/accommodations";
import { getLocale } from "@/lib/get-locale";
import { publicationStatusLabel, tr } from "@/lib/operator-i18n";
import { requireOperationsIdentity } from "@/lib/require-operations-identity";

export const metadata = {
  title: "Accommodation catalogue | Kairoseth Travel",
  description: "Manage accommodation products, room types and inventory."
};

export default async function OperatorAccommodationListPage() {
  const locale = await getLocale();
  await requireOperationsIdentity();
  const accommodations = await listAccommodationsForAdmin();
  const inventoryGroups = await Promise.all(accommodations.map(async (item) => ({
    id: item.id,
    periods: await listAccommodationInventory(item.id)
  })));
  const inventoryByAccommodation = new Map(inventoryGroups.map((item) => [item.id, item.periods]));

  return (
    <main className="section">
      <div className={`container ${styles.shell}`}>
        <section className={styles.panel}>
          <div className="eyebrow">{tr(locale, "Catalogue · Accommodation", "Catálogo · Alojamiento")}</div>
          <h1>{tr(locale, "Accommodation products", "Productos de alojamiento")}</h1>
          <p className={styles.lead}>{tr(locale, "Manage properties, room definitions, occupancy rules and room inventory periods.", "Gestiona alojamientos, tipos de habitación, reglas de ocupación y periodos de inventario.")}</p>
          <div className={styles.actions}>
            <Link className="button button-primary" href="/operator/catalogue/accommodations/new">{tr(locale, "+ New accommodation", "+ Nuevo alojamiento")}</Link>
            <Link className="button button-secondary" href="/operator/catalogue">{tr(locale, "← Main catalogue", "← Catálogo principal")}</Link>
            <Link className="button button-secondary" href="/accommodations">{tr(locale, "Public accommodation", "Alojamientos públicos")}</Link>
          </div>
        </section>

        <section className={styles.panel} style={{ marginTop: "1rem" }}>
          {accommodations.length ? (
            <div className={styles.managementList}>
              {accommodations.map((accommodation) => {
                const periods = inventoryByAccommodation.get(accommodation.id) ?? [];
                const openPeriods = periods.filter((period) => period.status === "open").length;
                return (
                  <div className={styles.managementRow} key={accommodation.id}>
                    <div>
                      <strong>{accommodation.name}</strong>
                      <span>{accommodation.location} · {accommodation.roomTypes.length} {tr(locale, "room types", "tipos de habitación")} · {openPeriods} {tr(locale, "open inventory periods", "periodos de inventario abiertos")}</span>
                    </div>
                    <span className={styles.badge}>{publicationStatusLabel(accommodation.publicationStatus ?? "draft", locale)}</span>
                    <span>{accommodation.featured ? tr(locale, "Featured", "Destacado") : tr(locale, "Standard", "Estándar")}</span>
                    <Link className="button button-secondary" href={`/operator/catalogue/accommodations/${accommodation.id}`}>{tr(locale, "Edit", "Editar")}</Link>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className={styles.notice}>{tr(locale, "No accommodation products have been created yet.", "Todavía no se han creado productos de alojamiento.")}</div>
          )}
        </section>
      </div>
    </main>
  );
}
