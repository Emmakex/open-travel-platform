export type CrmSyncMode = "disabled" | "rest";

export type RestCrmRuntimeConfig = {
  baseUrl: URL;
  bearerToken: string;
  timeoutMs: number;
  maxResponseBytes: number;
};

function clampInteger(raw: string | undefined, fallback: number, minimum: number, maximum: number) {
  const parsed = Number.parseInt(raw ?? "", 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(minimum, Math.min(parsed, maximum));
}

function configError(code: string, message: string) {
  return Object.assign(new Error(message), { code });
}

const requestedMode = process.env.CRM_SYNC_MODE?.trim().toLowerCase();
export const crmSyncMode: CrmSyncMode = requestedMode === "rest" ? "rest" : "disabled";

function parseRestBaseUrl() {
  const raw = process.env.REST_CRM_BASE_URL?.trim() ?? "";
  if (!raw) throw configError("CRM_SYNC_BASE_URL_REQUIRED", "REST_CRM_BASE_URL is required when CRM_SYNC_MODE=rest.");

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw configError("CRM_SYNC_BASE_URL_INVALID", "REST CRM base URL must be an absolute HTTP(S) URL.");
  }

  if (url.username || url.password || url.hash || url.search) {
    throw configError("CRM_SYNC_BASE_URL_INVALID", "REST CRM base URL must not contain credentials, a fragment or query parameters.");
  }

  const hostname = url.hostname.toLowerCase();
  const localDevelopmentTarget = hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
  if (process.env.NODE_ENV === "production" && url.protocol !== "https:") {
    throw configError("CRM_SYNC_HTTPS_REQUIRED", "CRM REST APIs must use HTTPS in production.");
  }
  if (url.protocol !== "https:" && !(process.env.NODE_ENV !== "production" && url.protocol === "http:" && localDevelopmentTarget)) {
    throw configError("CRM_SYNC_BASE_URL_INVALID", "CRM REST APIs must use HTTPS, except HTTP localhost during development.");
  }

  if (!url.pathname.endsWith("/")) url.pathname += "/";
  return url;
}

export function getRestCrmRuntimeConfig(): RestCrmRuntimeConfig {
  const bearerToken = process.env.REST_CRM_BEARER_TOKEN?.trim() ?? "";
  if (process.env.NODE_ENV === "production" && bearerToken.length < 16) {
    throw configError("CRM_SYNC_TOKEN_REQUIRED", "REST_CRM_BEARER_TOKEN must contain at least 16 characters in production.");
  }

  return {
    baseUrl: parseRestBaseUrl(),
    bearerToken,
    timeoutMs: clampInteger(process.env.REST_CRM_TIMEOUT_MS, 10_000, 1_000, 30_000),
    maxResponseBytes: clampInteger(process.env.REST_CRM_MAX_RESPONSE_BYTES, 262_144, 8_192, 1_000_000)
  };
}

export function isCrmSyncConfigured() {
  if (crmSyncMode !== "rest") return false;
  try {
    getRestCrmRuntimeConfig();
    return true;
  } catch {
    return false;
  }
}
