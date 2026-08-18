import { DemoTravelRepository } from "@/adapters/demo-travel-repository";
import { HttpTravelRepository } from "@/adapters/http-travel-repository";
import { appConfig } from "@/lib/config";
import type { TravelRepository } from "@/repositories/travel-repository";

export function getTravelRepository(): TravelRepository {
  if (appConfig.dataMode === "api") {
    if (!appConfig.travelApiUrl) {
      throw new Error(
        "NEXT_PUBLIC_TRAVEL_API_URL is required when NEXT_PUBLIC_DATA_MODE=api"
      );
    }

    return new HttpTravelRepository(appConfig.travelApiUrl);
  }

  return new DemoTravelRepository();
}
