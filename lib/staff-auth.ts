import {
  createHash,
  randomBytes,
  randomUUID,
  scrypt as scryptCallback,
  timingSafeEqual
} from "node:crypto";
import { promisify } from "node:util";
import type { UserRole } from "@/domain/identity/types";
import { authLockout, recordAuthAudit } from "@/lib/auth-security";
import { getMongoDatabase } from "@/lib/mongodb";

const scrypt = promisify(scryptCallback);
const dummyPasswordSalt = "ktravel-staff-auth-dummy-salt-v1";

export const staffUserCollectionName = "travel_staff_users";
export const staffSessionCollectionName = "travel_staff_sessions";

export type StaffRole = Extract<UserRole, "operator" | "admin">;

export type StoredStaffUser = {
  id: string;
  email: string;
  emailNormalized: string;
  displayName: string;
  role: StaffRole;
  passwordHash: string;
  passwordSalt: string;
  status: "active" | "disabled";
  failedSignInAttempts?: number;
  lockedUntil?: Date;
  createdAt: Date;
  updatedAt?: Date;
  lastSignedInAt?: Date;
  passwordChangedAt?: Date;
};

type StoredStaffSession = {
  id: string;
  userId: string;
  tokenHash: string;
  createdAt: Date;
  expiresAt: Date;
};

export type SafeStaffUser = Omit<
  StoredStaffUser,
  "passwordHash" | "passwordSalt" | "emailNormalized" | "failedSignInAttempts" | "lockedUntil"
>;

type CreateStaffInput = {
  email: string;
  password: string;
  displayName: string;
  role: StaffRole;
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
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

async function ensureStaffIndexes() {
  const database = await getMongoDatabase();
  await Promise.all([
    database.collection<StoredStaffUser>(staffUserCollectionName).createIndex(
      { emailNormalized: 1 },
      { unique: true, name: "travel_staff_email_unique" }
    ),
    database.collection<StoredStaffSession>(staffSessionCollectionName).createIndex(
      { tokenHash: 1 },
      { unique: true, name: "travel_staff_session_token_unique" }
    ),
    database.collection<StoredStaffSession>(staffSessionCollectionName).createIndex(
      { expiresAt: 1 },
      { expireAfterSeconds: 0, name: "travel_staff_session_expiry" }
    ),
    database.collection<StoredStaffSession>(staffSessionCollectionName).createIndex(
      { userId: 1 },
      { name: "travel_staff_session_user" }
    )
  ]);
}

function safeStaffUser(user: StoredStaffUser): SafeStaffUser {
  const {
    passwordHash: _passwordHash,
    passwordSalt: _passwordSalt,
    emailNormalized: _emailNormalized,
    failedSignInAttempts: _failedSignInAttempts,
    lockedUntil: _lockedUntil,
    ...safe
  } = user;
  return safe;
}

export async function createStaffUser(input: CreateStaffInput) {
  await ensureStaffIndexes();
  const database = await getMongoDatabase();
  const now = new Date();
  const passwordSalt = randomBytes(16).toString("hex");
  const passwordHash = await derivePassword(input.password, passwordSalt);
  const user: StoredStaffUser = {
    id: `stf-${randomUUID()}`,
    email: input.email.trim(),
    emailNormalized: normalizeEmail(input.email),
    displayName: input.displayName.trim(),
    role: input.role,
    passwordHash,
    passwordSalt,
    status: "active",
    createdAt: now
  };

  try {
    await database.collection<StoredStaffUser>(staffUserCollectionName).insertOne(user);
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === 11000) {
      const duplicate = new Error("A staff account already exists for this email.");
      Object.assign(duplicate, { code: "EMAIL_EXISTS" });
      throw duplicate;
    }
    throw error;
  }

  return safeStaffUser(user);
}

