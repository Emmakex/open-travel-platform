"use server";

import { redirect } from "next/navigation";
import type { CurrencyCode } from "@/domain/travel/types";
import { operationsConfig } from "@/lib/operations-config";
import { requireStaffCapability } from "@/lib/require-staff-capability";
import {
  isSupplierCurrency,
  isSupplierFulfilmentStatus,
  isSupplierFulfilmentTargetType,
  normalizeSupplierDeadline
} from "@/lib/supplier-fulfilment-rules";
import {
  addSupplierFulfilmentNote,
  saveSupplierFulfilment
} from "@/lib/supplier-fulfilment";
import { performSupplierAdapterOperation } from "@/lib/supplier-fulfilment-sync";
import type { SupplierAdapterOperation } from "@/repositories/supplier-fulfilment-adapter";

function value(formData: FormData, key: string) {
  const item = formData.get(key);
  return typeof item === "string" ? item.trim() : "";
}

function safeReturnTo(candidate: string) {
  return candidate.startsWith("/operator/") && !candidate.startsWith("//")
    ? candidate
    : "/operator/fulfilment";
}

function withQuery(path: string, key: string, queryValue: string) {
  const url = new URL(path, "https://internal.invalid");
  url.searchParams.set(key, queryValue);
  return `${url.pathname}${url.search}${url.hash || "#fulfilment"}`;
}

function errorQuery(error: unknown) {
  if (!error || typeof error !== "object" || !("code" in error)) return "update-failed";
  switch (error.code) {
    case "FULFILMENT_UNAVAILABLE": return "fulfilment-unavailable";
    case "TARGET_NOT_FOUND": return "target-not-found";
    case "COMPONENT_NOT_FOUND": return "component-not-found";
    case "FULFILMENT_NOT_FOUND": return "fulfilment-not-found";
    case "SUPPLIER_REQUIRED": return "supplier-required";
    case "INVALID_COST": return "invalid-cost";
    case "INVALID_TRANSITION": return "invalid-transition";
    case "INVALID_NOTE": return "invalid-note";
    case "NO_CHANGES": return "no-changes";
    case "INVALID_FULFILMENT": return "invalid-fulfilment";
    case "SUPPLIER_ADAPTER_DISABLED": return "adapter-disabled";
    case "SUPPLIER_ADAPTER_UNAVAILABLE": return "adapter-unavailable";
    case "SUPPLIER_ADAPTER_BASE_URL_REQUIRED":
    case "SUPPLIER_ADAPTER_BASE_URL_INVALID":
    case "SUPPLIER_ADAPTER_HTTPS_REQUIRED":
    case "SUPPLIER_ADAPTER_TOKEN_REQUIRED": return "adapter-config";
    case "SUPPLIER_ADAPTER_SUPPLIER_REQUIRED": return "adapter-supplier-required";
    case "SUPPLIER_ADAPTER_INVALID_OPERATION": return "adapter-invalid-operation";
    case "SUPPLIER_ADAPTER_FULFILMENT_NOT_FOUND": return "adapter-fulfilment-not-found";
    case "SUPPLIER_ADAPTER_AUTH_FAILED": return "adapter-auth";
    case "SUPPLIER_ADAPTER_NOT_FOUND": return "adapter-not-found";
    case "SUPPLIER_ADAPTER_CONFLICT":
    case "SUPPLIER_ADAPTER_STATUS_CONFLICT": return "adapter-conflict";
    case "SUPPLIER_ADAPTER_REJECTED": return "adapter-rejected";
    case "SUPPLIER_ADAPTER_RATE_LIMITED": return "adapter-rate-limited";
    case "SUPPLIER_ADAPTER_TIMEOUT": return "adapter-timeout";
    case "SUPPLIER_ADAPTER_NETWORK_ERROR": return "adapter-network";
    case "SUPPLIER_ADAPTER_CONTRACT_INVALID":
    case "SUPPLIER_ADAPTER_CONTRACT_VERSION": return "adapter-contract";
    case "SUPPLIER_ADAPTER_RESPONSE_TOO_LARGE": return "adapter-response-too-large";
    case "SUPPLIER_ADAPTER_AUDIT_FAILED": return "adapter-audit";
    default: return "update-failed";
  }
}

