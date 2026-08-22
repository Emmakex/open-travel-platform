import { bookingConfig } from "@/lib/booking-config";

export type PaymentLedgerMode = "mongodb" | "disabled";

const configuredMode = process.env.PAYMENT_LEDGER_MODE?.trim().toLowerCase();
const mode: PaymentLedgerMode = configuredMode === "mongodb"
  ? "mongodb"
  : configuredMode === "disabled"
    ? "disabled"
    : bookingConfig.mode === "mongodb"
      ? "mongodb"
      : "disabled";

export const paymentConfig = {
  mode,
  writesEnabled: mode === "mongodb"
} as const;
