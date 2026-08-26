import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const assert = (condition, message) => {
  if (!condition) throw new Error(`Payment idempotency invariant failed: ${message}`);
};

const mongoPayments = read("lib/mongo-payments.ts");
const repository = read("adapters/mongo-payment-repository.ts");
const checkout = read("lib/payment-checkout.ts");
const stripeRoute = read("app/api/payments/stripe/webhook/route.ts");
const redsysRoute = read("app/api/payments/redsys/notify/route.ts");
const test = read("tests/mongodb-payment-idempotency.ts");
const workflow = read(".github/workflows/ci.yml");
const packageJson = JSON.parse(read("package.json"));

assert(
  mongoPayments.includes('name: "travel_payment_provider_reference_unique"') && mongoPayments.includes("unique: true"),
  "payment provider references must be protected by a unique MongoDB index"
);
assert(
  mongoPayments.includes('dropIndex("travel_payment_provider_reference")'),
  "legacy non-unique provider-reference index must have an explicit migration path"
);
assert(
  repository.includes("mongoCode(error) === 11000") && repository.includes("PAYMENT_REFERENCE_CONFLICT"),
  "duplicate-key races must map to stable payment reference semantics"
);
assert(
  repository.includes("sameProviderMovement(existing, input)"),
  "same provider movement must resolve idempotently after a unique-key race"
);
assert(
  checkout.includes('events.createIndex({ provider: 1, eventId: 1 }, { unique: true'),
  "webhook claims must retain a unique provider/event ID index"
);
assert(
  stripeRoute.includes("claimPaymentWebhookEvent") && stripeRoute.indexOf("claimPaymentWebhookEvent") < stripeRoute.indexOf("finalizeCheckoutOrder"),
  "Stripe must claim the provider event before finalization"
);
assert(
  redsysRoute.includes("claimPaymentWebhookEvent") && redsysRoute.indexOf("claimPaymentWebhookEvent") < redsysRoute.indexOf("finalizeCheckoutOrder"),
  "Redsys must claim the provider event before finalization"
);
assert(
  redsysRoute.includes('finalizeCheckoutOrder(order.id, "paid", notification.order)'),
  "Redsys must use the stable merchant order as the ledger provider reference"
);
assert(
  test.includes('databaseName.startsWith("ktravel_ci_")') && test.includes('parsed.hostname === "127.0.0.1"'),
  "destructive payment test must retain local CI database guards"
);
assert(
  test.includes("Concurrent creates with the same provider reference") && test.includes("Promise.all"),
  "real test must exercise concurrent provider-reference creation"
);
assert(
  test.includes("A repeated provider event ID must be claimed once under concurrency"),
  "real test must exercise concurrent webhook claiming"
);
assert(
  test.includes("Concurrent checkout finalization must be idempotent"),
  "real test must exercise concurrent checkout finalization"
);
assert(
  test.includes("one ERP integration event") && test.includes("one ERP delivery"),
  "real test must verify financial outbox deduplication"
);
assert(
  packageJson.scripts?.["test:mongodb-payment-idempotency"] === "tsx tests/mongodb-payment-idempotency.ts",
  "package script must execute the real payment idempotency test"
);
assert(
  workflow.includes("npm run test:mongodb-payment-idempotency"),
  "MongoDB CI job must execute the real payment idempotency test"
);

console.log("Payment webhook, ledger reference and finalization idempotency invariants passed.");
