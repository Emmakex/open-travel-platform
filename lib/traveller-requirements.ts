import type { ReservationTraveller } from "@/domain/booking/types";
import type {
  TravellerRequirementField,
  TravellerRequirementPreset,
  TravellerRequirementsProfile
} from "@/domain/traveller/types";

export const travellerRequirementFields: TravellerRequirementField[] = [
  "secondSurname",
  "sex",
  "documentType",
  "documentNumber",
  "documentSupportNumber",
  "documentIssuingCountry",
  "documentExpiryDate",
  "residenceAddress",
  "residenceCity",
  "residenceCountry",
  "phone",
  "email",
  "emergencyContactName",
  "emergencyContactPhone",
  "minorTravelAuthorization"
];

const presets: Record<TravellerRequirementPreset, TravellerRequirementField[]> = {
  none: [],
  "travel-document": [
    "documentType",
    "documentNumber",
    "documentIssuingCountry",
    "documentExpiryDate"
  ],
  "international-air": [
    "sex",
    "documentType",
    "documentNumber",
    "documentIssuingCountry",
    "documentExpiryDate"
  ],
  "spanish-lodging": [
    "secondSurname",
    "sex",
    "documentType",
    "documentNumber",
    "documentSupportNumber",
    "residenceAddress",
    "residenceCity",
    "residenceCountry",
    "phone",
    "email"
  ],
  maritime: ["sex"],
  custom: []
};

export function travellerRequirementPresetFields(preset: TravellerRequirementPreset) {
  return presets[preset];
}

export function defaultTravellerRetentionDays(preset: TravellerRequirementPreset) {
  // Spanish professional lodging records can be subject to a three-year retention duty.
  // Other travel-document data defaults to a deliberately short post-service retention period.
  return preset === "spanish-lodging" ? 1095 : preset === "none" ? 0 : 30;
}

export function buildTravellerRequirementsProfile(input: {
  preset: TravellerRequirementPreset;
  customFields?: TravellerRequirementField[];
  completionDeadlineDaysBeforeStart?: number;
  retentionDaysAfterEnd?: number;
}): TravellerRequirementsProfile {
  const fields = input.preset === "custom"
    ? (input.customFields ?? []).filter((field, index, items) => travellerRequirementFields.includes(field) && items.indexOf(field) === index)
    : travellerRequirementPresetFields(input.preset);
  const deadline = input.completionDeadlineDaysBeforeStart;
  const retention = input.retentionDaysAfterEnd;

  return {
    preset: input.preset,
    requiredFields: [...fields],
    ...(deadline !== undefined && Number.isInteger(deadline) && deadline >= 0 && deadline <= 365
      ? { completionDeadlineDaysBeforeStart: deadline }
      : {}),
    retentionDaysAfterEnd: retention !== undefined && Number.isInteger(retention) && retention >= 0 && retention <= 3650
      ? retention
      : defaultTravellerRetentionDays(input.preset)
  };
}

export function travellerFieldsForReservationTraveller(
  profile: TravellerRequirementsProfile | undefined,
  traveller: ReservationTraveller
): TravellerRequirementField[] {
  if (!profile || profile.preset === "none") return [];
  const fields = [...profile.requiredFields];

  // Spanish minors travelling abroad without a parent/legal guardian may need a travel authorisation.
  // We only make this a completion item for international-document presets and when the recorded
  // responsible adult is not marked as a parent/legal guardian.
  if (
    traveller.ageAtDeparture < 18 &&
    traveller.guardianRelationship === "other" &&
    (profile.preset === "international-air" || profile.preset === "travel-document") &&
    !fields.includes("minorTravelAuthorization")
  ) {
    fields.push("minorTravelAuthorization");
  }

  return fields;
}

export function travellerRequirementsDeadline(
  profile: TravellerRequirementsProfile | undefined,
  startDate?: string
) {
  if (!profile?.completionDeadlineDaysBeforeStart || !startDate) return undefined;
  const start = Date.parse(`${startDate}T00:00:00Z`);
  if (!Number.isFinite(start)) return undefined;
  return new Date(start - profile.completionDeadlineDaysBeforeStart * 86400000).toISOString().slice(0, 10);
}
