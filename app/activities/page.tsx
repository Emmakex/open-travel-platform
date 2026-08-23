import type { Metadata } from "next";
import { ServiceCatalogue } from "@/components/service-catalogue";
import { getLocale } from "@/lib/get-locale";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return locale === "es"
    ? { title: "Actividades y experiencias", description: "Descubre excursiones, visitas guiadas y actividades para completar tu viaje." }
    : { title: "Activities and experiences", description: "Discover excursions, guided visits and activities to add to your journey." };
}

export default async function ActivitiesPage() {
  const locale = await getLocale();
  return <ServiceCatalogue type="activity" locale={locale} />;
}
