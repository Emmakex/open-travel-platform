import type {
  TravellerRequirementField,
  TravellerRequirementPreset,
  TravellerRequirementsProfile
} from "@/domain/traveller/types";
import {
  buildTravellerRequirementsProfile,
  travellerRequirementFields
} from "@/lib/traveller-requirements";

const presets = new Set<TravellerRequirementPreset>([
  "none",
  "travel-document",
  "international-air",
  "spanish-lodging",
  "maritime",
  "custom"
]);

function text(formData: FormData, name: string) {
  const raw = formData.get(name);
  return typeof raw === "string" ? raw.trim() : "";
}

function optionalInteger(raw: string, min: number, max: number) {
  if (!raw) return undefined;
  const value = Number(raw);
  return Number.isInteger(value) && value >= min && value <= max ? value : null;
}

export function parseTravellerRequirementsForm(
  formData: FormData
): TravellerRequirementsProfile | null {
  const rawPreset = text(formData, "travellerRequirementPreset") as TravellerRequirementPreset;
  const preset = presets.has(rawPreset) ? rawPreset : "none";
  const deadline = optionalInteger(text(formData, "travellerRequirementDeadlineDays"), 0, 365);
  const retention = optionalInteger(text(formData, "travellerRequirementRetentionDays"), 0, 3650);
  if (deadline === null || retention === null) return null;

  const customFields = formData
    .getAll("travellerRequirementField")
    .filter((item): item is string => typeof item === "string")
    .filter((item): item is TravellerRequirementField => travellerRequirementFields.includes(item as TravellerRequirementField));

  return buildTravellerRequirementsProfile({
    preset,
    customFields,
    completionDeadlineDaysBeforeStart: deadline,
    retentionDaysAfterEnd: retention
  });
}
