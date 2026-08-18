import { appConfig } from "@/lib/config";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container footer-row">
        <div>
          <strong>{appConfig.siteName}</strong>
          <div>{appConfig.siteTagline}</div>
        </div>
        <div>MIT licensed · Clean-room implementation · 2026</div>
      </div>
    </footer>
  );
}
