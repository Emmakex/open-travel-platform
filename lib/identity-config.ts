export type IdentityMode = "demo" | "mongodb" | "disabled";

const requestedMode = process.env.IDENTITY_MODE;
const defaultMode: IdentityMode = process.env.NODE_ENV === "production" ? "disabled" : "demo";
const mode: IdentityMode = requestedMode === "demo" || requestedMode === "mongodb" || requestedMode === "disabled"
  ? requestedMode
  : defaultMode;

const demoExplicitlyEnabled = process.env.NODE_ENV !== "production" || process.env.DEMO_IDENTITY_ENABLED === "true";

export const identityConfig = {
  mode,
  customerAuthEnabled: mode === "mongodb",
  demoSessionEnabled: mode === "demo" && demoExplicitlyEnabled,
  demoStaffEnabled: (mode === "demo" || mode === "mongodb") && demoExplicitlyEnabled
} satisfies {
  mode: IdentityMode;
  customerAuthEnabled: boolean;
  demoSessionEnabled: boolean;
  demoStaffEnabled: boolean;
};

export const DEMO_SESSION_COOKIE = "otp_demo_session";
export const KTRAVEL_SESSION_COOKIE = "ktravel_session";
