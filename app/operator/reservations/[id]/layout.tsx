import Link from "next/link";
import styles from "@/app/operator/operator.module.css";
import { getLocale } from "@/lib/get-locale";
import { tr } from "@/lib/operator-i18n";
import { requireOperationsIdentity } from "@/lib/require-operations-identity";

export default async function OperatorReservationLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const locale = await getLocale();
  await requireOperationsIdentity();
  const { id } = await params;
  const encodedId = encodeURIComponent(id);

  return (
    <>
      <div className="section" style={{ paddingBottom: 0 }}>
        <div className={`container ${styles.toolbar}`} aria-label={tr(locale, "Reservation navigation", "Navegación de reserva")}>
          <Link className="button button-secondary" href={`/operator/reservations/${encodedId}`}>{tr(locale, "Reservation detail", "Detalle de reserva")}</Link>
          <Link className="button button-secondary" href={`/operator/reservations/${encodedId}/workflow`}>{tr(locale, "Internal workspace", "Gestión interna")}</Link>
          <Link className="text-link" href="/operator/reservations">{tr(locale, "Reservation queue", "Cola de reservas")}</Link>
        </div>
      </div>
      {children}
    </>
  );
}
