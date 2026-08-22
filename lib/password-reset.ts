import { createHash, randomBytes, randomUUID } from "node:crypto";
import { getMongoDatabase } from "@/lib/mongodb";

export const passwordResetCollectionName = "travel_password_resets";

export type PasswordResetScope = "customer" | "staff";

type StoredPasswordReset = {
  id: string;
  scope: PasswordResetScope;
  userId: string;
  tokenHash: string;
  createdAt: Date;
  expiresAt: Date;
  usedAt?: Date;
};

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

async function ensurePasswordResetIndexes() {
  const database = await getMongoDatabase();
  const resets = database.collection<StoredPasswordReset>(passwordResetCollectionName);
  await Promise.all([
    resets.createIndex({ tokenHash: 1 }, { unique: true, name: "travel_password_reset_token_unique" }),
    resets.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0, name: "travel_password_reset_expiry" }),
    resets.createIndex({ scope: 1, userId: 1, createdAt: -1 }, { name: "travel_password_reset_subject" })
  ]);
}

export async function createPasswordResetToken(scope: PasswordResetScope, userId: string) {
  await ensurePasswordResetIndexes();
  const database = await getMongoDatabase();
  const resets = database.collection<StoredPasswordReset>(passwordResetCollectionName);
  const now = new Date();
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(now.getTime() + 30 * 60 * 1000);

  await resets.deleteMany({ scope, userId, usedAt: { $exists: false } });
  await resets.insertOne({
    id: `pwd-${randomUUID()}`,
    scope,
    userId,
    tokenHash: hashToken(token),
    createdAt: now,
    expiresAt
  });

  return { token, expiresAt };
}

export async function consumePasswordResetToken(scope: PasswordResetScope, token: string) {
  if (!token) return null;
  await ensurePasswordResetIndexes();
  const database = await getMongoDatabase();
  const result = await database.collection<StoredPasswordReset>(passwordResetCollectionName).findOneAndUpdate(
    {
      scope,
      tokenHash: hashToken(token),
      expiresAt: { $gt: new Date() },
      usedAt: { $exists: false }
    },
    { $set: { usedAt: new Date() } },
    { returnDocument: "after" }
  );

  return result?.userId ?? null;
}
