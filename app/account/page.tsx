import Link from "next/link";
import { endCustomerSession } from "@/app/account/actions";
import styles from "@/app/account/account.module.css";
import { getAccountCopy } from "@/lib/account-i18n";
import { getBookingRepository } from "@/lib/booking-repository";
import { getLocale } from "@/lib/get-locale";
import { localizeTrip } from "@/lib/i18n";
import { getIdentityRepository } from "@/lib/identity-repository";
import { requireCustomerIdentity } from "@/lib/require-customer-identity";
import { getTravelRepository } from "@/lib/travel-repository";

export const metadata = {
  title: "My account | Kairoseth Travel",
  description: "Customer account for Kairoseth Travel reservations and journeys."
};

export default async function AccountPage({
  searchParams
}: {
  searchParams: Promise<{ created?: string }>;
}) {
  const locale = await getLocale();
  const copy = getAccountCopy(locale).account;
  const identity = await requireCustomerIdentity();
  const { created } = await searchParams;
  const identityRepository = getIdentityRepository();

  const [profile, trips, reservations] = await Promise.all([
    identityRepository.getCustomerProfile(identity.id),
    getTravelRepository().listTrips(),
    getBookingRepository().listReservations(identity.id)
  ]);
  const suggestedTrip = trips[0] ? localizeTrip(trips[0], locale) : null;
  const reservationLabel = locale === "es"
    ? reservations.length === 1 ? "reserva" : "reservas"
    : reservations.length === 1 ? "reservation" : "reservations";

  return (
    <main className="section">
      <div className={`container ${styles.grid}`}>
        <section className={styles.panel}>
          <div className="eyebrow">{copy.eyebrow}</div>
          <h1>{identity.displayName}</h1>

          {created === "1" ? (
            <div className={styles.notice}>
              {locale === "es" ? "Tu cuenta se ha creado correctamente." : "Your account has been created successfully."}
            </div>
          ) : null}

          <dl className={styles.profileList}>
            <div><dt>Email</dt><dd>{profile?.email ?? identity.email}</dd></div>
            <div><dt>{copy.role}</dt><dd>{locale === "es" ? "cliente" : identity.role}</dd></div>
            <div><dt>{copy.country}</dt><dd>{profile?.country ?? "—"}</dd></div>
            <div><dt>{copy.language}</dt><dd>{locale.toUpperCase()}</dd></div>
            <div>
              <dt>{copy.reservations}</dt>
              <dd>
                {reservations.length} {reservationLabel} ·{" "}
                <Link className="text-link" href="/account/reservations">{copy.viewAll}</Link>
              </dd>
            </div>
          </dl>

          <div className={styles.actions}>
            <form action={endCustomerSession}>
              <button className="button button-secondary" type="submit">{copy.endSession}</button>
            </form>
            <Link className="button button-secondary" href="/operator/sign-in">{copy.switchStaff}</Link>
          </div>
        </section>

        <aside className={styles.panel}>
          <div className="eyebrow">{copy.suggested}</div>
          {suggestedTrip && trips[0] ? (
            <>
              <h2>{suggestedTrip.title}</h2>
              <p>{suggestedTrip.summary}</p>
              <Link className="text-link" href={`/trips/${trips[0].slug}`}>{copy.viewItinerary}</Link>
            </>
          ) : (
            <p>{copy.noTrips}</p>
          )}
        </aside>
      </div>
    </main>
  );
}
