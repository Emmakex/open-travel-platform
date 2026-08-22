export type BookingMode = "demo" | "mongodb" | "disabled";

const requestedMode = process.env.BOOKING_MODE;
const defaultMode: BookingMode = process.env.NODE_ENV === "production" ? "disabled" : "demo";
const mode: BookingMode =
  requestedMode === "demo" || requestedMode === "mongodb" || requestedMode === "disabled"
    ? requestedMode
    : defaultMode;

const demoWritesEnabled =
  mode === "demo" &&
  (process.env.NODE_ENV !== "production" || process.env.DEMO_BOOKING_ENABLED === "true");

export const bookingConfig = {
  mode,
  writesEnabled: mode === "mongodb" || demoWritesEnabled,
  demoWritesEnabled
} satisfies {
  mode: BookingMode;
  writesEnabled: boolean;
  demoWritesEnabled: boolean;
};

export const DEMO_RESERVATIONS_COOKIE = "otp_demo_reservations";
