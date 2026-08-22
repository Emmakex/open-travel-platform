import { notFound } from "next/navigation";
import { TripForm } from "@/components/operator/catalogue-forms";
import styles from "@/app/operator/operator.module.css";
import { getMongoTripForAdmin, listMongoDestinationsForAdmin } from "@/lib/mongo-travel-admin";
import { listMediaLibraryChoices } from "@/lib/media-library";
import { requireOperationsIdentity } from "@/lib/require-operations-identity";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
};

export const metadata = { title: "Edit trip" };

export default async function EditTripPage({ params, searchParams }: PageProps) {
  await requireOperationsIdentity();
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const [trip, destinations, mediaLibrary] = await Promise.all([
    getMongoTripForAdmin(id),
    listMongoDestinationsForAdmin(),
    listMediaLibraryChoices(100)
  ]);

  if (!trip) notFound();

  return (
    <main className="section">
      <div className={`container ${styles.shell}`}>
        <section className={styles.panel}>
          <div className="eyebrow">Catalogue · Trips</div>
          <h1>Edit {trip.title}</h1>
          <p className={styles.lead}>Manage product content, itinerary, media, publication and translations in MongoDB.</p>
          <TripForm trip={trip} destinations={destinations} error={query.error} mediaLibrary={mediaLibrary} />
        </section>
      </div>
    </main>
  );
}
