import Link from "next/link";
import { endCustomerSession } from "@/app/account/actions";
import styles from "@/app/account/account.module.css";
import { getAccountCopy } from "@/lib/account-i18n";
import { getBookingRepository } from "@/lib/booking-repository";
import { getLocale } from "@/lib/get-locale";
import { localizeTrip } from "@/lib/i18n";
import { getIdentityRepository } from "@/lib/identity-repository";
import { requireCustomerIdentity } from "@/lib/require-customer-identity";
import { listServiceReservationsForCustomer } from "@/lib/service-reservations";
import { getTravelRepository } from "@/lib/travel-repository";
import type { TravelLocale } from "@/domain/travel/types";

export const metadata = {
  title: "My account | Kairoseth Travel",
  description: "Customer account for Kairoseth Travel reservations and journeys."
};

function formatDate(value: string, locale: TravelLocale) {
  return new Intl.DateTimeFormat(locale === "es" ? "es-ES" : "en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC"
  }).format(new Date(`${value}T12:00:00Z`));
}

export default async function AccountPage({
  searchParams
}: {
  searchParams: Promise<{ created?: string; profile?: string }>;
}) {
  const locale = await getLocale();
  const copy = getAccountCopy(locale).account;
  const identity = await requireCustomerIdentity();
  const { created, profile: profileStatus } = await searchParams;
  const identityRepository = getIdentityRepository();

  const [profile, trips, reservations, serviceReservations] = await Promise.all([
    identityRepository.getCustomerProfile(identity.id),
    getTravelRepository().listTrips(),
    getBookingRepository().listReservations(identity.id),
    listServiceReservationsForCustomer(identity.id)
  ]);

  const today = new Date().toISOString().slice(0, 10);
  const upcomingReservation = reservations
    .filter((reservation) => (
      reservation.status !== "cancelled" &&
      Boolean(reservation.departureDate) &&
      (reservation.departureDate ?? "") >= today
    ))
    .sort((left, right) => (left.departureDate ?? "").localeCompare(right.departureDate ?? ""))[0] ?? null;

  const upcomingTripRecord = upcomingReservation
    ? trips.find((trip) => trip.id === upcomingReservation.tripId) ?? null
    : null;
  const upcomingTrip = upcomingTripRecord ? localizeTrip(upcomingTripRecord, locale) : null;

  const reservedTripIds = new Set(reservations.map((reservation) => reservation.tripId));
  const recommendedTripRecord = trips.find((trip) => !reservedTripIds.has(trip.id)) ?? trips[0] ?? null;
  const recommendedTrip = recommendedTripRecord ? localizeTrip(recommendedTripRecord, locale) : null;

  const reservationLabel = locale === "es"
    ? reservations.length === 1 ? "reserva" : "reservas"
    : reservations.length === 1 ? "reservation" : "reservations";
  const serviceLabel = locale === "es"
    ? serviceReservations.length === 1 ? "servicio" : "servicios"
    : serviceReservations.length === 1 ? "service" : "services";

  return (
    <main className="section">
      <div className={`container ${styles.grid}`}>
        <section className={styles.panel}>
          <div className="eyebrow">{copy.eyebrow}</div>
          <h1>{identity.displayName}</h1>

          {created === "1" ? <div className={styles.notice}>{locale === "es" ? "Tu cuenta se ha creado correctamente." : "Your account has been created successfully."}</div> : null}
          {profileStatus === "updated" ? <div className={styles.notice}>{locale === "es" ? "Tu perfil se ha actualizado correctamente." : "Your profile has been updated successfully."}</div> : null}

          <dl className={styles.profileList}>
            <div><dt>Email</dt><dd>{profile?.email ?? identity.email}</dd></div>
            <div><dt>{copy.role}</dt><dd>{locale === "es" ? "cliente" : identity.role}</dd></div>
            <div><dt>{locale === "es" ? "Teléfono" : "Phone"}</dt><dd>{profile?.phone ?? "—"}</dd></div>
            <div><dt>{copy.country}</dt><dd>{profile?.country ?? "—"}</dd></div>
            <div><dt>{copy.language}</dt><dd>{(profile?.preferredLocale ?? locale).toUpperCase()}</dd></div>
            <div><dt>{copy.reservations}</dt><dd>{reservations.length} {reservationLabel} · <Link className="text-link" href="/account/reservations">{copy.viewAll}</Link></dd></div>
            <div><dt>{locale === "es" ? "Servicios" : "Services"}</dt><dd>{serviceReservations.length} {serviceLabel} · <Link className="text-link" href="/account/services">{copy.viewAll}</Link></dd></div>
          </dl>

          <div className={styles.actions}>
            <Link className="button button-primary" href="/account/profile">{locale === "es" ? "Editar perfil" : "Edit profile"}</Link>
            <Link className="button button-secondary" href="/account/services">{locale === "es" ? "Mis servicios" : "My services"}</Link>
            <Link className="button button-secondary" href="/account/security">{locale === "es" ? "Seguridad" : "Security"}</Link>
            <form action={endCustomerSession}><button className="button button-secondary" type="submit">{copy.endSession}</button></form>
            <Link className="button button-secondary" href="/operator/sign-in">{copy.switchStaff}</Link>
          </div>
        </section>

        <aside className={styles.panel}>
          {upcomingReservation ? (
            <>
              <div className="eyebrow">{copy.upcoming}</div>
              <h2>{upcomingTrip?.title ?? upcomingReservation.tripTitle ?? (locale === "es" ? "Próximo viaje" : "Upcoming trip")}</h2>
              {upcomingReservation.departureDate ? (
                <p>
                  <strong>{formatDate(upcomingReservation.departureDate, locale)}</strong>
                  {upcomingReservation.returnDate ? ` → ${formatDate(upcomingReservation.returnDate, locale)}` : ""}
                </p>
              ) : null}
              <p>
                {upcomingReservation.status === "confirmed"
                  ? locale === "es" ? "Tu reserva está confirmada." : "Your reservation is confirmed."
                  : locale === "es" ? "Tu reserva está pendiente de confirmación." : "Your reservation is pending confirmation."}
              </p>
              <p><Link className="text-link" href={`/account/reservations/${upcomingReservation.id}`}>{copy.viewReservation}</Link></p>
              {upcomingTripRecord ? <p><Link className="text-link" href={`/trips/${upcomingTripRecord.slug}`}>{copy.viewItinerary}</Link></p> : null}
              <p><Link className="text-link" href="/services">{copy.addServices}</Link></p>
            </>
          ) : recommendedTrip && recommendedTripRecord ? (
            <>
              <div className="eyebrow">{copy.recommended}</div>
              <h2>{recommendedTrip.title}</h2>
              <p>{recommendedTrip.summary}</p>
              <Link className="text-link" href={`/trips/${recommendedTripRecord.slug}`}>{copy.viewItinerary}</Link>
              <p><Link className="text-link" href="/services">{copy.addServices}</Link></p>
            </>
          ) : (
            <>
              <div className="eyebrow">{copy.recommended}</div>
              <p>{copy.noTrips}</p>
            </>
          )}
        </aside>
      </div>
    </main>
  );
}
