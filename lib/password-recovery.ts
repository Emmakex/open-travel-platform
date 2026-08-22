import {
  randomBytes,
  scrypt as scryptCallback
} from "node:crypto";
import { promisify } from "node:util";
import { recordAuthAudit } from "@/lib/auth-security";
import {
  customerUserCollectionName,
  revokeAllCustomerSessions,
  type StoredCustomerUser
} from "@/lib/customer-auth";
import { getMongoDatabase } from "@/lib/mongodb";
import {
  staffUserCollectionName,
  revokeAllStaffSessions,
  type StoredStaffUser
} from "@/lib/staff-auth";

const scrypt = promisify(scryptCallback);

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

async function derivePassword(password: string, salt: string) {
  const result = (await scrypt(password, salt, 64)) as Buffer;
  return result.toString("hex");
}

export type PasswordRecoveryAccount = {
  id: string;
  email: string;
  displayName: string;
  preferredLocale?: "en" | "es";
};

export async function findCustomerPasswordRecoveryAccount(email: string): Promise<PasswordRecoveryAccount | null> {
  const database = await getMongoDatabase();
  const user = await database.collection<StoredCustomerUser>(customerUserCollectionName).findOne({
    emailNormalized: normalizeEmail(email),
    role: "customer",
    status: "active"
  });

  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    preferredLocale: user.preferredLocale === "es" ? "es" : "en"
  };
}

export async function findStaffPasswordRecoveryAccount(email: string): Promise<PasswordRecoveryAccount | null> {
  const database = await getMongoDatabase();
  const user = await database.collection<StoredStaffUser>(staffUserCollectionName).findOne({
    emailNormalized: normalizeEmail(email),
    status: "active"
  });

  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    preferredLocale: "en"
  };
}

export async function resetCustomerPassword(userId: string, newPassword: string) {
  const database = await getMongoDatabase();
  const users = database.collection<StoredCustomerUser>(customerUserCollectionName);
  const user = await users.findOne({ id: userId, role: "customer", status: "active" });
  if (!user) return false;

  const passwordSalt = randomBytes(16).toString("hex");
  const passwordHash = await derivePassword(newPassword, passwordSalt);
  const now = new Date();

  await users.updateOne(
    { id: user.id },
    {
      $set: {
        passwordSalt,
        passwordHash,
        passwordChangedAt: now,
        failedSignInAttempts: 0,
        updatedAt: now
      },
      $unset: { lockedUntil: "" }
    }
  );
  await revokeAllCustomerSessions(user.id);
  await recordAuthAudit({
    scope: "customer",
    event: "password_reset_completed",
    subjectId: user.id,
    email: user.email
  });
  return true;
}

export async function resetStaffPassword(userId: string, newPassword: string) {
  const database = await getMongoDatabase();
  const users = database.collection<StoredStaffUser>(staffUserCollectionName);
  const user = await users.findOne({ id: userId, status: "active" });
  if (!user) return false;

  const passwordSalt = randomBytes(16).toString("hex");
  const passwordHash = await derivePassword(newPassword, passwordSalt);
  const now = new Date();

  await users.updateOne(
    { id: user.id },
    {
      $set: {
        passwordSalt,
        passwordHash,
        passwordChangedAt: now,
        failedSignInAttempts: 0,
        updatedAt: now
      },
      $unset: { lockedUntil: "" }
    }
  );
  await revokeAllStaffSessions(user.id);
  await recordAuthAudit({
    scope: "staff",
    event: "password_reset_completed",
    subjectId: user.id,
    email: user.email
  });
  return true;
}
