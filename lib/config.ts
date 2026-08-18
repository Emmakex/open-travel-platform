export type DataMode = "demo" | "api";

const rawDataMode = process.env.NEXT_PUBLIC_DATA_MODE ?? "demo";

export const appConfig = {
  siteName: process.env.NEXT_PUBLIC_SITE_NAME ?? "Open Travel Platform",
  siteTagline:
    process.env.NEXT_PUBLIC_SITE_TAGLINE ??
    "Build travel products without vendor lock-in.",
  dataMode: (rawDataMode === "api" ? "api" : "demo") as DataMode,
  travelApiUrl: process.env.NEXT_PUBLIC_TRAVEL_API_URL?.replace(/\/$/, "") ?? ""
};
