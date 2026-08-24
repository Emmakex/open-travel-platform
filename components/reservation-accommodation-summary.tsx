import Link from "next/link";
import styles from "@/app/account/account.module.css";
import type { AccommodationMealPlan } from "@/domain/accommodation/types";
import type { Reservation } from "@/domain/booking/types";
import type { TravelLocale } from "@/domain/travel/types";

function formatDate(value: string, locale: TravelLocale) {
  return new Intl.DateTimeFormat(locale === "es" ? "es-ES" : "en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric"
  }).format(new Date(`${value}T00:00:00Z`));
}

function money(value: number, currency: string, locale: TravelLocale) {
  return new Intl.NumberFormat(locale === "es" ? "es-ES" : "en-GB", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

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

function travellerNames(reservation: Reservation, ids: string[]) {
  return ids.map((id) => {
    const traveller = reservation.travellers?.find((item) => item.id === id);
    return traveller ? `${traveller.firstName} ${traveller.lastName}` : "";
  }).filter(Boolean).join(", ");
}

export function ReservationAccommodationSummary({ reservation, locale }: {
  reservation: Reservation;
  locale: TravelLocale;
}) {
  if (!reservation.accommodationBookings?.length) return null;
  const t = (en: string, es: string) => locale === "es" ? es : en;

  return (
    <section className={styles.panel} style={{ marginTop: "1rem" }}>
      <div className="eyebrow">{t("Accommodation", "Alojamiento")}</div>
      <h2>{t("Your confirmed stay", "Tu estancia confirmada")}</h2>
      <p className={styles.lead}>{t(
        "These are the rooms and travellers included in your reservation. The details below are saved with your booking.",
        "Estas son las habitaciones y los viajeros incluidos en tu reserva. Los datos siguientes quedan guardados con la reserva."
      )}</p>

      <div className={styles.profileList}>
        {reservation.accommodationBookings.map((booking) => (
          <div key={booking.componentId}>
            <dt>{booking.accommodationName} · {booking.roomTypeName}</dt>
            <dd>
              {booking.mode === "optional" ? <><strong>{t("Optional accommodation added", "Alojamiento opcional añadido")}</strong><br /></> : <><strong>{t("Included in the trip price", "Incluido en el precio del viaje")}</strong><br /></>}
              {formatDate(booking.checkInDate, locale)} → {formatDate(booking.checkOutDate, locale)} · {booking.nights} {booking.nights === 1 ? t("night", "noche") : t("nights", "noches")}<br />
              {booking.rooms.length} {booking.rooms.length === 1 ? t("room", "habitación") : t("rooms", "habitaciones")}
              {mealPlanLabel(booking.mealPlan, locale) ? ` · ${mealPlanLabel(booking.mealPlan, locale)}` : ""}
              {booking.mode === "optional" ? <><br />{t("Added to your reservation", "Añadido a tu reserva")}: <strong>{money(booking.amountAddedToReservation, booking.currency, locale)}</strong></> : null}
              <br />
              {booking.rooms.map((room, index) => (
                <span key={room.id}>
                  <strong>{t("Room", "Habitación")} {index + 1}:</strong> {travellerNames(reservation, room.travellerIds)}
                  {index < booking.rooms.length - 1 ? <br /> : null}
                </span>
              ))}
              {booking.accommodationSlug ? <><br /><Link className="text-link" href={`/accommodations/${booking.accommodationSlug}`}>{t("View accommodation", "Ver alojamiento")}</Link></> : null}
            </dd>
          </div>
        ))}
      </div>
    </section>
  );
}
