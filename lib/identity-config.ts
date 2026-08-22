export type IdentityMode = "demo" | "mongodb" | "disabled";
export type StaffAuthMode = "demo" | "mongodb" | "disabled";

const requestedMode = process.env.IDENTITY_MODE;
const defaultMode: IdentityMode = process.env.NODE_ENV === "production" ? "disabled" : "demo";
const mode: IdentityMode = requestedMode === "demo" || requestedMode === "mongodb" || requestedMode === "disabled"
  ? requestedMode
  : defaultMode;

const demoExplicitlyEnabled = process.env.NODE_ENV !== "production" || process.env.DEMO_IDENTITY_ENABLED === "true";
const requestedStaffMode = process.env.STAFF_AUTH_MODE;
const staffMode: StaffAuthMode =
  requestedStaffMode === "demo" || requestedStaffMode === "mongodb" || requestedStaffMode === "disabled"
    ? requestedStaffMode
    : mode === "demo"
      ? "demo"
      : mode === "mongodb" && demoExplicitlyEnabled
        ? "demo"
        : "disabled";

export const identityConfig = {
  mode,
  staffMode,
  customerAuthEnabled: mode === "mongodb",
  staffAuthEnabled: staffMode === "mongodb",
  demoSessionEnabled: mode === "demo" && demoExplicitlyEnabled,
  demoStaffEnabled: staffMode === "demo" && demoExplicitlyEnabled
} satisfies {
  mode: IdentityMode;
  staffMode: StaffAuthMode;
  customerAuthEnabled: boolean;
  staffAuthEnabled: boolean;
  demoSessionEnabled: boolean;
  demoStaffEnabled: boolean;
};

export const DEMO_SESSION_COOKIE = "otp_demo_session";
export const KTRAVEL_SESSION_COOKIE = "ktravel_session";
export const KTRAVEL_STAFF_SESSION_COOKIE = "ktravel_staff_session";
