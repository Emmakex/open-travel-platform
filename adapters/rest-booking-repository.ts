import { randomUUID } from "node:crypto";
import type { AvailabilityWindow, CreateReservationInput, Reservation } from "@/domain/booking/types";
import {
  parseAvailabilityEnvelope,
  parseReservationEnvelope,
  parseReservationsEnvelope,
  restBookingContractHeader,
  restBookingContractVersion
} from "@/lib/rest-booking-contract";
import { getRestBookingRuntimeConfig } from "@/lib/rest-booking-config";
import type { BookingRepository } from "@/repositories/booking-repository";

const transientStatuses = new Set([429, 502, 503, 504]);

function adapterError(code: string, message: string, status?: number) {
  return Object.assign(new Error(message), { code, ...(status ? { status } : {}) });
}

function mapHttpError(status: number) {
  if (status === 401 || status === 403) return adapterError("REST_BOOKING_AUTH_FAILED", "The external booking API rejected server authentication.", status);
  if (status === 404) return adapterError("REST_BOOKING_NOT_FOUND", "The requested external booking resource was not found.", status);
  if (status === 409) return adapterError("REST_BOOKING_CONFLICT", "The external booking API rejected the operation because its state changed.", status);
  if (status === 422 || status === 400) return adapterError("REST_BOOKING_REJECTED", "The external booking API rejected the booking request.", status);
  if (status === 429) return adapterError("REST_BOOKING_RATE_LIMITED", "The external booking API is temporarily rate limited.", status);
  if (status >= 500) return adapterError("REST_BOOKING_UNAVAILABLE", "The external booking API is temporarily unavailable.", status);
  return adapterError("REST_BOOKING_REQUEST_FAILED", "The external booking API request failed.", status);
}

async function readBoundedResponse(response: Response, maximumBytes: number) {
  const contentLength = Number.parseInt(response.headers.get("content-length") ?? "", 10);
  if (Number.isFinite(contentLength) && contentLength > maximumBytes) {
    throw adapterError("REST_BOOKING_RESPONSE_TOO_LARGE", "The external booking API response exceeded the configured size limit.");
  }

  if (!response.body) return "";
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      if (!value) continue;
      total += value.byteLength;
      if (total > maximumBytes) {
        await reader.cancel();
        throw adapterError("REST_BOOKING_RESPONSE_TOO_LARGE", "The external booking API response exceeded the configured size limit.");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(bytes);
}

function parseJson(text: string) {
  if (!text.trim()) throw adapterError("REST_BOOKING_CONTRACT_INVALID", "The external booking API returned an empty response.");
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw adapterError("REST_BOOKING_CONTRACT_INVALID", "The external booking API returned invalid JSON.");
  }
}

function assertAvailabilityTrip(items: AvailabilityWindow[], tripId: string) {
  if (items.some((item) => item.tripId !== tripId)) {
    throw adapterError("REST_BOOKING_SCOPE_MISMATCH", "The external booking API returned availability outside the requested trip scope.");
  }
  return items;
}

function assertReservationIdentity(reservation: Reservation, identityId: string) {
  if (reservation.identityId !== identityId) {
    throw adapterError("REST_BOOKING_SCOPE_MISMATCH", "The external booking API returned a reservation outside the requested customer scope.");
  }
  return reservation;
}

function assertReservationListIdentity(reservations: Reservation[], identityId: string) {
  reservations.forEach((reservation) => assertReservationIdentity(reservation, identityId));
  return reservations;
}

function assertCreatedReservation(reservation: Reservation, input: CreateReservationInput) {
  assertReservationIdentity(reservation, input.identityId);
  if (reservation.tripId !== input.tripId || reservation.availabilityId !== input.availabilityId) {
    throw adapterError("REST_BOOKING_SCOPE_MISMATCH", "The external booking API returned a reservation for a different trip or departure.");
  }
  return reservation;
}

type RequestOptions<T> = {
  method?: "GET" | "POST";
  body?: unknown;
  parse: (value: unknown) => T;
  allowNotFound?: boolean;
  mutating?: boolean;
};

