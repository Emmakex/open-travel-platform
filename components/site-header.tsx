import Link from "next/link";
import { setLocaleAction } from "@/app/locale/actions";
import type { TravelLocale } from "@/domain/travel/types";
import { appConfig } from "@/lib/config";
import { getDictionary } from "@/lib/i18n";
import { getIdentityRepository } from "@/lib/identity-repository";

function roleLabel(role: "customer" | "operator" | "admin", locale: TravelLocale) {
  if (role === "customer") return locale === "es" ? "Cliente" : "Customer";
  if (role === "admin") return locale === "es" ? "Admin" : "Admin";
  return locale === "es" ? "Operador" : "Operator";
}

export async function SiteHeader({ locale }: { locale: TravelLocale }) {
  const brandInitial = appConfig.siteName.trim().charAt(0).toUpperCase() || "K";
  const copy = getDictionary(locale);
  const identity = await getIdentityRepository().getCurrentIdentity();
  const isCustomer = identity?.role === "customer";
  const isStaff = identity?.role === "operator" || identity?.role === "admin";
  const sessionHref = isCustomer ? "/account" : isStaff ? "/operator" : null;
  const sessionLabel = identity ? roleLabel(identity.role, locale) : null;

  const sessionChip = identity && sessionHref && sessionLabel ? (
    <Link
      className={`session-chip session-${identity.role}`}
      href={sessionHref}
      aria-label={`${locale === "es" ? "Sesión activa" : "Active session"}: ${identity.displayName}, ${sessionLabel}`}
    >
      <span className="session-dot" aria-hidden="true" />
      <span className="session-name">{identity.displayName}</span>
      <span className="session-role">{sessionLabel}</span>
    </Link>
  ) : null;

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
          <Link href="/services">{locale === "es" ? "Servicios" : "Services"}</Link>
          {isCustomer ? sessionChip : !identity ? <Link href="/account">{copy.nav.account}</Link> : null}
          {isStaff ? sessionChip : <Link className="nav-operator" href="/operator/sign-in">{copy.nav.operator}</Link>}
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
        {identity && sessionHref && sessionLabel ? (
          <Link className={`session-chip session-mobile session-${identity.role}`} href={sessionHref}>
            <span className="session-dot" aria-hidden="true" />
            <span className="session-name">{identity.displayName}</span>
            <span className="session-role">{sessionLabel}</span>
          </Link>
        ) : null}
      </div>
    </header>
  );
}
