import { appConfig } from "@/lib/config";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container footer-row">
        <div>
          <strong>{appConfig.siteName}</strong>
          <div>{appConfig.siteTagline}</div>
        </div>
        <div>A Kairoseth travel technology product · 2026</div>
      </div>
    </footer>
  );
}
