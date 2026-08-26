import { getRestErpAccountingRuntimeConfig } from "@/lib/erp-accounting-config";
import {
  erpAccountingContractHeader,
  erpAccountingContractVersion,
  parseErpAccountingSyncResult
} from "@/lib/rest-erp-accounting-contract";
import type {
  ErpAccountingAdapter,
  ErpAccountingMovementSnapshot,
  ErpAccountingSyncCommand,
  ErpAccountingSyncResult
} from "@/repositories/erp-accounting-adapter";

const transientStatuses = new Set([429, 502, 503, 504]);

function accountingError(code: string, message: string, status?: number) {
  return Object.assign(new Error(message), { code, ...(status ? { status } : {}) });
}

function mapHttpError(status: number) {
  if (status === 401 || status === 403) {
    return accountingError("ERP_ACCOUNTING_AUTH_FAILED", "The ERP/accounting API rejected server authentication.", status);
  }
  if (status === 409) {
    return accountingError("ERP_ACCOUNTING_CONFLICT", "The ERP/accounting API rejected the movement because its state changed.", status);
  }
  if (status === 400 || status === 422) {
    return accountingError("ERP_ACCOUNTING_REJECTED", "The ERP/accounting API rejected the normalized movement.", status);
  }
  if (status === 429) {
    return accountingError("ERP_ACCOUNTING_RATE_LIMITED", "The ERP/accounting API is temporarily rate limited.", status);
  }
  if (status >= 500) {
    return accountingError("ERP_ACCOUNTING_UNAVAILABLE", "The ERP/accounting API is temporarily unavailable.", status);
  }
  return accountingError("ERP_ACCOUNTING_REQUEST_FAILED", "The ERP/accounting API request failed.", status);
}

async function readBoundedResponse(response: Response, maximumBytes: number) {
  const contentLength = Number.parseInt(response.headers.get("content-length") ?? "", 10);
  if (Number.isFinite(contentLength) && contentLength > maximumBytes) {
    throw accountingError(
      "ERP_ACCOUNTING_RESPONSE_TOO_LARGE",
      "The ERP/accounting API response exceeded the configured size limit."
    );
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
        throw accountingError(
          "ERP_ACCOUNTING_RESPONSE_TOO_LARGE",
          "The ERP/accounting API response exceeded the configured size limit."
        );
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
  if (!text.trim()) {
    throw accountingError("ERP_ACCOUNTING_CONTRACT_INVALID", "The ERP/accounting API returned an empty response.");
  }
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw accountingError("ERP_ACCOUNTING_CONTRACT_INVALID", "The ERP/accounting API returned invalid JSON.");
  }
}

function movementBody(snapshot: ErpAccountingMovementSnapshot) {
  return {
    entity: "accounting-movement",
    operation: "upsert",
    movement: {
      localId: snapshot.localId,
      targetType: snapshot.targetType,
      targetId: snapshot.targetId,
      movementType: snapshot.movementType,
      amount: snapshot.amount,
      currency: snapshot.currency,
      provider: snapshot.provider,
      ...(snapshot.method ? { method: snapshot.method } : {}),
      ...(snapshot.providerReference ? { providerReference: snapshot.providerReference } : {}),
      occurredAt: snapshot.occurredAt
    }
  };
}

async function postMovement(command: ErpAccountingSyncCommand): Promise<ErpAccountingSyncResult> {
  const config = getRestErpAccountingRuntimeConfig();
  const endpoint = new URL("v1/accounting/movements/upsert", config.baseUrl);
  const maximumAttempts = 2;

  for (let attempt = 1; attempt <= maximumAttempts; attempt += 1) {
    try {
      const headers = new Headers({
        Accept: "application/json",
        "Content-Type": "application/json",
        [erpAccountingContractHeader]: erpAccountingContractVersion,
        "X-OTP-Request-Id": command.requestId,
        "X-OTP-Operation": "upsert",
        "Idempotency-Key": command.idempotencyKey
      });
      if (config.bearerToken) headers.set("Authorization", `Bearer ${config.bearerToken}`);

      const response = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify(movementBody(command.snapshot)),
        cache: "no-store",
        redirect: "error",
        signal: AbortSignal.timeout(config.timeoutMs)
      });

      if (!response.ok) {
        if (attempt < maximumAttempts && transientStatuses.has(response.status)) continue;
        throw mapHttpError(response.status);
      }

      if (response.headers.get(erpAccountingContractHeader) !== erpAccountingContractVersion) {
        throw accountingError(
          "ERP_ACCOUNTING_CONTRACT_VERSION",
          `The ERP/accounting API must return ${erpAccountingContractHeader}: ${erpAccountingContractVersion}.`
        );
      }

      const parsed = parseErpAccountingSyncResult(
        parseJson(await readBoundedResponse(response, config.maxResponseBytes))
      );
      return { ...parsed, responseStatus: response.status };
    } catch (error) {
      const code = error && typeof error === "object" && "code" in error ? String(error.code) : "";
      if (code.startsWith("ERP_ACCOUNTING_")) throw error;
      const isTimeout = error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");
      if (attempt < maximumAttempts) continue;
      throw accountingError(
        isTimeout ? "ERP_ACCOUNTING_TIMEOUT" : "ERP_ACCOUNTING_NETWORK_ERROR",
        isTimeout ? "The ERP/accounting API timed out." : "The ERP/accounting API could not be reached."
      );
    }
  }

  throw accountingError("ERP_ACCOUNTING_REQUEST_FAILED", "The ERP/accounting API request failed.");
}

export class RestErpAccountingAdapter implements ErpAccountingAdapter {
  readonly id = "rest-accounting-v1";

  upsertMovement(command: ErpAccountingSyncCommand) {
    return postMovement(command);
  }
}