export async function authenticateStaff(email: string, password: string) {
  await ensureStaffIndexes();
  const database = await getMongoDatabase();
  const users = database.collection<StoredStaffUser>(staffUserCollectionName);
  const emailNormalized = normalizeEmail(email);
  const user = await users.findOne({ emailNormalized, status: "active" });

  if (!user) {
    await derivePassword(password, dummyPasswordSalt);
    await recordAuthAudit({ scope: "staff", event: "sign_in_failure", email });
    return null;
  }

  const now = new Date();
  if (user.lockedUntil && user.lockedUntil > now) {
    await recordAuthAudit({
      scope: "staff",
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
      scope: "staff",
      event: "sign_in_failure",
      subjectId: user.id,
      email: user.email
    });
    if (shouldLock) {
      await recordAuthAudit({
        scope: "staff",
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
    scope: "staff",
    event: "sign_in_success",
    subjectId: user.id,
    email: user.email
  });

  return safeStaffUser({ ...user, failedSignInAttempts: 0, lockedUntil: undefined, lastSignedInAt: now });
}

export async function createStaffSession(userId: string) {
  await ensureStaffIndexes();
  const database = await getMongoDatabase();
  const token = randomBytes(32).toString("base64url");
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 8 * 60 * 60 * 1000);

  await database.collection<StoredStaffSession>(staffSessionCollectionName).insertOne({
    id: `sts-${randomUUID()}`,
    userId,
    tokenHash: hashSessionToken(token),
    createdAt: now,
    expiresAt
  });

  return { token, expiresAt };
}

export async function revokeStaffSession(token: string) {
  if (!token) return;
  const database = await getMongoDatabase();
  await database.collection<StoredStaffSession>(staffSessionCollectionName).deleteOne({
    tokenHash: hashSessionToken(token)
  });
}

export async function revokeAllStaffSessions(userId: string) {
  const database = await getMongoDatabase();
  await database.collection<StoredStaffSession>(staffSessionCollectionName).deleteMany({ userId });
}

export async function resolveStaffSession(token: string) {
  if (!token) return null;
  await ensureStaffIndexes();
  const database = await getMongoDatabase();
  const session = await database.collection<StoredStaffSession>(staffSessionCollectionName).findOne({
    tokenHash: hashSessionToken(token),
    expiresAt: { $gt: new Date() }
  });
  if (!session) return null;

  const user = await database.collection<StoredStaffUser>(staffUserCollectionName).findOne({
    id: session.userId,
    status: "active"
  });
  return user ? safeStaffUser(user) : null;
}

export async function changeStaffPassword(userId: string, currentPassword: string, newPassword: string) {
  await ensureStaffIndexes();
  const database = await getMongoDatabase();
  const users = database.collection<StoredStaffUser>(staffUserCollectionName);
  const user = await users.findOne({ id: userId, status: "active" });
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
  await revokeAllStaffSessions(user.id);
  await recordAuthAudit({
    scope: "staff",
    event: "password_changed",
    subjectId: user.id,
    email: user.email
  });
  return true;
}

export async function listStaffUsers() {
  await ensureStaffIndexes();
  const database = await getMongoDatabase();
  const users = await database.collection<StoredStaffUser>(staffUserCollectionName)
    .find({})
    .sort({ createdAt: 1 })
    .toArray();
  return users.map(safeStaffUser);
}

export async function setStaffUserStatus(userId: string, status: "active" | "disabled") {
  await ensureStaffIndexes();
  const database = await getMongoDatabase();
  const result = await database.collection<StoredStaffUser>(staffUserCollectionName).findOneAndUpdate(
    { id: userId },
    { $set: { status, updatedAt: new Date() } },
    { returnDocument: "after" }
  );
  if (status === "disabled") await revokeAllStaffSessions(userId);
  return result ? safeStaffUser(result) : null;
}

export async function getStaffBootstrapState() {
  await ensureStaffIndexes();
  const database = await getMongoDatabase();
  const count = await database.collection<StoredStaffUser>(staffUserCollectionName).countDocuments({});
  return {
    count,
    configured: Boolean(
      process.env.KTRAVEL_BOOTSTRAP_ADMIN_EMAIL &&
      process.env.KTRAVEL_BOOTSTRAP_ADMIN_PASSWORD
    )
  };
}

export async function ensureBootstrapAdmin() {
  const state = await getStaffBootstrapState();
  if (state.count > 0 || !state.configured) return { created: false, ...state };

  const email = process.env.KTRAVEL_BOOTSTRAP_ADMIN_EMAIL?.trim() ?? "";
  const password = process.env.KTRAVEL_BOOTSTRAP_ADMIN_PASSWORD ?? "";
  const displayName = process.env.KTRAVEL_BOOTSTRAP_ADMIN_NAME?.trim() || "Kairoseth Admin";

  if (!email || password.length < 12) {
    return { created: false, count: 0, configured: false };
  }

  try {
    await createStaffUser({ email, password, displayName, role: "admin" });
    return { created: true, count: 1, configured: true };
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "EMAIL_EXISTS") {
      return { created: false, count: 1, configured: true };
    }
    throw error;
  }
}
