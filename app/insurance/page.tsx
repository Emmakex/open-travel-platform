import type { Metadata } from "next";
import { ServiceCatalogue } from "@/components/service-catalogue";
import { getLocale } from "@/lib/get-locale";

export const metadata: Metadata = {
  title: "Insurance | Kairoseth Travel",
  description: "Explore travel insurance products that can be contracted independently."
};

export default async function InsurancePage() {
  const locale = await getLocale();
  return <ServiceCatalogue type="insurance" locale={locale} />;
}
