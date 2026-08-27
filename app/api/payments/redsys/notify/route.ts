import { NextResponse } from "next/server";
import {
  claimPaymentWebhookEvent,
  finalizeCheckoutOrder,
  getCheckoutOrderByRedsysOrder
} from "@/lib/payment-checkout";
import { getActivePaymentProviderCredentials } from "@/lib/payment-provider-config";
import {
  decodeRedsysNotification,
  isSuccessfulRedsysResponse,
  REDSYS_SIGNATURE_VERSION,
  redsysCurrencyCode,
  verifyRedsysSignature
} from "@/lib/payment-redsys";
import { toMinorUnits } from "@/lib/payment-stripe";
import {
  correlationHeaders,
  emitOperationalLog,
  getRequestCorrelationId
} from "@/lib/observability";

export const runtime = "nodejs";

function field(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

function text(body: string, correlationId: string, status = 200) {
  return new NextResponse(body, {
    status,
    headers: correlationHeaders(correlationId)
  });
}

function logRejected(correlationId: string, reason: string, startedAt: number) {
  emitOperationalLog({
    level: "warn",
    event: "payment.notification.rejected",
    component: "payment-webhook",
    correlationId,
    fields: { provider: "redsys", reason, durationMs: Date.now() - startedAt }
  });
}

export async function POST(request: Request) {
  const correlationId = getRequestCorrelationId(request);
  const startedAt = Date.now();

  try {
    const formData = await request.formData();
    const signatureVersion = field(formData, "Ds_SignatureVersion") || field(formData, "DS_SIGNATUREVERSION");
    const merchantParameters = field(formData, "Ds_MerchantParameters") || field(formData, "DS_MERCHANTPARAMETERS");
    const signature = field(formData, "Ds_Signature") || field(formData, "DS_SIGNATURE");
    if (signatureVersion !== REDSYS_SIGNATURE_VERSION || !merchantParameters || !signature) {
      logRejected(correlationId, "invalid-notification", startedAt);
      return text("Invalid notification", correlationId, 400);
    }

    const notification = decodeRedsysNotification(merchantParameters);
    if (!notification) {
      logRejected(correlationId, "invalid-merchant-parameters", startedAt);
      return text("Invalid merchant parameters", correlationId, 400);
    }
    const order = await getCheckoutOrderByRedsysOrder(notification.order);
    if (!order) {
      logRejected(correlationId, "checkout-not-found", startedAt);
      return text("Checkout not found", correlationId, 404);
    }

    const credentials = await getActivePaymentProviderCredentials("redsys");
    if (!credentials || credentials.provider !== "redsys" || credentials.environment !== order.environment) {
      emitOperationalLog({
        level: "error",
        event: "payment.notification.unavailable",
        component: "payment-webhook",
        correlationId,
        fields: { provider: "redsys", reason: "environment-unavailable" }
      });
      return text("Redsys environment unavailable", correlationId, 503);
    }
    if (!verifyRedsysSignature({
      merchantParameters,
      signature,
      orderNumber: notification.order,
      signingKey: credentials.signingKey
    })) {
      logRejected(correlationId, "invalid-signature", startedAt);
      return text("Invalid signature", correlationId, 400);
    }

    const expectedCurrency = redsysCurrencyCode(order.currency);
    if (
      notification.amount !== String(toMinorUnits(order.amount, order.currency)) ||
      !expectedCurrency ||
      notification.currency !== expectedCurrency
    ) {
      logRejected(correlationId, "payment-data-mismatch", startedAt);
      return text("Payment data mismatch", correlationId, 400);
    }

    const eventId = [
      notification.order,
      notification.response,
      notification.authorizationCode ?? "none"
    ].join(":");
    const claimed = await claimPaymentWebhookEvent({
      provider: "redsys",
      eventId,
      checkoutId: order.id
    });
    if (!claimed) {
      emitOperationalLog({
        level: "info",
        event: "payment.notification.duplicate",
        component: "payment-webhook",
        correlationId,
        fields: { provider: "redsys", durationMs: Date.now() - startedAt }
      });
      return text("OK", correlationId);
    }

    const outcome = isSuccessfulRedsysResponse(notification.response) ? "paid" : "failed";
    await finalizeCheckoutOrder(order.id, outcome, notification.order);
    emitOperationalLog({
      level: "info",
      event: "payment.notification.processed",
      component: "payment-webhook",
      correlationId,
      fields: { provider: "redsys", outcome, durationMs: Date.now() - startedAt }
    });
    return text("OK", correlationId);
  } catch (error) {
    emitOperationalLog({
      level: "error",
      event: "payment.notification.failed",
      component: "payment-webhook",
      correlationId,
      fields: { provider: "redsys", durationMs: Date.now() - startedAt },
      error
    });
    return text("Notification processing failed", correlationId, 500);
  }
}
