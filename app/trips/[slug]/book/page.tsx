import Link from "next/link";
import { notFound } from "next/navigation";
import { createReservationAction } from "@/app/reservations/actions";
import styles from "@/app/trips/[slug]/book/booking.module.css";
import { hasCustomerAccess, hasOperationsAccess } from "@/lib/access-control";
import { bookingConfig } from "@/lib/booking-config";
import { getBookingRepository } from "@/lib/booking-repository";
import { getIdentityRepository } from "@/lib/identity-repository";
import { getTravelRepository } from "@/lib/travel-repository";

const dateFormatter = new Intl.DateTimeFormat("en", {
  year: "numeric",
  month: "short",
  day: "numeric"
});

const errorMessages: Record<string, string> = {
  "booking-disabled": "Demo reservations are currently disabled.",
  "invalid-party-size": "Choose a party size between 1 and 8 travellers.",
  "invalid-availability": "The selected departure is no longer available.",
  "insufficient-space": "The selected departure does not have enough remaining spaces."
};

function formatDate(value: string) {
  return dateFormatter.format(new Date(`${value}T00:00:00Z`));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const trip = await getTravelRepository().getTripBySlug(slug);

  return {
    title: trip ? `Book ${trip.title}` : "Book trip",
    description: trip ? `Choose a departure for ${trip.title}.` : "Choose a trip departure."
  };
}

export default async function BookTripPage({
  params,
  searchParams
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { slug } = await params;
  const { error } = await searchParams;
  const travelRepository = getTravelRepository();
  const trip = await travelRepository.getTripBySlug(slug);

  if (!trip) notFound();

  const [availability, identity] = await Promise.all([
    getBookingRepository().listAvailability(trip.id),
    getIdentityRepository().getCurrentIdentity()
  ]);
  const customer = hasCustomerAccess(identity);
  const staff = hasOperationsAccess(identity);

  return (
    <main className="section">
      <div className={`container ${styles.grid}`}>
        <section className={styles.panel}>
          <div className="eyebrow">Choose your departure</div>
          <h1>{trip.title}</h1>
          <p className={styles.lead}>
            Select a departure and the number of travellers. This public environment uses fictional
            availability and reservations so the complete booking journey can be explored safely.
          </p>

          {error && errorMessages[error] ? (
            <div className={styles.error}>{errorMessages[error]}</div>
          ) : null}

          {!identity ? (
            <div className={styles.notice}>
              <strong>Customer session required.</strong> Start the demo customer account before
              creating a reservation. <Link className="text-link" href="/account/sign-in">Continue →</Link>
            </div>
          ) : null}

          {staff ? (
            <div className={styles.notice}>
              A staff session is active. Reservations can only be created from the customer demo.{" "}
              <Link className="text-link" href="/operator">Open operations →</Link>
            </div>
          ) : null}

          {customer && bookingConfig.demoWritesEnabled && availability.length > 0 ? (
            <form action={createReservationAction} className={styles.form}>
              <input type="hidden" name="tripSlug" value={trip.slug} />

              <label className={styles.field}>
                <span>Departure</span>
                <select name="availabilityId" required defaultValue={availability[0].id}>
                  {availability.map((item) => (
                    <option key={item.id} value={item.id}>
                      {formatDate(item.departureDate)} → {formatDate(item.returnDate)} · {item.remainingSpaces} spaces
                    </option>
                  ))}
                </select>
              </label>

              <label className={styles.field}>
                <span>Travellers</span>
                <input name="partySize" type="number" min="1" max="8" step="1" defaultValue="2" required />
              </label>

              <button className="button button-primary" type="submit">Create demo reservation</button>
            </form>
          ) : null}

          {customer && !bookingConfig.demoWritesEnabled ? (
            <div className={styles.notice}>
              Demo reservation creation is disabled in this environment.
            </div>
          ) : null}

          {availability.length === 0 ? (
            <div className={styles.notice}>No departures are currently available for this trip.</div>
          ) : null}

          <p><Link className="text-link" href={`/trips/${trip.slug}`}>← Back to trip</Link></p>
        </section>

        <aside className={styles.panel}>
          <div className="eyebrow">Availability</div>
          <h2>Upcoming departures</h2>
          <p className={styles.muted}>These dates and spaces are fictional demo inventory, not live supplier availability.</p>
          <div className={styles.availabilityList}>
            {availability.map((item) => (
              <div className={styles.availabilityItem} key={item.id}>
                <div>
                  <strong>{formatDate(item.departureDate)}</strong><br />
                  <span>to {formatDate(item.returnDate)}</span>
                </div>
                <strong>{item.remainingSpaces} left</strong>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </main>
  );
}
