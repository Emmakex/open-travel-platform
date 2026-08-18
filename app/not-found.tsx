import Link from "next/link";

export default function NotFound() {
  return (
    <main className="section">
      <div className="container">
        <div className="empty-state not-found-state">
          <div className="eyebrow">404</div>
          <h1>That travel page is not in the catalogue.</h1>
          <p>The destination or trip may have been removed, renamed or never existed.</p>
          <div className="actions not-found-actions">
            <Link className="button button-primary" href="/trips">Browse trips</Link>
            <Link className="button button-secondary" href="/destinations">Browse destinations</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
