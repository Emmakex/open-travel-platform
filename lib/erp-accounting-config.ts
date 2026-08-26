export type ErpAccountingMode = "disabled" | "rest";

export type RestErpAccountingRuntimeConfig = {
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

const requestedMode = process.env.ERP_ACCOUNTING_MODE?.trim().toLowerCase();
export const erpAccountingMode: ErpAccountingMode = requestedMode === "rest" ? "rest" : "disabled";

function parseRestBaseUrl() {
  const raw = process.env.REST_ERP_ACCOUNTING_BASE_URL?.trim() ?? "";
  if (!raw) {
    throw configError(
      "ERP_ACCOUNTING_BASE_URL_REQUIRED",
      "REST_ERP_ACCOUNTING_BASE_URL is required when ERP_ACCOUNTING_MODE=rest."
    );
  }

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw configError("ERP_ACCOUNTING_BASE_URL_INVALID", "REST ERP/accounting base URL must be an absolute HTTP(S) URL.");
  }

  if (url.username || url.password || url.hash || url.search) {
    throw configError(
      "ERP_ACCOUNTING_BASE_URL_INVALID",
      "REST ERP/accounting base URL must not contain credentials, a fragment or query parameters."
    );
  }

  const hostname = url.hostname.toLowerCase();
  const localDevelopmentTarget = hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
  if (process.env.NODE_ENV === "production" && url.protocol !== "https:") {
    throw configError("ERP_ACCOUNTING_HTTPS_REQUIRED", "ERP/accounting REST APIs must use HTTPS in production.");
  }
  if (
    url.protocol !== "https:" &&
    !(process.env.NODE_ENV !== "production" && url.protocol === "http:" && localDevelopmentTarget)
  ) {
    throw configError(
      "ERP_ACCOUNTING_BASE_URL_INVALID",
      "ERP/accounting REST APIs must use HTTPS, except HTTP localhost during development."
    );
  }

  if (!url.pathname.endsWith("/")) url.pathname += "/";
  return url;
}

export function getRestErpAccountingRuntimeConfig(): RestErpAccountingRuntimeConfig {
  const bearerToken = process.env.REST_ERP_ACCOUNTING_BEARER_TOKEN?.trim() ?? "";
  if (process.env.NODE_ENV === "production" && bearerToken.length < 16) {
    throw configError(
      "ERP_ACCOUNTING_TOKEN_REQUIRED",
      "REST_ERP_ACCOUNTING_BEARER_TOKEN must contain at least 16 characters in production."
    );
  }

  return {
    baseUrl: parseRestBaseUrl(),
    bearerToken,
    timeoutMs: clampInteger(process.env.REST_ERP_ACCOUNTING_TIMEOUT_MS, 10_000, 1_000, 30_000),
    maxResponseBytes: clampInteger(process.env.REST_ERP_ACCOUNTING_MAX_RESPONSE_BYTES, 262_144, 8_192, 1_000_000)
  };
}

export function isErpAccountingConfigured() {
  if (erpAccountingMode !== "rest") return false;
  try {
    getRestErpAccountingRuntimeConfig();
    return true;
  } catch {
    return false;
  }
}
