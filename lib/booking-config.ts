export type BookingMode = "demo" | "disabled";

const requestedMode = process.env.BOOKING_MODE;
const defaultMode: BookingMode = process.env.NODE_ENV === "production" ? "disabled" : "demo";
const mode: BookingMode = requestedMode === "demo" || requestedMode === "disabled"
  ? requestedMode
  : defaultMode;

export const bookingConfig = {
  mode,
  demoWritesEnabled:
    mode === "demo" &&
    (process.env.NODE_ENV !== "production" || process.env.DEMO_BOOKING_ENABLED === "true")
} satisfies {
  mode: BookingMode;
  demoWritesEnabled: boolean;
};

export const DEMO_RESERVATIONS_COOKIE = "otp_demo_reservations";
