import { cookies } from "next/headers";
import type { TravelLocale } from "@/domain/travel/types";

export const localeCookieName = "kairoseth_travel_locale";

export async function getLocale(): Promise<TravelLocale> {
  const cookieStore = await cookies();
  return cookieStore.get(localeCookieName)?.value === "es" ? "es" : "en";
}
