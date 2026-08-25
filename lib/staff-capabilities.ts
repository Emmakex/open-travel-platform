import type { StaffCapability, UserIdentity } from "@/domain/identity/types";

export const staffCapabilities: StaffCapability[] = [
  "reservations",
  "catalogue",
  "finance",
  "traveller-data",
  "suppliers",
  "tasks",
  "administration"
];

export const legacyOperatorCapabilities: StaffCapability[] = [
  "reservations",
  "catalogue",
  "finance",
  "traveller-data",
  "suppliers",
  "tasks"
];

export function isStaffCapability(value: string): value is StaffCapability {
  return staffCapabilities.includes(value as StaffCapability);
}

export function normalizeStaffCapabilities(values: string[]) {
  const unique = new Set<StaffCapability>();
  for (const value of values) {
    if (isStaffCapability(value) && value !== "administration") unique.add(value);
  }
  return legacyOperatorCapabilities.filter((capability) => unique.has(capability));
}

export function effectiveStaffCapabilities(identity: UserIdentity | null): StaffCapability[] {
  if (!identity || identity.role === "customer") return [];
  if (identity.role === "admin") return [...staffCapabilities];
  if (identity.capabilities === undefined) return [...legacyOperatorCapabilities];
  return normalizeStaffCapabilities(identity.capabilities);
}

export function hasStaffCapability(identity: UserIdentity | null, capability: StaffCapability) {
  return effectiveStaffCapabilities(identity).includes(capability);
}
