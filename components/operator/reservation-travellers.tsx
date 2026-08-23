import { correctReservationTravellerAction } from "@/app/operator/reservations/actions";
import styles from "@/app/operator/operator.module.css";
import type { Reservation } from "@/domain/booking/types";
import type { TravelLocale } from "@/domain/travel/types";
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
  const canAmend =
    operationsConfig.mode === "mongodb" &&
    operationsConfig.writesEnabled &&
    reservation.status !== "cancelled";

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

      {canAmend ? (
        <div className={styles.notice}>
          <strong>{tr(locale, "Reservation amendments · Phase 6B", "Modificaciones de reserva · Fase 6B")}</strong><br />
          {tr(
            locale,
            "Authorized staff can correct traveller names and nationality. Every correction requires a reason and is stored as an immutable before → after history entry. Date of birth, fare band and inventory are intentionally locked in this first amendment slice because changing them can affect price or capacity.",
            "El personal autorizado puede corregir nombres y nacionalidad. Cada corrección exige un motivo y se guarda como un registro histórico inmutable antes → después. La fecha de nacimiento, la tarifa y el inventario permanecen bloqueados en este primer bloque porque modificarlos puede afectar al precio o a la capacidad."
          )}
        </div>
      ) : null}

      {requirementsActive ? (
        <div className={styles.notice}>
          <strong>
            {allComplete
              ? tr(locale, "Post-purchase traveller data: COMPLETE", "Datos post-compra de viajeros: COMPLETOS")
              : tr(locale, "Post-purchase traveller data: PENDING", "Datos post-compra de viajeros: PENDIENTES")}
          </strong><br />
          {tr(
            locale,
            `${completedCount}/${reservation.travellers.length} travellers complete. The customer manages this task from My account → Reservation → Traveller information. Sensitive identity/document values remain encrypted and are not exposed in this overview.`,
            `${completedCount}/${reservation.travellers.length} viajeros completos. El cliente gestiona esta tarea desde Mi cuenta → Reserva → Datos de viajeros. Los valores sensibles de identidad/documentación permanecen cifrados y no se exponen en esta vista.`
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
              {tr(locale, "Inventory", "Inventario")}: {traveller.consumesInventory ? tr(locale, "1 space", "1 plaza") : tr(locale, "does not consume a space", "no consume plaza")}
              {guardian ? (
                <><br />{tr(locale, "Responsible adult", "Adulto responsable")}: {guardian.firstName} {guardian.lastName}</>
              ) : null}

              {canAmend ? (
                <details style={{ marginTop: "0.9rem" }}>
                  <summary style={{ cursor: "pointer", fontWeight: 700 }}>
                    {tr(locale, "Correct traveller details", "Corregir datos del viajero")}
                  </summary>
                  <form action={correctReservationTravellerAction} style={{ display: "grid", gap: "0.75rem", marginTop: "0.85rem" }}>
                    <input type="hidden" name="reservationId" value={reservation.id} />
                    <input type="hidden" name="travellerId" value={traveller.id} />
                    <label>
                      <span>{tr(locale, "First name", "Nombre")}</span>
                      <input name="firstName" defaultValue={traveller.firstName} required maxLength={100} />
                    </label>
                    <label>
                      <span>{tr(locale, "Last name", "Apellidos")}</span>
                      <input name="lastName" defaultValue={traveller.lastName} required maxLength={140} />
                    </label>
                    <label>
                      <span>{tr(locale, "Nationality", "Nacionalidad")}</span>
                      <input name="nationality" defaultValue={traveller.nationality} required maxLength={100} />
                    </label>
                    <label>
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
                    <div>
                      <button className="button button-primary" type="submit">
                        {tr(locale, "Save auditable correction", "Guardar corrección con auditoría")}
                      </button>
                    </div>
                  </form>
                </details>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
