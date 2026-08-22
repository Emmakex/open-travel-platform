import type { TravelLocale } from "@/domain/travel/types";
import { appConfig } from "@/lib/config";
import { getDictionary } from "@/lib/i18n";

export function SiteFooter({ locale }: { locale: TravelLocale }) {
  const copy = getDictionary(locale);

  return (
    <footer className="site-footer">
      <div className="container footer-row">
        <div>
          <strong>{appConfig.siteName}</strong>
          <div>{copy.nav.brandTagline}</div>
        </div>
        <div>{copy.footer.product}</div>
      </div>
    </footer>
  );
}
