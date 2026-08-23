import { createHmac, timingSafeEqual } from "node:crypto";
import type { CheckoutOrder } from "@/domain/payment/checkout-types";
import type { StripeRuntimeCredentials } from "@/lib/payment-provider-config";
import { publicPaymentBaseUrl } from "@/lib/payment-checkout";

export type StripeCheckoutSession = {
  id: string;
  url?: string | null;
  status?: "open" | "complete" | "expired";
  payment_status?: "paid" | "unpaid" | "no_payment_required";
  amount_total?: number | null;
  currency?: string | null;
  metadata?: Record<string, string> | null;
};

export type StripeWebhookEvent = {
  id: string;
  type: string;
  data: { object: StripeCheckoutSession };
};

const ZERO_DECIMAL_CURRENCIES = new Set([
  "bif", "clp", "djf", "gnf", "jpy", "kmf", "krw", "mga", "pyg", "rwf", "ugx", "vnd", "vuv", "xaf", "xof", "xpf"
]);

export function toMinorUnits(amount: number, currency: string) {
  const factor = ZERO_DECIMAL_CURRENCIES.has(currency.toLowerCase()) ? 1 : 100;
  return Math.round(amount * factor);
}

async function stripeRequest<T>(apiKey: string, path: string, init?: RequestInit) {
  const response = await fetch(`https://api.stripe.com${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      ...(init?.headers ?? {})
    },
    cache: "no-store"
  });
  const payload = await response.json().catch(() => null) as (T & { error?: { message?: string } }) | null;
  if (!response.ok || !payload) {
    throw new Error(payload?.error?.message || `Stripe request failed with HTTP ${response.status}.`);
  }
  return payload as T;
}

export async function createStripeCheckoutSession(input: {
  order: CheckoutOrder;
  credentials: StripeRuntimeCredentials;
  customerEmail: string;
}) {
  const { order, credentials } = input;
  const base = publicPaymentBaseUrl();
  const params = new URLSearchParams();
  params.set("mode", "payment");
  params.set("success_url", `${base}/account/checkout/return?checkout=${encodeURIComponent(order.id)}&provider=stripe&session_id={CHECKOUT_SESSION_ID}`);
  params.set("cancel_url", `${base}/account/checkout/return?checkout=${encodeURIComponent(order.id)}&provider=stripe&result=cancelled`);
  params.set("client_reference_id", order.id);
  params.set("customer_email", input.customerEmail);
  params.set("line_items[0][quantity]", "1");
  params.set("line_items[0][price_data][currency]", order.currency.toLowerCase());
  params.set("line_items[0][price_data][unit_amount]", String(toMinorUnits(order.amount, order.currency)));
  params.set("line_items[0][price_data][product_data][name]", order.targetLabel.slice(0, 120));
  params.set("metadata[ktravel_checkout_id]", order.id);
  params.set("metadata[ktravel_target_type]", order.targetType);
  params.set("metadata[ktravel_target_id]", order.targetId);

  return stripeRequest<StripeCheckoutSession>(credentials.apiKey, "/v1/checkout/sessions", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString()
  });
}

export function retrieveStripeCheckoutSession(credentials: StripeRuntimeCredentials, sessionId: string) {
  return stripeRequest<StripeCheckoutSession>(
    credentials.apiKey,
    `/v1/checkout/sessions/${encodeURIComponent(sessionId)}`,
    { method: "GET" }
  );
}

function safeEqual(left: string, right: string) {
  const a = Buffer.from(left, "hex");
  const b = Buffer.from(right, "hex");
  return a.length === b.length && a.length > 0 && timingSafeEqual(a, b);
}

export function verifyStripeWebhookSignature(
  rawBody: string,
  signatureHeader: string,
  endpointSecret: string,
  toleranceSeconds = 300
) {
  const pairs = signatureHeader.split(",").map((part) => part.trim().split("=", 2));
  const timestamp = pairs.find(([key]) => key === "t")?.[1];
  const signatures = pairs.filter(([key]) => key === "v1").map(([, value]) => value).filter(Boolean);
  if (!timestamp || !signatures.length || !/^\d+$/.test(timestamp)) return false;

  const timestampNumber = Number(timestamp);
  const now = Math.floor(Date.now() / 1000);
  if (!Number.isFinite(timestampNumber) || Math.abs(now - timestampNumber) > toleranceSeconds) return false;

  const expected = createHmac("sha256", endpointSecret)
    .update(`${timestamp}.${rawBody}`, "utf8")
    .digest("hex");
  return signatures.some((signature) => safeEqual(signature, expected));
}

export function parseStripeWebhookEvent(rawBody: string): StripeWebhookEvent | null {
  try {
    const event = JSON.parse(rawBody) as StripeWebhookEvent;
    if (!event?.id || !event?.type || !event?.data?.object) return null;
    return event;
  } catch {
    return null;
  }
}
