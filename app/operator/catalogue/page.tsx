import Link from "next/link";
import { seedMongoCatalogueAction } from "@/app/operator/catalogue/actions";
import styles from "@/app/operator/operator.module.css";
import type { TravelServiceType } from "@/domain/services/types";
import { getLocale } from "@/lib/get-locale";
import {
  getMongoCatalogueStatus,
  listMongoDestinationsForAdmin,
  listMongoTripsForAdmin
} from "@/lib/mongo-travel-admin";
import { diagnoseMongoConnectionError, isMongoConfigured } from "@/lib/mongodb";
import { publicationStatusLabel, tr } from "@/lib/operator-i18n";
import { requireOperationsIdentity } from "@/lib/require-operations-identity";
import {
  listTravelServicesForAdmin,
  servicePublicPath,
  serviceTypePluralLabel
} from "@/lib/travel-services";

export const metadata = {
  title: "Catalogue | Kairoseth Travel",
  description: "Protected Kairoseth Travel catalogue controls."
};

export default async function OperatorCataloguePage({
  searchParams
}: {
  searchParams: Promise<{ seeded?: string; destinations?: string; trips?: string; error?: string; updated?: string }>;
}) {
  const locale = await getLocale();
  await requireOperationsIdentity();
  const params = await searchParams;
  const configured = isMongoConfigured();

  let status: Awaited<ReturnType<typeof getMongoCatalogueStatus>> | null = null;
  let storageError = false;
  let destinations: Awaited<ReturnType<typeof listMongoDestinationsForAdmin>> = [];
  let trips: Awaited<ReturnType<typeof listMongoTripsForAdmin>> = [];
  let services: Awaited<ReturnType<typeof listTravelServicesForAdmin>> = [];

  try {
    status = await getMongoCatalogueStatus();
    if (status.configured) {
      [destinations, trips, services] = await Promise.all([
        listMongoDestinationsForAdmin(),
        listMongoTripsForAdmin(),
        listTravelServicesForAdmin()
      ]);
    }
  } catch (error) {
    storageError = true;
    const diagnostic = diagnoseMongoConnectionError(error);
    console.error("Catalogue storage status check failed", { code: diagnostic.code });
  }

  const catalogueReady = configured && Boolean(status?.configured) && !storageError;
  const allItems = [...destinations, ...trips, ...services];
  const draftItems = allItems.filter((item) => (item.publicationStatus ?? "published") === "draft").length;
  const serviceTypes: TravelServiceType[] = ["activity", "transport", "insurance"];

  return (
    <main className="section">
      <div className={`container ${styles.shell}`}>
        <section className={styles.panel}>
          <div className="eyebrow">{tr(locale, "Catalogue management", "Gestión del catálogo")}</div>
          <h1>{tr(locale, "Travel catalogue", "Catálogo de viajes")}</h1>
          <p className={styles.lead}>
            {tr(
              locale,
              "Manage destinations, trips and independent services. Draft records remain hidden until they are published.",
              "Gestiona destinos, viajes y servicios independientes. Los borradores permanecen ocultos hasta que se publican."
            )}
          </p>

          <div className={styles.metrics}>
            <div className={styles.metric}><strong>{catalogueReady ? destinations.length : "—"}</strong><span>{tr(locale, "Destinations", "Destinos")}</span></div>
            <div className={styles.metric}><strong>{catalogueReady ? trips.length : "—"}</strong><span>{tr(locale, "Trips", "Viajes")}</span></div>
            <div className={styles.metric}><strong>{catalogueReady ? services.length : "—"}</strong><span>{tr(locale, "Services", "Servicios")}</span></div>
            <div className={styles.metric}><strong>{catalogueReady ? draftItems : "—"}</strong><span>{tr(locale, "Drafts", "Borradores")}</span></div>
          </div>

          {!catalogueReady ? (
            <div className={styles.notice}>
              <strong>{tr(locale, "Catalogue temporarily unavailable.", "Catálogo temporalmente no disponible.")}</strong>{" "}
              {tr(locale, "Please contact an administrator or review the server diagnostics.", "Contacta con un administrador o revisa los diagnósticos del servidor.")}
            </div>
          ) : null}

          {params.seeded === "1" ? (
            <div className={styles.notice}>
              {tr(locale, "Initial catalogue import completed:", "Importación del catálogo inicial completada:")} {params.destinations ?? "0"} {tr(locale, "destinations and", "destinos y")} {params.trips ?? "0"} {tr(locale, "trips added. Existing records were unchanged.", "viajes añadidos. Los registros existentes no se modificaron.")}
            </div>
          ) : null}

          {params.updated ? (
            <div className={styles.notice}>
              <strong>{tr(locale, "Saved.", "Guardado.")}</strong>{" "}
              {tr(locale, "The catalogue record was saved successfully.", "El registro del catálogo se guardó correctamente.")}
            </div>
          ) : null}

          {params.error === "mongodb-seed" ? (
            <div className={styles.notice}>{tr(locale, "The initial catalogue import could not be completed. Review the server logs.", "No se pudo completar la importación inicial del catálogo. Revisa los logs del servidor.")}</div>
          ) : null}

          {catalogueReady ? (
            <div className={styles.toolbar}>
              <Link className="button button-primary" href="/operator/catalogue/destinations/new">{tr(locale, "+ New destination", "+ Nuevo destino")}</Link>
              <Link className="button button-primary" href="/operator/catalogue/trips/new">{tr(locale, "+ New trip", "+ Nuevo viaje")}</Link>
              <Link className="button button-secondary" href="/operator/catalogue/services/new?type=activity">{tr(locale, "+ Activity", "+ Actividad")}</Link>
              <Link className="button button-secondary" href="/operator/catalogue/services/new?type=transport">{tr(locale, "+ Transport", "+ Transporte")}</Link>
              <Link className="button button-secondary" href="/operator/catalogue/services/new?type=insurance">{tr(locale, "+ Insurance", "+ Seguro")}</Link>
              <Link className="button button-secondary" href="/operator/media">{tr(locale, "Media library", "Biblioteca multimedia")}</Link>
              <form action={seedMongoCatalogueAction}>
                <button className="button button-secondary" type="submit">{tr(locale, "Import missing starter catalogue", "Importar catálogo inicial faltante")}</button>
              </form>
            </div>
          ) : null}
        </section>

        {catalogueReady ? (
          <>
            <section className={styles.panel} style={{ marginTop: "1rem" }}>
              <div className={styles.sectionHeader}>
                <div><div className="eyebrow">{tr(locale, "Destinations", "Destinos")}</div><h2>{tr(locale, "Manage destinations", "Gestionar destinos")}</h2></div>
                <Link className="text-link" href="/operator/catalogue/destinations/new">{tr(locale, "Create destination →", "Crear destino →")}</Link>
              </div>
              {destinations.length ? <div className={styles.managementList}>{destinations.map((destination) => (
                <div className={styles.managementRow} key={destination.id}>
                  <div><strong>{destination.name}</strong><span>{destination.country} · /destinations/{destination.slug}</span></div>
                  <span className={styles.badge}>{publicationStatusLabel(destination.publicationStatus ?? "published", locale)}</span>
                  <span>{destination.featured ? tr(locale, "Featured", "Destacado") : tr(locale, "Standard", "Estándar")}</span>
                  <Link className="button button-secondary" href={`/operator/catalogue/destinations/${destination.id}`}>{tr(locale, "Edit", "Editar")}</Link>
                </div>
              ))}</div> : <div className={styles.notice}>{tr(locale, "No destinations have been created yet.", "Todavía no se han creado destinos.")}</div>}
            </section>

            <section className={styles.panel} style={{ marginTop: "1rem" }}>
              <div className={styles.sectionHeader}>
                <div><div className="eyebrow">{tr(locale, "Trips", "Viajes")}</div><h2>{tr(locale, "Manage travel products", "Gestionar productos de viaje")}</h2></div>
                <Link className="text-link" href="/operator/catalogue/trips/new">{tr(locale, "Create trip →", "Crear viaje →")}</Link>
              </div>
              {trips.length ? <div className={styles.managementList}>{trips.map((trip) => {
                const destination = destinations.find((item) => item.id === trip.destinationId);
                return (
                  <div className={styles.managementRow} key={trip.id}>
                    <div><strong>{trip.title}</strong><span>{destination?.name ?? trip.destinationId} · {trip.durationDays} {tr(locale, "days", "días")} · {trip.currency} {trip.fromPrice}</span></div>
                    <span className={styles.badge}>{publicationStatusLabel(trip.publicationStatus ?? "published", locale)}</span>
                    <span>{trip.featured ? tr(locale, "Featured", "Destacado") : tr(locale, "Standard", "Estándar")}</span>
                    <Link className="button button-secondary" href={`/operator/catalogue/trips/${trip.id}`}>{tr(locale, "Edit", "Editar")}</Link>
                  </div>
                );
              })}</div> : <div className={styles.notice}>{tr(locale, "No trips have been created yet.", "Todavía no se han creado viajes.")}</div>}
            </section>

            {serviceTypes.map((type) => {
              const items = services.filter((service) => service.serviceType === type);
              return (
                <section className={styles.panel} style={{ marginTop: "1rem" }} key={type}>
                  <div className={styles.sectionHeader}>
                    <div><div className="eyebrow">{serviceTypePluralLabel(type, locale)}</div><h2>{tr(locale, "Manage independent services", "Gestionar servicios independientes")}</h2></div>
                    <Link className="text-link" href={`/operator/catalogue/services/new?type=${type}`}>{tr(locale, "Create service →", "Crear servicio →")}</Link>
                  </div>
                  {items.length ? <div className={styles.managementList}>{items.map((service) => (
                    <div className={styles.managementRow} key={service.id}>
                      <div><strong>{service.title}</strong><span>{service.currency} {service.fromPrice} · {servicePublicPath(service)}</span></div>
                      <span className={styles.badge}>{publicationStatusLabel(service.publicationStatus ?? "published", locale)}</span>
                      <span>{service.featured ? tr(locale, "Featured", "Destacado") : tr(locale, "Standard", "Estándar")}</span>
                      <Link className="button button-secondary" href={`/operator/catalogue/services/${service.id}`}>{tr(locale, "Edit", "Editar")}</Link>
                    </div>
                  ))}</div> : <div className={styles.notice}>{tr(locale, "No services have been created in this category yet.", "Todavía no se han creado servicios en esta categoría.")}</div>}
                </section>
              );
            })}
          </>
        ) : null}

        <div className={styles.actions}>
          <Link className="button button-secondary" href="/operator">{tr(locale, "← Operator dashboard", "← Panel de operador")}</Link>
          <Link className="button button-secondary" href="/operator/media">{tr(locale, "Media library", "Biblioteca multimedia")}</Link>
          <Link className="button button-secondary" href="/services">{tr(locale, "Public services", "Servicios públicos")}</Link>
          <Link className="button button-secondary" href="/trips">{tr(locale, "Public trips", "Viajes públicos")}</Link>
        </div>
      </div>
    </main>
  );
}
