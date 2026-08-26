import { createHash, timingSafeEqual } from "node:crypto";

function configuredSecret() {
  const secret = process.env.INTEGRATION_WORKER_SECRET?.trim() ?? "";
  return secret.length >= 32 ? secret : null;
}

export function isIntegrationWorkerAuthConfigured() {
  return Boolean(configuredSecret());
}

function digest(value: string) {
  return createHash("sha256").update(value, "utf8").digest();
}

export function authorizeIntegrationWorkerRequest(request: Request) {
  const expected = configuredSecret();
  if (!expected) return { ok: false as const, status: 503, code: "WORKER_AUTH_NOT_CONFIGURED" };

  const authorization = request.headers.get("authorization") ?? "";
  const match = /^Bearer\s+(.+)$/i.exec(authorization);
  if (!match) return { ok: false as const, status: 401, code: "WORKER_AUTH_REQUIRED" };

  const supplied = match[1].trim();
  const valid = timingSafeEqual(digest(expected), digest(supplied));
  if (!valid) return { ok: false as const, status: 401, code: "WORKER_AUTH_INVALID" };
  return { ok: true as const };
}
