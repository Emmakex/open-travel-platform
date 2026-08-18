import type { CustomerProfile, UserIdentity } from "@/domain/identity/types";

export const demoIdentities = {
  customer: {
    id: "demo-customer",
    email: "traveller@example.test",
    displayName: "Demo Traveller",
    role: "customer"
  },
  operator: {
    id: "demo-operator",
    email: "operator@example.test",
    displayName: "Demo Operator",
    role: "operator"
  },
  admin: {
    id: "demo-admin",
    email: "admin@example.test",
    displayName: "Demo Admin",
    role: "admin"
  }
} as const satisfies Record<"customer" | "operator" | "admin", UserIdentity>;

export const demoCustomerProfile: CustomerProfile = {
  identityId: demoIdentities.customer.id,
  firstName: "Demo",
  lastName: "Traveller",
  email: demoIdentities.customer.email,
  country: "Spain",
  preferredLocale: "en"
};
