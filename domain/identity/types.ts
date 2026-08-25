export type UserRole = "customer" | "operator" | "admin";

export type StaffCapability =
  | "reservations"
  | "catalogue"
  | "finance"
  | "traveller-data"
  | "suppliers"
  | "tasks"
  | "administration";

export interface UserIdentity {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  /**
   * Undefined preserves the legacy role-based access profile for existing staff.
   * Explicit capabilities are only used for persistent staff accounts.
   */
  capabilities?: StaffCapability[];
}

export interface CustomerProfile {
  identityId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  country?: string;
  preferredLocale?: string;
}
