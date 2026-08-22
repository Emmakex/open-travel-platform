import type { NextConfig } from "next";

const remoteMediaHosts = (process.env.TRAVEL_MEDIA_HOSTS ?? "")
  .split(",")
  .map((host) => host.trim())
  .filter((host) => /^[a-z0-9.-]+$/i.test(host));

const nextConfig: NextConfig = {
  poweredByHeader: false,
  output: "standalone",
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24,
    remotePatterns: remoteMediaHosts.map((hostname) => ({
      protocol: "https",
      hostname
    }))
  }
};

export default nextConfig;
