import { randomUUID } from "node:crypto";
import type { Db } from "mongodb";
import type { StaffRole, SupplierFulfilmentTargetType } from "@/domain/operations/types";
import { getMongoClient, getMongoDatabaseName } from "@/lib/mongodb";
import { operationsConfig } from "@/lib/operations-config";
import { travelSupplierFulfilmentCollectionName } from "@/lib/supplier-fulfilment";

export const supplierReferenceDisclosureCollectionName = "travel_supplier_reference_disclosures";
export const supplierReferenceDisclosureAuditCollectionName = "travel_supplier_reference_disclosure_audit";

type SupplierReferenceDisclosure = {
  fulfilmentId: string;
  targetType: SupplierFulfilmentTargetType;
  targetId: string;
  componentKey: string;
  approvedReference: string;
  visible: boolean;
  updatedAt: string;
  updatedByStaffId: string;
  updatedByDisplayName: string;
};

type SupplierReferenceDisclosureAudit = {
  id: string;
  fulfilmentId: string;
  targetType: SupplierFulfilmentTargetType;
  targetId: string;
  componentKey: string;
  beforeVisible: boolean;
  afterVisible: boolean;
  approvedReference: string;
  actorIdentityId: string;
  actorRole: StaffRole;
  actorDisplayName: string;
  occurredAt: string;
};

type SupplierFulfilmentReferenceProjection = {
  id: string;
  targetType: SupplierFulfilmentTargetType;
  targetId: string;
  componentKey: string;
  supplierReference?: string;
};

export type SupplierReferenceDisclosureView = Pick<
  SupplierReferenceDisclosure,
  "fulfilmentId" | "approvedReference" | "visible" | "updatedAt" | "updatedByDisplayName"
>;

function disclosureError(code: string, message: string) {
  const error = new Error(message);
  Object.assign(error, { code });
  return error;
}

async function ensureIndexes(database: Db) {
  const disclosures = database.collection<SupplierReferenceDisclosure>(supplierReferenceDisclosureCollectionName);
  const audit = database.collection<SupplierReferenceDisclosureAudit>(supplierReferenceDisclosureAuditCollectionName);
  await Promise.all([
    disclosures.createIndex({ fulfilmentId: 1 }, { unique: true, name: "supplier_reference_disclosure_fulfilment_unique" }),
    disclosures.createIndex({ targetType: 1, targetId: 1 }, { name: "supplier_reference_disclosure_target" }),
    audit.createIndex({ id: 1 }, { unique: true, name: "supplier_reference_disclosure_audit_id_unique" }),
    audit.createIndex({ fulfilmentId: 1, occurredAt: -1 }, { name: "supplier_reference_disclosure_audit_fulfilment" })
  ]);
}

export async function listSupplierReferenceDisclosures(fulfilmentIds: string[]) {
  if (operationsConfig.mode !== "mongodb" || !fulfilmentIds.length) return [] as SupplierReferenceDisclosureView[];
  const client = await getMongoClient();
  const database = client.db(getMongoDatabaseName());
  await ensureIndexes(database);
  const rows = await database
    .collection<SupplierReferenceDisclosure>(supplierReferenceDisclosureCollectionName)
    .find({ fulfilmentId: { $in: fulfilmentIds } })
    .project<SupplierReferenceDisclosureView>({
      _id: 0,
      fulfilmentId: 1,
      approvedReference: 1,
      visible: 1,
      updatedAt: 1,
      updatedByDisplayName: 1
    })
    .toArray();
  return rows;
}

