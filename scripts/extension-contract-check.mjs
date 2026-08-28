import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const exists = (file) => fs.existsSync(path.join(root, file));
const assert = (condition, message) => {
  if (!condition) throw new Error(`Extension contract invariant failed: ${message}`);
};

const expectedRepositoryFiles = [
  "booking-repository.ts",
  "crm-sync-adapter.ts",
  "erp-accounting-adapter.ts",
  "failure-transport.ts",
  "identity-repository.ts",
  "operations-repository.ts",
  "payment-repository.ts",
  "supplier-fulfilment-adapter.ts",
  "travel-repository.ts"
].sort();

const requiredDocs = [
  "docs/EXTENSION-POINT-INVENTORY.md",
  "docs/EXTENSION-POINT-INVENTORY.es.md",
  "docs/EXTENSION-COMPATIBILITY.md",
  "docs/EXTENSION-COMPATIBILITY.es.md",
  "docs/REFERENCE-ADAPTERS.md",
  "docs/REFERENCE-ADAPTERS.es.md",
  "docs/EXTENSION-CONTRACTS.md",
  "docs/EXTENSION-CONTRACTS.es.md",
  "docs/ADAPTER-GUIDE.md",
  "README.md",
  "README.es.md",
  "ROADMAP.md",
  "ROADMAP.es.md",
  "CONTRIBUTING.md"
];

for (const file of requiredDocs) assert(exists(file), `${file} must remain present`);

const actualRepositoryFiles = fs.readdirSync(path.join(root, "repositories"))
  .filter((file) => file.endsWith(".ts"))
  .sort();
assert(
  JSON.stringify(actualRepositoryFiles) === JSON.stringify(expectedRepositoryFiles),
  `public repository/adapter inventory changed without updating the extension gate: expected ${expectedRepositoryFiles.join(", ")}; found ${actualRepositoryFiles.join(", ")}`
);

const interfaceNames = [
  "BookingRepository",
  "CrmSyncAdapter",
  "ErpAccountingAdapter",
  "FailureTransport",
  "IdentityRepository",
  "OperationsRepository",
  "PaymentRepository",
  "SupplierFulfilmentAdapter",
  "TravelRepository"
];

const inventoryEn = read("docs/EXTENSION-POINT-INVENTORY.md");
const inventoryEs = read("docs/EXTENSION-POINT-INVENTORY.es.md");
for (const name of interfaceNames) {
  assert(inventoryEn.includes(name), `English inventory must document ${name}`);
  assert(inventoryEs.includes(name), `Spanish inventory must document ${name}`);
}