async function requestBookingApi<T>(path: string, options: RequestOptions<T>): Promise<T | null> {
  const config = getRestBookingRuntimeConfig();
  const url = new URL(path.replace(/^\/+/, ""), config.baseUrl);
  const requestId = `otp-${randomUUID()}`;
  const method = options.method ?? "GET";
  const maxAttempts = 2;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const headers = new Headers({
        Accept: "application/json",
        [restBookingContractHeader]: restBookingContractVersion,
        "X-OTP-Request-Id": requestId
      });
      if (config.bearerToken) headers.set("Authorization", `Bearer ${config.bearerToken}`);
      if (options.body !== undefined) headers.set("Content-Type", "application/json");
      if (options.mutating) headers.set("Idempotency-Key", requestId);

      const response = await fetch(url, {
        method,
        headers,
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
        cache: "no-store",
        redirect: "error",
        signal: AbortSignal.timeout(config.timeoutMs)
      });

      if (options.allowNotFound && response.status === 404) return null;
      if (!response.ok) {
        if (attempt < maxAttempts && transientStatuses.has(response.status)) continue;
        throw mapHttpError(response.status);
      }

      const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
      if (!contentType.includes("application/json")) {
        throw adapterError("REST_BOOKING_CONTRACT_INVALID", "The external booking API must return application/json.");
      }
      const responseVersion = response.headers.get(restBookingContractHeader);
      if (responseVersion !== restBookingContractVersion) {
        throw adapterError("REST_BOOKING_CONTRACT_VERSION", `The external booking API must return ${restBookingContractHeader}: ${restBookingContractVersion}.`);
      }

      const text = await readBoundedResponse(response, config.maxResponseBytes);
      return options.parse(parseJson(text));
    } catch (error) {
      const code = error && typeof error === "object" && "code" in error ? String(error.code) : "";
      if (code.startsWith("REST_BOOKING_")) throw error;
      const isTimeout = error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");
      if (attempt < maxAttempts) continue;
      throw adapterError(
        isTimeout ? "REST_BOOKING_TIMEOUT" : "REST_BOOKING_NETWORK_ERROR",
        isTimeout ? "The external booking API timed out." : "The external booking API could not be reached."
      );
    }
  }

  throw adapterError("REST_BOOKING_REQUEST_FAILED", "The external booking API request failed.");
}

export class RestBookingRepository implements BookingRepository {
  async listAvailability(tripId: string) {
    const result = await requestBookingApi(`v1/availability?tripId=${encodeURIComponent(tripId)}`, {
      parse: parseAvailabilityEnvelope
    });
    return assertAvailabilityTrip(result ?? [], tripId);
  }

  async listReservations(identityId: string) {
    const result = await requestBookingApi(`v1/customers/${encodeURIComponent(identityId)}/reservations`, {
      parse: parseReservationsEnvelope
    });
    return assertReservationListIdentity(result ?? [], identityId);
  }

  async getReservation(identityId: string, reservationId: string) {
    const reservation = await requestBookingApi(
      `v1/customers/${encodeURIComponent(identityId)}/reservations/${encodeURIComponent(reservationId)}`,
      { parse: (value) => parseReservationEnvelope(value), allowNotFound: true }
    );
    return reservation ? assertReservationIdentity(reservation, identityId) : null;
  }

  async createReservation(input: CreateReservationInput) {
    const reservation = await requestBookingApi("v1/reservations", {
      method: "POST",
      body: { reservation: input },
      parse: (value) => parseReservationEnvelope(value),
      mutating: true
    });
    if (!reservation) throw adapterError("REST_BOOKING_CONTRACT_INVALID", "The external booking API did not return the created reservation.");
    return assertCreatedReservation(reservation, input);
  }

  async cancelReservation(identityId: string, reservationId: string) {
    const reservation = await requestBookingApi(
      `v1/customers/${encodeURIComponent(identityId)}/reservations/${encodeURIComponent(reservationId)}/cancel`,
      {
        method: "POST",
        body: {},
        parse: (value) => parseReservationEnvelope(value, true),
        allowNotFound: true,
        mutating: true
      }
    );
    return reservation ? assertReservationIdentity(reservation, identityId) : null;
  }
}
