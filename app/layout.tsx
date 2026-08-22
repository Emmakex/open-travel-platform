import type { Metadata } from "next";
import "./globals.css";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { appConfig } from "@/lib/config";

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

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
