import { getRestCrmRuntimeConfig } from "@/lib/crm-sync-config";
import { crmContractHeader, crmContractVersion, parseCrmSyncResult } from "@/lib/rest-crm-contract";
import type {
  CrmContactSnapshot,
  CrmReservationSnapshot,
  CrmSyncAdapter,
  CrmSyncCommand,
  CrmSyncResult
} from "@/repositories/crm-sync-adapter";

const transientStatuses = new Set([429, 502, 503, 504]);

function crmError(code: string, message: string, status?: number) {
  return Object.assign(new Error(message), { code, ...(status ? { status } : {}) });
}

function mapHttpError(status: number) {
  if (status === 401 || status === 403) return crmError("CRM_SYNC_AUTH_FAILED", "The CRM API rejected server authentication.", status);
  if (status === 409) return crmError("CRM_SYNC_CONFLICT", "The CRM API rejected the upsert because its state changed.", status);
  if (status === 400 || status === 422) return crmError("CRM_SYNC_REJECTED", "The CRM API rejected the normalized payload.", status);
  if (status === 429) return crmError("CRM_SYNC_RATE_LIMITED", "The CRM API is temporarily rate limited.", status);
  if (status >= 500) return crmError("CRM_SYNC_UNAVAILABLE", "The CRM API is temporarily unavailable.", status);
  return crmError("CRM_SYNC_REQUEST_FAILED", "The CRM API request failed.", status);
}

async function readBoundedResponse(response: Response, maximumBytes: number) {
  const contentLength = Number.parseInt(response.headers.get("content-length") ?? "", 10);
  if (Number.isFinite(contentLength) && contentLength > maximumBytes) {
    throw crmError("CRM_SYNC_RESPONSE_TOO_LARGE", "The CRM API response exceeded the configured size limit.");
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
        throw crmError("CRM_SYNC_RESPONSE_TOO_LARGE", "The CRM API response exceeded the configured size limit.");
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
  if (!text.trim()) throw crmError("CRM_SYNC_CONTRACT_INVALID", "The CRM API returned an empty response.");
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw crmError("CRM_SYNC_CONTRACT_INVALID", "The CRM API returned invalid JSON.");
  }
}

function contactBody(snapshot: CrmContactSnapshot) {
  return {
    entity: "contact",
    operation: "upsert",
    contact: {
      localId: snapshot.localId,
      firstName: snapshot.firstName,
      lastName: snapshot.lastName,
      email: snapshot.email,
      ...(snapshot.phone ? { phone: snapshot.phone } : {}),
      ...(snapshot.country ? { country: snapshot.country } : {}),
      ...(snapshot.preferredLocale ? { preferredLocale: snapshot.preferredLocale } : {})
    }
  };
}

function reservationBody(snapshot: CrmReservationSnapshot) {
  return {
    entity: "reservation",
    operation: "upsert",
    reservation: {
      reservationType: snapshot.reservationType,
      localId: snapshot.localId,
      contactLocalId: snapshot.contactLocalId,
      productId: snapshot.productId,
      ...(snapshot.productTitle ? { productTitle: snapshot.productTitle } : {}),
      status: snapshot.status,
      partySize: snapshot.partySize,
      ...(snapshot.startDate ? { startDate: snapshot.startDate } : {}),
      ...(snapshot.endDate ? { endDate: snapshot.endDate } : {}),
      createdAt: snapshot.createdAt,
      ...(snapshot.updatedAt ? { updatedAt: snapshot.updatedAt } : {})
    }
  };
}

async function postUpsert<TSnapshot>(
  path: string,
  command: CrmSyncCommand<TSnapshot>,
  body: unknown
): Promise<CrmSyncResult> {
  const config = getRestCrmRuntimeConfig();
  const endpoint = new URL(path, config.baseUrl);
  const maximumAttempts = 2;

  for (let attempt = 1; attempt <= maximumAttempts; attempt += 1) {
    try {
      const headers = new Headers({
        Accept: "application/json",
        "Content-Type": "application/json",
        [crmContractHeader]: crmContractVersion,
        "X-OTP-Request-Id": command.requestId,
        "X-OTP-Operation": "upsert",
        "Idempotency-Key": command.idempotencyKey
      });
      if (config.bearerToken) headers.set("Authorization", `Bearer ${config.bearerToken}`);

      const response = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
        cache: "no-store",
        redirect: "error",
        signal: AbortSignal.timeout(config.timeoutMs)
      });

      if (!response.ok) {
        if (attempt < maximumAttempts && transientStatuses.has(response.status)) continue;
        throw mapHttpError(response.status);
      }

      if (response.headers.get(crmContractHeader) !== crmContractVersion) {
        throw crmError(
          "CRM_SYNC_CONTRACT_VERSION",
          `The CRM API must return ${crmContractHeader}: ${crmContractVersion}.`
        );
      }

      const parsed = parseCrmSyncResult(parseJson(await readBoundedResponse(response, config.maxResponseBytes)));
      return { ...parsed, responseStatus: response.status };
    } catch (error) {
      const code = error && typeof error === "object" && "code" in error ? String(error.code) : "";
      if (code.startsWith("CRM_SYNC_")) throw error;
      const isTimeout = error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");
      if (attempt < maximumAttempts) continue;
      throw crmError(
        isTimeout ? "CRM_SYNC_TIMEOUT" : "CRM_SYNC_NETWORK_ERROR",
        isTimeout ? "The CRM API timed out." : "The CRM API could not be reached."
      );
    }
  }

  throw crmError("CRM_SYNC_REQUEST_FAILED", "The CRM API request failed.");
}

export class RestCrmSyncAdapter implements CrmSyncAdapter {
  readonly id = "rest-crm-v1";

  upsertContact(command: CrmSyncCommand<CrmContactSnapshot>) {
    return postUpsert("v1/crm/contacts/upsert", command, contactBody(command.snapshot));
  }

  upsertReservation(command: CrmSyncCommand<CrmReservationSnapshot>) {
    return postUpsert("v1/crm/reservations/upsert", command, reservationBody(command.snapshot));
  }
}
