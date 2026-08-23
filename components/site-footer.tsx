import type { TravelLocale } from "@/domain/travel/types";
import { appConfig } from "@/lib/config";
import { getPublicCopy } from "@/lib/public-copy";

export function SiteFooter({ locale }: { locale: TravelLocale }) {
  const copy = getPublicCopy(locale);

  return (
    <footer className="site-footer">
      <div className="container footer-row">
        <div>
          <strong>{appConfig.siteName}</strong>
          <div>{copy.brandTagline}</div>
        </div>
        <div>{copy.footer}</div>
      </div>
    </footer>
  );
}
