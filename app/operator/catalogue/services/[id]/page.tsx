import { notFound } from "next/navigation";
import { ServiceForm } from "@/components/operator/service-form";
import styles from "@/app/operator/operator.module.css";
import { getLocale } from "@/lib/get-locale";
import { listMediaLibraryChoices } from "@/lib/media-library";
import { tr } from "@/lib/operator-i18n";
import { requireOperationsIdentity } from "@/lib/require-operations-identity";
import { getTravelServiceForAdmin, serviceTypeLabel } from "@/lib/travel-services";

type PageProps = { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> };
export const metadata = { title: "Service | Kairoseth Travel" };

export default async function EditServicePage({ params, searchParams }: PageProps) {
  const locale = await getLocale();
  await requireOperationsIdentity();
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const [service, mediaLibrary] = await Promise.all([
    getTravelServiceForAdmin(id),
    listMediaLibraryChoices(100)
  ]);
  if (!service) notFound();

  return (
    <main className="section">
      <div className={`container ${styles.shell}`}>
        <section className={styles.panel}>
          <div className="eyebrow">{tr(locale, "Catalogue · Independent services", "Catálogo · Servicios independientes")}</div>
          <h1>{tr(locale, "Edit", "Editar")} {service.title}</h1>
          <p className={styles.lead}>{tr(locale, "Manage the public content, pricing, media and publication settings for this independent service.", "Gestiona el contenido público, precios, multimedia y publicación de este servicio independiente.")}</p>
          <ServiceForm service={service} type={service.serviceType} error={query.error} mediaLibrary={mediaLibrary} locale={locale} />
          <div className={styles.notice} style={{ marginTop: "1rem" }}>{serviceTypeLabel(service.serviceType, locale)} · /{service.serviceType === "activity" ? "activities" : service.serviceType}/{service.slug}</div>
        </section>
      </div>
    </main>
  );
}
