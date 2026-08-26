import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const assert = (condition, message) => {
  if (!condition) throw new Error(`Production security invariant failed: ${message}`);
};

const nextConfig = read("next.config.ts");
const requestSecurity = read("lib/request-security.ts");
const rateLimit = read("lib/security-rate-limit.ts");
const readiness = read("lib/production-readiness.ts");
const customerActions = read("app/account/actions.ts");
const staffActions = read("app/operator/actions.ts");
const customerRecovery = read("app/account/password-recovery-actions.ts");
const staffRecovery = read("app/operator/password-recovery-actions.ts");
const mediaRoute = read("app/api/operator/media/route.ts");
const mediaDeleteRoute = read("app/api/operator/media/[id]/route.ts");
const protectedExportRoute = read("app/operator/reports/protected-travellers/export/route.ts");
const stripeWebhook = read("app/api/payments/stripe/webhook/route.ts");
const redsysWebhook = read("app/api/payments/redsys/notify/route.ts");
const workerRoute = read("app/api/internal/integrations/process/route.ts");
const liveRoute = read("app/api/health/live/route.ts");
const readyRoute = read("app/api/health/ready/route.ts");
const customerAuth = read("lib/customer-auth.ts");
const staffAuth = read("lib/staff-auth.ts");
const envExample = read(".env.example");

for (const header of [
  "Content-Security-Policy",
  "Referrer-Policy",
  "X-Content-Type-Options",
  "X-Frame-Options",
  "Permissions-Policy",
  "Strict-Transport-Security"
]) {
  assert(nextConfig.includes(header), `global header ${header} must be configured`);
}
assert(nextConfig.includes("frame-ancestors 'none'"), "CSP must block framing");
assert(nextConfig.includes("object-src 'none'"), "CSP must disable object/embed content");
assert(nextConfig.includes("form-action 'self' https:"), "CSP must retain HTTPS external payment form compatibility");
assert(!nextConfig.includes("'unsafe-eval'"), "production CSP must not allow unsafe-eval");
assert(nextConfig.includes("isProduction") && nextConfig.includes("upgrade-insecure-requests"), "HTTPS upgrade/HSTS must be production-aware");

assert(requestSecurity.includes('request.headers.get("origin")'), "browser mutation helper must require Origin");
assert(requestSecurity.includes("KTRAVEL_ALLOWED_BROWSER_ORIGINS"), "explicit additional origins must be configurable");
assert(requestSecurity.includes("KTRAVEL_PUBLIC_URL"), "canonical public origin must be accepted");
assert(requestSecurity.includes("KTRAVEL_TRUST_PROXY_IP_HEADERS"), "proxy IP trust must be explicit");
assert(requestSecurity.includes("isIP(candidate)"), "trusted proxy addresses must be validated as IPs");
assert(!requestSecurity.includes("*\""), "origin helper must not introduce wildcard origins");

for (const [name, source] of [
  ["media upload", mediaRoute],
  ["media delete", mediaDeleteRoute],
  ["protected traveller export", protectedExportRoute]
]) {
  assert(source.includes("browserMutationHasTrustedOrigin"), `${name} must validate browser Origin`);
  assert(source.indexOf("browserMutationHasTrustedOrigin") < source.indexOf("getCurrentIdentity") || !source.includes("getCurrentIdentity"), `${name} origin validation must occur before authenticated mutation work`);
}
assert(!stripeWebhook.includes("browserMutationHasTrustedOrigin"), "Stripe webhook must remain provider-signature authenticated, not browser-origin authenticated");
assert(!redsysWebhook.includes("browserMutationHasTrustedOrigin"), "Redsys callback must remain provider-signature authenticated, not browser-origin authenticated");
assert(workerRoute.includes("authenticateIntegrationWorkerRequest"), "internal worker must retain Bearer authentication");

assert(rateLimit.includes("travel_security_rate_limits"), "persistent security rate-limit collection must exist");
assert(rateLimit.includes('createHash("sha256")'), "rate-limit identifiers must be hashed");
assert(rateLimit.includes("expireAfterSeconds: 0"), "rate-limit storage must use TTL cleanup");
assert(rateLimit.includes("$inc: { count: 1 }"), "rate-limit consumption must be atomic");
assert(rateLimit.includes("getTrustedProxyClientIp"), "client buckets must use only explicitly trusted proxy IPs");
assert(!/email\s*:\s*string/.test(rateLimit), "rate-limit records must not define raw email fields");
assert(!/ip\s*:\s*string/.test(rateLimit), "rate-limit records must not define raw IP fields");

for (const [scope, source] of [
  ["customer-sign-in", customerActions],
  ["customer-register", customerActions],
  ["staff-sign-in", staffActions],
  ["customer-password-reset", customerRecovery],
  ["staff-password-reset", staffRecovery]
]) {
  assert(source.includes(`consumeAuthRateLimit(\"${scope}\"`), `${scope} must be rate limited`);
}
assert(customerRecovery.includes('/account/forgot-password?sent=1'), "customer recovery throttling must preserve non-enumerating response");
assert(staffRecovery.includes('/operator/forgot-password?sent=1'), "staff recovery throttling must preserve non-enumerating response");

for (const [name, source] of [["customer", customerAuth], ["staff", staffAuth]]) {
  assert(source.includes('createHash("sha256")') && source.includes("hashSessionToken"), `${name} sessions must persist only token hashes`);
  assert(source.includes("expireAfterSeconds: 0"), `${name} sessions must have TTL expiry indexes`);
}
assert(customerActions.includes("httpOnly: true") && customerActions.includes('sameSite: "lax"'), "customer session cookie must remain HttpOnly/SameSite");
assert(staffActions.includes("httpOnly: true") && staffActions.includes('sameSite: "strict"'), "staff session cookie must remain HttpOnly/Strict");
assert(customerActions.includes('secure: process.env.NODE_ENV === "production"'), "customer session cookie must be Secure in production");
assert(staffActions.includes('secure: process.env.NODE_ENV === "production"'), "staff session cookie must be Secure in production");

assert(liveRoute.includes('{ status: "ok" }') && liveRoute.includes("no-store"), "liveness endpoint must be cheap and non-cacheable");
assert(readyRoute.includes("getProductionReadiness") && readyRoute.includes("503"), "readiness endpoint must fail with 503 when dependencies/configuration are not ready");
assert(readiness.includes("KTRAVEL_DEPLOYMENT_PROFILE"), "readiness must support explicit demo/live profiles");
assert(readiness.includes("liveProfileUsesDemoCapability"), "live readiness must reject demo capabilities");
assert(readiness.includes("db.command({ ping: 1 })"), "readiness must ping MongoDB when configured capabilities require it");
assert(readiness.includes("KTRAVEL_INTEGRATION_WORKER_TOKEN"), "readiness must verify worker configuration for outbound REST adapters");

for (const variable of [
  "KTRAVEL_DEPLOYMENT_PROFILE",
  "KTRAVEL_ALLOWED_BROWSER_ORIGINS",
  "KTRAVEL_TRUST_PROXY_IP_HEADERS"
]) {
  assert(envExample.includes(`${variable}=`), `${variable} must be documented in .env.example`);
}

console.log("Production security invariant check passed.");
