import { createHash } from "node:crypto";
import { getFailureTransport } from "@/lib/failure-transport";
import {
  describeOperationalError,
  emitOperationalLog,
  safeOperationalToken,
  sanitizeOperationalCorrelationId,
  sanitizeOperationalFields,
  type OperationalLogFields,
  type OperationalLogScalar
} from "@/lib/observability";
import type { FailureSeverity, FailureTransportEvent } from "@/repositories/failure-transport";

export type OperationalFailureInput = {
  severity: FailureSeverity;
  event: string;
  component: string;
  correlationId?: string;
  fields?: OperationalLogFields;
  error?: unknown;
};

const failureFieldAllowlist = new Set([
  "provider",
  "reason",
  "eventType",
  "durationMs",
  "retrySeconds",
  "status",
  "attempt",
  "limit",
  "profile",
  "mode"
]);

function sanitizeFailureFields(fields: OperationalLogFields | undefined) {
  const sanitized = sanitizeOperationalFields(fields);
  if (!sanitized) return undefined;

  const output: Record<string, OperationalLogScalar> = {};
  for (const [key, value] of Object.entries(sanitized)) {
    if (!failureFieldAllowlist.has(key)) continue;
    if (typeof value === "string") {
      const safeValue = safeOperationalToken(value);
      if (safeValue) output[key] = safeValue;
      continue;
    }
    output[key] = value;
  }
  return Object.keys(output).length ? output : undefined;
}

function fingerprintFor(input: {
  event: string;
  component: string;
  errorType?: string;
  errorCode?: string;
}) {
  return createHash("sha256")
    .update([input.event, input.component, input.errorType ?? "none", input.errorCode ?? "none"].join("|"))
    .digest("hex");
}

export function buildFailureTransportEvent(input: OperationalFailureInput): FailureTransportEvent {
  const event = safeOperationalToken(input.event) ?? "operational-failure";
  const component = safeOperationalToken(input.component) ?? "unknown";
  const correlationId = sanitizeOperationalCorrelationId(input.correlationId);
  const fields = sanitizeFailureFields(input.fields);
  const error = describeOperationalError(input.error);
  const fingerprint = fingerprintFor({
    event,
    component,
    errorType: error?.errorType,
    errorCode: error?.errorCode
  });

  return {
    schemaVersion: 1,
    occurredAt: new Date().toISOString(),
    event,
    component,
    severity: input.severity,
    ...(correlationId ? { correlationId } : {}),
    fingerprint,
    ...(fields ? { fields } : {}),
    ...(error ?? {})
  };
}

export async function reportOperationalFailure(input: OperationalFailureInput) {
  emitOperationalLog({
    level: input.severity === "warning" ? "warn" : "error",
    event: input.event,
    component: input.component,
    correlationId: input.correlationId,
    fields: input.fields,
    error: input.error
  });

  const transport = getFailureTransport();
  if (!transport) return false;

  try {
    await transport.deliver(buildFailureTransportEvent(input));
    return true;
  } catch (error) {
    emitOperationalLog({
      level: "error",
      event: "observability.failure-transport.failed",
      component: "observability",
      correlationId: input.correlationId,
      fields: {
        sourceComponent: safeOperationalToken(input.component) ?? "unknown",
        transport: transport.id
      },
      error
    });
    return false;
  }
}
