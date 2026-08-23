import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ServiceDetail } from "@/components/service-detail";
import { getLocale } from "@/lib/get-locale";
import { getPublishedTravelService, localizeTravelService } from "@/lib/travel-services";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const [{ slug }, locale] = await Promise.all([params, getLocale()]);
  const service = await getPublishedTravelService("transport", slug);
  if (!service) return { title: locale === "es" ? "Transporte" : "Transport" };
  const item = localizeTravelService(service, locale);
  return { title: item.title, description: item.summary };
}

export default async function TransportDetailPage({ params }: PageProps) {
  const [{ slug }, locale] = await Promise.all([params, getLocale()]);
  const service = await getPublishedTravelService("transport", slug);
  if (!service) notFound();
  return <ServiceDetail service={service} locale={locale} />;
}
