import { randomUUID } from "node:crypto";
import type { Reservation } from "@/domain/booking/types";
import type {
  CreatePaymentTransactionInput,
  PaymentTargetSnapshot,
  PaymentTargetType,
  PaymentTransaction,
  UpdatePaymentTransactionInput
} from "@/domain/payment/types";
import type { ServiceReservation } from "@/domain/services/booking-types";
import {
  ensureMongoPaymentIndexes,
  travelPaymentTransactionCollectionName,
  type StoredPaymentTransaction
} from "@/lib/mongo-payments";
import {
  ensureMongoReservationIndexes,
  travelReservationCollectionName,
  type StoredReservation
} from "@/lib/mongo-reservations";
import { getMongoClient, getMongoDatabaseName } from "@/lib/mongodb";
import { buildPaymentSummary } from "@/lib/payment-summary";
import {
  ensureServiceReservationIndexes,
  serviceReservationCollectionName
} from "@/lib/service-reservations";
import type { PaymentRepository } from "@/repositories/payment-repository";

function paymentError(code: string, message: string) {
  const error = new Error(message);
  Object.assign(error, { code });
  return error;
}

function money(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function validAmount(value: number) {
  return Number.isFinite(value) && value > 0 && money(value) === value;
}

function targetTypeFor(id: string, explicit?: PaymentTargetType): PaymentTargetType {
  if (explicit) return explicit;
  return id.startsWith("srv-") ? "service" : "trip";
}

type StoredPaymentTarget = PaymentTargetSnapshot & { status?: string };

export class MongoPaymentRepository implements PaymentRepository {
  private async database() {
    const client = await getMongoClient();
    const database = client.db(getMongoDatabaseName());
    await Promise.all([
      ensureMongoReservationIndexes(database),
      ensureServiceReservationIndexes(database),
      ensureMongoPaymentIndexes(database)
    ]);
    return database;
  }

  private async storedTarget(
    database: Awaited<ReturnType<MongoPaymentRepository["database"]>>,
    id: string,
    explicitType?: PaymentTargetType
  ): Promise<StoredPaymentTarget | null> {
    const targetType = targetTypeFor(id, explicitType);
    if (targetType === "service") {
      const service = await database
        .collection<ServiceReservation>(serviceReservationCollectionName)
        .findOne({ id });
      return service ? {
        id: service.id,
        totalPrice: service.totalPrice,
        currency: service.currency,
        targetType,
        status: service.status
      } : null;
    }

    const reservation = await database
      .collection<StoredReservation>(travelReservationCollectionName)
      .findOne({ id });
    return reservation ? {
      id: reservation.id,
      totalPrice: reservation.totalPrice,
      currency: reservation.currency,
      targetType,
      status: reservation.status
    } : null;
  }

  async getSummary(reservation: Reservation) {
    const transactions = await this.listTransactions(reservation.id);
    return buildPaymentSummary({ ...reservation, targetType: "trip" }, transactions);
  }

  async getTargetSummary(target: PaymentTargetSnapshot) {
    const transactions = await this.listTransactions(target.id);
    return buildPaymentSummary(target, transactions);
  }

  async getSummaries(reservations: Reservation[]) {
    if (!reservations.length) return {};
    const database = await this.database();
    const ids = reservations.map((item) => item.id);
    const transactions = await database
      .collection<StoredPaymentTransaction>(travelPaymentTransactionCollectionName)
      .find({ reservationId: { $in: ids } })
      .sort({ createdAt: 1 })
      .toArray();

    const grouped = new Map<string, PaymentTransaction[]>();
    for (const transaction of transactions) {
      const current = grouped.get(transaction.reservationId) ?? [];
      current.push(transaction);
      grouped.set(transaction.reservationId, current);
    }

    return Object.fromEntries(
      reservations.map((reservation) => [
        reservation.id,
        buildPaymentSummary(
          { ...reservation, targetType: "trip" },
          grouped.get(reservation.id) ?? []
        )
      ])
    );
  }

  async listTransactions(reservationId: string) {
    const database = await this.database();
    return database
      .collection<StoredPaymentTransaction>(travelPaymentTransactionCollectionName)
      .find({ reservationId })
      .sort({ createdAt: -1 })
      .toArray();
  }

  async listRecentTransactions(limit = 100) {
    const database = await this.database();
    return database
      .collection<StoredPaymentTransaction>(travelPaymentTransactionCollectionName)
      .find({})
      .sort({ createdAt: -1 })
      .limit(Math.max(1, Math.min(limit, 500)))
      .toArray();
  }

  async createTransaction(input: CreatePaymentTransactionInput) {
    const database = await this.database();
    const payments = database.collection<StoredPaymentTransaction>(travelPaymentTransactionCollectionName);
    const target = await this.storedTarget(database, input.reservationId, input.targetType);

    if (!target) {
      throw paymentError("PAYMENT_RESERVATION_NOT_FOUND", "Payment target not found.");
    }
    if (target.status === "cancelled") {
      throw paymentError("PAYMENT_TARGET_CANCELLED", "Cancelled reservations cannot receive payments.");
    }
    if (!validAmount(input.amount)) {
      throw paymentError("PAYMENT_AMOUNT_INVALID", "Payment amount must be a positive value with at most two decimals.");
    }
    if (input.currency !== target.currency) {
      throw paymentError("PAYMENT_CURRENCY_MISMATCH", "Payment currency does not match the reservation.");
    }

    if (input.providerReference) {
      const existing = await payments.findOne({
        provider: input.provider,
        providerReference: input.providerReference
      });
      if (existing) {
        if (
          existing.reservationId === input.reservationId &&
          existing.type === input.type &&
          existing.amount === input.amount &&
          existing.currency === input.currency
        ) {
          return existing;
        }
        throw paymentError("PAYMENT_REFERENCE_CONFLICT", "Provider payment reference is already in use.");
      }
    }

    const existingTransactions = await payments
      .find({ reservationId: target.id })
      .toArray();
    const summary = buildPaymentSummary(target, existingTransactions);
    const status = input.status ?? "pending";
    const amount = money(input.amount);

    if (input.type === "payment") {
      const available = status === "pending"
        ? money(summary.outstandingAmount - summary.pendingPaymentAmount)
        : summary.outstandingAmount;
      if (amount > available) {
        throw paymentError("PAYMENT_EXCEEDS_BALANCE", "Payment amount exceeds the reservation balance.");
      }
    } else {
      const available = status === "pending"
        ? money(summary.refundableAmount - summary.pendingRefundAmount)
        : summary.refundableAmount;
      if (amount > available) {
        throw paymentError("REFUND_EXCEEDS_PAID", "Refund amount exceeds the refundable balance.");
      }
    }

    const transaction: PaymentTransaction = {
      id: `pay-${randomUUID()}`,
      reservationId: target.id,
      targetType: target.targetType,
      type: input.type,
      status,
      amount,
      currency: input.currency,
      provider: input.provider,
      method: input.method,
      providerReference: input.providerReference,
      note: input.note,
      actorIdentityId: input.actorIdentityId,
      actorRole: input.actorRole,
      createdAt: new Date().toISOString()
    };

    await payments.insertOne(transaction);
    return transaction;
  }

  async updateTransaction(input: UpdatePaymentTransactionInput) {
    const database = await this.database();
    const payments = database.collection<StoredPaymentTransaction>(travelPaymentTransactionCollectionName);
    const current = await payments.findOne({ id: input.transactionId });
    if (!current) return null;
    if (current.status !== "pending") {
      if (current.status === input.status) return current;
      throw paymentError("PAYMENT_FINALIZED", "Only pending transactions can change status.");
    }

    const target = await this.storedTarget(database, current.reservationId, current.targetType);
    if (!target) {
      throw paymentError("PAYMENT_RESERVATION_NOT_FOUND", "Payment target not found.");
    }

    if (input.status === "succeeded") {
      const otherTransactions = await payments
        .find({ reservationId: target.id, id: { $ne: current.id } })
        .toArray();
      const summary = buildPaymentSummary(target, otherTransactions);
      if (current.type === "payment" && current.amount > summary.outstandingAmount) {
        throw paymentError("PAYMENT_EXCEEDS_BALANCE", "Payment amount exceeds the reservation balance.");
      }
      if (current.type === "refund" && current.amount > summary.refundableAmount) {
        throw paymentError("REFUND_EXCEEDS_PAID", "Refund amount exceeds the refundable balance.");
      }
    }

    const updatedAt = new Date().toISOString();
    const update = await payments.findOneAndUpdate(
      { id: current.id, status: "pending" },
      {
        $set: {
          status: input.status,
          updatedAt,
          ...(input.providerReference ? { providerReference: input.providerReference } : {})
        }
      },
      { returnDocument: "after" }
    );

    return update;
  }
}
