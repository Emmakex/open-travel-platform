import type { UserIdentity } from "@/domain/identity/types";

type CustomerIdentity = UserIdentity & { role: "customer" };
type StaffIdentity = UserIdentity & { role: "operator" | "admin" };

export function hasCustomerAccess(identity: UserIdentity | null): identity is CustomerIdentity {
  return identity?.role === "customer";
}

export function hasOperationsAccess(identity: UserIdentity | null): identity is StaffIdentity {
  return identity?.role === "operator" || identity?.role === "admin";
}
