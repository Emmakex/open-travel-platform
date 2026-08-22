"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { demoIdentities } from "@/data/demo-identities";
import { DEMO_RESERVATIONS_COOKIE } from "@/lib/booking-config";
import {
  authenticateCustomer,
  createCustomerSession,
  registerCustomer,
  revokeCustomerSession,
  updateCustomerProfile
} from "@/lib/customer-auth";
import { getLocale, localeCookieName } from "@/lib/get-locale";
import {
  DEMO_SESSION_COOKIE,
  KTRAVEL_SESSION_COOKIE,
  identityConfig
} from "@/lib/identity-config";
import { DEMO_OPERATIONS_AUDIT_COOKIE } from "@/lib/operations-config";
import { requireCustomerIdentity } from "@/lib/require-customer-identity";

function value(formData: FormData, key: string) {
  const item = formData.get(key);
  return typeof item === "string" ? item.trim() : "";
}

function validEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

async function setCustomerSessionCookie(token: string, expiresAt: Date) {
  const cookieStore = await cookies();
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
  if (!identityConfig.customerAuthEnabled) {
    redirect("/account/sign-in?error=registration-disabled");
  }

  const firstName = value(formData, "firstName");
  const lastName = value(formData, "lastName");
  const email = value(formData, "email");
  const password = value(formData, "password");
  const country = value(formData, "country");

  if (
    !firstName || firstName.length > 80 ||
    !lastName || lastName.length > 80 ||
    !validEmail(email) ||
    password.length < 10 || password.length > 128 ||
    country.length > 80
  ) {
    redirect("/account/register?error=validation");
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
      redirect("/account/register?error=email-exists");
    }
    throw error;
  }

  redirect("/account?created=1");
}

export async function signInCustomerAction(formData: FormData) {
  if (!identityConfig.customerAuthEnabled) {
    redirect("/account/sign-in?error=auth-disabled");
  }

  const email = value(formData, "email");
  const password = value(formData, "password");

  if (!validEmail(email) || !password) {
    redirect("/account/sign-in?error=invalid-credentials");
  }

  const user = await authenticateCustomer(email, password);
  if (!user) {
    redirect("/account/sign-in?error=invalid-credentials");
  }

  const session = await createCustomerSession(user.id);
  await setCustomerSessionCookie(session.token, session.expiresAt);
  redirect("/account");
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
  const cookieStore = await cookies();
  const mongoToken = cookieStore.get(KTRAVEL_SESSION_COOKIE)?.value;

  if (mongoToken) {
    await revokeCustomerSession(mongoToken).catch(() => undefined);
  }

  cookieStore.delete(KTRAVEL_SESSION_COOKIE);
  cookieStore.delete(DEMO_SESSION_COOKIE);
  cookieStore.delete(DEMO_RESERVATIONS_COOKIE);
  cookieStore.delete(DEMO_OPERATIONS_AUDIT_COOKIE);
  redirect("/account/sign-in");
}
