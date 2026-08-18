import { cookies } from "next/headers";
import { demoCustomerProfile, demoIdentities } from "@/data/demo-identities";
import { DEMO_SESSION_COOKIE } from "@/lib/identity-config";
import type { IdentityRepository } from "@/repositories/identity-repository";

const identities = Object.values(demoIdentities);

export class DemoIdentityRepository implements IdentityRepository {
  async getCurrentIdentity() {
    const cookieStore = await cookies();
    const session = cookieStore.get(DEMO_SESSION_COOKIE)?.value;

    return identities.find((identity) => identity.id === session) ?? null;
  }

  async getCustomerProfile(identityId: string) {
    return identityId === demoCustomerProfile.identityId ? demoCustomerProfile : null;
  }
}
