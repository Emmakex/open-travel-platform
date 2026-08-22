import { DemoIdentityRepository } from "@/adapters/demo-identity-repository";
import { MongoIdentityRepository } from "@/adapters/mongo-identity-repository";
import type { IdentityRepository } from "@/repositories/identity-repository";
import { identityConfig } from "@/lib/identity-config";

class DisabledIdentityRepository implements IdentityRepository {
  async getCurrentIdentity() {
    return null;
  }

  async getCustomerProfile() {
    return null;
  }
}

export function getIdentityRepository(): IdentityRepository {
  if (identityConfig.mode === "mongodb") {
    return new MongoIdentityRepository();
  }

  if (identityConfig.mode === "demo") {
    return new DemoIdentityRepository();
  }

  return new DisabledIdentityRepository();
}
