import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { getMongoDatabase } from "@/lib/mongodb";
import { getTrustedProxyClientIp } from "@/lib/request-security";

export const securityRateLimitCollectionName = "travel_security_rate_limits";

export type AuthRateLimitScope =
  | "customer-sign-in"
  | "staff-sign-in"
  | "customer-register"
  | "customer-password-reset"
  | "staff-password-reset";

type StoredSecurityRateLimit = {
  keyHash: string;
  scope: AuthRateLimitScope;
  count: number;
  windowStartedAt: Date;
  expiresAt: Date;
};

type RateLimitPolicy = {
  subjectLimit: number;
  clientLimit: number;
  windowSeconds: number;
};

export const authRateLimitPolicies: Record<AuthRateLimitScope, RateLimitPolicy> = {
  "customer-sign-in": { subjectLimit: 10, clientLimit: 30, windowSeconds: 15 * 60 },
  "staff-sign-in": { subjectLimit: 8, clientLimit: 20, windowSeconds: 15 * 60 },
  "customer-register": { subjectLimit: 3, clientLimit: 10, windowSeconds: 60 * 60 },
  "customer-password-reset": { subjectLimit: 3, clientLimit: 10, windowSeconds: 60 * 60 },
  "staff-password-reset": { subjectLimit: 3, clientLimit: 10, windowSeconds: 60 * 60 }
};

let rateLimitIndexPromise: Promise<void> | null = null;

function hashRateLimitKey(scope: AuthRateLimitScope, kind: "subject" | "client", value: string, windowStartMs: number) {
  return createHash("sha256")
    .update(`${scope}\u0000${kind}\u0000${value}\u0000${windowStartMs}`)
    .digest("hex");
}

function normalizeSubject(value: string) {
  return value.trim().toLowerCase();
}

async function ensureSecurityRateLimitIndexes() {
  if (!rateLimitIndexPromise) {
    rateLimitIndexPromise = (async () => {
      const database = await getMongoDatabase();
      const collection = database.collection<StoredSecurityRateLimit>(securityRateLimitCollectionName);
      await Promise.all([
        collection.createIndex({ keyHash: 1 }, { unique: true, name: "travel_security_rate_limit_key" }),
        collection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0, name: "travel_security_rate_limit_expiry" })
      ]);
    })().catch((error) => {
      rateLimitIndexPromise = null;
      throw error;
    });
  }
  await rateLimitIndexPromise;
}

async function consumeBucket(input: {
  scope: AuthRateLimitScope;
  kind: "subject" | "client";
  value: string;
  limit: number;
  windowSeconds: number;
  now: Date;
}) {
  await ensureSecurityRateLimitIndexes();
  const database = await getMongoDatabase();
  const collection = database.collection<StoredSecurityRateLimit>(securityRateLimitCollectionName);
  const windowMs = input.windowSeconds * 1000;
  const windowStartMs = Math.floor(input.now.getTime() / windowMs) * windowMs;
  const windowStartedAt = new Date(windowStartMs);
  const windowEndsAt = new Date(windowStartMs + windowMs);
  const keyHash = hashRateLimitKey(input.scope, input.kind, input.value, windowStartMs);

  const updated = await collection.findOneAndUpdate(
    { keyHash },
    {
      $setOnInsert: {
        keyHash,
        scope: input.scope,
        windowStartedAt,
        expiresAt: new Date(windowEndsAt.getTime() + windowMs)
      },
      $inc: { count: 1 }
    },
    { upsert: true, returnDocument: "after" }
  );

  const count = updated?.count ?? 1;
  return {
    allowed: count <= input.limit,
    retryAfterSeconds: Math.max(1, Math.ceil((windowEndsAt.getTime() - input.now.getTime()) / 1000))
  };
}

/**
 * Applies a per-subject bucket and, when trusted proxy IP headers are enabled,
 * an additional per-client bucket. Only SHA-256 bucket identifiers are stored;
 * raw email addresses and IP addresses never enter the rate-limit collection.
 */
export async function consumeAuthRateLimit(scope: AuthRateLimitScope, subject: string) {
  const policy = authRateLimitPolicies[scope];
  const now = new Date();
  const normalizedSubject = normalizeSubject(subject) || "invalid-subject";
  const requestHeaders = await headers();
  const trustedClientIp = getTrustedProxyClientIp(requestHeaders);

  const subjectResult = await consumeBucket({
    scope,
    kind: "subject",
    value: normalizedSubject,
    limit: policy.subjectLimit,
    windowSeconds: policy.windowSeconds,
    now
  });

  if (!trustedClientIp) return subjectResult;

  const clientResult = await consumeBucket({
    scope,
    kind: "client",
    value: trustedClientIp,
    limit: policy.clientLimit,
    windowSeconds: policy.windowSeconds,
    now
  });

  return {
    allowed: subjectResult.allowed && clientResult.allowed,
    retryAfterSeconds: Math.max(subjectResult.retryAfterSeconds, clientResult.retryAfterSeconds)
  };
}
