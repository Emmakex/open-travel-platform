import Link from "next/link";
import styles from "@/app/operator/operator.module.css";
import { getLocale } from "@/lib/get-locale";
import { formatOperatorMoney, tr } from "@/lib/operator-i18n";
import { requireOperationsIdentity } from "@/lib/require-operations-identity";
import { listServiceReservationsForOperator } from "@/lib/service-reservations";

export const metadata = { title: "Service reservations | Kairoseth Travel" };

export default async function OperatorServiceReservationsPage() {
  const locale = await getLocale();
  await requireOperationsIdentity();
  const reservations = await listServiceReservationsForOperator();
  const pending = reservations.filter((item) => item.status === "pending").length;
  const confirmed = reservations.filter((item) => item.status === "confirmed").length;
  const cancelled = reservations.filter((item) => item.status === "cancelled").length;

  return (
    <main className="section"><div className={`container ${styles.shell}`}>
      <section className={styles.panel}>
        <div className="eyebrow">{tr(locale, "Operations · Independent services", "Operaciones · Servicios independientes")}</div>
        <h1>{tr(locale, "Service reservations", "Reservas de servicios")}</h1>
        <p className={styles.lead}>{tr(locale, "Manage activities, transport and insurance booked with or without a Kairoseth trip.", "Gestiona actividades, transporte y seguros reservados con o sin un viaje de Kairoseth.")}</p>
        <div className={styles.metrics}>
          <div className={styles.metric}><strong>{reservations.length}</strong><span>{tr(locale, "Total", "Total")}</span></div>
          <div className={styles.metric}><strong>{pending}</strong><span>{tr(locale, "Pending", "Pendientes")}</span></div>
          <div className={styles.metric}><strong>{confirmed}</strong><span>{tr(locale, "Confirmed", "Confirmadas")}</span></div>
          <div className={styles.metric}><strong>{cancelled}</strong><span>{tr(locale, "Cancelled", "Canceladas")}</span></div>
        </div>
        <div className={styles.actions}><Link className="button button-secondary" href="/operator">{tr(locale, "Back to dashboard", "Volver al panel")}</Link><Link className="button button-secondary" href="/operator/catalogue">{tr(locale, "Catalogue", "Catálogo")}</Link></div>
      </section>

      <section className={styles.panel} style={{ marginTop: "1rem" }}>
        {reservations.length ? <div className={styles.list}>{reservations.map((reservation) => (
          <Link className={styles.row} href={`/operator/service-reservations/${reservation.id}`} key={reservation.id}>
            <strong>{reservation.serviceTitle}</strong>
            <span>{reservation.serviceType === "activity" ? tr(locale, "Activity", "Actividad") : reservation.serviceType === "transport" ? tr(locale, "Transport", "Transporte") : tr(locale, "Insurance", "Seguro")}</span>
            <span>{reservation.partySize} {tr(locale, "travellers", "viajeros")}</span>
            <span className={styles.badge}>{reservation.status === "pending" ? tr(locale, "Pending", "Pendiente") : reservation.status === "confirmed" ? tr(locale, "Confirmed", "Confirmada") : tr(locale, "Cancelled", "Cancelada")}</span>
            <span>{formatOperatorMoney(reservation.totalPrice, reservation.currency, locale)}</span>
          </Link>
        ))}</div> : <div className={styles.notice}>{tr(locale, "No independent service reservations have been created yet.", "Todavía no se han creado reservas de servicios independientes.")}</div>}
      </section>
    </div></main>
  );
}
