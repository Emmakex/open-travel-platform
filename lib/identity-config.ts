export type IdentityMode = "demo" | "disabled";

const requestedMode = process.env.IDENTITY_MODE;

export const identityConfig = {
  mode: requestedMode === "disabled" ? "disabled" : "demo",
  demoSessionEnabled:
    requestedMode !== "disabled" &&
    (process.env.NODE_ENV !== "production" || process.env.DEMO_IDENTITY_ENABLED === "true")
} satisfies {
  mode: IdentityMode;
  demoSessionEnabled: boolean;
};

export const DEMO_SESSION_COOKIE = "otp_demo_session";
