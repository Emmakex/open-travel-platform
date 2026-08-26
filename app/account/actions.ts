"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { demoIdentities } from "@/data/demo-identities";
import { recordAuthAudit } from "@/lib/auth-security";
import { DEMO_RESERVATIONS_COOKIE } from "@/lib/booking-config";
import {
  authenticateCustomer,
  changeCustomerPassword,
  createCustomerSession,
  registerCustomer,
  revokeCustomerSession,
  updateCustomerProfile
} from "@/lib/customer-auth";
import { getLocale, localeCookieName } from "@/lib/get-locale";
import {
  DEMO_SESSION_COOKIE,
  KTRAVEL_SESSION_COOKIE,
  KTRAVEL_STAFF_SESSION_COOKIE,
  identityConfig
} from "@/lib/identity-config";
import { DEMO_OPERATIONS_AUDIT_COOKIE } from "@/lib/operations-config";
import { requireCustomerIdentity } from "@/lib/require-customer-identity";
import { consumeAuthRateLimit } from "@/lib/security-rate-limit";
import { revokeStaffSession } from "@/lib/staff-auth";

function value(formData: FormData, key: string) {
  const item = formData.get(key);
  return typeof item === "string" ? item.trim() : "";
}

function validEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

function safeNextPath(value: string) {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return "";
  return value.length <= 1000 ? value : "";
}

function authErrorPath(base: string, error: string, next: string) {
  return `${base}?error=${encodeURIComponent(error)}${next ? `&next=${encodeURIComponent(next)}` : ""}`;
}

async function setCustomerSessionCookie(token: string, expiresAt: Date) {
  const cookieStore = await cookies();
  const staffToken = cookieStore.get(KTRAVEL_STAFF_SESSION_COOKIE)?.value;

  if (staffToken) {
    await revokeStaffSession(staffToken).catch(() => undefined);
    cookieStore.delete(KTRAVEL_STAFF_SESSION_COOKIE);
  }

  cookieStore.delete(DEMO_SESSION_COOKIE);
  cookieStore.set(KTRAVEL_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt
  });
}

export async function registerCustomerAction(formData: FormData) {
  const next = safeNextPath(value(formData, "next"));
  if (!identityConfig.customerAuthEnabled) {
    redirect(authErrorPath("/account/sign-in", "registration-disabled", next));
  }

  const firstName = value(formData, "firstName");
  const lastName = value(formData, "lastName");
  const email = value(formData, "email");
  const password = value(formData, "password");
  const country = value(formData, "country");
  const rateLimit = await consumeAuthRateLimit("customer-register", email);
  if (!rateLimit.allowed) {
    redirect(authErrorPath("/account/register", "rate-limited", next));
  }

  if (
    !firstName || firstName.length > 80 ||
    !lastName || lastName.length > 80 ||
    !validEmail(email) ||
    password.length < 10 || password.length > 128 ||
    country.length > 80
  ) {
    redirect(authErrorPath("/account/register", "validation", next));
  }

  try {
    const locale = await getLocale();
    const user = await registerCustomer({
      email,
      password,
      firstName,
      lastName,
      country: country || undefined,
      preferredLocale: locale
    });
    const session = await createCustomerSession(user.id);
    await setCustomerSessionCookie(session.token, session.expiresAt);
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "EMAIL_EXISTS") {
      redirect(authErrorPath("/account/register", "email-exists", next));
    }
    throw error;
  }

  redirect(next || "/account?created=1");
}

export async function signInCustomerAction(formData: FormData) {
  const next = safeNextPath(value(formData, "next"));
  if (!identityConfig.customerAuthEnabled) {
    redirect(authErrorPath("/account/sign-in", "auth-disabled", next));
  }

  const email = value(formData, "email");
  const password = value(formData, "password");
  const rateLimit = await consumeAuthRateLimit("customer-sign-in", email);
  if (!rateLimit.allowed) {
    redirect(authErrorPath("/account/sign-in", "rate-limited", next));
  }

  if (!validEmail(email) || !password) {
    redirect(authErrorPath("/account/sign-in", "invalid-credentials", next));
  }

  const user = await authenticateCustomer(email, password);
  if (!user) {
    redirect(authErrorPath("/account/sign-in", "invalid-credentials", next));
  }

  const session = await createCustomerSession(user.id);
  await setCustomerSessionCookie(session.token, session.expiresAt);
  redirect(next || "/account");
}

export async function updateCustomerProfileAction(formData: FormData) {
  if (!identityConfig.customerAuthEnabled) {
    redirect("/account?error=profile-disabled");
  }

  const identity = await requireCustomerIdentity();
  const firstName = value(formData, "firstName");
  const lastName = value(formData, "lastName");
  const phone = value(formData, "phone");
  const country = value(formData, "country");
  const preferredLocale = value(formData, "preferredLocale");

  if (
    !firstName || firstName.length > 80 ||
    !lastName || lastName.length > 80 ||
    phone.length > 40 ||
    country.length > 80 ||
    (preferredLocale !== "en" && preferredLocale !== "es")
  ) {
    redirect("/account/profile?error=validation");
  }

  const updated = await updateCustomerProfile(identity.id, {
    firstName,
    lastName,
    phone: phone || undefined,
    country: country || undefined,
    preferredLocale
  });

  if (!updated) {
    redirect("/account/profile?error=not-found");
  }

  const cookieStore = await cookies();
  cookieStore.set(localeCookieName, preferredLocale, {
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365
  });

  redirect("/account?profile=updated");
}

export async function changeCustomerPasswordAction(formData: FormData) {
  if (!identityConfig.customerAuthEnabled) {
    redirect("/account/security?error=auth-disabled");
  }

  const identity = await requireCustomerIdentity();
  const currentPassword = value(formData, "currentPassword");
  const newPassword = value(formData, "newPassword");
  const confirmPassword = value(formData, "confirmPassword");

  if (
    !currentPassword ||
    newPassword.length < 10 ||
    newPassword.length > 128 ||
    newPassword !== confirmPassword ||
    newPassword === currentPassword
  ) {
    redirect("/account/security?error=validation");
  }

  const changed = await changeCustomerPassword(identity.id, currentPassword, newPassword);
  if (!changed) {
    redirect("/account/security?error=current-password");
  }

  const session = await createCustomerSession(identity.id);
  await setCustomerSessionCookie(session.token, session.expiresAt);
  redirect("/account/security?changed=1");
}

export async function startDemoSession() {
  if (!identityConfig.demoSessionEnabled) {
    redirect("/account/sign-in?demo=disabled");
  }

  const cookieStore = await cookies();
  cookieStore.set(DEMO_SESSION_COOKIE, demoIdentities.customer.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8
  });

  redirect("/account");
}

export async function endCustomerSession() {
  const identity = await requireCustomerIdentity();
  const cookieStore = await cookies();
  const mongoToken = cookieStore.get(KTRAVEL_SESSION_COOKIE)?.value;

  if (mongoToken) {
    await revokeCustomerSession(mongoToken).catch(() => undefined);
    await recordAuthAudit({
      scope: "customer",
      event: "sign_out",
      subjectId: identity.id,
      email: identity.email
    }).catch(() => undefined);
  }

  cookieStore.delete(KTRAVEL_SESSION_COOKIE);
  cookieStore.delete(DEMO_SESSION_COOKIE);
  cookieStore.delete(DEMO_RESERVATIONS_COOKIE);
  cookieStore.delete(DEMO_OPERATIONS_AUDIT_COOKIE);
  redirect("/account/sign-in");
}