function isAdapterOperation(value: string): value is SupplierAdapterOperation {
  return value === "request" || value === "status" || value === "cancel";
}

export async function saveSupplierFulfilmentAction(formData: FormData) {
  const staff = await requireStaffCapability("suppliers");
  const targetType = value(formData, "targetType");
  const targetId = value(formData, "targetId");
  const componentKey = value(formData, "componentKey");
  const status = value(formData, "status");
  const supplierName = value(formData, "supplierName") || undefined;
  const supplierReference = value(formData, "supplierReference") || undefined;
  const supplierCostRaw = value(formData, "supplierCost");
  const supplierCurrencyRaw = value(formData, "supplierCurrency");
  const deadline = value(formData, "deadline") || undefined;
  const returnTo = safeReturnTo(value(formData, "returnTo"));
  const supplierCost = supplierCostRaw ? Number(supplierCostRaw) : undefined;
  const supplierCurrency = supplierCurrencyRaw && isSupplierCurrency(supplierCurrencyRaw)
    ? supplierCurrencyRaw as CurrencyCode
    : undefined;

  if (
    !operationsConfig.writesEnabled ||
    !isSupplierFulfilmentTargetType(targetType) ||
    !targetId ||
    !componentKey ||
    !isSupplierFulfilmentStatus(status) ||
    (supplierCostRaw && !Number.isFinite(supplierCost)) ||
    normalizeSupplierDeadline(deadline) === null
  ) {
    redirect(withQuery(returnTo, "fulfilmentError", "invalid-fulfilment"));
  }

  try {
    await saveSupplierFulfilment({
      targetType,
      targetId,
      componentKey,
      status,
      supplierName,
      supplierReference,
      supplierCost,
      supplierCurrency,
      deadline,
      actorIdentityId: staff.id,
      actorRole: staff.role,
      actorDisplayName: staff.displayName
    });
  } catch (error) {
    redirect(withQuery(returnTo, "fulfilmentError", errorQuery(error)));
  }

  redirect(withQuery(returnTo, "fulfilmentUpdated", "saved"));
}

export async function runSupplierAdapterAction(formData: FormData) {
  const staff = await requireStaffCapability("suppliers");
  const fulfilmentId = value(formData, "fulfilmentId");
  const operation = value(formData, "operation");
  const returnTo = safeReturnTo(value(formData, "returnTo"));

  if (!operationsConfig.writesEnabled || !fulfilmentId || !isAdapterOperation(operation)) {
    redirect(withQuery(returnTo, "fulfilmentError", "adapter-invalid-operation"));
  }

  try {
    await performSupplierAdapterOperation({
      fulfilmentId,
      operation,
      actorIdentityId: staff.id,
      actorRole: staff.role,
      actorDisplayName: staff.displayName
    });
  } catch (error) {
    redirect(withQuery(returnTo, "fulfilmentError", errorQuery(error)));
  }

  redirect(withQuery(returnTo, "fulfilmentUpdated", `adapter-${operation}`));
}

export async function addSupplierFulfilmentNoteAction(formData: FormData) {
  const staff = await requireStaffCapability("suppliers");
  const fulfilmentId = value(formData, "fulfilmentId");
  const body = value(formData, "body");
  const returnTo = safeReturnTo(value(formData, "returnTo"));

  if (!operationsConfig.writesEnabled || !fulfilmentId || !body) {
    redirect(withQuery(returnTo, "fulfilmentError", "invalid-note"));
  }

  try {
    await addSupplierFulfilmentNote({
      fulfilmentId,
      body,
      actorIdentityId: staff.id,
      actorRole: staff.role,
      actorDisplayName: staff.displayName
    });
  } catch (error) {
    redirect(withQuery(returnTo, "fulfilmentError", errorQuery(error)));
  }

  redirect(withQuery(returnTo, "fulfilmentUpdated", "note"));
}
