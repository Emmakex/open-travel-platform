import {
  createHash,
  randomBytes,
  randomUUID,
  scrypt as scryptCallback,
  timingSafeEqual
} from "node:crypto";
import { promisify } from "node:util";
import { authLockout, recordAuthAudit } from "@/lib/auth-security";
import { getMongoDatabase } from "@/lib/mongodb";

const scrypt = promisify(scryptCallback);
const dummyPasswordSalt = "ktravel-customer-auth-dummy-salt-v1";

export const customerUserCollectionName = "travel_users";
export const customerSessionCollectionName = "travel_sessions";

export type StoredCustomerUser = {
  id: string;
  email: string;
  emailNormalized: string;
  displayName: string;
  firstName: string;
  lastName: string;
  role: "customer";
  passwordHash: string;
  passwordSalt: string;
  phone?: string;
  country?: string;
  preferredLocale?: string;
  status: "active" | "disabled";
  failedSignInAttempts?: number;
  lockedUntil?: Date;
  lastSignedInAt?: Date;
  passwordChangedAt?: Date;
  createdAt: Date;
  updatedAt?: Date;
};

type StoredCustomerSession = {
  id: string;
  userId: string;
  tokenHash: string;
  createdAt: Date;
  expiresAt: Date;
};

export type RegisterCustomerInput = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  country?: string;
  preferredLocale?: string;
};

export type UpdateCustomerProfileInput = {
  firstName: string;
  lastName: string;
  phone?: string;
  country?: string;
  preferredLocale?: "en" | "es";
};

export type SafeCustomerUser = {
  id: string;
  email: string;
  displayName: string;
  firstName: string;
  lastName: string;
  role: "customer";
  phone?: string;
  country?: string;
  preferredLocale?: string;
  status: "active" | "disabled";
  lastSignedInAt?: Date;
  passwordChangedAt?: Date;
  createdAt: Date;
  updatedAt?: Date;
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function toSafeCustomerUser(user: StoredCustomerUser): SafeCustomerUser {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    phone: user.phone,
    country: user.country,
    preferredLocale: user.preferredLocale,
    status: user.status,
    lastSignedInAt: user.lastSignedInAt,
    passwordChangedAt: user.passwordChangedAt,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
}

async function ensureAuthIndexes() {
  const database = await getMongoDatabase();
  await Promise.all([
    database.collection<StoredCustomerUser>(customerUserCollectionName).createIndex(
      { emailNormalized: 1 },
      { unique: true, name: "travel_user_email_unique" }
    ),
    database.collection<StoredCustomerSession>(customerSessionCollectionName).createIndex(
      { tokenHash: 1 },
      { unique: true, name: "travel_session_token_unique" }
    ),
    database.collection<StoredCustomerSession>(customerSessionCollectionName).createIndex(
      { expiresAt: 1 },
      { expireAfterSeconds: 0, name: "travel_session_expiry" }
    ),
    database.collection<StoredCustomerSession>(customerSessionCollectionName).createIndex(
      { userId: 1 },
      { name: "travel_session_user" }
    )
  ]);
}

async function derivePassword(password: string, salt: string) {
  const result = (await scrypt(password, salt, 64)) as Buffer;
  return result.toString("hex");
}

async function passwordMatches(password: string, salt: string, expectedHash: string) {
  const candidateHash = await derivePassword(password, salt);
  const candidate = Buffer.from(candidateHash, "hex");
  const expected = Buffer.from(expectedHash, "hex");
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}

export async function registerCustomer(input: RegisterCustomerInput) {
  await ensureAuthIndexes();
  const database = await getMongoDatabase();
  const emailNormalized = normalizeEmail(input.email);
  const passwordSalt = randomBytes(16).toString("hex");
  const passwordHash = await derivePassword(input.password, passwordSalt);
  const now = new Date();
  const user: StoredCustomerUser = {
    id: `usr-${randomUUID()}`,
    email: input.email.trim(),
    emailNormalized,
    displayName: `${input.firstName.trim()} ${input.lastName.trim()}`.trim(),
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    role: "customer",
    passwordHash,
    passwordSalt,
    country: input.country?.trim() || undefined,
    preferredLocale: input.preferredLocale?.trim() || undefined,
    status: "active",
    createdAt: now
  };

  try {
    await database.collection<StoredCustomerUser>(customerUserCollectionName).insertOne(user);
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === 11000) {
      const duplicate = new Error("A customer account already exists for this email.");
      Object.assign(duplicate, { code: "EMAIL_EXISTS" });
      throw duplicate;
    }
    throw error;
  }

  return user;
}

