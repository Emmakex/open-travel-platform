import { privacyDataInventory } from "@/lib/privacy-data-inventory";

export type RetentionPolicyOwner = "privacy" | "security" | "operations" | "finance";
export type RetentionPolicyStrategy = "ttl" | "case-review" | "business-record-review" | "security-review";
export type RetentionPolicyAction = "retain" | "review-required" | "eligible-for-expiry";

export type PrivacyRetentionPolicyItem = {
  inventoryId: string;
  owner: RetentionPolicyOwner;
  strategy: RetentionPolicyStrategy;
  deploymentDecisionRequired: boolean;
  purpose: string;
  notes: string;
};

/**
 * Technical retention policy registry.
 *
 * It intentionally does not encode a jurisdiction-specific statutory period.
 * Concrete deployments must document their actual retention schedule with the
 * appropriate privacy/legal/finance/operations owners. This registry only
 * defines the safe execution boundary for each known personal-data store.
 */
export const privacyRetentionPolicy: PrivacyRetentionPolicyItem[] = [
  {
    inventoryId: "customer-account",
    owner: "privacy",
    strategy: "case-review",
    deploymentDecisionRequired: true,
    purpose: "Customer account servicing and identity resolution for linked contractual records.",
    notes: "Account identity may be anonymised after an approved privacy case; linked business records remain subject to their own retention boundary."
  },
  {
    inventoryId: "customer-sessions",
    owner: "security",
    strategy: "ttl",
    deploymentDecisionRequired: false,
    purpose: "Short-lived authenticated session security.",
    notes: "Sessions are already TTL-managed and can also be revoked server-side."
  },
  {
    inventoryId: "authentication-audit",
    owner: "security",
    strategy: "security-review",
    deploymentDecisionRequired: true,
    purpose: "Security incident investigation, abuse prevention and authentication audit evidence.",
    notes: "Never auto-delete solely because a customer privacy request exists; approved erasure removes direct linkage while preserving bounded security evidence when required."
  },
  {
    inventoryId: "trip-reservations",
    owner: "operations",
    strategy: "business-record-review",
    deploymentDecisionRequired: true,
    purpose: "Contract performance, traveller servicing, booking history, consumer obligations and claims evidence.",
    notes: "No automatic statutory duration is hard-coded in the MIT core."
  },
  {
    inventoryId: "service-reservations",
    owner: "operations",
    strategy: "business-record-review",
    deploymentDecisionRequired: true,
    purpose: "Independent service contract performance, fulfilment and claims evidence.",
    notes: "Review together with the related trip or standalone service contract."
  },
  {
    inventoryId: "payment-ledger",
    owner: "finance",
    strategy: "business-record-review",
    deploymentDecisionRequired: true,
    purpose: "Authoritative payment/refund history, reconciliation, accounting, tax and claims evidence.",
    notes: "The monetary ledger is never auto-deleted by this policy module. Customer actor/free-text data can be minimised separately."
  },
  {
    inventoryId: "protected-traveller-data",
    owner: "privacy",
    strategy: "ttl",
    deploymentDecisionRequired: false,
    purpose: "Time-bounded post-purchase traveller fulfilment data.",
    notes: "Encrypted payloads already carry reservation-configured TTL expiry and should not outlive their operational purpose absent a documented hold."
  },
  {
    inventoryId: "operations-audit",
    owner: "operations",
    strategy: "business-record-review",
    deploymentDecisionRequired: true,
    purpose: "Evidence of booking-status changes, operational decisions and dispute handling.",
    notes: "Customer-facing rights execution must not expose unrelated staff details or destroy required operational evidence."
  },
  {
    inventoryId: "customer-operations-tasks",
    owner: "operations",
    strategy: "case-review",
    deploymentDecisionRequired: true,
    purpose: "Customer-service follow-up and operational case management.",
    notes: "Review with the underlying booking/customer-service case; approved erasure pseudonymises direct customer targets."
  },
  {
    inventoryId: "integration-outbox",
    owner: "operations",
    strategy: "case-review",
    deploymentDecisionRequired: true,
    purpose: "Reliable downstream delivery, retry history and integration diagnostics.",
    notes: "Retention must stay aligned with the source business event and configured integration-success retention."
  },
  {
    inventoryId: "privacy-rights-case",
    owner: "privacy",
    strategy: "case-review",
    deploymentDecisionRequired: true,
    purpose: "Bounded evidence that a privacy-right request was received, reviewed and actioned.",
    notes: "The deployment must define a documented retention period and rationale for closed privacy cases."
  }
];

export function validatePrivacyRetentionPolicyCoverage() {
  const inventoryIds = new Set(privacyDataInventory.map((item) => item.id));
  const policyIds = new Set<string>();

  for (const item of privacyRetentionPolicy) {
    if (policyIds.has(item.inventoryId)) {
      throw new Error(`Duplicate retention policy entry: ${item.inventoryId}`);
    }
    policyIds.add(item.inventoryId);
    if (!inventoryIds.has(item.inventoryId)) {
      throw new Error(`Retention policy references unknown inventory item: ${item.inventoryId}`);
    }
    if (!item.purpose.trim() || !item.notes.trim()) {
      throw new Error(`Retention policy entry is missing purpose/notes: ${item.inventoryId}`);
    }
  }

  for (const inventoryId of inventoryIds) {
    if (!policyIds.has(inventoryId)) {
      throw new Error(`Personal-data inventory item has no retention policy entry: ${inventoryId}`);
    }
  }

  return true;
}

export function getPrivacyRetentionPolicyItem(inventoryId: string) {
  return privacyRetentionPolicy.find((item) => item.inventoryId === inventoryId) ?? null;
}

export function evaluatePrivacyRetention(input: {
  inventoryId: string;
  now?: Date;
  expiresAt?: Date | null;
  hold?: boolean;
}): { action: RetentionPolicyAction; reason: string } {
  const policy = getPrivacyRetentionPolicyItem(input.inventoryId);
  if (!policy) {
    return { action: "review-required", reason: "unknown-inventory-item" };
  }

  if (input.hold) {
    return { action: "retain", reason: "documented-hold" };
  }

  if (policy.strategy !== "ttl") {
    return { action: "review-required", reason: `${policy.strategy}-requires-deployment-review` };
  }

  if (!input.expiresAt) {
    return { action: "review-required", reason: "ttl-expiry-metadata-missing" };
  }

  const now = input.now ?? new Date();
  if (input.expiresAt.getTime() > now.getTime()) {
    return { action: "retain", reason: "ttl-not-expired" };
  }

  return { action: "eligible-for-expiry", reason: "ttl-expired-no-hold" };
}
