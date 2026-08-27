import { RestFailureTransport } from "@/adapters/rest-failure-transport";
import { failureTransportMode } from "@/lib/failure-transport-config";
import type { FailureTransport } from "@/repositories/failure-transport";

let cachedRestTransport: FailureTransport | undefined;

export function getFailureTransport(): FailureTransport | null {
  if (failureTransportMode !== "rest") return null;
  cachedRestTransport ??= new RestFailureTransport();
  return cachedRestTransport;
}
