import { DemoTravelRepository } from "@/adapters/demo-travel-repository";
import { HttpTravelRepository } from "@/adapters/http-travel-repository";
import { MongoTravelRepository } from "@/adapters/mongo-travel-repository";
import { appConfig } from "@/lib/config";
import { travelDataConfig } from "@/lib/travel-data-config";
import type { TravelRepository } from "@/repositories/travel-repository";

export function getTravelRepository(): TravelRepository {
  if (travelDataConfig.mode === "mongodb") {
    return new MongoTravelRepository();
  }

  if (travelDataConfig.mode === "api") {
    if (!appConfig.travelApiUrl) {
      throw new Error(
        "NEXT_PUBLIC_TRAVEL_API_URL is required when TRAVEL_DATA_MODE=api"
      );
    }

    return new HttpTravelRepository(appConfig.travelApiUrl);
  }

  return new DemoTravelRepository();
}
