import styles from "@/app/operator/operator.module.css";
import { ReservationPackageAddOns } from "@/components/operator/reservation-package-addons";
import type { Reservation } from "@/domain/booking/types";
import type { AccommodationMealPlan } from "@/domain/accommodation/types";
import type { TravelLocale } from "@/domain/travel/types";
import { formatOperatorDate, formatOperatorMoney, tr } from "@/lib/operator-i18n";

function mealPlanLabel(plan: AccommodationMealPlan | undefined, locale: TravelLocale) {
  if (!plan) return null;
  const labels: Record<AccommodationMealPlan, [string, string]> = {
    "room-only": ["Room only", "Solo alojamiento"],
    breakfast: ["Breakfast", "Desayuno"],
    "half-board": ["Half board", "Media pensión"],
    "full-board": ["Full board", "Pensión completa"],
    "all-inclusive": ["All inclusive", "Todo incluido"]
  };
  return locale === "es" ? labels[plan][1] : labels[plan][0];
}

function names(reservation: Reservation, ids: string[]) {
  return ids.map((id) => {
    const traveller = reservation.travellers?.find((item) => item.id === id);
    return traveller ? `${traveller.firstName} ${traveller.lastName}` : id;
  }).join(", ");
}

export function ReservationAccommodation({ reservation, locale }: {
  reservation: Reservation;
  locale: TravelLocale;
}) {
  if (!reservation.accommodationBookings?.length && !reservation.packageAddOns?.length) return null;

  return (
    <>
      {reservation.accommodationBookings?.length ? (
        <section className={styles.panel}>
          <div className="eyebrow">{tr(locale, "Accommodation", "Alojamiento")}</div>
          <h2>{tr(locale, "Reserved rooms", "Habitaciones reservadas")}</h2>
          <p className={styles.lead}>{tr(
            locale,
            "This is the accommodation snapshot stored with the reservation. It remains stable even if catalogue rates or room settings change later.",
            "Este es el snapshot de alojamiento guardado con la reserva. Se mantiene estable aunque después cambien tarifas o configuraciones del catálogo."
          )}</p>

          <div className={styles.managementList}>
            {reservation.accommodationBookings.map((booking) => (
              <div className={styles.editorSection} key={booking.componentId}>
                <div className={styles.sectionHeader}>
                  <div>
                    <strong>{booking.accommodationName}</strong>
                    <div className={styles.muted}>{booking.roomTypeName}</div>
                  </div>
                  <span className={styles.badge}>{booking.mode === "optional" ? tr(locale, "Optional", "Opcional") : tr(locale, "Included", "Incluido")}</span>
                </div>

                <dl className={styles.definitionList}>
                  <div><dt>{tr(locale, "Check-in", "Entrada")}</dt><dd>{formatOperatorDate(`${booking.checkInDate}T00:00:00Z`, locale)}</dd></div>
                  <div><dt>{tr(locale, "Check-out", "Salida")}</dt><dd>{formatOperatorDate(`${booking.checkOutDate}T00:00:00Z`, locale)}</dd></div>
                  <div><dt>{tr(locale, "Nights", "Noches")}</dt><dd>{booking.nights}</dd></div>
                  <div><dt>{tr(locale, "Rooms", "Habitaciones")}</dt><dd>{booking.rooms.length}</dd></div>
                  {mealPlanLabel(booking.mealPlan, locale) ? <div><dt>{tr(locale, "Meal plan", "Régimen")}</dt><dd>{mealPlanLabel(booking.mealPlan, locale)}</dd></div> : null}
                  <div><dt>{tr(locale, "Calculated accommodation value", "Valor calculado del alojamiento")}</dt><dd>{formatOperatorMoney(booking.totalPrice, booking.currency, locale, 2)}</dd></div>
                  <div><dt>{tr(locale, "Added to reservation total", "Añadido al total de la reserva")}</dt><dd>{formatOperatorMoney(booking.amountAddedToReservation, booking.currency, locale, 2)}</dd></div>
                </dl>

                <div className={styles.auditList}>
                  {booking.rooms.map((room, index) => (
                    <div className={styles.auditItem} key={room.id}>
                      <strong>{tr(locale, "Room", "Habitación")} {index + 1}</strong><br />
                      {names(reservation, room.travellerIds)}<br />
                      {room.adults} {tr(locale, "adult(s)", "adulto(s)")}
                      {room.childAges.length ? ` · ${room.childAges.length} ${tr(locale, "child(ren)", "niño(s)")} (${room.childAges.join(", ")} ${tr(locale, "years", "años")})` : ""}<br />
                      {tr(locale, "Base", "Base")}: {formatOperatorMoney(room.basePrice, booking.currency, locale, 2)}
                      {room.seasonalAdjustment ? ` · ${tr(locale, "season", "temporada")}: ${room.seasonalAdjustment > 0 ? "+" : ""}${formatOperatorMoney(room.seasonalAdjustment, booking.currency, locale, 2)}` : ""}
                      {room.occupancyAdjustment ? ` · ${tr(locale, "occupancy", "ocupación")}: ${room.occupancyAdjustment > 0 ? "+" : ""}${formatOperatorMoney(room.occupancyAdjustment, booking.currency, locale, 2)}` : ""}
                      <br /><strong>{formatOperatorMoney(room.totalPrice, booking.currency, locale, 2)}</strong>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}
      <ReservationPackageAddOns reservation={reservation} locale={locale} />
    </>
  );
}
