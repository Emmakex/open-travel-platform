import Link from "next/link";
import { DestinationForm } from "@/components/operator/catalogue-forms";
import styles from "@/app/operator/operator.module.css";
import { listMediaLibraryChoices } from "@/lib/media-library";
import { requireOperationsIdentity } from "@/lib/require-operations-identity";

export const metadata = { title: "New destination" };

export default async function NewDestinationPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireOperationsIdentity();
  const [params, mediaLibrary] = await Promise.all([
    searchParams,
    listMediaLibraryChoices(100)
  ]);

  return (
    <main className="section">
      <div className={`container ${styles.shell}`}>
        <section className={styles.panel}>
          <div className="eyebrow">Catalogue · Destinations</div>
          <h1>New destination</h1>
          <p className={styles.lead}>Create the destination in MongoDB and select reusable images from the media library.</p>
          <DestinationForm error={params.error} mediaLibrary={mediaLibrary} />
          <Link className="text-link" href="/operator/catalogue">← Catalogue manager</Link>
        </section>
      </div>
    </main>
  );
}
