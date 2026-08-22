import { cookies } from "next/headers";
import { demoIdentities } from "@/data/demo-identities";
import type { CustomerProfile, UserIdentity } from "@/domain/identity/types";
import {
  getCustomerUserById,
  resolveCustomerSession,
  type StoredCustomerUser
} from "@/lib/customer-auth";
import {
  DEMO_SESSION_COOKIE,
  KTRAVEL_SESSION_COOKIE,
  KTRAVEL_STAFF_SESSION_COOKIE,
  identityConfig
} from "@/lib/identity-config";
import { resolveStaffSession, type SafeStaffUser } from "@/lib/staff-auth";
import type { IdentityRepository } from "@/repositories/identity-repository";

function toIdentity(user: StoredCustomerUser): UserIdentity {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    role: "customer"
  };
}

function toStaffIdentity(user: SafeStaffUser): UserIdentity {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    role: user.role
  };
}

function toProfile(user: StoredCustomerUser): CustomerProfile {
  return {
    identityId: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
    country: user.country,
    preferredLocale: user.preferredLocale
  };
}

export class MongoIdentityRepository implements IdentityRepository {
  async getCurrentIdentity() {
    const cookieStore = await cookies();

    if (identityConfig.staffAuthEnabled) {
      const staffToken = cookieStore.get(KTRAVEL_STAFF_SESSION_COOKIE)?.value;
      if (staffToken) {
        const staff = await resolveStaffSession(staffToken);
        if (staff) return toStaffIdentity(staff);
      }
    }

    const customerToken = cookieStore.get(KTRAVEL_SESSION_COOKIE)?.value;
    if (customerToken) {
      const customer = await resolveCustomerSession(customerToken);
      if (customer) return toIdentity(customer);
    }

    if (identityConfig.demoStaffEnabled) {
      const demoSession = cookieStore.get(DEMO_SESSION_COOKIE)?.value;
      const staff = [demoIdentities.operator, demoIdentities.admin].find(
        (identity) => identity.id === demoSession
      );
      if (staff) return staff;
    }

    return null;
  }

  async getCustomerProfile(identityId: string) {
    const user = await getCustomerUserById(identityId);
    return user ? toProfile(user) : null;
  }
}
