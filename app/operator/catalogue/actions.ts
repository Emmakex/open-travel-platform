"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { seedDemoCatalogueToMongo } from "@/lib/mongo-travel-admin";
import { requireOperationsIdentity } from "@/lib/require-operations-identity";

export async function seedMongoCatalogueAction() {
  await requireOperationsIdentity();

  try {
    const result = await seedDemoCatalogueToMongo();

    revalidatePath("/");
    revalidatePath("/destinations");
    revalidatePath("/trips");
    revalidatePath("/operator");
    revalidatePath("/operator/catalogue");

    const params = new URLSearchParams({
      seeded: "1",
      destinations: String(result.destinationsInserted),
      trips: String(result.tripsInserted)
    });

    redirect(`/operator/catalogue?${params.toString()}`);
  } catch (error) {
    console.error("Failed to seed MongoDB travel catalogue", error);
    redirect("/operator/catalogue?error=mongodb-seed");
  }
}
