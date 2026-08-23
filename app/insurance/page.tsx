import type { Metadata } from "next";
import { ServiceCatalogue } from "@/components/service-catalogue";
import { getLocale } from "@/lib/get-locale";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return locale === "es"
    ? { title: "Protección de viaje", description: "Consulta productos de protección de viaje con proveedor, condiciones y requisitos visibles antes de contratar." }
    : { title: "Travel protection", description: "Explore travel-protection products with provider details, conditions and requirements shown before purchase." };
}

export default async function InsurancePage() {
  const locale = await getLocale();
  return <ServiceCatalogue type="insurance" locale={locale} />;
}
