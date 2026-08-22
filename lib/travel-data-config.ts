export type TravelDataMode = "demo" | "api" | "mongodb";

const publicMode = process.env.NEXT_PUBLIC_DATA_MODE ?? "demo";
const rawServerMode = process.env.TRAVEL_DATA_MODE ?? publicMode;

function normalizeMode(value: string): TravelDataMode {
  if (value === "api" || value === "mongodb") return value;
  return "demo";
}

export const travelDataConfig = {
  mode: normalizeMode(rawServerMode),
  publicMode: publicMode === "api" ? "api" : "demo"
};
