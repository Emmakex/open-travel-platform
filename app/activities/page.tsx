import type { Metadata } from "next";
import { ServiceCatalogue } from "@/components/service-catalogue";
import { getLocale } from "@/lib/get-locale";

export const metadata: Metadata = {
  title: "Activities | Kairoseth Travel",
  description: "Discover travel activities that can be booked independently or alongside a trip."
};

export default async function ActivitiesPage() {
  const locale = await getLocale();
  return <ServiceCatalogue type="activity" locale={locale} />;
}
