import type { TravelService } from "@/domain/services/types";
import type { Destination, Trip } from "@/domain/travel/types";

export type CatalogueContentIssue = {
  code: string;
  field: string;
};

function normalized(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function hasUsefulSummary(value?: string) {
  return Boolean(value && value.trim().length >= 70);
}

function hasMediaAlt(src?: { alt?: string }) {
  return Boolean(src?.alt?.trim());
}

function duplicateAcrossSections(summary: string, groups: Array<string[] | undefined>) {
  const seen = new Set<string>();
  const summaryKey = normalized(summary);
  for (const group of groups) {
    for (const value of group ?? []) {
      const key = normalized(value);
      if (!key) continue;
      if (key === summaryKey || seen.has(key)) return true;
      seen.add(key);
    }
  }
  return false;
}

function validHttpsUrl(value?: string) {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:";
  } catch {
    return false;
  }
}

export function destinationPublishingIssues(destination: Destination): CatalogueContentIssue[] {
  const issues: CatalogueContentIssue[] = [];
  const es = destination.translations?.es;

  if (!hasUsefulSummary(destination.summary)) issues.push({ code: "summary-too-short", field: "summary" });
  if (!destination.coverImage?.src) issues.push({ code: "cover-required", field: "coverImage" });
  else if (!hasMediaAlt(destination.coverImage)) issues.push({ code: "cover-alt-required", field: "coverImage.alt" });

  if (!es?.name?.trim()) issues.push({ code: "spanish-required", field: "nameEs" });
  if (!es?.country?.trim()) issues.push({ code: "spanish-required", field: "countryEs" });
  if (!es?.region?.trim()) issues.push({ code: "spanish-required", field: "regionEs" });
  if (!hasUsefulSummary(es?.summary)) issues.push({ code: "spanish-summary-too-short", field: "summaryEs" });

  return issues;
}

export function tripPublishingIssues(trip: Trip): CatalogueContentIssue[] {
  const issues: CatalogueContentIssue[] = [];
  const es = trip.translations?.es;

  if (!hasUsefulSummary(trip.summary)) issues.push({ code: "summary-too-short", field: "summary" });
  if (trip.highlights.length < 2) issues.push({ code: "highlights-required", field: "highlights" });
  if (!(trip.included?.length)) issues.push({ code: "included-required", field: "included" });
  if (!(trip.notIncluded?.length)) issues.push({ code: "not-included-required", field: "notIncluded" });
  if (!(trip.itinerary?.length)) issues.push({ code: "itinerary-required", field: "itinerary" });
  if (!trip.coverImage?.src) issues.push({ code: "cover-required", field: "coverImage" });
  else if (!hasMediaAlt(trip.coverImage)) issues.push({ code: "cover-alt-required", field: "coverImage.alt" });

  if (!es?.title?.trim()) issues.push({ code: "spanish-required", field: "titleEs" });
  if (!hasUsefulSummary(es?.summary)) issues.push({ code: "spanish-summary-too-short", field: "summaryEs" });
  if ((es?.highlights?.length ?? 0) < 2) issues.push({ code: "spanish-highlights-required", field: "highlightsEs" });
  if (!(es?.included?.length)) issues.push({ code: "spanish-included-required", field: "includedEs" });
  if (!(es?.notIncluded?.length)) issues.push({ code: "spanish-not-included-required", field: "notIncludedEs" });
  if (trip.itinerary?.length && !(es?.itinerary?.length)) issues.push({ code: "spanish-itinerary-required", field: "itineraryEs" });

  if (duplicateAcrossSections(trip.summary, [trip.highlights, trip.included, trip.notIncluded])) {
    issues.push({ code: "duplicate-commercial-copy", field: "commercialContent" });
  }

  return issues;
}

export function servicePublishingIssues(service: TravelService): CatalogueContentIssue[] {
  const issues: CatalogueContentIssue[] = [];
  const es = service.translations?.es;

  if (!hasUsefulSummary(service.summary)) issues.push({ code: "summary-too-short", field: "summary" });
  if (service.highlights.length < 2) issues.push({ code: "highlights-required", field: "highlights" });
  if (!(service.included?.length)) issues.push({ code: "included-required", field: "included" });
  if (!(service.notIncluded?.length)) issues.push({ code: "not-included-required", field: "notIncluded" });
  if (!service.coverImage?.src) issues.push({ code: "cover-required", field: "coverImage" });
  else if (!hasMediaAlt(service.coverImage)) issues.push({ code: "cover-alt-required", field: "coverImage.alt" });

  if (!es?.title?.trim()) issues.push({ code: "spanish-required", field: "titleEs" });
  if (!hasUsefulSummary(es?.summary)) issues.push({ code: "spanish-summary-too-short", field: "summaryEs" });
  if ((es?.highlights?.length ?? 0) < 2) issues.push({ code: "spanish-highlights-required", field: "highlightsEs" });
  if (!(es?.included?.length)) issues.push({ code: "spanish-included-required", field: "includedEs" });
  if (!(es?.notIncluded?.length)) issues.push({ code: "spanish-not-included-required", field: "notIncludedEs" });

  if (duplicateAcrossSections(service.summary, [service.highlights, service.included, service.notIncluded])) {
    issues.push({ code: "duplicate-commercial-copy", field: "commercialContent" });
  }

  if (service.serviceType === "activity") {
    if (/^\d+(?:[.,]\d+)?$/.test(service.durationLabel.trim())) {
      issues.push({ code: "duration-needs-unit", field: "durationLabel" });
    }
    if (!es?.activityCategory?.trim()) issues.push({ code: "spanish-required", field: "activityCategoryEs" });
    if (!es?.location?.trim()) issues.push({ code: "spanish-required", field: "locationEs" });
    if (!es?.durationLabel?.trim()) issues.push({ code: "spanish-required", field: "durationLabelEs" });
  }

  if (service.serviceType === "transport") {
    if (!es?.transportMode?.trim()) issues.push({ code: "spanish-required", field: "transportModeEs" });
    if (!es?.origin?.trim()) issues.push({ code: "spanish-required", field: "originEs" });
    if (!es?.destination?.trim()) issues.push({ code: "spanish-required", field: "destinationEs" });
  }

  if (service.serviceType === "insurance") {
    const genericCoverage = new Set(["total", "premium", "basic", "standard", "completa", "completo"]);
    if (!service.providerName?.trim()) issues.push({ code: "insurance-provider-required", field: "providerName" });
    if (!validHttpsUrl(service.termsUrl)) issues.push({ code: "insurance-terms-required", field: "termsUrl" });
    if (genericCoverage.has(normalized(service.coverageType))) issues.push({ code: "insurance-coverage-too-generic", field: "coverageType" });
    if (!es?.coverageType?.trim()) issues.push({ code: "spanish-required", field: "coverageTypeEs" });
  }

  return issues;
}

export function isDestinationPublishReady(destination: Destination) {
  return destinationPublishingIssues(destination).length === 0;
}

export function isTripPublishReady(trip: Trip) {
  return tripPublishingIssues(trip).length === 0;
}

export function isServicePublishReady(service: TravelService) {
  return servicePublishingIssues(service).length === 0;
}
