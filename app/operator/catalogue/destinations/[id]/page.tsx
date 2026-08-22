import { notFound } from "next/navigation";
import { DestinationForm } from "@/components/operator/catalogue-forms";
import styles from "@/app/operator/operator.module.css";
import { getMongoDestinationForAdmin } from "@/lib/mongo-travel-admin";
import { requireOperationsIdentity } from "@/lib/require-operations-identity";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
};

export const metadata = { title: "Edit destination" };

export default async function EditDestinationPage({ params, searchParams }: PageProps) {
  await requireOperationsIdentity();
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const destination = await getMongoDestinationForAdmin(id);

  if (!destination) notFound();

  return (
    <main className="section">
      <div className={`container ${styles.shell}`}>
        <section className={styles.panel}>
          <div className="eyebrow">Catalogue · Destinations</div>
          <h1>Edit {destination.name}</h1>
          <p className={styles.lead}>Update catalogue content while preserving its existing media, gallery and other structured fields.</p>
          <DestinationForm destination={destination} error={query.error} />
        </section>
      </div>
    </main>
  );
}
