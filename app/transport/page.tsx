import type { Metadata } from "next";
import { ServiceCatalogue } from "@/components/service-catalogue";
import { getLocale } from "@/lib/get-locale";

export const metadata: Metadata = {
  title: "Transport | Kairoseth Travel",
  description: "Discover transfers and transport services that can be booked independently."
};

export default async function TransportPage() {
  const locale = await getLocale();
  return <ServiceCatalogue type="transport" locale={locale} />;
}
