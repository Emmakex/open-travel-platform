import { getRestFailureTransportRuntimeConfig } from "@/lib/failure-transport-config";
import type { FailureTransport, FailureTransportEvent } from "@/repositories/failure-transport";

export const failureTransportContractHeader = "X-OTP-Failure-Contract-Version";
export const failureTransportContractVersion = "1";

function transportError(code: string, message: string, status?: number) {
  return Object.assign(new Error(message), { code, ...(status ? { status } : {}) });
}

async function consumeBoundedResponse(response: Response, maximumBytes: number) {
  const contentLength = Number.parseInt(response.headers.get("content-length") ?? "", 10);
  if (Number.isFinite(contentLength) && contentLength > maximumBytes) {
    throw transportError("FAILURE_TRANSPORT_RESPONSE_TOO_LARGE", "Failure transport response exceeded the configured size limit.");
  }
  if (!response.body) return;

  const reader = response.body.getReader();
  let total = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      if (!value) continue;
      total += value.byteLength;
      if (total > maximumBytes) {
        await reader.cancel();
        throw transportError(
          "FAILURE_TRANSPORT_RESPONSE_TOO_LARGE",
          "Failure transport response exceeded the configured size limit."
        );
      }
    }
  } finally {
    reader.releaseLock();
  }
}

export class RestFailureTransport implements FailureTransport {
  readonly id = "rest-failure-v1";

  async deliver(event: FailureTransportEvent) {
    const config = getRestFailureTransportRuntimeConfig();
    const headers = new Headers({
      Accept: "application/json",
      "Content-Type": "application/json",
      [failureTransportContractHeader]: failureTransportContractVersion,
      ...(event.correlationId ? { "X-OTP-Request-Id": event.correlationId } : {})
    });
    if (config.bearerToken) headers.set("Authorization", `Bearer ${config.bearerToken}`);

    let response: Response;
    try {
      response = await fetch(config.endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify({ failure: event }),
        cache: "no-store",
        redirect: "error",
        signal: AbortSignal.timeout(config.timeoutMs)
      });
    } catch (error) {
      const isTimeout = error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");
      throw transportError(
        isTimeout ? "FAILURE_TRANSPORT_TIMEOUT" : "FAILURE_TRANSPORT_NETWORK_ERROR",
        isTimeout ? "Failure transport timed out." : "Failure transport could not be reached."
      );
    }

    await consumeBoundedResponse(response, config.maxResponseBytes);
    if (!response.ok) {
      throw transportError("FAILURE_TRANSPORT_REJECTED", "Failure transport rejected the normalized event.", response.status);
    }
  }
}
