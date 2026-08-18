"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DEMO_SESSION_COOKIE, identityConfig } from "@/lib/identity-config";

const DEMO_IDENTITY_ID = "demo-customer";

export async function startDemoSession() {
  if (!identityConfig.demoSessionEnabled) {
    redirect("/account/sign-in?demo=disabled");
  }

  const cookieStore = await cookies();
  cookieStore.set(DEMO_SESSION_COOKIE, DEMO_IDENTITY_ID, {
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
  redirect("/account/sign-in");
}
