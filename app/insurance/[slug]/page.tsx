import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ServiceDetail } from "@/components/service-detail";
import { getLocale } from "@/lib/get-locale";
import { getPublishedTravelService } from "@/lib/travel-services";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const service = await getPublishedTravelService("insurance", slug);
  return service
    ? { title: `${service.title} | Kairoseth Travel`, description: service.summary }
    : { title: "Insurance | Kairoseth Travel" };
}

export default async function InsuranceDetailPage({ params }: PageProps) {
  const [{ slug }, locale] = await Promise.all([params, getLocale()]);
  const service = await getPublishedTravelService("insurance", slug);
  if (!service) notFound();
  return <ServiceDetail service={service} locale={locale} />;
}
