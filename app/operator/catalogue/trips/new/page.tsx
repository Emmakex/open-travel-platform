import { TripForm } from "@/components/operator/catalogue-forms";
import styles from "@/app/operator/operator.module.css";
import { listMongoDestinationsForAdmin } from "@/lib/mongo-travel-admin";
import { requireOperationsIdentity } from "@/lib/require-operations-identity";

export const metadata = { title: "New trip" };

export default async function NewTripPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireOperationsIdentity();
  const [destinations, params] = await Promise.all([
    listMongoDestinationsForAdmin(),
    searchParams
  ]);

  return (
    <main className="section">
      <div className={`container ${styles.shell}`}>
        <section className={styles.panel}>
          <div className="eyebrow">Catalogue · Trips</div>
          <h1>New trip</h1>
          <p className={styles.lead}>Create a MongoDB-backed travel product and keep it as a draft until it is ready for the public catalogue.</p>
          {destinations.length ? (
            <TripForm destinations={destinations} error={params.error} />
          ) : (
            <div className={styles.notice}>Create at least one destination before adding a trip.</div>
          )}
        </section>
      </div>
    </main>
  );
}
