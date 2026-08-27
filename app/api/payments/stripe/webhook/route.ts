import { NextResponse } from "next/server";
import { reportOperationalFailure } from "@/lib/failure-reporting";
import {
  claimPaymentWebhookEvent,
  finalizeCheckoutOrder,
  getCheckoutOrder
} from "@/lib/payment-checkout";
import { getActivePaymentProviderCredentials } from "@/lib/payment-provider-config";
import {
  parseStripeWebhookEvent,
  toMinorUnits,
  verifyStripeWebhookSignature
} from "@/lib/payment-stripe";
import {
  correlationHeaders,
  emitOperationalLog,
  getRequestCorrelationId
} from "@/lib/observability";

export const runtime = "nodejs";

function text(body: string, correlationId: string, status: number) {
  return new NextResponse(body, {
    status,
    headers: correlationHeaders(correlationId)
  });
}

function json(body: Record<string, unknown>, correlationId: string, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: correlationHeaders(correlationId)
  });
}

function logRejected(correlationId: string, reason: string, startedAt: number, eventType?: string) {
  emitOperationalLog({
    level: "warn",
    event: "payment.webhook.rejected",
    component: "payment-webhook",
    correlationId,
    fields: {
      provider: "stripe",
      reason,
      ...(eventType ? { eventType } : {}),
      durationMs: Date.now() - startedAt
    }
  });
}

export async function POST(request: Request) {
  const correlationId = getRequestCorrelationId(request);
  const startedAt = Date.now();

  try {
    const rawBody = await request.text();
    const signature = request.headers.get("stripe-signature") ?? "";
    const event = parseStripeWebhookEvent(rawBody);
    if (!event || !signature) {
      logRejected(correlationId, "invalid-payload", startedAt);
      return text("Invalid payload", correlationId, 400);
    }

    const session = event.data.object;
    const checkoutId = session.metadata?.ktravel_checkout_id;
    if (!checkoutId) {
      logRejected(correlationId, "checkout-metadata-missing", startedAt, event.type);
      return text("Checkout metadata missing", correlationId, 400);
    }

    const order = await getCheckoutOrder(checkoutId);
    if (!order || order.provider !== "stripe") {
      logRejected(correlationId, "checkout-not-found", startedAt, event.type);
      return text("Checkout not found", correlationId, 404);
    }

    const credentials = await getActivePaymentProviderCredentials("stripe");
    if (!credentials || credentials.provider !== "stripe" || credentials.environment !== order.environment) {
      await reportOperationalFailure({
        severity: "error",
        event: "payment.webhook.unavailable",
        component: "payment-webhook",
        correlationId,
        fields: { provider: "stripe", reason: "environment-unavailable", eventType: event.type }
      });
      return text("Stripe environment unavailable", correlationId, 503);
    }
    if (!verifyStripeWebhookSignature(rawBody, signature, credentials.webhookSecret)) {
      logRejected(correlationId, "invalid-signature", startedAt, event.type);
      return text("Invalid signature", correlationId, 400);
    }
    if (order.providerReference && session.id !== order.providerReference) {
      logRejected(correlationId, "session-mismatch", startedAt, event.type);
      return text("Session mismatch", correlationId, 400);
    }
    if (
      session.amount_total !== null &&
      session.amount_total !== undefined &&
      session.amount_total !== toMinorUnits(order.amount, order.currency)
    ) {
      logRejected(correlationId, "amount-mismatch", startedAt, event.type);
      return text("Amount mismatch", correlationId, 400);
    }
    if (session.currency && session.currency.toUpperCase() !== order.currency.toUpperCase()) {
      logRejected(correlationId, "currency-mismatch", startedAt, event.type);
      return text("Currency mismatch", correlationId, 400);
    }

    const claimed = await claimPaymentWebhookEvent({
      provider: "stripe",
      eventId: event.id,
      checkoutId: order.id
    });
    if (!claimed) {
      emitOperationalLog({
        level: "info",
        event: "payment.webhook.duplicate",
        component: "payment-webhook",
        correlationId,
        fields: { provider: "stripe", eventType: event.type, durationMs: Date.now() - startedAt }
      });
      return json({ received: true, duplicate: true }, correlationId);
    }

    let outcome = "ignored";
    if (
      (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") &&
      (session.payment_status === "paid" || session.payment_status === "no_payment_required")
    ) {
      await finalizeCheckoutOrder(order.id, "paid", session.id);
      outcome = "paid";
    } else if (
      event.type === "checkout.session.expired" ||
      event.type === "checkout.session.async_payment_failed"
    ) {
      await finalizeCheckoutOrder(order.id, "failed", session.id);
      outcome = "failed";
    }

    emitOperationalLog({
      level: "info",
      event: "payment.webhook.processed",
      component: "payment-webhook",
      correlationId,
      fields: { provider: "stripe", eventType: event.type, outcome, durationMs: Date.now() - startedAt }
    });
    return json({ received: true }, correlationId);
  } catch (error) {
    await reportOperationalFailure({
      severity: "error",
      event: "payment.webhook.failed",
      component: "payment-webhook",
      correlationId,
      fields: { provider: "stripe", durationMs: Date.now() - startedAt },
      error
    });
    return text("Webhook processing failed", correlationId, 500);
  }
}
