import { redirect } from "next/navigation";
import { hasCustomerAccess } from "@/lib/access-control";
import { getIdentityRepository } from "@/lib/identity-repository";

export async function requireCustomerIdentity() {
  const identity = await getIdentityRepository().getCurrentIdentity();

  if (!identity) {
    redirect("/account/sign-in");
  }

  if (!hasCustomerAccess(identity)) {
    redirect("/operator");
  }

  return identity;
}
