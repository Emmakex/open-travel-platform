import Link from "next/link";
import { appConfig } from "@/lib/config";
import { getIdentityRepository } from "@/lib/identity-repository";

export async function SiteHeader() {
  const identity = await getIdentityRepository().getCurrentIdentity();

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
          <Link href={identity ? "/account" : "/account/sign-in"}>
            {identity ? "My account" : "Sign in"}
          </Link>
          <a href="https://github.com/Emmakex/open-travel-platform" target="_blank" rel="noreferrer">GitHub</a>
        </nav>
      </div>
    </header>
  );
}
