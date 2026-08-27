import { authAuditCollectionName } from "@/lib/auth-security";
import { customerSessionCollectionName, customerUserCollectionName } from "@/lib/customer-auth";
import { travelOperationsAuditCollectionName, travelReservationCollectionName } from "@/lib/mongo-reservations";
import { travelPaymentTransactionCollectionName } from "@/lib/mongo-payments";
import { privacyRequestAuditCollectionName, privacyRequestCollectionName } from "@/lib/privacy-rights";
import { serviceReservationCollectionName } from "@/lib/service-reservations";
import { travellerDataAuditCollectionName, travellerDataCollectionName } from "@/lib/traveller-data";

export type PrivacyInventoryAccess =
  | "customer-copy"
  | "customer-summary"
  | "security-excluded"
  | "internal-review";
export type PrivacyInventoryErasure =
  | "review-required"
  | "ttl-managed"
  | "security-retained";

export type PrivacyDataInventoryItem = {
  id: string;
  collections: string[];
  categories: string[];
  access: PrivacyInventoryAccess;
  erasure: PrivacyInventoryErasure;
  retention: string;
  notes: string;
};

/**
 * Technical inventory for privacy-right execution. This is intentionally not
 * a declaration of legal basis or a jurisdiction-specific retention schedule.
 * Phase 9D-2 will use this registry as the allowlisted starting point for
 * access/portability exports and erasure/restriction execution.
 */
export const privacyDataInventory: PrivacyDataInventoryItem[] = [
  {
    id: "customer-account",
    collections: [customerUserCollectionName],
    categories: ["identity", "contact", "locale", "account-status", "account-timestamps"],
    access: "customer-copy",
    erasure: "review-required",
    retention: "Retained while the customer account and linked contractual/operational records require identity resolution; final policy is deployment/jurisdiction specific.",
    notes: "Password hashes, password salts and lockout internals are credentials/security material and are never copied into a data-subject export."
  },
  {
    id: "customer-sessions",
    collections: [customerSessionCollectionName],
    categories: ["session-security", "expiry"],
    access: "security-excluded",
    erasure: "ttl-managed",
    retention: "Sessions expire automatically by TTL and may also be revoked server-side.",
    notes: "Only token hashes are persisted; raw session tokens are never stored."
  },
  {
    id: "authentication-audit",
    collections: [authAuditCollectionName],
    categories: ["security-events", "pseudonymous-identifiers", "timestamps"],
    access: "customer-summary",
    erasure: "security-retained",
    retention: "Security/audit retention requires a dedicated policy review; records use subject IDs and hashed email identifiers rather than plaintext email.",
    notes: "Do not expose hashes or internal security signals as portability data."
  },
  {
    id: "trip-reservations",
    collections: [travelReservationCollectionName],
    categories: ["booking", "traveller-snapshot", "commercial", "service-selection", "timestamps"],
    access: "customer-copy",
    erasure: "review-required",
    retention: "Reservation retention is not auto-deleted by this phase; contractual, consumer, accounting and legal-claims requirements must be reviewed before erasure.",
    notes: "Customer-owned reservation data is a primary access/export source; internal-only supplier and permission-gated fields require separate filtering."
  },
  {
    id: "service-reservations",
    collections: [serviceReservationCollectionName],
    categories: ["service-booking", "commercial", "schedule", "timestamps"],
    access: "customer-copy",
    erasure: "review-required",
    retention: "Service reservation retention follows the same reviewed contractual/legal boundary as trip reservations.",
    notes: "Only records owned by the requesting identity are eligible for customer export."
  },
  {
    id: "payment-ledger",
    collections: [travelPaymentTransactionCollectionName],
    categories: ["payment-movement", "refund-movement", "provider", "transaction-timestamps"],
    access: "customer-copy",
    erasure: "review-required",
    retention: "Authoritative payment/refund history is immutable business history and requires fiscal/accounting/legal review before any erasure or anonymisation.",
    notes: "Provider credentials and raw callback material are not part of this ledger and must never enter a customer export."
  },
  {
    id: "protected-traveller-data",
    collections: [travellerDataCollectionName, travellerDataAuditCollectionName],
    categories: ["identity-document", "contact", "residence", "emergency-contact", "field-change-audit"],
    access: "internal-review",
    erasure: "ttl-managed",
    retention: "Encrypted traveller payloads use reservation-configured TTL expiry; the audit stores field names rather than protected values.",
    notes: "The Phase 9D-2 exporter must decrypt only customer-owned, unexpired values at request execution time and must never expose encryption metadata."
  },
  {
    id: "operations-audit",
    collections: [travelOperationsAuditCollectionName],
    categories: ["booking-status-audit", "staff-actor", "timestamps"],
    access: "customer-summary",
    erasure: "security-retained",
    retention: "Operational audit retention requires policy review and may remain necessary to evidence booking changes and disputes.",
    notes: "Customer access may summarize relevant processing without disclosing unrelated staff/internal data or rights of others."
  },
  {
    id: "privacy-rights-case",
    collections: [privacyRequestCollectionName, privacyRequestAuditCollectionName],
    categories: ["rights-request", "case-status", "deadline", "retention-review", "audit"],
    access: "customer-copy",
    erasure: "review-required",
    retention: "The rights case itself is retained as bounded evidence of request handling; a dedicated retention period must be set in a later policy slice.",
    notes: "The case stores identity IDs and structured reason codes, not copies of credentials or protected traveller values."
  }
];
