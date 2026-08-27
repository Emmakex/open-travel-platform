import assert from "node:assert/strict";
import {
  getPaymentProviderSummary,
  paymentProviderAuditCollectionName,
  paymentProviderSettingsCollectionName,
  saveStripeProvider
} from "../lib/payment-provider-config";
import {
  deleteIntegrationEndpoint,
  integrationEndpointAuditCollectionName,
  integrationEndpointCollectionName
} from "../lib/integration-endpoints";
import { getMongoDatabase } from "../lib/mongodb";

async function main() {
  process.env.PAYMENT_SECRETS_KEY = "11".repeat(32);
  process.env.INTEGRATION_SECRETS_KEY = "22".repeat(32);

  const database = await getMongoDatabase();
  const paymentSettings = database.collection(paymentProviderSettingsCollectionName);
  const paymentAudit = database.collection(paymentProviderAuditCollectionName);
  const integrationEndpoints = database.collection(integrationEndpointCollectionName);
  const integrationAudit = database.collection(integrationEndpointAuditCollectionName);

  await Promise.all([
    paymentSettings.deleteMany({}),
    paymentAudit.deleteMany({}),
    integrationEndpoints.deleteMany({}),
    integrationAudit.deleteMany({})
  ]);

  await saveStripeProvider({
    enabled: true,
    activeEnvironment: "test",
    environment: "test",
    publishableKey: "pk_test_initial_9c4",
    apiKey: "sk_test_initial_9c4",
    webhookSecret: "whsec_initial_9c4",
    actorIdentityId: "staff-audit-test",
    actorRole: "admin"
  });

  const initial = await getPaymentProviderSummary("stripe");
  assert.equal(initial.test.publicFields.publishableKey, "pk_test_initial_9c4");
  assert.equal(await paymentAudit.countDocuments({ provider: "stripe" }), 1);

  await paymentAudit.createIndex(
    { provider: 1 },
    { unique: true, name: "test_privileged_payment_audit_failure" }
  );

  await assert.rejects(
    () => saveStripeProvider({
      enabled: true,
      activeEnvironment: "test",
      environment: "test",
      publishableKey: "pk_test_changed_9c4",
      actorIdentityId: "staff-audit-test-2",
      actorRole: "admin"
    }),
    /duplicate key/i,
    "an audit write failure must reject the privileged payment settings mutation"
  );

  const afterRejectedPaymentChange = await getPaymentProviderSummary("stripe");
  assert.equal(
    afterRejectedPaymentChange.test.publicFields.publishableKey,
    "pk_test_initial_9c4",
    "payment settings must roll back when audit persistence fails"
  );
  assert.equal(await paymentAudit.countDocuments({ provider: "stripe" }), 1);

  const endpointId = "int-privileged-audit-test";
  await integrationEndpoints.insertOne({
    id: endpointId,
    name: "Audit rollback endpoint",
    url: "https://example.invalid/webhook",
    enabled: false,
    subscribedEvents: ["trip.reservation.created"],
    signingSecret: {
      version: 1,
      iv: Buffer.alloc(12).toString("base64"),
      tag: Buffer.alloc(16).toString("base64"),
      value: Buffer.alloc(8).toString("base64")
    },
    createdAt: new Date().toISOString(),
    createdBy: "staff-audit-test"
  });
  await integrationAudit.insertOne({
    id: "inta-existing-audit",
    endpointId,
    action: "created",
    actorIdentityId: "staff-audit-test",
    actorRole: "admin",
    occurredAt: new Date().toISOString()
  });
  await integrationAudit.createIndex(
    { endpointId: 1 },
    { unique: true, name: "test_privileged_integration_audit_failure" }
  );

  await assert.rejects(
    () => deleteIntegrationEndpoint({
      endpointId,
      actorIdentityId: "staff-audit-test-2",
      actorRole: "admin"
    }),
    /duplicate key/i,
    "an audit write failure must reject integration endpoint deletion"
  );

  assert.ok(
    await integrationEndpoints.findOne({ id: endpointId }),
    "integration endpoint deletion must roll back when audit persistence fails"
  );
  assert.equal(await integrationAudit.countDocuments({ endpointId }), 1);

  console.info(
    "Privileged audit MongoDB validation passed: payment configuration and integration deletion fail closed when their audit write cannot commit."
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
