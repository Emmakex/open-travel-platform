import type { CustomerProfile, UserIdentity } from "@/domain/identity/types";

export interface IdentityRepository {
  getCurrentIdentity(): Promise<UserIdentity | null>;
  getCustomerProfile(identityId: string): Promise<CustomerProfile | null>;
}
