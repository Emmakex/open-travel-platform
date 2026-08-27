"use server";

import { redirect } from "next/navigation";
import {
  privacyRequestStatuses,
  updatePrivacyRequestByAdmin,
  type PrivacyExtensionReason,
  type PrivacyOutcomeCode,
  type PrivacyRequestStatus,
  type PrivacyRetentionReason,
  type PrivacyRetentionState
} from "@/lib/privacy-rights";
import { requireAdminIdentity } from "@/lib/require-admin-identity";

function value(formData: FormData, key: string) {
  const item = formData.get(key);
  return typeof item === "string" ? item.trim() : "";
}

const extensionReasons = new Set<PrivacyExtensionReason>(["complexity", "request-volume"]);
const retentionStates = new Set<PrivacyRetentionState>(["not-applicable", "pending", "clear", "hold"]);
const retentionReasons = new Set<PrivacyRetentionReason>([
  "legal-obligation",
  "legal-claims",
  "rights-of-others",
  "other-applicable-basis"
]);
const outcomeCodes = new Set<PrivacyOutcomeCode>([
  "fulfilled",
  "partially-fulfilled",
  "identity-not-verified",
  "not-applicable",
  "retention-required"
]);

export async function reviewPrivacyRequestAction(formData: FormData) {
  const admin = await requireAdminIdentity();
  const requestId = value(formData, "requestId");
  const rawStatus = value(formData, "status");
  const rawExtension = value(formData, "extendByMonths");
  const rawExtensionReason = value(formData, "extensionReason");
  const rawRetentionState = value(formData, "retentionState");
  const rawRetentionReason = value(formData, "retentionReason");
  const rawOutcome = value(formData, "outcomeCode");

  if (!/^prq-[a-f0-9-]{36}$/i.test(requestId)) redirect("/operator/privacy?error=invalid-request");

  const status = rawStatus && (privacyRequestStatuses as readonly string[]).includes(rawStatus)
    ? rawStatus as PrivacyRequestStatus
    : undefined;
  const extendByMonths = rawExtension === "1" ? 1 : rawExtension === "2" ? 2 : undefined;
  const extensionReason = extensionReasons.has(rawExtensionReason as PrivacyExtensionReason)
    ? rawExtensionReason as PrivacyExtensionReason
    : undefined;
  const retentionState = retentionStates.has(rawRetentionState as PrivacyRetentionState)
    ? rawRetentionState as PrivacyRetentionState
    : undefined;
  const retentionReason = retentionReasons.has(rawRetentionReason as PrivacyRetentionReason)
    ? rawRetentionReason as PrivacyRetentionReason
    : undefined;
  const outcomeCode = outcomeCodes.has(rawOutcome as PrivacyOutcomeCode)
    ? rawOutcome as PrivacyOutcomeCode
    : undefined;

  if (!status && !extendByMonths && !retentionState && !outcomeCode) {
    redirect(`/operator/privacy?error=no-change&request=${encodeURIComponent(requestId)}`);
  }

  try {
    await updatePrivacyRequestByAdmin({
      actorId: admin.id,
      requestId,
      status,
      extendByMonths,
      extensionReason,
      retentionState,
      retentionReason,
      outcomeCode
    });
    redirect(`/operator/privacy?updated=${encodeURIComponent(requestId)}`);
  } catch (error) {
    const code = error && typeof error === "object" && "code" in error
      ? String((error as { code?: unknown }).code ?? "")
      : "";
    const known: Record<string, string> = {
      PRIVACY_REQUEST_NOT_FOUND: "not-found",
      PRIVACY_STATUS_INVALID: "invalid-status",
      PRIVACY_EXTENSION_REASON_REQUIRED: "extension-reason",
      PRIVACY_RETENTION_NOT_APPLICABLE: "retention-not-applicable",
      PRIVACY_RETENTION_REASON_REQUIRED: "retention-reason",
      PRIVACY_RETENTION_REVIEW_REQUIRED: "retention-review",
      PRIVACY_OUTCOME_REQUIRED: "outcome-required",
      PRIVACY_REQUEST_CONFLICT: "conflict",
      PRIVACY_REQUEST_TERMINAL: "terminal"
    };
    if (known[code]) redirect(`/operator/privacy?error=${known[code]}&request=${encodeURIComponent(requestId)}`);
    throw error;
  }
}
