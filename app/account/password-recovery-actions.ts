"use server";

import { redirect } from "next/navigation";
import { recordAuthAudit } from "@/lib/auth-security";
import {
  emailConfig,
  isEmailDeliveryConfigured,
  sendPasswordResetEmail
} from "@/lib/email";
import {
  findCustomerPasswordRecoveryAccount,
  resetCustomerPassword
} from "@/lib/password-recovery";
import {
  consumePasswordResetToken,
  createPasswordResetToken
} from "@/lib/password-reset";
import { consumeAuthRateLimit } from "@/lib/security-rate-limit";

function value(formData: FormData, key: string) {
  const item = formData.get(key);
  return typeof item === "string" ? item.trim() : "";
}

function validEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

export async function requestCustomerPasswordResetAction(formData: FormData) {
  const email = value(formData, "email");
  const rateLimit = await consumeAuthRateLimit("customer-password-reset", email);
  if (!rateLimit.allowed) {
    redirect("/account/forgot-password?sent=1");
  }

  if (!validEmail(email)) {
    redirect("/account/forgot-password?sent=1");
  }

  if (!isEmailDeliveryConfigured()) {
    redirect("/account/forgot-password?error=delivery-unavailable");
  }

  const account = await findCustomerPasswordRecoveryAccount(email);
  await recordAuthAudit({
    scope: "customer",
    event: "password_reset_requested",
    subjectId: account?.id,
    email
  });

  if (account) {
    try {
      const reset = await createPasswordResetToken("customer", account.id);
      const resetUrl = `${emailConfig.publicUrl}/account/reset-password?token=${encodeURIComponent(reset.token)}`;
      await sendPasswordResetEmail({
        to: account.email,
        displayName: account.displayName,
        resetUrl,
        scope: "customer",
        locale: account.preferredLocale
      });
    } catch {
      redirect("/account/forgot-password?error=delivery-failed");
    }
  }

  redirect("/account/forgot-password?sent=1");
}

export async function resetCustomerPasswordAction(formData: FormData) {
  const token = value(formData, "token");
  const password = value(formData, "password");
  const confirmation = value(formData, "passwordConfirmation");

  if (!token || password.length < 10 || password.length > 128 || password !== confirmation) {
    redirect(`/account/reset-password?token=${encodeURIComponent(token)}&error=validation`);
  }

  const userId = await consumePasswordResetToken("customer", token);
  if (!userId) {
    redirect("/account/reset-password?error=invalid-token");
  }

  const updated = await resetCustomerPassword(userId, password);
  if (!updated) {
    redirect("/account/reset-password?error=invalid-token");
  }

  redirect("/account/sign-in?reset=success");
}