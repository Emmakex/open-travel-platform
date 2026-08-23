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
  _traveller: ReservationTraveller
): TravellerRequirementField[] {
  // Do not infer extra identity/document requirements from age or nationality. Requirements
  // must come from the reservation snapshot because border, supplier and minor-authorisation
  // rules depend on route, residence, accompaniment and other facts Kairoseth may not know.
  return profile && profile.preset !== "none" ? [...profile.requiredFields] : [];
}

export function travellerRequirementsDeadline(
  profile: TravellerRequirementsProfile | undefined,
  startDate?: string
) {
  if (!profile || !startDate) return undefined;
  const start = Date.parse(`${startDate}T00:00:00Z`);
  if (!Number.isFinite(start)) return undefined;
  const daysBeforeStart = profile.completionDeadlineDaysBeforeStart ?? 0;
  return new Date(start - daysBeforeStart * 86400000).toISOString().slice(0, 10);
}
