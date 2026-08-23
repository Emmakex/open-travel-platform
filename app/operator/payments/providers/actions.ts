"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { PaymentEnvironment } from "@/lib/payment-provider-config";
import {
  saveRedsysProvider,
  saveStripeProvider
} from "@/lib/payment-provider-config";
import { requireAdminIdentity } from "@/lib/require-admin-identity";

function value(formData: FormData, key: string) {
  const item = formData.get(key);
  return typeof item === "string" ? item.trim() : "";
}

function checked(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

function environment(raw: string): PaymentEnvironment {
  return raw === "live" ? "live" : "test";
}

function safeError(error: unknown) {
  const message = error instanceof Error ? error.message : "Unable to save payment provider settings.";
  return encodeURIComponent(message.slice(0, 220));
}

export async function saveStripeProviderAction(formData: FormData) {
  const identity = await requireAdminIdentity();
  const editingEnvironment = environment(value(formData, "environment"));

  try {
    await saveStripeProvider({
      enabled: checked(formData, "enabled"),
      activeEnvironment: environment(value(formData, "activeEnvironment")),
      environment: editingEnvironment,
      publishableKey: value(formData, "publishableKey"),
      apiKey: value(formData, "apiKey") || undefined,
      webhookSecret: value(formData, "webhookSecret") || undefined,
      clearApiKey: checked(formData, "clearApiKey"),
      clearWebhookSecret: checked(formData, "clearWebhookSecret"),
      actorIdentityId: identity.id,
      actorRole: identity.role
    });
  } catch (error) {
    redirect(`/operator/payments/providers?error=${safeError(error)}#stripe`);
  }

  revalidatePath("/operator/payments/providers");
  revalidatePath("/operator/payments");
  redirect(`/operator/payments/providers?saved=stripe&environment=${editingEnvironment}#stripe`);
}

export async function saveRedsysProviderAction(formData: FormData) {
  const identity = await requireAdminIdentity();
  const editingEnvironment = environment(value(formData, "environment"));

  try {
    await saveRedsysProvider({
      enabled: checked(formData, "enabled"),
      activeEnvironment: environment(value(formData, "activeEnvironment")),
      environment: editingEnvironment,
      merchantCode: value(formData, "merchantCode"),
      terminal: value(formData, "terminal"),
      signingKey: value(formData, "signingKey") || undefined,
      clearSigningKey: checked(formData, "clearSigningKey"),
      actorIdentityId: identity.id,
      actorRole: identity.role
    });
  } catch (error) {
    redirect(`/operator/payments/providers?error=${safeError(error)}#redsys`);
  }

  revalidatePath("/operator/payments/providers");
  revalidatePath("/operator/payments");
  redirect(`/operator/payments/providers?saved=redsys&environment=${editingEnvironment}#redsys`);
}
