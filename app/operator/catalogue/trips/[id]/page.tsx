import { notFound } from "next/navigation";
import { TripForm } from "@/components/operator/catalogue-forms";
import styles from "@/app/operator/operator.module.css";
import { getMongoTripForAdmin, listMongoDestinationsForAdmin } from "@/lib/mongo-travel-admin";
import { requireOperationsIdentity } from "@/lib/require-operations-identity";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
};

export const metadata = { title: "Edit trip" };

export default async function EditTripPage({ params, searchParams }: PageProps) {
  await requireOperationsIdentity();
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const [trip, destinations] = await Promise.all([
    getMongoTripForAdmin(id),
    listMongoDestinationsForAdmin()
  ]);

  if (!trip) notFound();

  return (
    <main className="section">
      <div className={`container ${styles.shell}`}>
        <section className={styles.panel}>
          <div className="eyebrow">Catalogue · Trips</div>
          <h1>Edit {trip.title}</h1>
          <p className={styles.lead}>Update the core product fields while preserving its itinerary, gallery and existing structured content.</p>
          <TripForm trip={trip} destinations={destinations} error={query.error} />
        </section>
      </div>
    </main>
  );
}
