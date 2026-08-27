import assert from "node:assert/strict";
import { getMongoClient, getMongoDatabaseName } from "../lib/mongodb";
import {
  addUtcCalendarMonths,
  createPrivacyRequest,
  ensurePrivacyRequestIndexes,
  listPrivacyRequestAudit,
  listPrivacyRequestsForCustomer,
  privacyRequestAuditCollectionName,
  privacyRequestCollectionName,
  updatePrivacyRequestByAdmin,
  withdrawPrivacyRequest
} from "../lib/privacy-rights";

async function expectCode(run: () => Promise<unknown>, code: string) {
  await assert.rejects(run, (error: unknown) => Boolean(
    error && typeof error === "object" && "code" in error && (error as { code?: unknown }).code === code
  ));
}

async function main() {
  const client = await getMongoClient();
  const database = client.db(getMongoDatabaseName());
  await database.dropDatabase();
  await ensurePrivacyRequestIndexes(database);

  try {
    assert.equal(
      addUtcCalendarMonths(new Date("2025-01-31T12:00:00.000Z"), 1).toISOString(),
      "2025-02-28T12:00:00.000Z",
      "one-calendar-month deadlines must clamp safely at month end"
    );
    assert.equal(
      addUtcCalendarMonths(new Date("2024-01-31T12:00:00.000Z"), 1).toISOString(),
      "2024-02-29T12:00:00.000Z",
      "calendar-month deadlines must handle leap years"
    );

    const access = await createPrivacyRequest("customer-privacy-1", "access");
    assert.equal(access.status, "received");
    assert.equal(access.retentionState, "not-applicable");
    assert.equal(access.dueAt.toISOString(), addUtcCalendarMonths(access.receivedAt, 1).toISOString());
    await expectCode(
      () => createPrivacyRequest("customer-privacy-1", "access"),
      "PRIVACY_REQUEST_ALREADY_OPEN"
    );

    const accessAudit = await listPrivacyRequestAudit(access.id);
    assert.equal(accessAudit.length, 1);
    assert.equal(accessAudit[0].action, "requested");
    assert.equal(accessAudit[0].actorType, "customer");

    await updatePrivacyRequestByAdmin({
      actorId: "admin-1",
      requestId: access.id,
      status: "in-review"
    });
    await expectCode(
      () => updatePrivacyRequestByAdmin({
        actorId: "admin-1",
        requestId: access.id,
        extendByMonths: 1
      }),
      "PRIVACY_EXTENSION_REASON_REQUIRED"
    );
    const extended = await updatePrivacyRequestByAdmin({
      actorId: "admin-1",
      requestId: access.id,
      extendByMonths: 2,
      extensionReason: "complexity"
    });
    assert.equal(
      extended?.extendedDueAt?.toISOString(),
      addUtcCalendarMonths(access.receivedAt, 3).toISOString(),
      "the technical maximum extension must remain two additional calendar months"
    );

    const erasure = await createPrivacyRequest("customer-privacy-1", "erasure");
    assert.equal(erasure.retentionState, "pending");
    await updatePrivacyRequestByAdmin({ actorId: "admin-1", requestId: erasure.id, status: "in-review" });
    await expectCode(
      () => updatePrivacyRequestByAdmin({
        actorId: "admin-1",
        requestId: erasure.id,
        status: "completed",
        outcomeCode: "fulfilled"
      }),
      "PRIVACY_RETENTION_REVIEW_REQUIRED"
    );
    await expectCode(
      () => updatePrivacyRequestByAdmin({
        actorId: "admin-1",
        requestId: erasure.id,
        retentionState: "hold"
      }),
      "PRIVACY_RETENTION_REASON_REQUIRED"
    );
    await updatePrivacyRequestByAdmin({
      actorId: "admin-1",
      requestId: erasure.id,
      retentionState: "hold",
      retentionReason: "legal-obligation"
    });
    const closedErasure = await updatePrivacyRequestByAdmin({
      actorId: "admin-1",
      requestId: erasure.id,
      status: "completed",
      outcomeCode: "retention-required"
    });
    assert.equal(closedErasure?.status, "completed");
    assert.equal(closedErasure?.openKey, undefined, "closed cases must release the duplicate-open guard");
    await expectCode(
      () => updatePrivacyRequestByAdmin({ actorId: "admin-1", requestId: erasure.id, status: "in-review" }),
      "PRIVACY_REQUEST_TERMINAL"
    );
    const secondErasure = await createPrivacyRequest("customer-privacy-1", "erasure");
    assert.notEqual(secondErasure.id, erasure.id, "a new request may be submitted after the previous case is closed");

    const portability = await createPrivacyRequest("customer-privacy-2", "portability");
    assert.equal(await withdrawPrivacyRequest("customer-privacy-2", portability.id), true);
    const withdrawn = (await listPrivacyRequestsForCustomer("customer-privacy-2"))[0];
    assert.equal(withdrawn.status, "withdrawn");
    const withdrawnAudit = await listPrivacyRequestAudit(portability.id);
    assert.ok(withdrawnAudit.some((event) => event.action === "withdrawn" && event.actorType === "customer"));

    // Force privacy audit persistence to fail and prove the customer request is
    // not committed without its audit event.
    await database.command({
      collMod: privacyRequestAuditCollectionName,
      validator: { actorType: "staff" },
      validationLevel: "strict",
      validationAction: "error"
    });
    await assert.rejects(() => createPrivacyRequest("customer-rollback", "access"));
    assert.equal(
      await database.collection(privacyRequestCollectionName).countDocuments({ identityId: "customer-rollback" }),
      0,
      "privacy request creation must roll back when its audit write fails"
    );
    await database.command({
      collMod: privacyRequestAuditCollectionName,
      validator: {},
      validationLevel: "off"
    });

    const serialized = JSON.stringify([
      ...(await database.collection(privacyRequestCollectionName).find({}).toArray()),
      ...(await database.collection(privacyRequestAuditCollectionName).find({}).toArray())
    ]).toLowerCase();
    for (const forbidden of ["passwordhash", "passwordsalt", "tokenhash", "documentnumber", "payload.value", "emailnormalized"]) {
      assert.equal(serialized.includes(forbidden), false, `privacy case storage must not duplicate protected/security field ${forbidden}`);
    }

    console.info("MongoDB privacy-rights validation passed: deadlines, duplicate guard, retention review, audit rollback and customer withdrawal are fail-closed.");
  } finally {
    await database.dropDatabase();
    await client.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
