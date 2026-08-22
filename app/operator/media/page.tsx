import Link from "next/link";
import styles from "@/app/operator/operator.module.css";
import { MediaManager } from "@/components/operator/media-manager";
import { listMediaLibrary } from "@/lib/media-library";
import { requireOperationsIdentity } from "@/lib/require-operations-identity";

export const metadata = {
  title: "Media library",
  description: "Protected Kairoseth Travel media library."
};

export default async function OperatorMediaPage() {
  await requireOperationsIdentity();
  const items = await listMediaLibrary();

  return (
    <main className="section">
      <div className={`container ${styles.shell}`}>
        <section className={styles.panel}>
          <div className="eyebrow">Media</div>
          <h1>Travel media library</h1>
          <p className={styles.lead}>
            Upload reusable catalogue images into MongoDB GridFS. Files stay persistent across Hostinger redeploys and can be selected from destination and trip editors.
          </p>
          <div className={styles.notice}>
            Uploaded files are stored in the <code>ktravel</code> database using the <code>travel_media</code> GridFS bucket. Images already used by catalogue records cannot be deleted until they are removed from those records.
          </div>
          <MediaManager initialItems={items} />
        </section>

        <div className={styles.actions}>
          <Link className="button button-secondary" href="/operator/catalogue">← Catalogue manager</Link>
          <Link className="button button-secondary" href="/operator">Operator dashboard</Link>
        </div>
      </div>
    </main>
  );
}
