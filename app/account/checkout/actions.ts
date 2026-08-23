"use server";

import { redirect } from "next/navigation";
import type { PaymentTargetType } from "@/domain/payment/types";
import type { PaymentProviderId, StripeRuntimeCredentials } from "@/lib/payment-provider-config";
import { getActivePaymentProviderCredentials } from "@/lib/payment-provider-config";
import {
  createCheckoutOrder,
  finalizeCheckoutOrder,
  setCheckoutProviderReference
} from "@/lib/payment-checkout";
import { createStripeCheckoutSession } from "@/lib/payment-stripe";
import { requireCustomerIdentity } from "@/lib/require-customer-identity";

function value(formData: FormData, key: string) {
  const item = formData.get(key);
  return typeof item === "string" ? item.trim() : "";
}

function targetType(value: string): PaymentTargetType | null {
  return value === "trip" || value === "service" ? value : null;
}

function provider(value: string): PaymentProviderId | null {
  return value === "stripe" || value === "redsys" ? value : null;
}

function checkoutError(error: unknown) {
  if (!error || typeof error !== "object" || !("code" in error)) return "provider-error";
  const code = String((error as { code?: unknown }).code ?? "");
  const map: Record<string, string> = {
    CHECKOUT_TARGET_NOT_FOUND: "not-found",
    CHECKOUT_TARGET_CANCELLED: "cancelled",
    CHECKOUT_PROVIDER_UNAVAILABLE: "provider-unavailable",
    CHECKOUT_ALREADY_PAID: "already-paid",
    CHECKOUT_PAYMENT_PENDING: "payment-pending",
    PAYMENT_EXCEEDS_BALANCE: "payment-pending",
    PAYMENT_TARGET_CANCELLED: "cancelled"
  };
  return map[code] ?? "provider-error";
}

export async function startPaymentCheckoutAction(formData: FormData) {
  const identity = await requireCustomerIdentity();
  const type = targetType(value(formData, "targetType"));
  const targetId = value(formData, "targetId");
  const selectedProvider = provider(value(formData, "provider"));
  const checkoutUrl = type && targetId
    ? `/account/checkout/${type}/${encodeURIComponent(targetId)}`
    : "/account";

  if (!type || !targetId || !selectedProvider) {
    redirect(`${checkoutUrl}?error=invalid-request`);
  }

  let order;
  try {
    order = await createCheckoutOrder({
      identityId: identity.id,
      targetType: type,
      targetId,
      provider: selectedProvider
    });
  } catch (error) {
    redirect(`${checkoutUrl}?error=${checkoutError(error)}`);
  }

  if (selectedProvider === "redsys") {
    redirect(`/account/checkout/redsys/${encodeURIComponent(order.id)}`);
  }

  let externalUrl = "";
  try {
    const credentials = await getActivePaymentProviderCredentials("stripe");
    if (!credentials || credentials.provider !== "stripe" || credentials.environment !== order.environment) {
      throw new Error("Stripe configuration changed while checkout was starting.");
    }
    const session = await createStripeCheckoutSession({
      order,
      credentials: credentials as StripeRuntimeCredentials,
      customerEmail: identity.email
    });
    if (!session.id || !session.url) throw new Error("Stripe did not return a hosted Checkout URL.");
    await setCheckoutProviderReference(order.id, session.id);
    externalUrl = session.url;
  } catch (error) {
    await finalizeCheckoutOrder(order.id, "failed").catch(() => undefined);
    console.error("Stripe checkout initialization failed", error);
    redirect(`${checkoutUrl}?error=provider-error`);
  }

  redirect(externalUrl);
}
