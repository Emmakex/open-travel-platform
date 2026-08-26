import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const assert = (condition, message) => {
  if (!condition) throw new Error(`Traveller/amendment validation invariant failed: ${message}`);
};

const packageJson = JSON.parse(read("package.json"));
const test = read("tests/mongodb-traveller-amendments.ts");
const workflow = read(".github/workflows/ci.yml");

assert(
  packageJson.scripts?.["test:mongodb-traveller-amendments"] === "tsx tests/mongodb-traveller-amendments.ts",
  "package script must execute the real MongoDB traveller/amendment test"
);
assert(
  packageJson.scripts?.["check:traveller-amendment-validation"] === "node scripts/traveller-amendment-validation-check.mjs",
  "static invariant must remain exposed as a package script"
);
assert(
  packageJson.scripts?.verify?.includes("check:traveller-amendment-validation"),
  "traveller/amendment invariant must remain part of verify"
);
assert(test.includes('databaseName.startsWith("ktravel_ci_")'), "destructive test must require a CI-only database name");
assert(
  test.includes('parsed.hostname === "127.0.0.1"') && test.includes('parsed.hostname === "localhost"'),
  "destructive test must reject remote MongoDB hosts"
);
assert(test.includes("calculateAgeOnDate"), "test must validate departure-date age calculation");
assert(test.includes('sourceDate),\n    17') && test.includes('targetDate),\n    18'), "test must cover the exact 17-to-18 birthday boundary");
assert(test.includes("MINOR_GUARDIAN_REQUIRED"), "test must retain minor guardian validation");
assert(test.includes("priceTravellerComposition"), "test must use the production traveller pricing function");
assert(test.includes("changeReservationDeparture"), "test must use the production departure amendment path");
assert(test.includes("correctReservationTraveller"), "test must use the production traveller correction path");
assert(test.includes('changed.amendment.priceDelta, 120'), "test must assert an explicit financial delta");
assert(test.includes('changed.amendment.currency, "EUR"'), "test must preserve amendment currency");
assert(test.includes("inventoryMovement"), "test must assert the audited inventory movement");
assert(test.includes("paymentAfterDepartureChange") && test.includes("paymentBefore"), "test must prove historical payment rows remain unchanged");
assert(test.includes("paymentAfterCorrection"), "traveller correction must also leave historical payment rows unchanged");
assert(test.includes("DEPARTURE_UNAVAILABLE"), "test must force an insufficient-capacity departure amendment failure");
assert(test.includes("Failed departure change must keep original inventory reserved"), "test must verify source inventory rollback");
assert(test.includes("Failed departure change must not leave target inventory consumed"), "test must verify target inventory rollback");
assert(test.includes("Failed departure change must not leave an amendment audit record"), "failed transaction must not persist audit history");
assert(workflow.includes("Traveller pricing and amendment MongoDB test"), "CI must run the blocking traveller/amendment integration test");
assert(workflow.includes("npm run test:mongodb-traveller-amendments"), "CI must execute the real MongoDB traveller/amendment script");
assert(workflow.includes("OPERATIONS_MODE: mongodb"), "CI amendment test must enable persistent operations mode");
assert(workflow.includes("Browser E2E (non-blocking)") && workflow.includes("continue-on-error: true"), "browser E2E must remain non-blocking by policy");

console.log("Traveller/minor pricing and MongoDB amendment validation invariants passed.");
