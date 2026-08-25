import styles from "@/app/account/account.module.css";
import type { Reservation } from "@/domain/booking/types";
import type { TravelLocale } from "@/domain/travel/types";

function money(value: number, currency: string, locale: TravelLocale) {
  return new Intl.NumberFormat(locale === "es" ? "es-ES" : "en-GB", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

function travellerNames(reservation: Reservation, ids: string[] | undefined) {
  if (!ids?.length) return "";
  return ids.map((id) => {
    const traveller = reservation.travellers?.find((item) => item.id === id);
    return traveller ? `${traveller.firstName} ${traveller.lastName}` : "";
  }).filter(Boolean).join(", ");
}

export function ReservationPackageAddOnsSummary({ reservation, locale }: {
  reservation: Reservation;
  locale: TravelLocale;
}) {
  if (!reservation.packageAddOns?.length) return null;
  const t = (en: string, es: string) => locale === "es" ? es : en;

  return (
    <section className={styles.panel} style={{ marginTop: "1rem" }}>
      <div className="eyebrow">{t("Optional extras", "Extras opcionales")}</div>
      <h2>{t("Extras included in your booking", "Extras incluidos en tu reserva")}</h2>
      <p className={styles.lead}>{t(
        "These are the optional supplements you selected when booking. Their prices are kept with this reservation.",
        "Estos son los suplementos opcionales que seleccionaste al reservar. Sus precios quedan guardados con esta reserva."
      )}</p>

      <div className={styles.profileList}>
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
                  ? <>{t("Selected travellers", "Viajeros seleccionados")}: {names || addOn.quantity}<br /></>
                  : <>{t("Added once to this booking", "Añadido una vez a esta reserva")}<br /></>}
                {addOn.quantity > 1 ? `${addOn.quantity} × ${money(addOn.unitPrice, reservation.currency, locale)} · ` : ""}
                <strong>{money(addOn.totalPrice, reservation.currency, locale)}</strong>
              </dd>
            </div>
          );
        })}
      </div>

      <div className={styles.notice}>
        <strong>{t("Optional extras total", "Total de extras opcionales")}: {money(reservation.packageAddOnTotal ?? reservation.packageAddOns.reduce((sum, item) => sum + item.totalPrice, 0), reservation.currency, locale)}</strong>
      </div>
    </section>
  );
}
