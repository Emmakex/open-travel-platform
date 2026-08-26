import { getRestSupplierFulfilmentRuntimeConfig } from "@/lib/supplier-fulfilment-adapter-config";
import {
  parseSupplierAdapterResult,
  supplierFulfilmentContractHeader,
  supplierFulfilmentContractVersion
} from "@/lib/rest-supplier-fulfilment-contract";
import type {
  SupplierAdapterCommand,
  SupplierAdapterResult,
  SupplierFulfilmentAdapter
} from "@/repositories/supplier-fulfilment-adapter";

const transientStatuses = new Set([429, 502, 503, 504]);

function adapterError(code: string, message: string, status?: number) {
  return Object.assign(new Error(message), { code, ...(status ? { status } : {}) });
}

function mapHttpError(status: number) {
  if (status === 401 || status === 403) return adapterError("SUPPLIER_ADAPTER_AUTH_FAILED", "The supplier API rejected server authentication.", status);
  if (status === 404) return adapterError("SUPPLIER_ADAPTER_NOT_FOUND", "The supplier API could not find the fulfilment request.", status);
  if (status === 409) return adapterError("SUPPLIER_ADAPTER_CONFLICT", "The supplier API rejected the operation because its state changed.", status);
  if (status === 400 || status === 422) return adapterError("SUPPLIER_ADAPTER_REJECTED", "The supplier API rejected the fulfilment request.", status);
  if (status === 429) return adapterError("SUPPLIER_ADAPTER_RATE_LIMITED", "The supplier API is temporarily rate limited.", status);
  if (status >= 500) return adapterError("SUPPLIER_ADAPTER_UNAVAILABLE", "The supplier API is temporarily unavailable.", status);
  return adapterError("SUPPLIER_ADAPTER_REQUEST_FAILED", "The supplier API request failed.", status);
}

async function readBoundedResponse(response: Response, maximumBytes: number) {
  const contentLength = Number.parseInt(response.headers.get("content-length") ?? "", 10);
  if (Number.isFinite(contentLength) && contentLength > maximumBytes) {
    throw adapterError("SUPPLIER_ADAPTER_RESPONSE_TOO_LARGE", "The supplier API response exceeded the configured size limit.");
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
        throw adapterError("SUPPLIER_ADAPTER_RESPONSE_TOO_LARGE", "The supplier API response exceeded the configured size limit.");
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
  if (!text.trim()) throw adapterError("SUPPLIER_ADAPTER_CONTRACT_INVALID", "The supplier API returned an empty response.");
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw adapterError("SUPPLIER_ADAPTER_CONTRACT_INVALID", "The supplier API returned invalid JSON.");
  }
}

function safeRequestBody(command: SupplierAdapterCommand) {
  const { component, item } = command;
  return {
    operation: command.operation,
    fulfilment: {
      id: item.id,
      targetType: component.targetType,
      targetId: component.targetId,
      componentType: component.componentType,
      componentKey: component.componentKey,
      componentLabel: component.componentLabel,
      supplierName: item.supplierName,
      reference: item.supplierReference,
      deadline: item.deadline
    }
  };
}

async function executeRestCommand(command: SupplierAdapterCommand): Promise<SupplierAdapterResult> {
  const config = getRestSupplierFulfilmentRuntimeConfig();
  const endpoint = new URL(`v1/fulfilment/${command.operation}`, config.baseUrl);
  const maximumAttempts = 2;

  for (let attempt = 1; attempt <= maximumAttempts; attempt += 1) {
    try {
      const headers = new Headers({
        Accept: "application/json",
        "Content-Type": "application/json",
        [supplierFulfilmentContractHeader]: supplierFulfilmentContractVersion,
        "X-OTP-Request-Id": command.requestId,
        "X-OTP-Operation": command.operation
      });
      if (config.bearerToken) headers.set("Authorization", `Bearer ${config.bearerToken}`);
      if (command.idempotencyKey) headers.set("Idempotency-Key", command.idempotencyKey);

      const response = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify(safeRequestBody(command)),
        cache: "no-store",
        redirect: "error",
        signal: AbortSignal.timeout(config.timeoutMs)
      });

      if (!response.ok) {
        if (attempt < maximumAttempts && transientStatuses.has(response.status)) continue;
        throw mapHttpError(response.status);
      }

      const responseVersion = response.headers.get(supplierFulfilmentContractHeader);
      if (responseVersion !== supplierFulfilmentContractVersion) {
        throw adapterError(
          "SUPPLIER_ADAPTER_CONTRACT_VERSION",
          `The supplier API must return ${supplierFulfilmentContractHeader}: ${supplierFulfilmentContractVersion}.`
        );
      }

      return parseSupplierAdapterResult(parseJson(await readBoundedResponse(response, config.maxResponseBytes)));
    } catch (error) {
      const code = error && typeof error === "object" && "code" in error ? String(error.code) : "";
      if (code.startsWith("SUPPLIER_ADAPTER_")) throw error;
      const isTimeout = error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");
      if (attempt < maximumAttempts) continue;
      throw adapterError(
        isTimeout ? "SUPPLIER_ADAPTER_TIMEOUT" : "SUPPLIER_ADAPTER_NETWORK_ERROR",
        isTimeout ? "The supplier API timed out." : "The supplier API could not be reached."
      );
    }
  }

  throw adapterError("SUPPLIER_ADAPTER_REQUEST_FAILED", "The supplier API request failed.");
}

export class RestSupplierFulfilmentAdapter implements SupplierFulfilmentAdapter {
  readonly id = "rest-v1";

  execute(command: SupplierAdapterCommand) {
    return executeRestCommand(command);
  }
}
