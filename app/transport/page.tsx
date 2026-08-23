import type { Metadata } from "next";
import { ServiceCatalogue } from "@/components/service-catalogue";
import { getLocale } from "@/lib/get-locale";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return locale === "es"
    ? { title: "Traslados y transporte", description: "Consulta traslados y servicios de transporte con ruta, capacidad, disponibilidad y precio claros." }
    : { title: "Transfers and transport", description: "Explore transfers and transport services with clear routes, capacity, availability and pricing." };
}

export default async function TransportPage() {
  const locale = await getLocale();
  return <ServiceCatalogue type="transport" locale={locale} />;
}
