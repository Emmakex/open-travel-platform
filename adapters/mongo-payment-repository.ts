import { randomUUID } from "node:crypto";
import type { Reservation } from "@/domain/booking/types";
import type {
  CreatePaymentTransactionInput,
  PaymentTransaction,
  UpdatePaymentTransactionInput
} from "@/domain/payment/types";
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

export class MongoPaymentRepository implements PaymentRepository {
  private async database() {
    const client = await getMongoClient();
    const database = client.db(getMongoDatabaseName());
    await Promise.all([
      ensureMongoReservationIndexes(database),
      ensureMongoPaymentIndexes(database)
    ]);
    return database;
  }

  async getSummary(reservation: Reservation) {
    const transactions = await this.listTransactions(reservation.id);
    return buildPaymentSummary(reservation, transactions);
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
        buildPaymentSummary(reservation, grouped.get(reservation.id) ?? [])
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
    const reservations = database.collection<StoredReservation>(travelReservationCollectionName);
    const payments = database.collection<StoredPaymentTransaction>(travelPaymentTransactionCollectionName);
    const reservation = await reservations.findOne({ id: input.reservationId });

    if (!reservation) {
      throw paymentError("PAYMENT_RESERVATION_NOT_FOUND", "Reservation not found.");
    }
    if (!validAmount(input.amount)) {
      throw paymentError("PAYMENT_AMOUNT_INVALID", "Payment amount must be a positive value with at most two decimals.");
    }
    if (input.currency !== reservation.currency) {
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
      .find({ reservationId: reservation.id })
      .toArray();
    const summary = buildPaymentSummary(reservation, existingTransactions);
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
      reservationId: reservation.id,
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
    const reservations = database.collection<StoredReservation>(travelReservationCollectionName);
    const payments = database.collection<StoredPaymentTransaction>(travelPaymentTransactionCollectionName);
    const current = await payments.findOne({ id: input.transactionId });
    if (!current) return null;
    if (current.status !== "pending") {
      if (current.status === input.status) return current;
      throw paymentError("PAYMENT_FINALIZED", "Only pending transactions can change status.");
    }

    const reservation = await reservations.findOne({ id: current.reservationId });
    if (!reservation) {
      throw paymentError("PAYMENT_RESERVATION_NOT_FOUND", "Reservation not found.");
    }

    if (input.status === "succeeded") {
      const otherTransactions = await payments
        .find({ reservationId: reservation.id, id: { $ne: current.id } })
        .toArray();
      const summary = buildPaymentSummary(reservation, otherTransactions);
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
