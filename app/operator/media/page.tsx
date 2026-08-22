import Link from "next/link";
import styles from "@/app/operator/operator.module.css";
import { MediaManager } from "@/components/operator/media-manager";
import { getLocale } from "@/lib/get-locale";
import { listMediaLibrary } from "@/lib/media-library";
import { tr } from "@/lib/operator-i18n";
import { requireOperationsIdentity } from "@/lib/require-operations-identity";

export const metadata = { title: "Media | Kairoseth Travel", description: "Protected Kairoseth Travel media library." };

export default async function OperatorMediaPage() {
  const locale = await getLocale();
  await requireOperationsIdentity();
  const items = await listMediaLibrary();

  return (
    <main className="section">
      <div className={`container ${styles.shell}`}>
        <section className={styles.panel}>
          <div className="eyebrow">{tr(locale, "Media", "Multimedia")}</div>
          <h1>{tr(locale, "Travel media library", "Biblioteca multimedia de viajes")}</h1>
          <p className={styles.lead}>{tr(locale, "Upload reusable catalogue images. Files remain persistent across deployments and can be selected from destination and trip editors.", "Sube imágenes reutilizables para el catálogo. Los archivos permanecen persistentes entre despliegues y pueden seleccionarse desde los editores de destinos y viajes.")}</p>
          <div className={styles.notice}>{tr(locale, "Files are stored in the ktravel database using the travel_media GridFS bucket. Images in use cannot be deleted until they are removed from their catalogue records.", "Los archivos se almacenan en la base ktravel mediante el bucket GridFS travel_media. Las imágenes en uso no pueden eliminarse hasta retirarlas de sus registros del catálogo.")}</div>
          <MediaManager initialItems={items} locale={locale} />
        </section>
        <div className={styles.actions}>
          <Link className="button button-secondary" href="/operator/catalogue">{tr(locale, "← Catalogue manager", "← Gestor del catálogo")}</Link>
          <Link className="button button-secondary" href="/operator">{tr(locale, "Operator dashboard", "Panel de operador")}</Link>
        </div>
      </div>
    </main>
  );
}
