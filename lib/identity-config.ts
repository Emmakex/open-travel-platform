export type IdentityMode = "demo" | "disabled";

const requestedMode = process.env.IDENTITY_MODE;
const defaultMode: IdentityMode = process.env.NODE_ENV === "production" ? "disabled" : "demo";
const mode: IdentityMode = requestedMode === "demo" || requestedMode === "disabled"
  ? requestedMode
  : defaultMode;

export const identityConfig = {
  mode,
  demoSessionEnabled:
    mode === "demo" &&
    (process.env.NODE_ENV !== "production" || process.env.DEMO_IDENTITY_ENABLED === "true")
} satisfies {
  mode: IdentityMode;
  demoSessionEnabled: boolean;
};

export const DEMO_SESSION_COOKIE = "otp_demo_session";
