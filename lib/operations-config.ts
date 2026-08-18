export type OperationsMode = "demo" | "disabled";

const requestedMode = process.env.OPERATIONS_MODE;
const defaultMode: OperationsMode = process.env.NODE_ENV === "production" ? "disabled" : "demo";
const mode: OperationsMode = requestedMode === "demo" || requestedMode === "disabled"
  ? requestedMode
  : defaultMode;

export const operationsConfig = {
  mode,
  demoWritesEnabled:
    mode === "demo" &&
    (process.env.NODE_ENV !== "production" || process.env.DEMO_OPERATIONS_ENABLED === "true")
} satisfies {
  mode: OperationsMode;
  demoWritesEnabled: boolean;
};

export const DEMO_OPERATIONS_AUDIT_COOKIE = "otp_demo_operations_audit";
