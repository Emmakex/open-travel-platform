import Link from "next/link";
import { appConfig } from "@/lib/config";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="container nav">
        <Link className="brand" href="/" aria-label={`${appConfig.siteName} home`}>
          <span className="brand-mark" aria-hidden="true">O</span>
          <span>{appConfig.siteName}</span>
        </Link>
        <nav className="nav-links" aria-label="Primary navigation">
          <Link href="/destinations">Destinations</Link>
          <Link href="/trips">Trips</Link>
          <Link href="/account">Account</Link>
          <Link href="/operator/sign-in">Operator</Link>
          <a href="https://github.com/Emmakex/open-travel-platform" target="_blank" rel="noreferrer">GitHub</a>
        </nav>
      </div>
    </header>
  );
}