export async function authenticateCustomer(email: string, password: string) {
  await ensureAuthIndexes();
  const database = await getMongoDatabase();
  const users = database.collection<StoredCustomerUser>(customerUserCollectionName);
  const emailNormalized = normalizeEmail(email);
  const user = await users.findOne({ emailNormalized, status: "active" });

  if (!user) {
    await derivePassword(password, dummyPasswordSalt);
    await recordAuthAudit({ scope: "customer", event: "sign_in_failure", email });
    return null;
  }

  const now = new Date();
  if (user.lockedUntil && user.lockedUntil > now) {
    await recordAuthAudit({
      scope: "customer",
      event: "sign_in_failure",
      subjectId: user.id,
      email: user.email
    });
    return null;
  }

  const matches = await passwordMatches(password, user.passwordSalt, user.passwordHash);
  if (!matches) {
    const attempts = (user.failedSignInAttempts ?? 0) + 1;
    const shouldLock = attempts >= authLockout.maxFailedAttempts;
    const lockedUntil = shouldLock
      ? new Date(now.getTime() + authLockout.lockMinutes * 60 * 1000)
      : undefined;

    await users.updateOne(
      { id: user.id },
      {
        $set: {
          failedSignInAttempts: shouldLock ? 0 : attempts,
          ...(lockedUntil ? { lockedUntil } : {}),
          updatedAt: now
        },
        ...(!lockedUntil ? { $unset: { lockedUntil: "" } } : {})
      }
    );

    await recordAuthAudit({
      scope: "customer",
      event: "sign_in_failure",
      subjectId: user.id,
      email: user.email
    });
    if (shouldLock) {
      await recordAuthAudit({
        scope: "customer",
        event: "account_locked",
        subjectId: user.id,
        email: user.email
      });
    }
    return null;
  }

  await users.updateOne(
    { id: user.id },
    {
      $set: { failedSignInAttempts: 0, lastSignedInAt: now, updatedAt: now },
      $unset: { lockedUntil: "" }
    }
  );
  await recordAuthAudit({
    scope: "customer",
    event: "sign_in_success",
    subjectId: user.id,
    email: user.email
  });

  return { ...user, failedSignInAttempts: 0, lockedUntil: undefined, lastSignedInAt: now };
}

export async function createCustomerSession(userId: string) {
  await ensureAuthIndexes();
  const database = await getMongoDatabase();
  const token = randomBytes(32).toString("base64url");
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  await database.collection<StoredCustomerSession>(customerSessionCollectionName).insertOne({
    id: `ses-${randomUUID()}`,
    userId,
    tokenHash: hashSessionToken(token),
    createdAt: now,
    expiresAt
  });

  return { token, expiresAt };
}

export async function revokeCustomerSession(token: string) {
  if (!token) return;
  const database = await getMongoDatabase();
  await database.collection<StoredCustomerSession>(customerSessionCollectionName).deleteOne({
    tokenHash: hashSessionToken(token)
  });
}

export async function revokeAllCustomerSessions(userId: string) {
  const database = await getMongoDatabase();
  await database.collection<StoredCustomerSession>(customerSessionCollectionName).deleteMany({ userId });
}

export async function resolveCustomerSession(token: string) {
  if (!token) return null;
  await ensureAuthIndexes();
  const database = await getMongoDatabase();
  const session = await database.collection<StoredCustomerSession>(customerSessionCollectionName).findOne({
    tokenHash: hashSessionToken(token),
    expiresAt: { $gt: new Date() }
  });

  if (!session) return null;

  return database.collection<StoredCustomerUser>(customerUserCollectionName).findOne({
    id: session.userId,
    status: "active"
  });
}

export async function getCustomerUserById(id: string) {
  await ensureAuthIndexes();
  const database = await getMongoDatabase();
  return database.collection<StoredCustomerUser>(customerUserCollectionName).findOne({
    id,
    status: "active"
  });
}

export async function changeCustomerPassword(userId: string, currentPassword: string, newPassword: string) {
  await ensureAuthIndexes();
  const database = await getMongoDatabase();
  const users = database.collection<StoredCustomerUser>(customerUserCollectionName);
  const user = await users.findOne({ id: userId, role: "customer", status: "active" });
  if (!user) return false;

  const validCurrent = await passwordMatches(currentPassword, user.passwordSalt, user.passwordHash);
  if (!validCurrent) return false;

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
    event: "password_changed",
    subjectId: user.id,
    email: user.email
  });
  return true;
}

export async function updateCustomerProfile(userId: string, input: UpdateCustomerProfileInput) {
  await ensureAuthIndexes();
  const database = await getMongoDatabase();
  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();
  const now = new Date();

  const result = await database.collection<StoredCustomerUser>(customerUserCollectionName).findOneAndUpdate(
    { id: userId, role: "customer", status: "active" },
    {
      $set: {
        firstName,
        lastName,
        displayName: `${firstName} ${lastName}`.trim(),
        phone: input.phone?.trim() || undefined,
        country: input.country?.trim() || undefined,
        preferredLocale: input.preferredLocale,
        updatedAt: now
      }
    },
    { returnDocument: "after" }
  );

  return result ? toSafeCustomerUser(result) : null;
}

export async function listCustomersForOperations() {
  await ensureAuthIndexes();
  const database = await getMongoDatabase();
  const users = await database.collection<StoredCustomerUser>(customerUserCollectionName)
    .find({ role: "customer" })
    .sort({ createdAt: -1 })
    .toArray();

  return users.map(toSafeCustomerUser);
}

export async function getCustomerForOperations(id: string) {
  await ensureAuthIndexes();
  const database = await getMongoDatabase();
  const user = await database.collection<StoredCustomerUser>(customerUserCollectionName).findOne({
    id,
    role: "customer"
  });

  return user ? toSafeCustomerUser(user) : null;
}
