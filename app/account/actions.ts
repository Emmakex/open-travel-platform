"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { demoIdentities } from "@/data/demo-identities";
import { DEMO_RESERVATIONS_COOKIE } from "@/lib/booking-config";
import { DEMO_SESSION_COOKIE, identityConfig } from "@/lib/identity-config";
import { DEMO_OPERATIONS_AUDIT_COOKIE } from "@/lib/operations-config";

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

export async function endDemoSession() {
  const cookieStore = await cookies();
  cookieStore.delete(DEMO_SESSION_COOKIE);
  cookieStore.delete(DEMO_RESERVATIONS_COOKIE);
  cookieStore.delete(DEMO_OPERATIONS_AUDIT_COOKIE);
  redirect("/account/sign-in");
}
