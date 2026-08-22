import Link from "next/link";
import { endDemoSession } from "@/app/account/actions";
import styles from "@/app/account/account.module.css";
import { getBookingRepository } from "@/lib/booking-repository";
import { getIdentityRepository } from "@/lib/identity-repository";
import { requireCustomerIdentity } from "@/lib/require-customer-identity";
import { getTravelRepository } from "@/lib/travel-repository";

export const metadata = {
  title: "My account",
  description: "Customer account experience for the Kairoseth Travel demo."
};

export default async function AccountPage() {
  const identity = await requireCustomerIdentity();
  const identityRepository = getIdentityRepository();

  const [profile, trips, reservations] = await Promise.all([
    identityRepository.getCustomerProfile(identity.id),
    getTravelRepository().listTrips(),
    getBookingRepository().listReservations(identity.id)
  ]);

  return (
    <main className="section">
      <div className={`container ${styles.grid}`}>
        <section className={styles.panel}>
          <div className="eyebrow">Customer account</div>
          <h1>{identity.displayName}</h1>
          <p className={styles.lead}>
            Review your profile and keep your demo reservations together in one place.
          </p>

          <dl className={styles.profileList}>
            <div><dt>Email</dt><dd>{profile?.email ?? identity.email}</dd></div>
            <div><dt>Role</dt><dd>{identity.role}</dd></div>
            <div><dt>Country</dt><dd>{profile?.country ?? "Not set"}</dd></div>
            <div><dt>Locale</dt><dd>{profile?.preferredLocale ?? "Not set"}</dd></div>
            <div>
              <dt>Reservations</dt>
              <dd>
                {reservations.length} demo record{reservations.length === 1 ? "" : "s"} ·{" "}
                <Link className="text-link" href="/account/reservations">View all →</Link>
              </dd>
            </div>
          </dl>

          <div className={styles.actions}>
            <form action={endDemoSession}>
              <button className="button button-secondary" type="submit">End demo session</button>
            </form>
            <Link className="button button-secondary" href="/operator/sign-in">Switch to staff demo</Link>
          </div>
        </section>

        <aside className={styles.panel}>
          <div className="eyebrow">Suggested next trip</div>
          {trips[0] ? (
            <>
              <h2>{trips[0].title}</h2>
              <p>{trips[0].summary}</p>
              <Link className="text-link" href={`/trips/${trips[0].slug}`}>
                View itinerary →
              </Link>
            </>
          ) : (
            <p>No trips are currently available.</p>
          )}
        </aside>
      </div>
    </main>
  );
}
