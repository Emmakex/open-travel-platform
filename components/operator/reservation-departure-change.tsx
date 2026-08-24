import { changeReservationDepartureAction } from "@/app/operator/reservations/actions";
import styles from "@/app/operator/operator.module.css";
import type { Reservation } from "@/domain/booking/types";
import type { TravelLocale, Trip } from "@/domain/travel/types";
import { getBookingRepository } from "@/lib/booking-repository";
import { formatOperatorDate, formatOperatorMoney, tr } from "@/lib/operator-i18n";
import { operationsConfig } from "@/lib/operations-config";
import { priceTravellerComposition } from "@/lib/traveller-pricing";

function dateLabel(value: string, locale: TravelLocale) {
  return formatOperatorDate(`${value}T00:00:00Z`, locale);
}

export async function ReservationDepartureChange({
  reservation,
  trip,
  locale
}: {
  reservation: Reservation;
  trip: Trip | null;
  locale: TravelLocale;
}) {
  const canAmend =
    operationsConfig.mode === "mongodb" &&
    operationsConfig.writesEnabled &&
    reservation.status !== "cancelled";

  const availability = canAmend
    ? await getBookingRepository().listAvailability(reservation.tripId).catch(() => [])
    : [];

  const drafts = reservation.travellers?.map((traveller) => ({
    id: traveller.id,
    firstName: traveller.firstName,
    lastName: traveller.lastName,
    dateOfBirth: traveller.dateOfBirth,
    nationality: traveller.nationality,
    guardianTravellerId: traveller.guardianTravellerId,
    guardianRelationship: traveller.guardianRelationship
  }));

  const candidates = availability
    .filter((item) => item.id !== reservation.availabilityId)
    .map((item) => {
      if (!trip || !drafts?.length) {
        const requiredSpaces = reservation.inventorySpaces ?? reservation.partySize;
        return requiredSpaces <= item.remainingSpaces
          ? { item, totalPrice: reservation.totalPrice, inventorySpaces: requiredSpaces }
          : null;
      }

      try {
        const pricing = priceTravellerComposition({ trip, availability: item, drafts });
        if (pricing.inventorySpaces > item.remainingSpaces) return null;
        return {
          item,
          totalPrice: pricing.totalPrice,
          inventorySpaces: pricing.inventorySpaces
        };
      } catch {
        return null;
      }
    })
    .filter((candidate): candidate is NonNullable<typeof candidate> => Boolean(candidate));

  return (
    <section className={styles.panel} style={{ marginTop: "1rem" }} id="departure-change">
      <div className="eyebrow">{tr(locale, "Trip dates", "Fechas del viaje")}</div>
      <h2>{tr(locale, "Change departure", "Cambiar salida")}</h2>
      <p className={styles.lead}>
        {tr(
          locale,
          "Move the reservation to another available departure. Traveller ages, fares and the reservation total are recalculated for the new date before the change is saved.",
          "Mueve la reserva a otra salida disponible. Las edades, tarifas y el total de la reserva se recalculan para la nueva fecha antes de guardar el cambio."
        )}
      </p>

      <div className={styles.notice}>
        <strong>{tr(locale, "Current departure", "Salida actual")}</strong><br />
        {reservation.departureDate ? dateLabel(reservation.departureDate, locale) : "—"}
        {reservation.returnDate ? ` → ${dateLabel(reservation.returnDate, locale)}` : ""}<br />
        {tr(locale, "Current total", "Total actual")}: {formatOperatorMoney(reservation.totalPrice, reservation.currency, locale, 2)}
      </div>

      {!canAmend ? (
        <p className={styles.muted}>
          {tr(locale, "This reservation cannot be moved to another departure.", "Esta reserva no se puede mover a otra salida.")}
        </p>
      ) : !candidates.length ? (
        <div className={styles.notice}>
          {tr(
            locale,
            "There are no alternative departures with enough availability for this reservation right now.",
            "Ahora mismo no hay otras salidas con disponibilidad suficiente para esta reserva."
          )}
        </div>
      ) : (
        <form action={changeReservationDepartureAction} className={styles.editorForm}>
          <input type="hidden" name="reservationId" value={reservation.id} />

          <label className={styles.field}>
            <span>{tr(locale, "New departure", "Nueva salida")}</span>
            <select name="newAvailabilityId" required defaultValue="">
              <option value="" disabled>{tr(locale, "Choose a departure", "Selecciona una salida")}</option>
              {candidates.map(({ item, totalPrice, inventorySpaces }) => {
                const delta = totalPrice - reservation.totalPrice;
                const deltaLabel = Math.abs(delta) < 0.005
                  ? tr(locale, "same total", "mismo total")
                  : `${delta > 0 ? "+" : "−"}${formatOperatorMoney(Math.abs(delta), reservation.currency, locale, 2)}`;
                return (
                  <option key={item.id} value={item.id}>
                    {dateLabel(item.departureDate, locale)} → {dateLabel(item.returnDate, locale)} · {item.remainingSpaces} {tr(locale, "available", "disponibles")} · {inventorySpaces} {tr(locale, "needed", "necesarias")} · {formatOperatorMoney(totalPrice, reservation.currency, locale, 2)} ({deltaLabel})
                  </option>
                );
              })}
            </select>
          </label>

          <label className={styles.field}>
            <span>{tr(locale, "Reason for change", "Motivo del cambio")}</span>
            <textarea
              name="reason"
              required
              maxLength={500}
              rows={3}
              placeholder={tr(
                locale,
                "Example: customer requested a later departure",
                "Ejemplo: el cliente solicitó una salida posterior"
              )}
            />
          </label>

          <div className={styles.notice}>
            {tr(
              locale,
              "The new places are secured before the previous ones are released. Existing payment records are not changed; if the total changes, review the payment summary after saving. Linked activities, transport and travel protection remain on their current dates and should be reviewed separately.",
              "Las plazas nuevas se aseguran antes de liberar las anteriores. Los pagos ya registrados no se modifican; si cambia el total, revisa el resumen de pagos después de guardar. Las actividades, el transporte y la protección de viaje vinculados mantienen sus fechas actuales y deben revisarse por separado."
            )}
          </div>

          <div className={styles.actions}>
            <button className="button button-primary" type="submit">
              {tr(locale, "Change departure", "Cambiar salida")}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
