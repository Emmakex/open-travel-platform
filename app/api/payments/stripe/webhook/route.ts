import { NextResponse } from "next/server";
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

export const runtime = "nodejs";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("stripe-signature") ?? "";
  const event = parseStripeWebhookEvent(rawBody);
  if (!event || !signature) return new NextResponse("Invalid payload", { status: 400 });

  const session = event.data.object;
  const checkoutId = session.metadata?.ktravel_checkout_id;
  if (!checkoutId) return new NextResponse("Checkout metadata missing", { status: 400 });

  const order = await getCheckoutOrder(checkoutId);
  if (!order || order.provider !== "stripe") return new NextResponse("Checkout not found", { status: 404 });

  const credentials = await getActivePaymentProviderCredentials("stripe");
  if (!credentials || credentials.provider !== "stripe" || credentials.environment !== order.environment) {
    return new NextResponse("Stripe environment unavailable", { status: 503 });
  }
  if (!verifyStripeWebhookSignature(rawBody, signature, credentials.webhookSecret)) {
    return new NextResponse("Invalid signature", { status: 400 });
  }
  if (order.providerReference && session.id !== order.providerReference) {
    return new NextResponse("Session mismatch", { status: 400 });
  }
  if (
    session.amount_total !== null &&
    session.amount_total !== undefined &&
    session.amount_total !== toMinorUnits(order.amount, order.currency)
  ) {
    return new NextResponse("Amount mismatch", { status: 400 });
  }
  if (session.currency && session.currency.toUpperCase() !== order.currency.toUpperCase()) {
    return new NextResponse("Currency mismatch", { status: 400 });
  }

  const claimed = await claimPaymentWebhookEvent({
    provider: "stripe",
    eventId: event.id,
    checkoutId: order.id
  });
  if (!claimed) return NextResponse.json({ received: true, duplicate: true });

  if (
    (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") &&
    (session.payment_status === "paid" || session.payment_status === "no_payment_required")
  ) {
    await finalizeCheckoutOrder(order.id, "paid", session.id);
  } else if (
    event.type === "checkout.session.expired" ||
    event.type === "checkout.session.async_payment_failed"
  ) {
    await finalizeCheckoutOrder(order.id, "failed", session.id);
  }

  return NextResponse.json({ received: true });
}
