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

export const runtime = "nodejs";

function field(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const signatureVersion = field(formData, "Ds_SignatureVersion") || field(formData, "DS_SIGNATUREVERSION");
  const merchantParameters = field(formData, "Ds_MerchantParameters") || field(formData, "DS_MERCHANTPARAMETERS");
  const signature = field(formData, "Ds_Signature") || field(formData, "DS_SIGNATURE");
  if (signatureVersion !== REDSYS_SIGNATURE_VERSION || !merchantParameters || !signature) {
    return new NextResponse("Invalid notification", { status: 400 });
  }

  const notification = decodeRedsysNotification(merchantParameters);
  if (!notification) return new NextResponse("Invalid merchant parameters", { status: 400 });
  const order = await getCheckoutOrderByRedsysOrder(notification.order);
  if (!order) return new NextResponse("Checkout not found", { status: 404 });

  const credentials = await getActivePaymentProviderCredentials("redsys");
  if (!credentials || credentials.provider !== "redsys" || credentials.environment !== order.environment) {
    return new NextResponse("Redsys environment unavailable", { status: 503 });
  }
  if (!verifyRedsysSignature({
    merchantParameters,
    signature,
    orderNumber: notification.order,
    signingKey: credentials.signingKey
  })) {
    return new NextResponse("Invalid signature", { status: 400 });
  }

  const expectedCurrency = redsysCurrencyCode(order.currency);
  if (
    notification.amount !== String(toMinorUnits(order.amount, order.currency)) ||
    !expectedCurrency ||
    notification.currency !== expectedCurrency
  ) {
    return new NextResponse("Payment data mismatch", { status: 400 });
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
  if (!claimed) return new NextResponse("OK");

  // Ds_Order is the stable merchant-side identifier used to resolve this
  // checkout and is therefore the authoritative idempotency reference stored
  // in the payment ledger. The authorization code remains part of eventId for
  // webhook replay detection but is not treated as a globally unique payment key.
  if (isSuccessfulRedsysResponse(notification.response)) {
    await finalizeCheckoutOrder(order.id, "paid", notification.order);
  } else {
    await finalizeCheckoutOrder(order.id, "failed", notification.order);
  }

  return new NextResponse("OK");
}