for (const file of expectedRepositoryFiles) {
  const source = read(`repositories/${file}`);
  assert(!source.includes('from "@/adapters/'), `${file} must not depend on concrete adapters`);
  assert(!source.includes('from "@/lib/'), `${file} must not depend on application/lib implementations`);
  assert(!source.includes('from "mongodb"'), `${file} must not depend on MongoDB`);
  assert(!source.includes("process.env"), `${file} must not read deployment configuration`);
  assert(!/\bfetch\s*\(/.test(source), `${file} must not perform network transport`);
}

function interfaceMethods(file, interfaceName) {
  const source = read(file);
  const match = source.match(new RegExp(`export interface ${interfaceName}\\s*\\{([\\s\\S]*?)\\n\\}`));
  assert(match, `${interfaceName} declaration must remain present in ${file}`);
  return [...match[1].matchAll(/^\s*([A-Za-z_$][\w$]*)\s*\(/gm)].map((entry) => entry[1]).sort();
}

const sameMethods = (file, interfaceName, expected) => {
  const actual = interfaceMethods(file, interfaceName);
  assert(
    JSON.stringify(actual) === JSON.stringify([...expected].sort()),
    `${interfaceName} authority surface changed: expected ${expected.join(", ")}; found ${actual.join(", ")}`
  );
};

sameMethods("repositories/crm-sync-adapter.ts", "CrmSyncAdapter", ["upsertContact", "upsertReservation"]);
sameMethods("repositories/erp-accounting-adapter.ts", "ErpAccountingAdapter", ["upsertMovement"]);
sameMethods("repositories/supplier-fulfilment-adapter.ts", "SupplierFulfilmentAdapter", ["execute"]);
sameMethods("repositories/failure-transport.ts", "FailureTransport", ["deliver"]);

const paymentRepository = read("repositories/payment-repository.ts");
assert(!/stripe|redsys/i.test(paymentRepository), "PaymentRepository must remain PSP-neutral");

const crmRepository = read("repositories/crm-sync-adapter.ts");
const erpRepository = read("repositories/erp-accounting-adapter.ts");
const reverseAuthorityTerms = /createReservation|cancelReservation|changeReservationStatus|recordPayment|createPayment|refundPayment|updateInventory|changeInventory|setSupplierStatus/;
assert(!reverseAuthorityTerms.test(crmRepository), "CRM contract must remain downstream-only");
assert(!reverseAuthorityTerms.test(erpRepository), "ERP/accounting contract must remain downstream-only");

const supplierRepository = read("repositories/supplier-fulfilment-adapter.ts");
assert(!supplierRepository.includes("supplierCost"), "Supplier adapter result/command contract must not gain supplier-cost mutation authority");
assert(!supplierRepository.includes("totalPrice"), "Supplier adapter contract must not gain customer-total mutation authority");

const supplierSync = read("lib/supplier-fulfilment-sync.ts");
const receivedAuditIndex = supplierSync.indexOf("await audit.insertOne(receivedAudit)");
const localApplyIndex = supplierSync.indexOf("const saved = await saveSupplierFulfilment");
assert(receivedAuditIndex >= 0, "supplier external response must be persisted to audit");
assert(localApplyIndex > receivedAuditIndex, "supplier response audit must happen before local workflow application");
assert(supplierSync.includes('code === "INVALID_TRANSITION"'), "supplier synchronization must reject invalid local transitions");

const contractFiles = {
  booking: read("lib/rest-booking-contract.ts"),
  supplier: read("lib/rest-supplier-fulfilment-contract.ts"),
  crm: read("lib/rest-crm-contract.ts"),
  erp: read("lib/rest-erp-accounting-contract.ts"),
  failure: read("adapters/rest-failure-transport.ts")
};

assert(contractFiles.booking.includes('restBookingContractHeader = "X-OTP-Contract-Version"'), "booking v1 header must remain stable");
assert(contractFiles.booking.includes('restBookingContractVersion = "1"'), "booking contract version must remain v1");
assert(contractFiles.supplier.includes('supplierFulfilmentContractHeader = "X-OTP-Contract-Version"'), "supplier v1 header must remain stable");
assert(contractFiles.supplier.includes('supplierFulfilmentContractVersion = "1"'), "supplier contract version must remain v1");
assert(contractFiles.crm.includes('crmContractHeader = "X-OTP-Contract-Version"'), "CRM v1 header must remain stable");
assert(contractFiles.crm.includes('crmContractVersion = "1"'), "CRM contract version must remain v1");
assert(contractFiles.erp.includes('erpAccountingContractHeader = "X-OTP-Accounting-Contract-Version"'), "ERP/accounting v1 header must remain stable");
assert(contractFiles.erp.includes('erpAccountingContractVersion = "1"'), "ERP/accounting contract version must remain v1");
assert(contractFiles.failure.includes('failureTransportContractHeader = "X-OTP-Failure-Contract-Version"'), "failure transport v1 header must remain stable");
assert(contractFiles.failure.includes('failureTransportContractVersion = "1"'), "failure transport contract version must remain v1");

const failureContract = read("repositories/failure-transport.ts");
assert(failureContract.includes("schemaVersion: 1;"), "FailureTransportEvent schema version must remain explicit");

const integrationTypes = read("domain/integrations/types.ts");
assert(integrationTypes.includes("version: 1;"), "integration event envelope schema version must remain explicit");
const webhookSecurity = read("lib/integration-webhook-security.ts");
assert(webhookSecurity.includes('"X-OTP-Signature"'), "generic webhook signature header must remain explicit");
assert(webhookSecurity.includes("v1=${signature}"), "generic webhook signing scheme must remain explicitly v1");

const referenceAdapters = [
  ["booking", "adapters/rest-booking-repository.ts", "lib/rest-booking-config.ts"],
  ["supplier", "adapters/rest-supplier-fulfilment-adapter.ts", "lib/supplier-fulfilment-adapter-config.ts"],
  ["CRM", "adapters/rest-crm-sync-adapter.ts", "lib/crm-sync-config.ts"]
];

for (const [name, adapterFile, configFile] of referenceAdapters) {
  const adapter = read(adapterFile);
  const config = read(configFile);
  assert(adapter.includes('redirect: "error"'), `${name} reference adapter must reject redirects`);
  assert(adapter.includes("AbortSignal.timeout"), `${name} reference adapter must keep bounded timeout handling`);
  assert(adapter.includes("maxResponseBytes"), `${name} reference adapter must keep bounded response handling`);
  assert(adapter.includes("content-type") && adapter.includes("application/json"), `${name} reference adapter must validate response media type`);
  assert(!adapter.includes("NEXT_PUBLIC_"), `${name} privileged adapter must not consume public browser configuration`);
  assert(!config.includes("NEXT_PUBLIC_"), `${name} privileged config must remain server-only`);
  assert(config.includes('NODE_ENV === "production"') && config.includes('url.protocol !== "https:"'), `${name} config must enforce HTTPS in production`);
}

const failureAdapter = read("adapters/rest-failure-transport.ts");
const failureConfig = read("lib/failure-transport-config.ts");
assert(failureAdapter.includes('redirect: "error"'), "failure transport must reject redirects");
assert(failureAdapter.includes("AbortSignal.timeout"), "failure transport must keep bounded timeout handling");
assert(failureAdapter.includes("maximumBytes"), "failure transport must keep bounded response handling");
assert(!failureConfig.includes("NEXT_PUBLIC_"), "failure transport config must remain server-only");
assert(failureConfig.includes('NODE_ENV === "production"') && failureConfig.includes('url.protocol !== "https:"'), "failure transport must require HTTPS in production");

const referencesEn = read("docs/REFERENCE-ADAPTERS.md");
const referencesEs = read("docs/REFERENCE-ADAPTERS.es.md");
for (const name of ["RestBookingRepository", "RestSupplierFulfilmentAdapter", "performSupplierAdapterOperation", "RestCrmSyncAdapter", "RestFailureTransport"]) {
  assert(referencesEn.includes(name), `English reference guide must document ${name}`);
  assert(referencesEs.includes(name), `Spanish reference guide must document ${name}`);
}

const compatibilityEn = read("docs/EXTENSION-COMPATIBILITY.md");
const compatibilityEs = read("docs/EXTENSION-COMPATIBILITY.es.md");
for (const source of [compatibilityEn, compatibilityEs]) {
  assert(source.includes("X-OTP-Contract-Version"), "compatibility policy must document shared v1 contract header");
  assert(source.includes("X-OTP-Accounting-Contract-Version"), "compatibility policy must document ERP/accounting version header");
  assert(source.includes("X-OTP-Failure-Contract-Version"), "compatibility policy must document failure transport version header");
  assert(source.includes("v1="), "compatibility policy must document webhook signature-scheme versioning");
}

const packageJson = JSON.parse(read("package.json"));
assert(
  packageJson.scripts?.["check:extension-contracts"] === "node scripts/extension-contract-check.mjs",
  "package.json must expose check:extension-contracts"
);
assert(packageJson.scripts?.verify?.includes("check:extension-contracts"), "check:extension-contracts must remain part of npm run verify");

const extensionWorkflow = read(".github/workflows/extension-contracts.yml");
assert(extensionWorkflow.includes("npm run check:extension-contracts"), "dedicated CI must execute the static extension gate");
assert(extensionWorkflow.includes("npm run test:rest-adapter-contracts"), "dedicated CI must execute the real local-HTTP adapter contract suite");
const mainWorkflow = read(".github/workflows/ci.yml");
assert(mainWorkflow.includes("npm run test:rest-adapter-contracts"), "main CI must retain runtime REST adapter contract coverage");

for (const file of ["README.md", "README.es.md", "ROADMAP.md", "ROADMAP.es.md", "docs/EXTENSION-CONTRACTS.md", "docs/EXTENSION-CONTRACTS.es.md", "docs/ADAPTER-GUIDE.md", "CONTRIBUTING.md"]) {
  const source = read(file);
  assert(source.includes("check:extension-contracts"), `${file} must document the permanent extension-contract gate`);
}

console.log("Permanent extension-contract inventory, authority, compatibility, reference and CI invariants passed.");
