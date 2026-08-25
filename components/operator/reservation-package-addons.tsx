import styles from "@/app/operator/operator.module.css";
import type { Reservation } from "@/domain/booking/types";
import type { TravelLocale } from "@/domain/travel/types";
import { formatOperatorMoney, tr } from "@/lib/operator-i18n";

function travellerNames(reservation: Reservation, ids: string[] | undefined) {
  if (!ids?.length) return "";
  return ids.map((id) => {
    const traveller = reservation.travellers?.find((item) => item.id === id);
    return traveller ? `${traveller.firstName} ${traveller.lastName}` : id;
  }).join(", ");
}

export function ReservationPackageAddOns({ reservation, locale }: {
  reservation: Reservation;
  locale: TravelLocale;
}) {
  if (!reservation.packageAddOns?.length) return null;
  const total = reservation.packageAddOnTotal ?? reservation.packageAddOns.reduce((sum, item) => sum + item.totalPrice, 0);

  return (
    <section className={styles.panel}>
      <div className="eyebrow">{tr(locale, "Package supplements", "Suplementos del paquete")}</div>
      <h2>{tr(locale, "Booked optional extras", "Extras opcionales contratados")}</h2>
      <p className={styles.lead}>{tr(
        locale,
        "This section shows the supplement snapshot stored on the reservation. Later catalogue price changes do not alter these contracted values.",
        "Esta sección muestra el snapshot de suplementos guardado en la reserva. Los cambios posteriores de precios en catálogo no modifican estos valores contratados."
      )}</p>

      <div className={styles.definitionList}>
        {reservation.packageAddOns.map((addOn) => {
          const title = locale === "es" ? addOn.titleEs : addOn.title;
          const description = locale === "es" ? addOn.descriptionEs : addOn.description;
          const names = travellerNames(reservation, addOn.travellerIds);
          return (
            <div key={addOn.addOnId}>
              <dt>{title}</dt>
              <dd>
                {description ? <>{description}<br /></> : null}
                {addOn.pricingMode === "per-traveller"
                  ? <>{tr(locale, "Travellers", "Viajeros")}: {names || addOn.quantity}<br /></>
                  : <>{tr(locale, "Once per reservation", "Una vez por reserva")}<br /></>}
                {tr(locale, "Unit price", "Precio unitario")}: {formatOperatorMoney(addOn.unitPrice, reservation.currency, locale, 2)} · {tr(locale, "Quantity", "Cantidad")}: {addOn.quantity}<br />
                <strong>{tr(locale, "Total", "Total")}: {formatOperatorMoney(addOn.totalPrice, reservation.currency, locale, 2)}</strong>
              </dd>
            </div>
          );
        })}
        <div>
          <dt>{tr(locale, "Supplements total", "Total suplementos")}</dt>
          <dd><strong>{formatOperatorMoney(total, reservation.currency, locale, 2)}</strong></dd>
        </div>
      </div>
    </section>
  );
}
