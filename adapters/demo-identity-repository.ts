import { cookies } from "next/headers";
import type { CustomerProfile, UserIdentity } from "@/domain/identity/types";
import { DEMO_SESSION_COOKIE } from "@/lib/identity-config";
import type { IdentityRepository } from "@/repositories/identity-repository";

const demoIdentity: UserIdentity = {
  id: "demo-customer",
  email: "traveller@example.test",
  displayName: "Demo Traveller",
  role: "customer"
};

const demoProfile: CustomerProfile = {
  identityId: demoIdentity.id,
  firstName: "Demo",
  lastName: "Traveller",
  email: demoIdentity.email,
  country: "Spain",
  preferredLocale: "en"
};

export class DemoIdentityRepository implements IdentityRepository {
  async getCurrentIdentity() {
    const cookieStore = await cookies();
    const session = cookieStore.get(DEMO_SESSION_COOKIE)?.value;

    return session === demoIdentity.id ? demoIdentity : null;
  }

  async getCustomerProfile(identityId: string) {
    return identityId === demoProfile.identityId ? demoProfile : null;
  }
}
