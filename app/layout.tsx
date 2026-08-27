import type { Metadata } from "next";
import "./globals.css";
import "./visual-polish.css";
import "./rich-travel.css";
import "./media-gallery.css";
import "./session-header.css";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { appConfig } from "@/lib/config";
import { getLocale } from "@/lib/get-locale";

export const metadata: Metadata = {
  title: {
    default: appConfig.siteName,
    template: `%s · ${appConfig.siteName}`
  },
  description: appConfig.siteTagline,
  robots: appConfig.dataMode === "demo"
    ? {
        index: false,
        follow: false
      }
    : undefined
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale();
  const skipLabel = locale === "es" ? "Saltar al contenido principal" : "Skip to main content";

  return (
    <html lang={locale}>
      <body>
        <a className="skip-link" href="#main-content">{skipLabel}</a>
        <SiteHeader locale={locale} />
        <div id="main-content" tabIndex={-1}>
          {children}
        </div>
        <SiteFooter locale={locale} />
      </body>
    </html>
  );
}
