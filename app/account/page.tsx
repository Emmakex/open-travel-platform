import Link from "next/link";
import { redirect } from "next/navigation";
import { endDemoSession } from "@/app/account/actions";
import { getIdentityRepository } from "@/lib/identity-repository";
import { getTravelRepository } from "@/lib/travel-repository";

export const metadata = {
  title: "My account",
  description: "Customer account demo for Open Travel Platform."
};

export default async function AccountPage() {
  const identityRepository = getIdentityRepository();
  const identity = await identityRepository.getCurrentIdentity();

  if (!identity) {
    redirect("/account/sign-in");
  }

  const [profile, trips] = await Promise.all([
    identityRepository.getCustomerProfile(identity.id),
    getTravelRepository().listTrips()
  ]);

  return (
    <main className="section">
      <div className="container account-grid">
        <section className="account-panel">
          <div className="eyebrow">Customer account</div>
          <h1>{identity.displayName}</h1>
          <p className="account-lead">
            A provider-neutral account surface backed by the current IdentityRepository adapter.
          </p>

          <dl className="profile-list">
            <div><dt>Email</dt><dd>{profile?.email ?? identity.email}</dd></div>
            <div><dt>Role</dt><dd>{identity.role}</dd></div>
            <div><dt>Country</dt><dd>{profile?.country ?? "Not set"}</dd></div>
            <div><dt>Locale</dt><dd>{profile?.preferredLocale ?? "Not set"}</dd></div>
          </dl>

          <form action={endDemoSession}>
            <button className="button button-secondary" type="submit">End demo session</button>
          </form>
        </section>

        <aside className="account-panel">
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
            <p>No trips are available from the current data adapter.</p>
          )}
        </aside>
      </div>
    </main>
  );
}
