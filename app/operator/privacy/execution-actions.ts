"use server";

import { redirect } from "next/navigation";
import {
  approvePrivacyExportByAdmin,
  executePrivacyRestrictionByAdmin
} from "@/lib/privacy-execution";
import { executePrivacyErasureWithSecondaryByAdmin } from "@/lib/privacy-erasure-runner";
import { requireAdminIdentity } from "@/lib/require-admin-identity";

function value(formData: FormData, key: string) {
  const item = formData.get(key);
  return typeof item === "string" ? item.trim() : "";
}

function requestId(formData: FormData) {
  const id = value(formData, "requestId");
  if (!/^prq-[a-f0-9-]{36}$/i.test(id)) redirect("/operator/privacy?executionError=invalid-request");
  return id;
}

function mapError(error: unknown) {
  const code = error && typeof error === "object" && "code" in error
    ? String((error as { code?: unknown }).code ?? "")
    : "";
  const known: Record<string, string> = {
    PRIVACY_REQUEST_NOT_FOUND: "not-found",
    PRIVACY_REQUEST_TERMINAL: "terminal",
    PRIVACY_EXECUTION_NOT_READY: "not-ready",
    PRIVACY_EXPORT_NOT_APPLICABLE: "export-not-applicable",
    PRIVACY_RESTRICTION_NOT_APPLICABLE: "restriction-not-applicable",
    PRIVACY_ERASURE_NOT_APPLICABLE: "erasure-not-applicable",
    PRIVACY_ERASURE_RETENTION_BLOCK: "retention-block",
    PRIVACY_IDENTITY_NOT_FOUND: "identity-not-found",
    PRIVACY_EXECUTION_REQUIRES_OFFLINE_MIGRATION: "offline-required",
    PRIVACY_ERASURE_EXECUTION_FAILED: "execution-failed"
  };
  return known[code];
}

export async function approvePrivacyExportAction(formData: FormData) {
  const admin = await requireAdminIdentity();
  const id = requestId(formData);
  try {
    await approvePrivacyExportByAdmin({ requestId: id, actorId: admin.id });
    redirect(`/operator/privacy?execution=export-approved&request=${encodeURIComponent(id)}`);
  } catch (error) {
    const mapped = mapError(error);
    if (mapped) redirect(`/operator/privacy?executionError=${mapped}&request=${encodeURIComponent(id)}`);
    throw error;
  }
}

export async function executePrivacyRestrictionAction(formData: FormData) {
  const admin = await requireAdminIdentity();
  const id = requestId(formData);
  if (value(formData, "confirm") !== "restrict") {
    redirect(`/operator/privacy?executionError=confirmation-required&request=${encodeURIComponent(id)}`);
  }
  try {
    await executePrivacyRestrictionByAdmin({ requestId: id, actorId: admin.id });
    redirect(`/operator/privacy?execution=restriction-applied&request=${encodeURIComponent(id)}`);
  } catch (error) {
    const mapped = mapError(error);
    if (mapped) redirect(`/operator/privacy?executionError=${mapped}&request=${encodeURIComponent(id)}`);
    throw error;
  }
}

export async function executePrivacyErasureAction(formData: FormData) {
  const admin = await requireAdminIdentity();
  const id = requestId(formData);
  if (value(formData, "confirm") !== "erase") {
    redirect(`/operator/privacy?executionError=confirmation-required&request=${encodeURIComponent(id)}`);
  }
  try {
    await executePrivacyErasureWithSecondaryByAdmin({ requestId: id, actorId: admin.id });
    redirect(`/operator/privacy?execution=erasure-applied&request=${encodeURIComponent(id)}`);
  } catch (error) {
    const mapped = mapError(error);
    if (mapped) redirect(`/operator/privacy?executionError=${mapped}&request=${encodeURIComponent(id)}`);
    throw error;
  }
}
