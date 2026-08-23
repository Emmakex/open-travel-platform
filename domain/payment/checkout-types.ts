import type { PaymentTargetType } from "@/domain/payment/types";
import type { PaymentEnvironment, PaymentProviderId } from "@/lib/payment-provider-config";

export type CheckoutOrderStatus = "pending" | "paid" | "failed" | "cancelled";

export type CheckoutOrder = {
  id: string;
  identityId: string;
  targetType: PaymentTargetType;
  targetId: string;
  targetLabel: string;
  amount: number;
  currency: string;
  provider: PaymentProviderId;
  environment: PaymentEnvironment;
  transactionId: string;
  status: CheckoutOrderStatus;
  providerReference?: string;
  redsysOrder?: string;
  createdAt: string;
  updatedAt?: string;
};
