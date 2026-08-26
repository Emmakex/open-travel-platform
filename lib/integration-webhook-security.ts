import { lookup } from "node:dns/promises";
import { createHmac } from "node:crypto";
import { request } from "node:https";
import { isIP } from "node:net";
import type { IntegrationEventEnvelope } from "@/domain/integrations/types";

export type ValidatedWebhookTarget = {
  url: URL;
  address: string;
  family: 4 | 6;
};

function ipv4Number(address: string) {
  const parts = address.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return null;
  return (((parts[0] * 256 + parts[1]) * 256 + parts[2]) * 256 + parts[3]) >>> 0;
}

function ipv4InCidr(address: string, network: string, bits: number) {
  const value = ipv4Number(address);
  const base = ipv4Number(network);
  if (value === null || base === null) return true;
  const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0;
  return (value & mask) === (base & mask);
}

function publicIpv4(address: string) {
  const blocked: Array<[string, number]> = [
    ["0.0.0.0", 8], ["10.0.0.0", 8], ["100.64.0.0", 10], ["127.0.0.0", 8],
    ["169.254.0.0", 16], ["172.16.0.0", 12], ["192.0.0.0", 24], ["192.0.2.0", 24],
    ["192.168.0.0", 16], ["198.18.0.0", 15], ["198.51.100.0", 24], ["203.0.113.0", 24],
    ["224.0.0.0", 4], ["240.0.0.0", 4]
  ];
  return !blocked.some(([network, bits]) => ipv4InCidr(address, network, bits));
}

function normalizedIpv6(address: string) {
  return address.toLowerCase().split("%")[0];
}

function publicIpv6(address: string) {
  const value = normalizedIpv6(address);
  if (value === "::" || value === "::1") return false;
  if (value.startsWith("::ffff:")) return false;
  if (!/^[23]/.test(value)) return false;
  if (value.startsWith("2001:db8:")) return false;
  return true;
}

export function isPublicWebhookAddress(address: string) {
  const family = isIP(address);
  if (family === 4) return publicIpv4(address);
  if (family === 6) return publicIpv6(address);
  return false;
}

export async function validateIntegrationWebhookUrl(raw: string): Promise<ValidatedWebhookTarget> {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    throw Object.assign(new Error("Webhook URL is invalid."), { code: "INTEGRATION_URL_INVALID" });
  }
  if (url.protocol !== "https:") {
    throw Object.assign(new Error("Integration webhook URLs must use HTTPS."), { code: "INTEGRATION_URL_HTTPS_REQUIRED" });
  }
  if (url.username || url.password || url.hash) {
    throw Object.assign(new Error("Webhook URL credentials and fragments are not allowed."), { code: "INTEGRATION_URL_INVALID" });
  }
  const hostname = url.hostname.toLowerCase();
  if (hostname === "localhost" || hostname.endsWith(".localhost") || hostname.endsWith(".local")) {
    throw Object.assign(new Error("Local webhook targets are not allowed."), { code: "INTEGRATION_URL_PRIVATE" });
  }

  const literalFamily = isIP(hostname);
  const addresses = literalFamily
    ? [{ address: hostname, family: literalFamily as 4 | 6 }]
    : await lookup(hostname, { all: true, verbatim: true });
  if (!addresses.length || addresses.some((entry) => !isPublicWebhookAddress(entry.address))) {
    throw Object.assign(new Error("Webhook target resolves to a private or reserved network."), { code: "INTEGRATION_URL_PRIVATE" });
  }
  const target = addresses[0];
  return { url, address: target.address, family: target.family as 4 | 6 };
}

export function signIntegrationWebhook(input: {
  secret: string;
  timestamp: string;
  eventId: string;
  body: string;
}) {
  return createHmac("sha256", input.secret)
    .update(`${input.timestamp}.${input.eventId}.${input.body}`, "utf8")
    .digest("hex");
}

export async function deliverSignedIntegrationWebhook(input: {
  target: ValidatedWebhookTarget;
  secret: string;
  event: IntegrationEventEnvelope;
  timeoutMs?: number;
}) {
  const body = JSON.stringify(input.event);
  const timestamp = new Date().toISOString();
  const signature = signIntegrationWebhook({ secret: input.secret, timestamp, eventId: input.event.id, body });
  const url = input.target.url;
  const timeoutMs = Math.max(1000, Math.min(input.timeoutMs ?? 10000, 30000));

  return new Promise<{ status: number; responseBytes: number }>((resolve, reject) => {
    let responseBytes = 0;
    const req = request({
      protocol: "https:",
      hostname: input.target.address,
      family: input.target.family,
      port: url.port ? Number(url.port) : 443,
      path: `${url.pathname}${url.search}`,
      method: "POST",
      servername: url.hostname,
      rejectUnauthorized: true,
      timeout: timeoutMs,
      headers: {
        Host: url.host,
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body),
        "User-Agent": "Open-Travel-Platform-Integration/1.0",
        "X-OTP-Event-Id": input.event.id,
        "X-OTP-Event-Type": input.event.type,
        "X-OTP-Timestamp": timestamp,
        "X-OTP-Signature": `v1=${signature}`
      }
    }, (res) => {
      res.on("data", (chunk: Buffer) => {
        responseBytes += chunk.length;
        if (responseBytes > 65536) res.destroy(new Error("Webhook response exceeded 64 KiB."));
      });
      res.on("end", () => {
        const status = res.statusCode ?? 0;
        if (status >= 200 && status < 300) resolve({ status, responseBytes });
        else reject(Object.assign(new Error(`Webhook returned HTTP ${status}.`), { code: "INTEGRATION_HTTP_ERROR", status }));
      });
    });
    req.on("timeout", () => req.destroy(new Error("Webhook request timed out.")));
    req.on("error", reject);
    req.end(body);
  });
}