export async function setSupplierReferenceDisclosure(input: {
  fulfilmentId: string;
  visible: boolean;
  actorIdentityId: string;
  actorRole: StaffRole;
  actorDisplayName: string;
}) {
  if (operationsConfig.mode !== "mongodb") {
    throw disclosureError("REFERENCE_DISCLOSURE_UNAVAILABLE", "Supplier reference disclosure requires MongoDB operations mode.");
  }
  if (!input.fulfilmentId || !input.actorIdentityId || !input.actorDisplayName.trim()) {
    throw disclosureError("INVALID_REFERENCE_DISCLOSURE", "Supplier reference disclosure input is invalid.");
  }

  const client = await getMongoClient();
  const database = client.db(getMongoDatabaseName());
  await ensureIndexes(database);
  const fulfilment = database.collection<SupplierFulfilmentReferenceProjection>(travelSupplierFulfilmentCollectionName);
  const disclosures = database.collection<SupplierReferenceDisclosure>(supplierReferenceDisclosureCollectionName);
  const audit = database.collection<SupplierReferenceDisclosureAudit>(supplierReferenceDisclosureAuditCollectionName);
  const session = client.startSession();
  let saved: SupplierReferenceDisclosure | null = null;

  try {
    await session.withTransaction(async () => {
      const item = await fulfilment.findOne(
        { id: input.fulfilmentId },
        { projection: { _id: 0, id: 1, targetType: 1, targetId: 1, componentKey: 1, supplierReference: 1 }, session }
      );
      if (!item) throw disclosureError("FULFILMENT_NOT_FOUND", "Supplier fulfilment item not found.");
      const reference = item.supplierReference?.trim();
      if (input.visible && !reference) {
        throw disclosureError("REFERENCE_REQUIRED", "A supplier reference is required before it can be shared with the customer.");
      }

      const current = await disclosures.findOne({ fulfilmentId: item.id }, { session });
      const nextVisible = input.visible && Boolean(reference);
      const approvedReference = reference ?? current?.approvedReference ?? "";
      const alreadyCurrent = Boolean(
        current &&
        current.visible === nextVisible &&
        current.approvedReference === approvedReference
      );
      if (alreadyCurrent) throw disclosureError("NO_CHANGES", "No supplier reference disclosure changes were detected.");

      const occurredAt = new Date().toISOString();
      const next: SupplierReferenceDisclosure = {
        fulfilmentId: item.id,
        targetType: item.targetType,
        targetId: item.targetId,
        componentKey: item.componentKey,
        approvedReference,
        visible: nextVisible,
        updatedAt: occurredAt,
        updatedByStaffId: input.actorIdentityId,
        updatedByDisplayName: input.actorDisplayName.trim()
      };
      await disclosures.updateOne({ fulfilmentId: item.id }, { $set: next }, { upsert: true, session });
      await audit.insertOne({
        id: `supplier-ref-audit-${randomUUID()}`,
        fulfilmentId: item.id,
        targetType: item.targetType,
        targetId: item.targetId,
        componentKey: item.componentKey,
        beforeVisible: current?.visible === true && current.approvedReference === reference,
        afterVisible: nextVisible,
        approvedReference,
        actorIdentityId: input.actorIdentityId,
        actorRole: input.actorRole,
        actorDisplayName: input.actorDisplayName.trim(),
        occurredAt
      }, { session });
      saved = next;
    });
    return saved;
  } finally {
    await session.endSession();
  }
}

/**
 * Customer-document boundary. Only an explicitly approved reference that still
 * exactly matches the current supplier reference can leave the staff domain.
 * Changing the supplier reference automatically invalidates an older approval.
 */
export async function getCustomerSafeSupplierReferences(
  targetType: SupplierFulfilmentTargetType,
  targetId: string
) {
  const safe = new Map<string, string>();
  if (operationsConfig.mode !== "mongodb") return safe;

  const client = await getMongoClient();
  const database = client.db(getMongoDatabaseName());
  await ensureIndexes(database);
  const fulfilment = database.collection<SupplierFulfilmentReferenceProjection>(travelSupplierFulfilmentCollectionName);
  const items = await fulfilment
    .find(
      { targetType, targetId, supplierReference: { $exists: true, $ne: "" } },
      { projection: { _id: 0, id: 1, targetType: 1, targetId: 1, componentKey: 1, supplierReference: 1 } }
    )
    .toArray();
  if (!items.length) return safe;

  const disclosures = await database
    .collection<SupplierReferenceDisclosure>(supplierReferenceDisclosureCollectionName)
    .find({ fulfilmentId: { $in: items.map((item) => item.id) }, visible: true })
    .toArray();
  const disclosureById = new Map(disclosures.map((item) => [item.fulfilmentId, item]));

  for (const item of items) {
    const currentReference = item.supplierReference?.trim();
    const disclosure = disclosureById.get(item.id);
    if (
      currentReference &&
      disclosure?.visible === true &&
      disclosure.approvedReference === currentReference
    ) {
      safe.set(item.componentKey, currentReference);
    }
  }
  return safe;
}
