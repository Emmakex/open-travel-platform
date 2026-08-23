import { randomInt, randomUUID } from "node:crypto";
import type { ReservationPaymentTerms } from "@/domain/booking/types";
import type { CheckoutOrder, CheckoutOrderStatus } from "@/domain/payment/checkout-types";
import type { PaymentTargetType } from "@/domain/payment/types";
import type { PaymentProviderId } from "@/lib/payment-provider-config";
import { getActivePaymentProviderCredentials } from "@/lib/payment-provider-config";
import { getBookingRepository } from "@/lib/booking-repository";
import { getMongoDatabase } from "@/lib/mongodb";
import { getPaymentRepository } from "@/lib/payment-repository";
import { derivePaymentSchedule } from "@/lib/payment-terms";
import { getServiceReservationForCustomer } from "@/lib/service-reservations";

export const paymentCheckoutOrderCollectionName = "travel_payment_checkout_orders";
export const paymentWebhookEventCollectionName = "travel_payment_webhook_events";

export type CheckoutTarget = {
  targetType: PaymentTargetType;
  targetId: string;
  label: string;
  totalPrice: number;
  currency: string;
  status: string;
  detailUrl: string;
  paymentTerms?: ReservationPaymentTerms;
};

type StoredWebhookEvent = {
  provider: PaymentProviderId;
  eventId: string;
  checkoutId: string;
  createdAt: string;
};

function checkoutError(code: string, message: string) {
  const error = new Error(message);
  Object.assign(error, { code });
  return error;
}

async function collections() {
  const database = await getMongoDatabase();
  const orders = database.collection<CheckoutOrder>(paymentCheckoutOrderCollectionName);
  const events = database.collection<StoredWebhookEvent>(paymentWebhookEventCollectionName);
  await Promise.all([
    orders.createIndex({ id: 1 }, { unique: true, name: "checkout_order_id_unique" }),
    orders.createIndex({ identityId: 1, createdAt: -1 }, { name: "checkout_order_customer" }),
    orders.createIndex({ targetType: 1, targetId: 1, createdAt: -1 }, { name: "checkout_order_target" }),
    orders.createIndex(
      { provider: 1, providerReference: 1 },
      {
        name: "checkout_order_provider_reference",
        partialFilterExpression: { providerReference: { $type: "string" } }
      }
    ),
    orders.createIndex(
      { redsysOrder: 1 },
      {
        name: "checkout_order_redsys_order",
        unique: true,
        partialFilterExpression: { redsysOrder: { $type: "string" } }
      }
    ),
    events.createIndex({ provider: 1, eventId: 1 }, { unique: true, name: "payment_webhook_event_unique" })
  ]);
  return { orders, events };
}

export async function resolveCheckoutTargetForCustomer(
  identityId: string,
  targetType: PaymentTargetType,
  targetId: string
): Promise<CheckoutTarget | null> {
  if (targetType === "trip") {
    const reservation = await getBookingRepository().getReservation(identityId, targetId);
    if (!reservation) return null;
    return {
      targetType,
      targetId: reservation.id,
      label: reservation.tripTitle ?? reservation.tripId,
      totalPrice: reservation.totalPrice,
      currency: reservation.currency,
      status: reservation.status,
      detailUrl: `/account/reservations/${encodeURIComponent(reservation.id)}`,
      paymentTerms: reservation.paymentTerms
    };
  }

  const reservation = await getServiceReservationForCustomer(identityId, targetId);
  if (!reservation) return null;
  return {
    targetType,
    targetId: reservation.id,
    label: reservation.serviceTitle,
    totalPrice: reservation.totalPrice,
    currency: reservation.currency,
    status: reservation.status,
    detailUrl: `/account/services/${encodeURIComponent(reservation.id)}`
  };
}

export async function getCheckoutSummaryForTarget(target: CheckoutTarget) {
  return getPaymentRepository().getTargetSummary({
    id: target.targetId,
    totalPrice: target.totalPrice,
    currency: target.currency,
    targetType: target.targetType
  });
}

export async function getCheckoutPaymentSchedule(target: CheckoutTarget) {
  const summary = await getCheckoutSummaryForTarget(target);
  return {
    summary,
    schedule: derivePaymentSchedule({
      totalAmount: target.totalPrice,
      currency: target.currency,
      paymentTerms: target.paymentTerms,
      netPaidAmount: summary.netPaidAmount
    })
  };
}

function redsysOrderNumber() {
  const first = String(Date.now() % 10000).padStart(4, "0");
  const rest = `${Date.now().toString(36)}${randomInt(0, 36 ** 3).toString(36)}`
    .replace(/[^a-z0-9]/gi, "")
    .slice(-8)
    .padStart(8, "0");
  return `${first}${rest}`.slice(0, 12);
}

