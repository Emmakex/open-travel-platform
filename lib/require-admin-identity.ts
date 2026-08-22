import { redirect } from "next/navigation";
import { getIdentityRepository } from "@/lib/identity-repository";

export async function requireAdminIdentity() {
  const identity = await getIdentityRepository().getCurrentIdentity();

  if (!identity) redirect("/operator/sign-in");
  if (identity.role !== "admin") redirect("/operator?error=admin-only");

  return identity;
}
