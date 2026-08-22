import { notFound } from "next/navigation";
import { ServiceAvailabilityEditor } from "@/components/operator/service-availability-editor";
import { ServiceForm } from "@/components/operator/service-form";
import styles from "@/app/operator/operator.module.css";
import { getLocale } from "@/lib/get-locale";
import { listMediaLibraryChoices } from "@/lib/media-library";
import { tr } from "@/lib/operator-i18n";
import { requireOperationsIdentity } from "@/lib/require-operations-identity";
import { listServiceAvailabilityForAdmin } from "@/lib/service-availability";
import { getTravelServiceForAdmin, serviceTypeLabel } from "@/lib/travel-services";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; availabilityUpdated?: string }>;
};
export const metadata = { title: "Service | Kairoseth Travel" };

export default async function EditServicePage({ params, searchParams }: PageProps) {
  const locale = await getLocale();
  await requireOperationsIdentity();
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const service = await getTravelServiceForAdmin(id);
  if (!service) notFound();

  const [mediaLibrary, availability] = await Promise.all([
    listMediaLibraryChoices(100),
    service.serviceType === "insurance" ? Promise.resolve([]) : listServiceAvailabilityForAdmin(service.id)
  ]);
  const serviceFormError = query.error === "validation" || query.error === "save" ? query.error : undefined;

  return (
    <main className="section">
      <div className={`container ${styles.shell}`}>
        <section className={styles.panel}>
          <div className="eyebrow">{tr(locale, "Catalogue · Independent services", "Catálogo · Servicios independientes")}</div>
          <h1>{tr(locale, "Edit", "Editar")} {service.title}</h1>
          <p className={styles.lead}>{tr(locale, "Manage public content, pricing, media, publication and service availability.", "Gestiona el contenido público, precios, multimedia, publicación y disponibilidad del servicio.")}</p>
          {query.availabilityUpdated === "1" ? (
            <div className={styles.notice}><strong>{tr(locale, "Availability saved.", "Disponibilidad guardada.")}</strong> {tr(locale, "The public schedule has been updated.", "El calendario público se ha actualizado.")}</div>
          ) : null}
          {query.error === "availability-validation" ? (
            <div className={styles.notice}>{tr(locale, "Review the availability dates, times, capacity and prices.", "Revisa las fechas, horarios, capacidad y precios de la disponibilidad.")}</div>
          ) : null}
          {query.error === "availability-save" ? (
            <div className={styles.notice}>{tr(locale, "The availability schedule could not be saved. Review the server logs.", "No se pudo guardar el calendario de disponibilidad. Revisa los logs del servidor.")}</div>
          ) : null}
          <ServiceForm service={service} type={service.serviceType} error={serviceFormError} mediaLibrary={mediaLibrary} locale={locale} />
          {service.serviceType !== "insurance" ? (
            <ServiceAvailabilityEditor service={service} slots={availability} locale={locale} />
          ) : (
            <section className={styles.editorSection} style={{ marginTop: "1rem" }}>
              <div className="eyebrow">{tr(locale, "Insurance availability", "Disponibilidad del seguro")}</div>
              <h2>{tr(locale, "Quoted from trip details", "Cotización según datos del viaje")}</h2>
              <p className={styles.muted}>{tr(locale, "Insurance does not use dated inventory slots. The future booking flow will validate destination, travel dates, traveller ages and the product maximum trip duration before pricing.", "Los seguros no utilizan cupos por fecha. El futuro flujo de contratación validará destino, fechas del viaje, edades de los viajeros y la duración máxima admitida antes de calcular el precio.")}</p>
            </section>
          )}
          <div className={styles.notice} style={{ marginTop: "1rem" }}>{serviceTypeLabel(service.serviceType, locale)} · /{service.serviceType === "activity" ? "activities" : service.serviceType}/{service.slug}</div>
        </section>
      </div>
    </main>
  );
}
