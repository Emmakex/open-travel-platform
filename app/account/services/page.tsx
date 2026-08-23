import Link from "next/link";
import styles from "@/app/account/account.module.css";
import { getLocale } from "@/lib/get-locale";
import { formatCurrency } from "@/lib/i18n";
import { requireCustomerIdentity } from "@/lib/require-customer-identity";
import { listServiceReservationsForCustomer } from "@/lib/service-reservations";

export const metadata = { title: "My services | Kairoseth Travel" };

export default async function AccountServicesPage() {
  const locale = await getLocale();
  const identity = await requireCustomerIdentity();
  const reservations = await listServiceReservationsForCustomer(identity.id);
  const t = (en: string, es: string) => locale === "es" ? es : en;

  return (
    <main className="section"><div className={`container ${styles.shell}`}><section className={styles.panel}>
      <div className="eyebrow">{t("My account · Services", "Mi cuenta · Servicios")}</div>
      <h1>{t("Service reservations", "Reservas de servicios")}</h1>
      <p className={styles.lead}>{t("Activities, transport and insurance booked independently or linked to one of your trips.", "Actividades, transporte y seguros contratados de forma independiente o vinculados a uno de tus viajes.")}</p>
      {reservations.length ? (
        <div className={styles.profileList}>
          {reservations.map((reservation) => (
            <div key={reservation.id}>
              <dt><Link className="text-link" href={`/account/services/${reservation.id}`}>{reservation.serviceTitle}</Link></dt>
              <dd>{reservation.serviceType === "activity" ? t("Activity", "Actividad") : reservation.serviceType === "transport" ? t("Transport", "Transporte") : t("Insurance", "Seguro")} · {reservation.partySize} {t("travellers", "viajeros")} · {formatCurrency(reservation.totalPrice, reservation.currency, locale)} · {reservation.status === "pending" ? t("Pending", "Pendiente") : reservation.status === "confirmed" ? t("Confirmed", "Confirmada") : t("Cancelled", "Cancelada")}</dd>
            </div>
          ))}
        </div>
      ) : <div className={styles.notice}>{t("You have not booked any independent services yet.", "Todavía no has reservado servicios independientes.")}</div>}
      <div className={styles.actions}><Link className="button button-primary" href="/services">{t("Explore services", "Explorar servicios")}</Link><Link className="button button-secondary" href="/account">{t("Back to account", "Volver a mi cuenta")}</Link></div>
    </section></div></main>
  );
}
