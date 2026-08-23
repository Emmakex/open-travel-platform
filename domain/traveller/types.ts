export type TravellerRequirementPreset =
  | "none"
  | "travel-document"
  | "international-air"
  | "spanish-lodging"
  | "maritime"
  | "custom";

export type TravellerRequirementField =
  | "secondSurname"
  | "sex"
  | "documentType"
  | "documentNumber"
  | "documentSupportNumber"
  | "documentIssuingCountry"
  | "documentExpiryDate"
  | "residenceAddress"
  | "residenceCity"
  | "residenceCountry"
  | "phone"
  | "email"
  | "emergencyContactName"
  | "emergencyContactPhone"
  | "minorTravelAuthorization";

export type TravellerRequirementsProfile = {
  preset: TravellerRequirementPreset;
  requiredFields: TravellerRequirementField[];
  /** Number of days before the service/trip starts when customer self-editing closes. */
  completionDeadlineDaysBeforeStart?: number;
  /** Encrypted post-purchase traveller data is automatically deleted after this many days. */
  retentionDaysAfterEnd: number;
};

export type TravellerDocumentType =
  | "passport"
  | "dni"
  | "tie"
  | "national-id"
  | "other";

export type TravellerSex = "female" | "male" | "x" | "not-stated";
export type MinorTravelAuthorizationStatus = "not-required" | "pending" | "confirmed";

export type TravellerPostPurchaseData = {
  secondSurname?: string;
  sex?: TravellerSex;
  documentType?: TravellerDocumentType;
  documentNumber?: string;
  documentSupportNumber?: string;
  documentIssuingCountry?: string;
  documentExpiryDate?: string;
  residenceAddress?: string;
  residenceCity?: string;
  residenceCountry?: string;
  phone?: string;
  email?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  minorTravelAuthorization?: MinorTravelAuthorizationStatus;
};
