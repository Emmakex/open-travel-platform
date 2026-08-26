import { timingSafeEqual } from "node:crypto";

function configuredWorkerToken() {
  const token = process.env.KTRAVEL_INTEGRATION_WORKER_TOKEN?.trim() ?? "";
  return token.length >= 32 ? token : "";
}

export function isIntegrationWorkerAuthConfigured() {
  return Boolean(configuredWorkerToken());
}

export function authenticateIntegrationWorkerRequest(request: Request) {
  const configured = configuredWorkerToken();
  if (!configured) return false;
  const authorization = request.headers.get("authorization") ?? "";
  if (!authorization.startsWith("Bearer ")) return false;
  const supplied = authorization.slice("Bearer ".length).trim();
  if (!supplied) return false;
  const expectedBuffer = Buffer.from(configured, "utf8");
  const suppliedBuffer = Buffer.from(supplied, "utf8");
  if (expectedBuffer.length !== suppliedBuffer.length) return false;
  return timingSafeEqual(expectedBuffer, suppliedBuffer);
}
