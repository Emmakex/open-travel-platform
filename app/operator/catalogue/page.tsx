import Link from "next/link";
import { seedMongoCatalogueAction } from "@/app/operator/catalogue/actions";
import styles from "@/app/operator/operator.module.css";
import { getMongoCatalogueStatus } from "@/lib/mongo-travel-admin";
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
  }>;
}) {
  await requireOperationsIdentity();
  const params = await searchParams;
  const configured = isMongoConfigured();

  let status: Awaited<ReturnType<typeof getMongoCatalogueStatus>> | null = null;
  let diagnostic: MongoConnectionDiagnostic | null = null;

  try {
    status = await getMongoCatalogueStatus();
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
            Move destinations and trips from the in-code demo catalogue into persistent MongoDB
            collections before enabling MongoDB as the public catalogue source.
          </p>

          <div className={styles.metrics}>
            <div className={styles.metric}>
              <strong>{travelDataConfig.mode}</strong>
              <span>Active mode</span>
            </div>
            <div className={styles.metric}>
              <strong>{databaseName}</strong>
              <span>Database</span>
            </div>
            <div className={styles.metric}>
              <strong>{status?.destinations ?? "—"}</strong>
              <span>Destinations</span>
            </div>
            <div className={styles.metric}>
              <strong>{status?.trips ?? "—"}</strong>
              <span>Trips</span>
            </div>
          </div>

          {!configured ? (
            <div className={styles.notice}>
              <strong>MongoDB URI not detected.</strong> Add the server-only <code>MONGODB_URI</code>
              environment variable in Hostinger. Do not use a <code>NEXT_PUBLIC_*</code> variable for
              database credentials.
            </div>
          ) : null}

          {diagnostic ? (
            <div className={styles.notice}>
              <strong>{diagnostic.title}</strong> {diagnostic.detail}
              <div style={{ marginTop: "0.65rem" }}>
                Safe diagnostic code: <code>{diagnostic.code}</code>
              </div>
            </div>
          ) : null}

          {configured && status ? (
            <div className={styles.notice}>
              <strong>MongoDB connection successful.</strong> Atlas is reachable and the application can
              read the <code>{databaseName}</code> catalogue collections.
            </div>
          ) : null}

          {params.seeded === "1" ? (
            <div className={styles.notice}>
              Seed completed: {params.destinations ?? "0"} new destination record(s) and {params.trips ?? "0"} new trip record(s) inserted.
              Existing MongoDB records were left unchanged.
            </div>
          ) : null}

          {params.error === "mongodb-seed" ? (
            <div className={styles.notice}>
              The seed could not be completed. Review the runtime log and MongoDB Atlas connection settings.
            </div>
          ) : null}

          {configured && status ? (
            <>
              <div className={styles.notice}>
                The seed is idempotent: it inserts only missing demo records by stable <code>id</code> and
                creates unique indexes for catalogue IDs and slugs. It will not overwrite records that
                already exist in MongoDB.
              </div>
              <form action={seedMongoCatalogueAction}>
                <button className="button button-primary" type="submit">
                  Seed missing demo catalogue
                </button>
              </form>
            </>
          ) : null}

          <div className={styles.actions}>
            <Link className="button button-secondary" href="/operator">← Operator dashboard</Link>
            <Link className="button button-secondary" href="/trips">Public catalogue</Link>
          </div>
        </section>
      </div>
    </main>
  );
}
