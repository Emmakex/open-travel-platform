import { redirect } from "next/navigation";
import type { StaffCapability } from "@/domain/identity/types";
import { hasOperationsAccess } from "@/lib/access-control";
import { getIdentityRepository } from "@/lib/identity-repository";
import { hasStaffCapability } from "@/lib/staff-capabilities";

export async function requireStaffCapability(capability: StaffCapability) {
  const identity = await getIdentityRepository().getCurrentIdentity();
  if (!identity) redirect("/operator/sign-in");
  if (!hasOperationsAccess(identity)) redirect("/operator/sign-in?error=forbidden");
  if (!hasStaffCapability(identity, capability)) {
    redirect(`/operator?error=permission-denied&capability=${encodeURIComponent(capability)}`);
  }
  return identity;
}