export async function createCheckoutOrder(input: {
  identityId: string;
  targetType: PaymentTargetType;
  targetId: string;
  provider: PaymentProviderId;
}) {
  const target = await resolveCheckoutTargetForCustomer(input.identityId, input.targetType, input.targetId);
  if (!target) throw checkoutError("CHECKOUT_TARGET_NOT_FOUND", "Payment target not found.");
  if (target.status === "cancelled") throw checkoutError("CHECKOUT_TARGET_CANCELLED", "Cancelled reservations cannot be paid.");

  const credentials = await getActivePaymentProviderCredentials(input.provider);
  if (!credentials) throw checkoutError("CHECKOUT_PROVIDER_UNAVAILABLE", "Payment provider is not enabled or configured.");

  const payments = getPaymentRepository();
  const summary = await getCheckoutSummaryForTarget(target);
  if (summary.outstandingAmount <= 0) throw checkoutError("CHECKOUT_ALREADY_PAID", "There is no outstanding balance.");
  if (summary.pendingPaymentAmount > 0) {
    throw checkoutError("CHECKOUT_PAYMENT_PENDING", "Another payment is already pending for this reservation.");
  }
  const schedule = derivePaymentSchedule({
    totalAmount: target.totalPrice,
    currency: target.currency,
    paymentTerms: target.paymentTerms,
    netPaidAmount: summary.netPaidAmount
  });
  const payableAmount = Math.min(summary.outstandingAmount, schedule.nextPaymentAmount || summary.outstandingAmount);
  if (payableAmount <= 0) throw checkoutError("CHECKOUT_ALREADY_PAID", "There is no scheduled payment outstanding.");

  const transaction = await payments.createTransaction({
    reservationId: target.targetId,
    targetType: target.targetType,
    type: "payment",
    amount: payableAmount,
    currency: target.currency,
    provider: input.provider,
    method: "online",
    status: "pending",
    actorIdentityId: input.identityId,
    actorRole: "customer",
    note: `Online checkout · ${target.label}${schedule.nextInstallment ? ` · ${schedule.nextInstallment.label}` : ""}`
  });

  const order: CheckoutOrder = {
    id: `chk-${randomUUID()}`,
    identityId: input.identityId,
    targetType: target.targetType,
    targetId: target.targetId,
    targetLabel: target.label,
    amount: payableAmount,
    currency: target.currency,
    provider: input.provider,
    environment: credentials.environment,
    transactionId: transaction.id,
    status: "pending",
    ...(input.provider === "redsys" ? { redsysOrder: redsysOrderNumber() } : {}),
    createdAt: new Date().toISOString()
  };

  try {
    const { orders } = await collections();
    await orders.insertOne(order);
    return order;
  } catch (error) {
    await payments.updateTransaction({ transactionId: transaction.id, status: "failed" }).catch(() => undefined);
    throw error;
  }
}

export async function getCheckoutOrderForCustomer(identityId: string, checkoutId: string) {
  const { orders } = await collections();
  return orders.findOne({ id: checkoutId, identityId });
}

export async function getCheckoutOrder(checkoutId: string) {
  const { orders } = await collections();
  return orders.findOne({ id: checkoutId });
}

export async function getCheckoutOrderByRedsysOrder(orderNumber: string) {
  const { orders } = await collections();
  return orders.findOne({ provider: "redsys", redsysOrder: orderNumber });
}

export async function setCheckoutProviderReference(checkoutId: string, providerReference: string) {
  const { orders } = await collections();
  const updatedAt = new Date().toISOString();
  return orders.findOneAndUpdate(
    { id: checkoutId, status: "pending" },
    { $set: { providerReference, updatedAt } },
    { returnDocument: "after" }
  );
}

export async function finalizeCheckoutOrder(
  checkoutId: string,
  status: Exclude<CheckoutOrderStatus, "pending">,
  providerReference?: string
) {
  const { orders } = await collections();
  const current = await orders.findOne({ id: checkoutId });
  if (!current) return null;
  if (current.status !== "pending") return current;

  const paymentStatus = status === "paid" ? "succeeded" : "failed";
  await getPaymentRepository().updateTransaction({
    transactionId: current.transactionId,
    status: paymentStatus,
    providerReference
  });

  const updatedAt = new Date().toISOString();
  return orders.findOneAndUpdate(
    { id: checkoutId, status: "pending" },
    {
      $set: {
        status,
        updatedAt,
        ...(providerReference ? { providerReference } : {})
      }
    },
    { returnDocument: "after" }
  );
}

export async function claimPaymentWebhookEvent(input: {
  provider: PaymentProviderId;
  eventId: string;
  checkoutId: string;
}) {
  const { events } = await collections();
  try {
    await events.insertOne({ ...input, createdAt: new Date().toISOString() });
    return true;
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && Number(error.code) === 11000) return false;
    throw error;
  }
}

export function publicPaymentBaseUrl() {
  return (process.env.KTRAVEL_PUBLIC_URL?.trim() || "https://travel.kairoseth.com").replace(/\/$/, "");
}
