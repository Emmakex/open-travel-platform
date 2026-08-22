import Link from "next/link";
import { setLocaleAction } from "@/app/locale/actions";
import type { TravelLocale } from "@/domain/travel/types";
import { appConfig } from "@/lib/config";
import { getDictionary } from "@/lib/i18n";

export function SiteHeader({ locale }: { locale: TravelLocale }) {
  const brandInitial = appConfig.siteName.trim().charAt(0).toUpperCase() || "K";
  const copy = getDictionary(locale);

  return (
    <header className="site-header">
      <div className="container nav">
        <Link className="brand" href="/" aria-label={`${appConfig.siteName} home`}>
          <span className="brand-mark" aria-hidden="true">{brandInitial}</span>
          <span className="brand-copy">
            <strong>{appConfig.siteName}</strong>
            <small>{copy.nav.brandTagline}</small>
          </span>
        </Link>
        <nav className="nav-links" aria-label="Primary navigation">
          <Link href="/destinations">{copy.nav.destinations}</Link>
          <Link href="/trips">{copy.nav.trips}</Link>
          <Link href="/account">{copy.nav.account}</Link>
          <Link className="nav-operator" href="/operator/sign-in">{copy.nav.operator}</Link>
          <form action={setLocaleAction} className="locale-switcher" aria-label={copy.language.label}>
            <button
              type="submit"
              name="locale"
              value="en"
              className={locale === "en" ? "locale-option is-active" : "locale-option"}
              aria-pressed={locale === "en"}
            >
              {copy.language.en}
            </button>
            <span aria-hidden="true">/</span>
            <button
              type="submit"
              name="locale"
              value="es"
              className={locale === "es" ? "locale-option is-active" : "locale-option"}
              aria-pressed={locale === "es"}
            >
              {copy.language.es}
            </button>
          </form>
        </nav>
      </div>
    </header>
  );
}
