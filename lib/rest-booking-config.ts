export type RestBookingRuntimeConfig = {
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

function bookingConfigError(code: string, message: string) {
  return Object.assign(new Error(message), { code });
}

function parseBaseUrl() {
  const raw = process.env.REST_BOOKING_BASE_URL?.trim() ?? "";
  if (!raw) {
    throw bookingConfigError("REST_BOOKING_BASE_URL_REQUIRED", "REST_BOOKING_BASE_URL is required when BOOKING_MODE=rest.");
  }

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw bookingConfigError("REST_BOOKING_BASE_URL_INVALID", "REST_BOOKING_BASE_URL must be an absolute HTTP(S) URL.");
  }

  if (url.username || url.password || url.hash || url.search) {
    throw bookingConfigError("REST_BOOKING_BASE_URL_INVALID", "REST_BOOKING_BASE_URL must not contain credentials, a fragment or query parameters.");
  }

  const hostname = url.hostname.toLowerCase();
  const localDevelopmentTarget = hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
  if (process.env.NODE_ENV === "production" && url.protocol !== "https:") {
    throw bookingConfigError("REST_BOOKING_HTTPS_REQUIRED", "REST booking APIs must use HTTPS in production.");
  }
  if (url.protocol !== "https:" && !(process.env.NODE_ENV !== "production" && url.protocol === "http:" && localDevelopmentTarget)) {
    throw bookingConfigError("REST_BOOKING_BASE_URL_INVALID", "REST booking APIs must use HTTPS, except HTTP localhost during development.");
  }

  if (!url.pathname.endsWith("/")) url.pathname += "/";
  return url;
}

export function getRestBookingRuntimeConfig(): RestBookingRuntimeConfig {
  const bearerToken = process.env.REST_BOOKING_BEARER_TOKEN?.trim() ?? "";
  if (process.env.NODE_ENV === "production" && bearerToken.length < 16) {
    throw bookingConfigError("REST_BOOKING_TOKEN_REQUIRED", "REST_BOOKING_BEARER_TOKEN must contain at least 16 characters in production.");
  }

  return {
    baseUrl: parseBaseUrl(),
    bearerToken,
    timeoutMs: clampInteger(process.env.REST_BOOKING_TIMEOUT_MS, 10_000, 1_000, 30_000),
    maxResponseBytes: clampInteger(process.env.REST_BOOKING_MAX_RESPONSE_BYTES, 2_000_000, 16_384, 5_000_000)
  };
}

export function isRestBookingConfigured() {
  try {
    getRestBookingRuntimeConfig();
    return true;
  } catch {
    return false;
  }
}
