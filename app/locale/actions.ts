"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { localeCookieName } from "@/lib/get-locale";

export async function setLocaleAction(formData: FormData) {
  const requestedLocale = formData.get("locale") === "es" ? "es" : "en";
  const cookieStore = await cookies();

  cookieStore.set(localeCookieName, requestedLocale, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365
  });

  revalidatePath("/", "layout");
}
