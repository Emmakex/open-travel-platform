import Link from "next/link";
import { seedMongoCatalogueAction } from "@/app/operator/catalogue/actions";
import styles from "@/app/operator/operator.module.css";
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
import { requireOperationsIdentity } from "@/lib/require-operations-identity";
import { travelDataConfig } from "@/lib/travel-data-config";

export const metadata = {
  title: "Catalogue data",
  description: "Protected Kairoseth Travel catalogue data controls."
};

export default async function OperatorCataloguePage({
  searchParams
}: {
  searchParams: Promise<{
    seeded?: string;
    destinations?: string;
    trips?: string;
    error?: string;
    updated?: string;
  }>;
}) {
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
    console.error("MongoDB catalogue status check failed", {
      code: diagnostic.code,
      database: getMongoDatabaseName()
    });
  }

  const databaseName = status?.databaseName ?? getMongoDatabaseName();

  return (
    <main className="section">
      <div className={`container ${styles.shell}`}>
        <section className={styles.panel}>
          <div className="eyebrow">Catalogue data</div>
          <h1>MongoDB catalogue</h1>
          <p className={styles.lead}>
            Manage persistent destinations and travel products stored in MongoDB. Draft records remain hidden from the public catalogue until explicitly published.
          </p>

          <div className={styles.metrics}>
            <div className={styles.metric}><strong>{travelDataConfig.mode}</strong><span>Active mode</span></div>
            <div className={styles.metric}><strong>{databaseName}</strong><span>Database</span></div>
            <div className={styles.metric}><strong>{status?.destinations ?? "—"}</strong><span>Destinations</span></div>
            <div className={styles.metric}><strong>{status?.trips ?? "—"}</strong><span>Trips</span></div>
          </div>

          {!configured ? (
            <div className={styles.notice}>
              <strong>MongoDB URI not detected.</strong> Add the server-only <code>MONGODB_URI</code> environment variable in Hostinger. Do not use a <code>NEXT_PUBLIC_*</code> variable for database credentials.
            </div>
          ) : null}

          {diagnostic ? (
            <div className={styles.notice}>
              <strong>{diagnostic.title}</strong> {diagnostic.detail}
              <div style={{ marginTop: "0.65rem" }}>Safe diagnostic code: <code>{diagnostic.code}</code></div>
            </div>
          ) : null}

          {configured && status ? (
            <div className={styles.notice}>
              <strong>MongoDB connection successful.</strong> Atlas is reachable and the application can read the <code>{databaseName}</code> catalogue collections.
            </div>
          ) : null}

          {params.seeded === "1" ? (
            <div className={styles.notice}>
              Seed completed: {params.destinations ?? "0"} new destination record(s) and {params.trips ?? "0"} new trip record(s) inserted. Existing MongoDB records were left unchanged.
            </div>
          ) : null}

          {params.updated ? (
            <div className={styles.notice}>
              <strong>Saved.</strong> The {params.updated} record was written to MongoDB successfully.
            </div>
          ) : null}

          {params.error === "mongodb-seed" ? (
            <div className={styles.notice}>The seed could not be completed. Review the runtime log and MongoDB Atlas connection settings.</div>
          ) : null}

          {configured && status ? (
            <div className={styles.toolbar}>
              <Link className="button button-primary" href="/operator/catalogue/destinations/new">+ New destination</Link>
              <Link className="button button-primary" href="/operator/catalogue/trips/new">+ New trip</Link>
              <Link className="button button-secondary" href="/operator/media">Media library</Link>
              <form action={seedMongoCatalogueAction}>
                <button className="button button-secondary" type="submit">Seed missing demo catalogue</button>
              </form>
            </div>
          ) : null}
        </section>

        {configured && status ? (
          <>
            <section className={styles.panel} style={{ marginTop: "1rem" }}>
              <div className={styles.sectionHeader}>
                <div>
                  <div className="eyebrow">Destinations</div>
                  <h2>Manage destinations</h2>
                </div>
                <Link className="text-link" href="/operator/catalogue/destinations/new">Create destination →</Link>
              </div>
              {destinations.length ? (
                <div className={styles.managementList}>
                  {destinations.map((destination) => (
                    <div className={styles.managementRow} key={destination.id}>
                      <div>
                        <strong>{destination.name}</strong>
                        <span>{destination.country} · /destinations/{destination.slug}</span>
                      </div>
                      <span className={styles.badge}>{destination.publicationStatus ?? "published"}</span>
                      <span>{destination.featured ? "Featured" : "Standard"}</span>
                      <Link className="button button-secondary" href={`/operator/catalogue/destinations/${destination.id}`}>Edit</Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.notice}>No destinations are stored in MongoDB yet.</div>
              )}
            </section>

            <section className={styles.panel} style={{ marginTop: "1rem" }}>
              <div className={styles.sectionHeader}>
                <div>
                  <div className="eyebrow">Trips</div>
                  <h2>Manage travel products</h2>
                </div>
                <Link className="text-link" href="/operator/catalogue/trips/new">Create trip →</Link>
              </div>
              {trips.length ? (
                <div className={styles.managementList}>
                  {trips.map((trip) => {
                    const destination = destinations.find((item) => item.id === trip.destinationId);
                    return (
                      <div className={styles.managementRow} key={trip.id}>
                        <div>
                          <strong>{trip.title}</strong>
                          <span>{destination?.name ?? trip.destinationId} · {trip.durationDays} days · {trip.currency} {trip.fromPrice}</span>
                        </div>
                        <span className={styles.badge}>{trip.publicationStatus ?? "published"}</span>
                        <span>{trip.featured ? "Featured" : "Standard"}</span>
                        <Link className="button button-secondary" href={`/operator/catalogue/trips/${trip.id}`}>Edit</Link>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className={styles.notice}>No trips are stored in MongoDB yet.</div>
              )}
            </section>
          </>
        ) : null}

        <div className={styles.actions}>
          <Link className="button button-secondary" href="/operator">← Operator dashboard</Link>
          <Link className="button button-secondary" href="/operator/media">Media library</Link>
          <Link className="button button-secondary" href="/trips">Public catalogue</Link>
        </div>
      </div>
    </main>
  );
}
