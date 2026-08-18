export type UserRole = "customer" | "operator" | "admin";

export interface UserIdentity {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
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
