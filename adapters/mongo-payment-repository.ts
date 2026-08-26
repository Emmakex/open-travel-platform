import { randomUUID } from "node:crypto";
import type { ClientSession } from "mongodb";
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
  createIntegrationEvent,
  enqueueIntegrationEvent,
  ensureIntegrationOutboxIndexes
} from "@/lib/integration-outbox";
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

function mongoCode(error: unknown) {
  return error && typeof error === "object" && "code" in error
    ? Number((error as { code?: unknown }).code)
    : undefined;
}

function sameProviderMovement(
  existing: PaymentTransaction,
  input: CreatePaymentTransactionInput
) {
  return existing.reservationId === input.reservationId &&
    existing.type === input.type &&
    existing.amount === input.amount &&
    existing.currency === input.currency;
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

function succeededPaymentIntegrationEvent(transaction: PaymentTransaction) {
  const occurredAt = transaction.updatedAt ?? transaction.createdAt;
  return createIntegrationEvent({
    id: `intevt-payment-${transaction.id}-succeeded`,
    type: "payment.transaction.succeeded",
    occurredAt,
    aggregateType: "payment-transaction",
    aggregateId: transaction.id,
    payload: {
      transactionId: transaction.id,
      targetType: transaction.targetType === "service" ? "service" : "trip",
      targetId: transaction.reservationId,
      movementType: transaction.type,
      amount: transaction.amount,
      currency: transaction.currency,
      provider: transaction.provider,
      ...(transaction.method ? { method: transaction.method } : {}),
      ...(transaction.providerReference ? { providerReference: transaction.providerReference } : {}),
      succeededAt: occurredAt
    }
  });
}

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
    explicitType?: PaymentTargetType,
    session?: ClientSession
  ): Promise<StoredPaymentTarget | null> {
    const targetType = targetTypeFor(id, explicitType);
    if (targetType === "service") {
      const service = await database
        .collection<ServiceReservation>(serviceReservationCollectionName)
        .findOne({ id }, session ? { session } : undefined);
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
      .findOne({ id }, session ? { session } : undefined);
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
    const client = await getMongoClient();
    const database = await this.database();
    await ensureIntegrationOutboxIndexes(database);
    const payments = database.collection<StoredPaymentTransaction>(travelPaymentTransactionCollectionName);
    const session = client.startSession();
    let result: PaymentTransaction | null = null;

    try {
      await session.withTransaction(async () => {
        const target = await this.storedTarget(database, input.reservationId, input.targetType, session);
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
          }, { session });
          if (existing) {
            if (sameProviderMovement(existing, input)) {
              result = existing;
              return;
            }
            throw paymentError("PAYMENT_REFERENCE_CONFLICT", "Provider payment reference is already in use.");
          }
        }

        const existingTransactions = await payments
          .find({ reservationId: target.id }, { session })
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
          targetType: target.targetType === "service" ? "service" : "trip",
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

        await payments.insertOne(transaction, { session });
        if (transaction.status === "succeeded") {
          await enqueueIntegrationEvent(database, session, succeededPaymentIntegrationEvent(transaction));
        }
        result = transaction;
      });
    } catch (error) {
      if (mongoCode(error) === 11000 && input.providerReference) {
        const existing = await payments.findOne({
          provider: input.provider,
          providerReference: input.providerReference
        });
        if (existing && sameProviderMovement(existing, input)) return existing;
        throw paymentError("PAYMENT_REFERENCE_CONFLICT", "Provider payment reference is already in use.");
      }
      throw error;
    } finally {
      await session.endSession();
    }

    if (!result) throw paymentError("PAYMENT_TRANSACTION_FAILED", "Payment transaction could not be stored.");
    return result;
  }

  async updateTransaction(input: UpdatePaymentTransactionInput) {
    const client = await getMongoClient();
    const database = await this.database();
    await ensureIntegrationOutboxIndexes(database);
    const payments = database.collection<StoredPaymentTransaction>(travelPaymentTransactionCollectionName);
    const session = client.startSession();
    let result: PaymentTransaction | null = null;

    try {
      await session.withTransaction(async () => {
        const current = await payments.findOne({ id: input.transactionId }, { session });
        if (!current) return;
        if (current.status !== "pending") {
          if (current.status === input.status) {
            result = current;
            return;
          }
          throw paymentError("PAYMENT_FINALIZED", "Only pending transactions can change status.");
        }

        const target = await this.storedTarget(database, current.reservationId, current.targetType, session);
        if (!target) {
          throw paymentError("PAYMENT_RESERVATION_NOT_FOUND", "Payment target not found.");
        }

        if (input.status === "succeeded") {
          const otherTransactions = await payments
            .find({ reservationId: target.id, id: { $ne: current.id } }, { session })
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
          { returnDocument: "after", session }
        );
        if (!update) {
          throw paymentError("PAYMENT_CONCURRENT_UPDATE", "Payment transaction changed concurrently.");
        }

        if (update.status === "succeeded") {
          await enqueueIntegrationEvent(database, session, succeededPaymentIntegrationEvent(update));
        }
        result = update;
      });
    } catch (error) {
      if (mongoCode(error) === 11000 && input.providerReference) {
        throw paymentError("PAYMENT_REFERENCE_CONFLICT", "Provider payment reference is already in use.");
      }
      throw error;
    } finally {
      await session.endSession();
    }

    return result;
  }
}
