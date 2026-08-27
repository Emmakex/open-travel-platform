import type { FailureSeverity } from "@/repositories/failure-transport";

export type OperationalAlertRoute =
  | "availability"
  | "payments"
  | "integrations"
  | "platform";

export type OperationalRunbookKey =
  | "availability-health"
  | "payment-processing"
  | "integration-delivery"
  | "platform-operations";

export type OperationalEscalation = "notify" | "urgent" | "page";

export type OperationalAlertRouting = {
  route: OperationalAlertRoute;
  runbook: OperationalRunbookKey;
  escalation: OperationalEscalation;
};

function escalationForSeverity(severity: FailureSeverity): OperationalEscalation {
  if (severity === "critical") return "page";
  if (severity === "error") return "urgent";
  return "notify";
}

export function getOperationalAlertRouting(input: {
  event: string;
  component: string;
  severity: FailureSeverity;
}): OperationalAlertRouting {
  const event = input.event.toLowerCase();
  const component = input.component.toLowerCase();
  const escalation = escalationForSeverity(input.severity);

  if (component === "health-readiness" || event.startsWith("health.")) {
    return {
      route: "availability",
      runbook: "availability-health",
      escalation
    };
  }

  if (component === "payment-webhook" || event.startsWith("payment.")) {
    return {
      route: "payments",
      runbook: "payment-processing",
      escalation
    };
  }

  if (component === "integration-worker" || event.startsWith("integration.")) {
    return {
      route: "integrations",
      runbook: "integration-delivery",
      escalation
    };
  }

  return {
    route: "platform",
    runbook: "platform-operations",
    escalation
  };
}
