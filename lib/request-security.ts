import { isIP } from "node:net";

const allowedOriginListVariable = "KTRAVEL_ALLOWED_BROWSER_ORIGINS";
const trustProxyIpVariable = "KTRAVEL_TRUST_PROXY_IP_HEADERS";

type HeaderReader = Pick<Headers, "get">;

function parseOrigin(value: string | undefined | null) {
  if (!value || value === "null") return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.origin;
  } catch {
    return null;
  }
}

function configuredBrowserOrigins() {
  const values = (process.env[allowedOriginListVariable] ?? "")
    .split(",")
    .map((value) => parseOrigin(value.trim()))
    .filter((value): value is string => Boolean(value));

  const publicOrigin = parseOrigin(process.env.KTRAVEL_PUBLIC_URL);
  if (publicOrigin) values.push(publicOrigin);
  return new Set(values);
}

/**
 * Cookie-authenticated Route Handlers must reject cross-origin browser writes.
 * Next Server Actions already enforce their own Origin/Host checks, so this
 * helper is intentionally limited to explicit Route Handlers.
 */
export function browserMutationHasTrustedOrigin(request: Request) {
  const origin = parseOrigin(request.headers.get("origin"));
  if (!origin) return false;

  const allowed = configuredBrowserOrigins();
  const requestOrigin = parseOrigin(request.url);
  if (requestOrigin) allowed.add(requestOrigin);

  if (!allowed.has(origin)) return false;

  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite && fetchSite !== "same-origin" && fetchSite !== "same-site") {
    return false;
  }

  return true;
}

function firstForwardedAddress(value: string | null) {
  return value?.split(",")[0]?.trim() ?? "";
}

/**
 * Proxy-provided client IPs are security-sensitive and therefore opt-in.
 * Enable KTRAVEL_TRUST_PROXY_IP_HEADERS only when the deployment edge strips
 * user supplied forwarding headers and writes trusted values itself.
 */
export function getTrustedProxyClientIp(headers: HeaderReader) {
  if ((process.env[trustProxyIpVariable] ?? "").trim().toLowerCase() !== "true") {
    return null;
  }

  const candidates = [
    headers.get("cf-connecting-ip")?.trim() ?? "",
    headers.get("x-real-ip")?.trim() ?? "",
    firstForwardedAddress(headers.get("x-forwarded-for"))
  ];

  for (const candidate of candidates) {
    if (candidate && isIP(candidate)) return candidate;
  }
  return null;
}
