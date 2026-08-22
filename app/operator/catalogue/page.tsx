import Link from "next/link";
import { seedMongoCatalogueAction } from "@/app/operator/catalogue/actions";
import styles from "@/app/operator/operator.module.css";
import { getLocale } from "@/lib/get-locale";
import {
  getMongoCatalogueStatus,
  listMongoDestinationsForAdmin,
  listMongoTripsForAdmin
} from "@/lib/mongo-travel-admin";
import {
  diagnoseMongoConnectionError,
  getMongoDatabaseName,
  isMongoConfigured,
  type MongoConnectionDiagnostic
} from "@/lib/mongodb";
import { publicationStatusLabel, tr } from "@/lib/operator-i18n";
import { requireOperationsIdentity } from "@/lib/require-operations-identity";
import { travelDataConfig } from "@/lib/travel-data-config";

export const metadata = {
  title: "Catalogue | Kairoseth Travel",
  description: "Protected Kairoseth Travel catalogue controls."
};

function diagnosticText(code: string, locale: "en" | "es") {
  const messages: Record<string, [string, string]> = {
    network: ["MongoDB cannot be reached. Check Atlas Network Access and the Hostinger outbound IP.", "No se puede acceder a MongoDB. Revisa Network Access de Atlas y la IP de salida de Hostinger."],
    authentication: ["MongoDB authentication failed. Check the database username and password.", "La autenticación de MongoDB ha fallado. Revisa el usuario y la contraseña de la base de datos."],
    authorization: ["The MongoDB user does not have enough permissions for this database.", "El usuario de MongoDB no tiene permisos suficientes para esta base de datos."],
    dns: ["The MongoDB SRV/DNS record could not be resolved.", "No se ha podido resolver el registro SRV/DNS de MongoDB."],
    tls: ["The secure MongoDB connection could not be established.", "No se ha podido establecer la conexión segura con MongoDB."],
    "connection-string": ["The MongoDB connection string is invalid.", "La cadena de conexión de MongoDB no es válida."],
    unknown: ["The MongoDB connection check failed. Review the runtime logs.", "La comprobación de MongoDB ha fallado. Revisa los logs de ejecución."]
  };
  const message = messages[code] ?? messages.unknown;
  return locale === "es" ? message[1] : message[0];
}

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
  let diagnostic: MongoConnectionDiagnostic | null = null;
  let destinations: Awaited<ReturnType<typeof listMongoDestinationsForAdmin>> = [];
  let trips: Awaited<ReturnType<typeof listMongoTripsForAdmin>> = [];

  try {
    status = await getMongoCatalogueStatus();
    if (status.configured) {
      [destinations, trips] = await Promise.all([
        listMongoDestinationsForAdmin(),
        listMongoTripsForAdmin()
      ]);
    }
  } catch (error) {
    diagnostic = diagnoseMongoConnectionError(error);
    console.error("MongoDB catalogue status check failed", { code: diagnostic.code, database: getMongoDatabaseName() });
  }

  const databaseName = status?.databaseName ?? getMongoDatabaseName();

  return (
    <main className="section">
      <div className={`container ${styles.shell}`}>
        <section className={styles.panel}>
          <div className="eyebrow">{tr(locale, "Catalogue data", "Datos del catálogo")}</div>
          <h1>{tr(locale, "MongoDB catalogue", "Catálogo MongoDB")}</h1>
          <p className={styles.lead}>
            {tr(
              locale,
              "Manage persistent destinations and travel products. Draft records remain hidden until they are published.",
              "Gestiona destinos y productos de viaje persistentes. Los borradores permanecen ocultos hasta que se publican."
            )}
          </p>

          <div className={styles.metrics}>
            <div className={styles.metric}><strong>{travelDataConfig.mode}</strong><span>{tr(locale, "Active mode", "Modo activo")}</span></div>
            <div className={styles.metric}><strong>{databaseName}</strong><span>{tr(locale, "Database", "Base de datos")}</span></div>
            <div className={styles.metric}><strong>{status?.destinations ?? "—"}</strong><span>{tr(locale, "Destinations", "Destinos")}</span></div>
            <div className={styles.metric}><strong>{status?.trips ?? "—"}</strong><span>{tr(locale, "Trips", "Viajes")}</span></div>
          </div>

          {!configured ? (
            <div className={styles.notice}>
              <strong>{tr(locale, "MongoDB URI not detected.", "No se ha detectado la URI de MongoDB.")}</strong>{" "}
              {tr(locale, "Add the server-only MONGODB_URI environment variable in Hostinger.", "Añade en Hostinger la variable de servidor MONGODB_URI.")}
            </div>
          ) : null}

          {diagnostic ? (
            <div className={styles.notice}>
              <strong>{tr(locale, "MongoDB connection issue.", "Problema de conexión con MongoDB.")}</strong>{" "}
              {diagnosticText(diagnostic.code, locale)}
              <div style={{ marginTop: "0.65rem" }}>{tr(locale, "Diagnostic code", "Código de diagnóstico")}: <code>{diagnostic.code}</code></div>
            </div>
          ) : null}

          {configured && status ? (
            <div className={styles.notice}>
              <strong>{tr(locale, "MongoDB connection successful.", "Conexión con MongoDB correcta.")}</strong>{" "}
              {tr(locale, "The application can read the catalogue collections in", "La aplicación puede leer las colecciones del catálogo en")} <code>{databaseName}</code>.
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
              {tr(locale, "The record was written to MongoDB successfully.", "El registro se guardó correctamente en MongoDB.")}
            </div>
          ) : null}

          {params.error === "mongodb-seed" ? (
            <div className={styles.notice}>{tr(locale, "The initial catalogue import could not be completed. Review the runtime logs and Atlas settings.", "No se pudo completar la importación inicial del catálogo. Revisa los logs y la configuración de Atlas.")}</div>
          ) : null}

          {configured && status ? (
            <div className={styles.toolbar}>
              <Link className="button button-primary" href="/operator/catalogue/destinations/new">{tr(locale, "+ New destination", "+ Nuevo destino")}</Link>
              <Link className="button button-primary" href="/operator/catalogue/trips/new">{tr(locale, "+ New trip", "+ Nuevo viaje")}</Link>
              <Link className="button button-secondary" href="/operator/media">{tr(locale, "Media library", "Biblioteca multimedia")}</Link>
              <form action={seedMongoCatalogueAction}>
                <button className="button button-secondary" type="submit">{tr(locale, "Import missing starter catalogue", "Importar catálogo inicial faltante")}</button>
              </form>
            </div>
          ) : null}
        </section>

        {configured && status ? (
          <>
            <section className={styles.panel} style={{ marginTop: "1rem" }}>
              <div className={styles.sectionHeader}>
                <div>
                  <div className="eyebrow">{tr(locale, "Destinations", "Destinos")}</div>
                  <h2>{tr(locale, "Manage destinations", "Gestionar destinos")}</h2>
                </div>
                <Link className="text-link" href="/operator/catalogue/destinations/new">{tr(locale, "Create destination →", "Crear destino →")}</Link>
              </div>
              {destinations.length ? (
                <div className={styles.managementList}>
                  {destinations.map((destination) => (
                    <div className={styles.managementRow} key={destination.id}>
                      <div><strong>{destination.name}</strong><span>{destination.country} · /destinations/{destination.slug}</span></div>
                      <span className={styles.badge}>{publicationStatusLabel(destination.publicationStatus ?? "published", locale)}</span>
                      <span>{destination.featured ? tr(locale, "Featured", "Destacado") : tr(locale, "Standard", "Estándar")}</span>
                      <Link className="button button-secondary" href={`/operator/catalogue/destinations/${destination.id}`}>{tr(locale, "Edit", "Editar")}</Link>
                    </div>
                  ))}
                </div>
              ) : <div className={styles.notice}>{tr(locale, "No destinations are stored in MongoDB yet.", "Todavía no hay destinos almacenados en MongoDB.")}</div>}
            </section>

            <section className={styles.panel} style={{ marginTop: "1rem" }}>
              <div className={styles.sectionHeader}>
                <div>
                  <div className="eyebrow">{tr(locale, "Trips", "Viajes")}</div>
                  <h2>{tr(locale, "Manage travel products", "Gestionar productos de viaje")}</h2>
                </div>
                <Link className="text-link" href="/operator/catalogue/trips/new">{tr(locale, "Create trip →", "Crear viaje →")}</Link>
              </div>
              {trips.length ? (
                <div className={styles.managementList}>
                  {trips.map((trip) => {
                    const destination = destinations.find((item) => item.id === trip.destinationId);
                    return (
                      <div className={styles.managementRow} key={trip.id}>
                        <div><strong>{trip.title}</strong><span>{destination?.name ?? trip.destinationId} · {trip.durationDays} {tr(locale, "days", "días")} · {trip.currency} {trip.fromPrice}</span></div>
                        <span className={styles.badge}>{publicationStatusLabel(trip.publicationStatus ?? "published", locale)}</span>
                        <span>{trip.featured ? tr(locale, "Featured", "Destacado") : tr(locale, "Standard", "Estándar")}</span>
                        <Link className="button button-secondary" href={`/operator/catalogue/trips/${trip.id}`}>{tr(locale, "Edit", "Editar")}</Link>
                      </div>
                    );
                  })}
                </div>
              ) : <div className={styles.notice}>{tr(locale, "No trips are stored in MongoDB yet.", "Todavía no hay viajes almacenados en MongoDB.")}</div>}
            </section>
          </>
        ) : null}

        <div className={styles.actions}>
          <Link className="button button-secondary" href="/operator">{tr(locale, "← Operator dashboard", "← Panel de operador")}</Link>
          <Link className="button button-secondary" href="/operator/media">{tr(locale, "Media library", "Biblioteca multimedia")}</Link>
          <Link className="button button-secondary" href="/trips">{tr(locale, "Public catalogue", "Catálogo público")}</Link>
        </div>
      </div>
    </main>
  );
}
