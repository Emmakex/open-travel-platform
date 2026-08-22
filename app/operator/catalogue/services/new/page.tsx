import { ServiceForm } from "@/components/operator/service-form";
import styles from "@/app/operator/operator.module.css";
import type { TravelServiceType } from "@/domain/services/types";
import { getLocale } from "@/lib/get-locale";
import { listMediaLibraryChoices } from "@/lib/media-library";
import { tr } from "@/lib/operator-i18n";
import { requireOperationsIdentity } from "@/lib/require-operations-identity";
import { serviceTypeLabel } from "@/lib/travel-services";

type PageProps = { searchParams: Promise<{ type?: string; error?: string }> };
export const metadata = { title: "New service | Kairoseth Travel" };

export default async function NewServicePage({ searchParams }: PageProps) {
  const locale = await getLocale();
  await requireOperationsIdentity();
  const query = await searchParams;
  const type: TravelServiceType = query.type === "transport" || query.type === "insurance" ? query.type : "activity";
  const mediaLibrary = await listMediaLibraryChoices(100);

  return (
    <main className="section">
      <div className={`container ${styles.shell}`}>
        <section className={styles.panel}>
          <div className="eyebrow">{tr(locale, "Catalogue · Independent services", "Catálogo · Servicios independientes")}</div>
          <h1>{tr(locale, "New", "Nuevo")} {serviceTypeLabel(type, locale).toLowerCase()}</h1>
          <p className={styles.lead}>{tr(locale, "Create a standalone product with its own public page. It can later be sold independently or attached to a trip reservation.", "Crea un producto independiente con su propia página pública. Más adelante podrá venderse solo o vinculado a una reserva de viaje.")}</p>
          <ServiceForm type={type} error={query.error} mediaLibrary={mediaLibrary} locale={locale} />
        </section>
      </div>
    </main>
  );
}
