import { correctReservationTravellerAction } from "@/app/operator/reservations/actions";
import styles from "@/app/operator/operator.module.css";
import ui from "@/components/operator/reservation-travellers.module.css";
import type { Reservation } from "@/domain/booking/types";
import type { TravelLocale } from "@/domain/travel/types";
import { evaluateTripReservationPolicy } from "@/lib/change-policy";
import { listTravellerCompletionForOperator } from "@/lib/traveller-data";
import { formatOperatorDate, formatOperatorMoney, tr } from "@/lib/operator-i18n";
import { operationsConfig } from "@/lib/operations-config";

export async function ReservationTravellers({
  reservation,
  locale
}: {
  reservation: Reservation;
  locale: TravelLocale;
}) {
  if (!reservation.travellers?.length) return null;

  const requirementsActive = Boolean(
    reservation.travellerRequirements &&
    reservation.travellerRequirements.preset !== "none"
  );
  const completion = requirementsActive
    ? await listTravellerCompletionForOperator({
        targetType: "trip",
        reservationId: reservation.id,
        profile: reservation.travellerRequirements,
        travellers: reservation.travellers
      }).catch(() => [])
    : [];
  const completionByTraveller = new Map(completion.map((item) => [item.travellerId, item]));
  const completedCount = completion.filter((item) => item.complete).length;
  const allComplete = requirementsActive && completion.length === reservation.travellers.length && completedCount === reservation.travellers.length;
  const policy = evaluateTripReservationPolicy(reservation);
  const canAmend =
    operationsConfig.mode === "mongodb" &&
    operationsConfig.writesEnabled &&
    reservation.status !== "cancelled" &&
    policy.staffModificationAllowed;

  return (
    <section className={styles.panel} style={{ marginTop: "1rem" }} id="travellers">
      <div className="eyebrow">{tr(locale, "Travellers", "Viajeros")}</div>
      <h2>{tr(locale, "Passenger details & post-purchase status", "Pasajeros y estado de datos post-compra")}</h2>
      <p className={styles.lead}>
        {tr(
          locale,
          "Age is the traveller's age on departure. Minor travellers are linked to the responsible adult recorded when the reservation was created.",
          "La edad corresponde a la fecha de salida. Los menores están vinculados al adulto responsable registrado al crear la reserva."
        )}
      </p>

      {requirementsActive ? (
        <div className={styles.notice}>
          <strong>
            {allComplete
              ? tr(locale, "Post-purchase traveller data: COMPLETE", "Datos post-compra de viajeros: COMPLETOS")
              : tr(locale, "Post-purchase traveller data: PENDING", "Datos post-compra de viajeros: PENDIENTES")}
          </strong><br />
          {tr(
            locale,
            `${completedCount}/${reservation.travellers.length} travellers complete. The customer manages this task from My account → Reservation → Traveller information.`,
            `${completedCount}/${reservation.travellers.length} viajeros completos. El cliente gestiona esta tarea desde Mi cuenta → Reserva → Datos de viajeros.`
          )}
        </div>
      ) : (
        <div className={styles.notice}>
          <strong>{tr(locale, "Post-purchase traveller data: NOT REQUIRED", "Datos post-compra de viajeros: NO REQUERIDOS")}</strong><br />
          {tr(
            locale,
            "This reservation was created without additional traveller-data requirements.",
            "Esta reserva se creó sin requisitos adicionales de datos de viajeros."
          )}
        </div>
      )}

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
              {requirementsActive ? (
                <><strong>
                  {tr(locale, "Traveller-data status", "Estado de datos")}: {travellerCompletion?.complete
                    ? tr(locale, "Complete", "Completo")
                    : tr(locale, "Pending", "Pendiente")}
                </strong><br /></>
              ) : null}
              {tr(locale, "Traveller", "Viajero")} {index + 1} · {traveller.ageAtDeparture} {tr(locale, "years", "años")} · {fareLabel}<br />
              {tr(locale, "Date of birth", "Fecha de nacimiento")}: {formatOperatorDate(`${traveller.dateOfBirth}T00:00:00Z`, locale)}<br />
              {tr(locale, "Nationality", "Nacionalidad")}: {traveller.nationality}<br />
              {tr(locale, "Fare", "Tarifa")}: {formatOperatorMoney(traveller.unitPrice, reservation.currency, locale, 2)}<br />
              {tr(locale, "Reserved space", "Plaza reservada")}: {traveller.consumesInventory ? tr(locale, "1 space", "1 plaza") : tr(locale, "not required", "no requerida")}
              {guardian ? (
                <><br />{tr(locale, "Responsible adult", "Adulto responsable")}: {guardian.firstName} {guardian.lastName}</>
              ) : null}

              {canAmend ? (
                <details className={ui.amendmentDetails}>
                  <summary className={ui.amendmentSummary}>
                    {tr(locale, "Correct traveller details", "Corregir datos del viajero")}
                  </summary>
                  <div className={ui.amendmentBody}>
                    <p className={ui.helperText}>
                      {tr(
                        locale,
                        "Update only the details that need correction. The reason is mandatory and the change will remain in the reservation history.",
                        "Modifica únicamente los datos que deban corregirse. El motivo es obligatorio y el cambio quedará registrado en el historial de la reserva."
                      )}
                    </p>
                    <form action={correctReservationTravellerAction} className={ui.amendmentForm}>
                      <input type="hidden" name="reservationId" value={reservation.id} />
                      <input type="hidden" name="travellerId" value={traveller.id} />

                      <div className={styles.formGrid}>
                        <label className={styles.field}>
                          <span>{tr(locale, "First name", "Nombre")}</span>
                          <input name="firstName" defaultValue={traveller.firstName} required maxLength={100} />
                        </label>
                        <label className={styles.field}>
                          <span>{tr(locale, "Last name", "Apellidos")}</span>
                          <input name="lastName" defaultValue={traveller.lastName} required maxLength={140} />
                        </label>
                      </div>

                      <label className={styles.field}>
                        <span>{tr(locale, "Nationality", "Nacionalidad")}</span>
                        <input name="nationality" defaultValue={traveller.nationality} required maxLength={100} />
                      </label>

                      <label className={styles.field}>
                        <span>{tr(locale, "Reason for correction", "Motivo de la corrección")}</span>
                        <textarea
                          name="reason"
                          required
                          maxLength={500}
                          rows={3}
                          placeholder={tr(
                            locale,
                            "Example: spelling correction requested by customer",
                            "Ejemplo: corrección ortográfica solicitada por el cliente"
                          )}
                        />
                      </label>

                      <div className={ui.formActions}>
                        <button className="button button-primary" type="submit">
                          {tr(locale, "Save correction", "Guardar corrección")}
                        </button>
                      </div>
                    </form>
                  </div>
                </details>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
