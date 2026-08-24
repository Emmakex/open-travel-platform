import Link from "next/link";
import { setLocaleAction } from "@/app/locale/actions";
import type { TravelLocale } from "@/domain/travel/types";
import { appConfig } from "@/lib/config";
import { getDictionary } from "@/lib/i18n";
import { getIdentityRepository } from "@/lib/identity-repository";
import { getPublicCopy } from "@/lib/public-copy";

function roleLabel(role: "customer" | "operator" | "admin", locale: TravelLocale) {
  if (role === "customer") return locale === "es" ? "Cliente" : "Customer";
  if (role === "admin") return "Admin";
  return locale === "es" ? "Operador" : "Operator";
}

export async function SiteHeader({ locale }: { locale: TravelLocale }) {
  const brandInitial = appConfig.siteName.trim().charAt(0).toUpperCase() || "K";
  const copy = getDictionary(locale);
  const editorial = getPublicCopy(locale);
  const identity = await getIdentityRepository().getCurrentIdentity();
  const isCustomer = identity?.role === "customer";
  const isStaff = identity?.role === "operator" || identity?.role === "admin";
  const sessionHref = isCustomer ? "/account" : isStaff ? "/operator" : null;
  const sessionLabel = identity ? roleLabel(identity.role, locale) : null;

  function renderSessionChip(extraClass = "") {
    if (!identity || !sessionHref || !sessionLabel) return null;

    return (
      <Link
        className={`session-chip session-${identity.role}${extraClass ? ` ${extraClass}` : ""}`}
        href={sessionHref}
        aria-label={`${locale === "es" ? "Sesión activa" : "Active session"}: ${identity.displayName}, ${sessionLabel}`}
      >
        <span className="session-dot" aria-hidden="true" />
        <span className="session-name">{identity.displayName}</span>
        <span className="session-role">{sessionLabel}</span>
      </Link>
    );
  }

  return (
    <header className="site-header">
      <div className="container nav">
        <Link className="brand" href="/" aria-label={`${appConfig.siteName} ${locale === "es" ? "inicio" : "home"}`}>
          <span className="brand-mark" aria-hidden="true">{brandInitial}</span>
          <span className="brand-copy">
            <strong>{appConfig.siteName}</strong>
            <small>{editorial.brandTagline}</small>
          </span>
        </Link>

        <nav className="nav-links nav-desktop" aria-label={locale === "es" ? "Navegación principal" : "Primary navigation"}>
          <Link href="/destinations">{copy.nav.destinations}</Link>
          <Link href="/trips">{copy.nav.trips}</Link>
          <Link href="/services">{locale === "es" ? "Servicios" : "Services"}</Link>
          {isCustomer ? renderSessionChip() : !identity ? <Link href="/account">{copy.nav.account}</Link> : null}
          {isStaff ? renderSessionChip() : null}
          <form action={setLocaleAction} className="locale-switcher" aria-label={copy.language.label}>
            <button type="submit" name="locale" value="en" className={locale === "en" ? "locale-option is-active" : "locale-option"} aria-pressed={locale === "en"}>
              {copy.language.en}
            </button>
            <span aria-hidden="true">/</span>
            <button type="submit" name="locale" value="es" className={locale === "es" ? "locale-option is-active" : "locale-option"} aria-pressed={locale === "es"}>
              {copy.language.es}
            </button>
          </form>
        </nav>

        <details className="mobile-nav">
          <summary aria-label={locale === "es" ? "Abrir menú de navegación" : "Open navigation menu"}>
            <span className="mobile-menu-label">{locale === "es" ? "Menú" : "Menu"}</span>
            <span className="mobile-menu-icon" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
          </summary>
          <div className="mobile-nav-panel">
            <nav className="mobile-nav-links" aria-label={locale === "es" ? "Navegación móvil" : "Mobile navigation"}>
              <Link href="/destinations">{copy.nav.destinations}</Link>
              <Link href="/trips">{copy.nav.trips}</Link>
              <Link href="/services">{locale === "es" ? "Servicios" : "Services"}</Link>
              {!identity ? <Link href="/account">{copy.nav.account}</Link> : null}
            </nav>

            {identity ? <div className="mobile-session">{renderSessionChip("mobile-session-chip")}</div> : null}

            <div className="mobile-language-row">
              <span>{copy.language.label}</span>
              <form action={setLocaleAction} className="locale-switcher mobile-locale-switcher" aria-label={copy.language.label}>
                <button type="submit" name="locale" value="en" className={locale === "en" ? "locale-option is-active" : "locale-option"} aria-pressed={locale === "en"}>
                  {copy.language.en}
                </button>
                <span aria-hidden="true">/</span>
                <button type="submit" name="locale" value="es" className={locale === "es" ? "locale-option is-active" : "locale-option"} aria-pressed={locale === "es"}>
                  {copy.language.es}
                </button>
              </form>
            </div>
          </div>
        </details>
      </div>
    </header>
  );
}
