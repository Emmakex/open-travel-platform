import Link from "next/link";
import { appConfig } from "@/lib/config";

export function SiteHeader() {
  const brandInitial = appConfig.siteName.trim().charAt(0).toUpperCase() || "K";

  return (
    <header className="site-header">
      <div className="container nav">
        <Link className="brand" href="/" aria-label={`${appConfig.siteName} home`}>
          <span className="brand-mark" aria-hidden="true">{brandInitial}</span>
          <span className="brand-copy">
            <strong>{appConfig.siteName}</strong>
            <small>Travel experiences & operations</small>
          </span>
        </Link>
        <nav className="nav-links" aria-label="Primary navigation">
          <Link href="/destinations">Destinations</Link>
          <Link href="/trips">Trips</Link>
          <Link href="/account">Account</Link>
          <Link className="nav-operator" href="/operator/sign-in">Operator</Link>
        </nav>
      </div>
    </header>
  );
}
