"use server";

import { redirect } from "next/navigation";
import { operationsConfig } from "@/lib/operations-config";
import { requireStaffCapability } from "@/lib/require-staff-capability";
import { setSupplierReferenceDisclosure } from "@/lib/customer-document-references";

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
  if (!error || typeof error !== "object" || !("code" in error)) return "reference-disclosure-failed";
  switch (error.code) {
    case "REFERENCE_DISCLOSURE_UNAVAILABLE": return "reference-disclosure-unavailable";
    case "FULFILMENT_NOT_FOUND": return "fulfilment-not-found";
    case "REFERENCE_REQUIRED": return "reference-required";
    case "NO_CHANGES": return "no-changes";
    case "INVALID_REFERENCE_DISCLOSURE": return "invalid-reference-disclosure";
    default: return "reference-disclosure-failed";
  }
}

export async function setSupplierReferenceDisclosureAction(formData: FormData) {
  const staff = await requireStaffCapability("suppliers");
  const fulfilmentId = value(formData, "fulfilmentId");
  const visible = value(formData, "visible") === "1";
  const returnTo = safeReturnTo(value(formData, "returnTo"));

  if (!operationsConfig.writesEnabled || !fulfilmentId) {
    redirect(withQuery(returnTo, "fulfilmentError", "invalid-reference-disclosure"));
  }

  try {
    await setSupplierReferenceDisclosure({
      fulfilmentId,
      visible,
      actorIdentityId: staff.id,
      actorRole: staff.role,
      actorDisplayName: staff.displayName
    });
  } catch (error) {
    redirect(withQuery(returnTo, "fulfilmentError", errorQuery(error)));
  }

  redirect(withQuery(returnTo, "fulfilmentUpdated", "reference-disclosure"));
}
