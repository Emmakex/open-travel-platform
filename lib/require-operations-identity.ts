import { redirect } from "next/navigation";
import { hasOperationsAccess } from "@/lib/access-control";
import { getIdentityRepository } from "@/lib/identity-repository";

export async function requireOperationsIdentity() {
  const identity = await getIdentityRepository().getCurrentIdentity();

  if (!identity) {
    redirect("/operator/sign-in");
  }

  if (!hasOperationsAccess(identity)) {
    redirect("/operator/sign-in?error=forbidden");
  }

  return identity;
}
