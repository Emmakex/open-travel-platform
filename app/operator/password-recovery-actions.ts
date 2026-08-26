"use server";

import { redirect } from "next/navigation";
import { recordAuthAudit } from "@/lib/auth-security";
import {
  emailConfig,
  isEmailDeliveryConfigured,
  sendPasswordResetEmail
} from "@/lib/email";
import {
  findStaffPasswordRecoveryAccount,
  resetStaffPassword
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

export async function requestStaffPasswordResetAction(formData: FormData) {
  const email = value(formData, "email");
  const rateLimit = await consumeAuthRateLimit("staff-password-reset", email);
  if (!rateLimit.allowed) {
    redirect("/operator/forgot-password?sent=1");
  }

  if (!validEmail(email)) {
    redirect("/operator/forgot-password?sent=1");
  }

  if (!isEmailDeliveryConfigured()) {
    redirect("/operator/forgot-password?error=delivery-unavailable");
  }

  const account = await findStaffPasswordRecoveryAccount(email);
  await recordAuthAudit({
    scope: "staff",
    event: "password_reset_requested",
    subjectId: account?.id,
    email
  });

  if (account) {
    try {
      const reset = await createPasswordResetToken("staff", account.id);
      const resetUrl = `${emailConfig.publicUrl}/operator/reset-password?token=${encodeURIComponent(reset.token)}`;
      await sendPasswordResetEmail({
        to: account.email,
        displayName: account.displayName,
        resetUrl,
        scope: "staff",
        locale: "en"
      });
    } catch {
      redirect("/operator/forgot-password?error=delivery-failed");
    }
  }

  redirect("/operator/forgot-password?sent=1");
}

export async function resetStaffPasswordAction(formData: FormData) {
  const token = value(formData, "token");
  const password = value(formData, "password");
  const confirmation = value(formData, "passwordConfirmation");

  if (!token || password.length < 12 || password.length > 128 || password !== confirmation) {
    redirect(`/operator/reset-password?token=${encodeURIComponent(token)}&error=validation`);
  }

  const userId = await consumePasswordResetToken("staff", token);
  if (!userId) {
    redirect("/operator/reset-password?error=invalid-token");
  }

  const updated = await resetStaffPassword(userId, password);
  if (!updated) {
    redirect("/operator/reset-password?error=invalid-token");
  }

  redirect("/operator/sign-in?reset=success");
}