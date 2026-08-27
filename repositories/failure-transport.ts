export type FailureSeverity = "warning" | "error" | "critical";

export type FailureTransportField = string | number | boolean | null;

export type FailureTransportEvent = {
  schemaVersion: 1;
  occurredAt: string;
  event: string;
  component: string;
  severity: FailureSeverity;
  correlationId?: string;
  fingerprint: string;
  fields?: Record<string, FailureTransportField>;
  errorType?: string;
  errorCode?: string;
};

export interface FailureTransport {
  readonly id: string;
  deliver(event: FailureTransportEvent): Promise<void>;
}
