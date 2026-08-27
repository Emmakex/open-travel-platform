"use server";

import { redirect } from "next/navigation";
import { createPrivacyRequest, privacyRightTypes, withdrawPrivacyRequest } from "@/lib/privacy-rights";
import { requireCustomerIdentity } from "@/lib/require-customer-identity";

function value(formData: FormData, key: string) {
  const item = formData.get(key);
  return typeof item === "string" ? item.trim() : "";
}

export async function createPrivacyRequestAction(formData: FormData) {
  const identity = await requireCustomerIdentity();
  const type = value(formData, "type");
  if (!(privacyRightTypes as readonly string[]).includes(type)) {
    redirect("/account/privacy?error=invalid-type");
  }

  try {
    const request = await createPrivacyRequest(identity.id, type);
    redirect(`/account/privacy?created=${encodeURIComponent(request.id)}`);
  } catch (error) {
    if (error && typeof error === "object" && "code" in error) {
      if ((error as { code?: unknown }).code === "PRIVACY_REQUEST_ALREADY_OPEN") {
        redirect("/account/privacy?error=already-open");
      }
    }
    throw error;
  }
}

export async function withdrawPrivacyRequestAction(formData: FormData) {
  const identity = await requireCustomerIdentity();
  const requestId = value(formData, "requestId");
  if (!/^prq-[a-f0-9-]{36}$/i.test(requestId)) {
    redirect("/account/privacy?error=invalid-request");
  }

  try {
    await withdrawPrivacyRequest(identity.id, requestId);
    redirect(`/account/privacy?withdrawn=${encodeURIComponent(requestId)}`);
  } catch (error) {
    if (error && typeof error === "object" && "code" in error) {
      const code = (error as { code?: unknown }).code;
      if (code === "PRIVACY_REQUEST_NOT_FOUND" || code === "PRIVACY_REQUEST_TERMINAL") {
        redirect("/account/privacy?error=request-unavailable");
      }
    }
    throw error;
  }
}
