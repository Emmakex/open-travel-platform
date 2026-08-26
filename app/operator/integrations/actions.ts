"use server";

import { redirect } from "next/navigation";
import {
  deleteIntegrationEndpoint,
  saveIntegrationEndpoint
} from "@/lib/integration-endpoints";
import {
  claimIntegrationWorkerRun,
  finishIntegrationWorkerRun,
  getIntegrationWorkerMinimumIntervalSeconds,
  pruneCompletedIntegrationHistory,
  releaseIntegrationWorkerLease,
  requeueDeadLetterDelivery
} from "@/lib/integration-operations";
import { processIntegrationDeliveries } from "@/lib/integration-outbox";
import { requireAdminIdentity } from "@/lib/require-admin-identity";

function value(formData: FormData, key: string) {
  const item = formData.get(key);
  return typeof item === "string" ? item.trim() : "";
}

function errorCode(error: unknown) {
  if (!error || typeof error !== "object" || !("code" in error)) return "save-failed";
  const code = String(error.code);
  const mapping: Record<string, string> = {
    INTEGRATION_ENCRYPTION_REQUIRED: "encryption-required",
    INTEGRATION_NAME_INVALID: "invalid-name",
    INTEGRATION_URL_INVALID: "invalid-url",
    INTEGRATION_URL_HTTPS_REQUIRED: "https-required",
    INTEGRATION_URL_PRIVATE: "private-target",
    INTEGRATION_EVENTS_REQUIRED: "events-required",
    INTEGRATION_NOT_FOUND: "not-found",
    INTEGRATION_SECRET_REQUIRED: "secret-required",
    INTEGRATION_SECRET_WEAK: "secret-required"
  };
  return mapping[code] ?? "save-failed";
}

export async function saveIntegrationEndpointAction(formData: FormData) {
  const admin = await requireAdminIdentity();
  try {
    await saveIntegrationEndpoint({
      endpointId: value(formData, "endpointId") || undefined,
      name: value(formData, "name"),
      url: value(formData, "url"),
      enabled: formData.get("enabled") === "on",
      subscribedEvents: formData.getAll("event").filter((item): item is string => typeof item === "string"),
      signingSecret: value(formData, "signingSecret") || undefined,
      actorIdentityId: admin.id,
      actorRole: admin.role
    });
  } catch (error) {
    redirect(`/operator/integrations?error=${encodeURIComponent(errorCode(error))}`);
  }
  redirect("/operator/integrations?saved=1");
}

export async function deleteIntegrationEndpointAction(formData: FormData) {
  const admin = await requireAdminIdentity();
  const endpointId = value(formData, "endpointId");
  if (!endpointId) redirect("/operator/integrations?error=not-found");
  await deleteIntegrationEndpoint({ endpointId, actorIdentityId: admin.id, actorRole: admin.role });
  redirect("/operator/integrations?deleted=1");
}

export async function processIntegrationDeliveriesAction() {
  await requireAdminIdentity();
  const claim = await claimIntegrationWorkerRun({
    source: "admin",
    minimumIntervalSeconds: getIntegrationWorkerMinimumIntervalSeconds()
  });
  if (!claim.claimed) redirect("/operator/integrations?error=worker-busy");

  try {
    const result = await processIntegrationDeliveries({ limit: 25 });
    await pruneCompletedIntegrationHistory();
    await finishIntegrationWorkerRun({ result });
    const params = new URLSearchParams({
      processed: String(result.processed),
      succeeded: String(result.succeeded),
      retried: String(result.retried),
      dead: String(result.deadLettered)
    });
    redirect(`/operator/integrations?${params.toString()}`);
  } catch (error) {
    await releaseIntegrationWorkerLease();
    console.error("Admin integration delivery run failed", error);
    redirect("/operator/integrations?error=worker-failed");
  }
}

export async function requeueIntegrationDeliveryAction(formData: FormData) {
  const admin = await requireAdminIdentity();
  const deliveryId = value(formData, "deliveryId");
  if (!deliveryId) redirect("/operator/integrations?error=delivery-not-found");
  const changed = await requeueDeadLetterDelivery({
    deliveryId,
    actorIdentityId: admin.id,
    actorRole: admin.role
  });
  if (!changed) redirect(`/operator/integrations/deliveries/${encodeURIComponent(deliveryId)}?error=not-dead-letter`);
  redirect(`/operator/integrations/deliveries/${encodeURIComponent(deliveryId)}?requeued=1`);
}
