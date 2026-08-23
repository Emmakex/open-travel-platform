import styles from "@/app/operator/operator.module.css";
import type { Reservation } from "@/domain/booking/types";
import type { TravelLocale } from "@/domain/travel/types";
import { listTravellerCompletionForOperator } from "@/lib/traveller-data";
import { formatOperatorDate, formatOperatorMoney, tr } from "@/lib/operator-i18n";

export async function ReservationTravellers({
  reservation,
  locale
}: {
  reservation: Reservation;
  locale: TravelLocale;
}) {
  if (!reservation.travellers?.length) return null;

  const completion = reservation.travellerRequirements?.preset !== "none"
    ? await listTravellerCompletionForOperator({
        targetType: "trip",
        reservationId: reservation.id,
        profile: reservation.travellerRequirements,
        travellers: reservation.travellers
      }).catch(() => [])
    : [];
  const completionByTraveller = new Map(completion.map((item) => [item.travellerId, item]));

  return (
    <section className={styles.panel} style={{ marginTop: "1rem" }}>
      <div className="eyebrow">{tr(locale, "Travellers", "Viajeros")}</div>
      <h2>{tr(locale, "Passenger details & fare snapshots", "Datos de pasajeros y tarifas contratadas")}</h2>
      <p className={styles.lead}>
        {tr(
          locale,
          "Age is the traveller's age on departure. Minor travellers are linked to the responsible adult recorded when the reservation was created.",
          "La edad corresponde a la fecha de salida. Los menores están vinculados al adulto responsable registrado al crear la reserva."
        )}
      </p>

      {reservation.travellerRequirements?.preset !== "none" ? (
        <div className={styles.notice}>
          {tr(
            locale,
            "Advanced identity/document values remain encrypted. Operator shows completion status without exposing those values in this overview.",
            "Los valores avanzados de identidad/documentación permanecen cifrados. Operator muestra el estado de completitud sin exponer esos valores en esta vista."
          )}
        </div>
      ) : null}

      <div className={styles.auditList}>
        {reservation.travellers.map((traveller, index) => {
          const guardian = traveller.guardianTravellerId
            ? reservation.travellers?.find((item) => item.id === traveller.guardianTravellerId)
            : null;
          const fareLabel = locale === "es"
            ? (traveller.pricingLabelEs || traveller.pricingLabel)
            : traveller.pricingLabel;
          const travellerCompletion = completionByTraveller.get(traveller.id);

          return (
            <div className={styles.auditItem} key={traveller.id}>
              <strong>
                {traveller.firstName} {traveller.lastName}
                {traveller.isLead ? ` · ${tr(locale, "Lead traveller", "Viajero principal")}` : ""}
              </strong><br />
              {tr(locale, "Traveller", "Viajero")} {index + 1} · {traveller.ageAtDeparture} {tr(locale, "years", "años")} · {fareLabel}<br />
              {tr(locale, "Date of birth", "Fecha de nacimiento")}: {formatOperatorDate(`${traveller.dateOfBirth}T00:00:00Z`, locale)}<br />
              {tr(locale, "Nationality", "Nacionalidad")}: {traveller.nationality}<br />
              {tr(locale, "Fare", "Tarifa")}: {formatOperatorMoney(traveller.unitPrice, reservation.currency, locale, 2)}<br />
              {tr(locale, "Inventory", "Inventario")}: {traveller.consumesInventory ? tr(locale, "1 space", "1 plaza") : tr(locale, "does not consume a space", "no consume plaza")}
              {guardian ? (
                <><br />{tr(locale, "Responsible adult", "Adulto responsable")}: {guardian.firstName} {guardian.lastName}</>
              ) : null}
              {travellerCompletion ? (
                <><br /><strong>{tr(locale, "Post-purchase data", "Datos post-compra")}: {travellerCompletion.complete ? tr(locale, "complete", "completos") : tr(locale, "incomplete", "incompletos")}</strong></>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
