export type FailureTransportMode = "disabled" | "rest";

export type RestFailureTransportRuntimeConfig = {
  endpoint: URL;
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

const requestedMode = process.env.FAILURE_TRANSPORT_MODE?.trim().toLowerCase();
export const failureTransportMode: FailureTransportMode = requestedMode === "rest" ? "rest" : "disabled";

function parseEndpoint() {
  const raw = process.env.REST_FAILURE_TRANSPORT_URL?.trim() ?? "";
  if (!raw) {
    throw configError(
      "FAILURE_TRANSPORT_URL_REQUIRED",
      "REST_FAILURE_TRANSPORT_URL is required when FAILURE_TRANSPORT_MODE=rest."
    );
  }

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw configError("FAILURE_TRANSPORT_URL_INVALID", "Failure transport URL must be an absolute HTTP(S) URL.");
  }

  if (url.username || url.password || url.hash) {
    throw configError(
      "FAILURE_TRANSPORT_URL_INVALID",
      "Failure transport URL must not contain credentials or a fragment."
    );
  }

  const hostname = url.hostname.toLowerCase();
  const localDevelopmentTarget = hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
  if (process.env.NODE_ENV === "production" && url.protocol !== "https:") {
    throw configError("FAILURE_TRANSPORT_HTTPS_REQUIRED", "Failure transport must use HTTPS in production.");
  }
  if (
    url.protocol !== "https:" &&
    !(process.env.NODE_ENV !== "production" && url.protocol === "http:" && localDevelopmentTarget)
  ) {
    throw configError(
      "FAILURE_TRANSPORT_URL_INVALID",
      "Failure transport must use HTTPS, except HTTP localhost during development."
    );
  }

  return url;
}

export function getRestFailureTransportRuntimeConfig(): RestFailureTransportRuntimeConfig {
  const bearerToken = process.env.REST_FAILURE_TRANSPORT_BEARER_TOKEN?.trim() ?? "";
  if (process.env.NODE_ENV === "production" && bearerToken && bearerToken.length < 16) {
    throw configError(
      "FAILURE_TRANSPORT_TOKEN_INVALID",
      "REST_FAILURE_TRANSPORT_BEARER_TOKEN must contain at least 16 characters when configured in production."
    );
  }

  return {
    endpoint: parseEndpoint(),
    bearerToken,
    timeoutMs: clampInteger(process.env.REST_FAILURE_TRANSPORT_TIMEOUT_MS, 3_000, 500, 10_000),
    maxResponseBytes: clampInteger(process.env.REST_FAILURE_TRANSPORT_MAX_RESPONSE_BYTES, 65_536, 1_024, 262_144)
  };
}

export function isFailureTransportConfigured() {
  if (failureTransportMode !== "rest") return false;
  try {
    getRestFailureTransportRuntimeConfig();
    return true;
  } catch {
    return false;
  }
}
