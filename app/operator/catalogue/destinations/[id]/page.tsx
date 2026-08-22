import { notFound } from "next/navigation";
import { DestinationForm } from "@/components/operator/catalogue-forms";
import styles from "@/app/operator/operator.module.css";
import { getMongoDestinationForAdmin } from "@/lib/mongo-travel-admin";
import { listMediaLibraryChoices } from "@/lib/media-library";
import { requireOperationsIdentity } from "@/lib/require-operations-identity";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
};

export const metadata = { title: "Edit destination" };

export default async function EditDestinationPage({ params, searchParams }: PageProps) {
  await requireOperationsIdentity();
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const [destination, mediaLibrary] = await Promise.all([
    getMongoDestinationForAdmin(id),
    listMediaLibraryChoices(100)
  ]);

  if (!destination) notFound();

  return (
    <main className="section">
      <div className={`container ${styles.shell}`}>
        <section className={styles.panel}>
          <div className="eyebrow">Catalogue · Destinations</div>
          <h1>Edit {destination.name}</h1>
          <p className={styles.lead}>Update catalogue content, media and translations stored in MongoDB.</p>
          <DestinationForm destination={destination} error={query.error} mediaLibrary={mediaLibrary} />
        </section>
      </div>
    </main>
  );
}
