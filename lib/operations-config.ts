export type OperationsMode = "demo" | "mongodb" | "disabled";

const requestedMode = process.env.OPERATIONS_MODE;
const defaultMode: OperationsMode = process.env.NODE_ENV === "production" ? "disabled" : "demo";
const mode: OperationsMode =
  requestedMode === "demo" || requestedMode === "mongodb" || requestedMode === "disabled"
    ? requestedMode
    : defaultMode;

const demoWritesEnabled =
  mode === "demo" &&
  (process.env.NODE_ENV !== "production" || process.env.DEMO_OPERATIONS_ENABLED === "true");

export const operationsConfig = {
  mode,
  writesEnabled: mode === "mongodb" || demoWritesEnabled,
  demoWritesEnabled
} satisfies {
  mode: OperationsMode;
  writesEnabled: boolean;
  demoWritesEnabled: boolean;
};

export const DEMO_OPERATIONS_AUDIT_COOKIE = "otp_demo_operations_audit";
