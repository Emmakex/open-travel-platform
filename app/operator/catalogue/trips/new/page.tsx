import { TripForm } from "@/components/operator/catalogue-forms";
import styles from "@/app/operator/operator.module.css";
import { listMongoDestinationsForAdmin } from "@/lib/mongo-travel-admin";
import { listMediaLibraryChoices } from "@/lib/media-library";
import { requireOperationsIdentity } from "@/lib/require-operations-identity";

export const metadata = { title: "New trip" };

export default async function NewTripPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireOperationsIdentity();
  const [destinations, mediaLibrary, params] = await Promise.all([
    listMongoDestinationsForAdmin(),
    listMediaLibraryChoices(100),
    searchParams
  ]);

  return (
    <main className="section">
      <div className={`container ${styles.shell}`}>
        <section className={styles.panel}>
          <div className="eyebrow">Catalogue · Trips</div>
          <h1>New trip</h1>
          <p className={styles.lead}>Create a MongoDB-backed travel product and select reusable media from the library.</p>
          {destinations.length ? (
            <TripForm destinations={destinations} error={params.error} mediaLibrary={mediaLibrary} />
          ) : (
            <div className={styles.notice}>Create at least one destination before adding a trip.</div>
          )}
        </section>
      </div>
    </main>
  );
}
